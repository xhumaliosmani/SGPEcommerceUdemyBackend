const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../../model/User/User.js");
const mongoose = require("mongoose");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.APP_SENDGRID_API_KEY);
const stripe = require("stripe")(process.env.APP_STRIPE_SECRET_KEY);
const crypto = require("crypto");

const expiryDate = new Date();
const date1 = expiryDate.setTime(expiryDate.getTime() + 12);

//register user
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req?.body;
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      throw new Error("User Already exists! Please Login.");
    }
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    //stripe customer id
    const stripeCustomer = await stripe.customers.create({ email: email });

    const newUser = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: encryptedPassword,
      stripe_customer_id: stripeCustomer.id,
    });

    //set cookie token
    const data = {
      id: newUser?._id,
    };
    const token = jwt.sign(data, process.env.APP_JWT_SECRET_KEY, {
      expiresIn: "12h",
    });

    const createdUser = newUser;
    createdUser.password = undefined;

    res
      .status(201)
      .cookie("token", token, { expires: new Date(Date.now() + date1) })
      .json({ sucess: true, token, createdUser });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//login user
const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req?.body;

  try {
    const emailExists = await User.findOne({ email: email }).populate("saved");

    if (!emailExists) {
      throw new Error("User Does not exist! Please Register.");
    }

    const user = await User.findOne({ email: email });
    const comparePassword = await bcrypt.compare(password, user?.password);

    if (!comparePassword) {
      throw new Error("Password Dosent Match!");
    }

    const data = {
      id: user?._id,
    };

    //sign the cookie token
    const token = jwt.sign(data, process.env.APP_JWT_SECRET_KEY, {
      expiresIn: "12h",
    });

    user.password = undefined;

    res
      .status(200)
      .cookie("token", token, {
        expires: new Date(Date.now() + date1),
        sameSite: "None",
        secure: true,
      })
      .json({
        success: true,
        token,
        user,
      });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//user details
const userDetails = asyncHandler(async (req, res) => {
  const id = req?.user?._id;
  try {
    const user = await User.findById(id).select("-password").populate("saved");
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//fetch all users
const fetchAllUsers = asyncHandler(async (req, res) => {
  try {
    const user = await User.find();
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//get all stripe subscriptions
const stripePrices = asyncHandler(async (req, res) => {
  try {
    const prices = await stripe.prices.list();
    const pricesdata = prices?.data;

    res.status(200).json({
      success: true,
      pricesdata,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//user change password controller/logic
const userPasswordUpdate = asyncHandler(async (req, res) => {
  const { password } = req?.body;
  const id = req?.user?._id;

  try {
    const user = await User.findById(id);

    const comparePassword = await bcrypt.compare(password, user?.password);
    if (comparePassword) {
      throw new Error("Please enter a different password from your own.");
    } else {
      const salt = await bcrypt.genSalt(10);
      const encryptedPassword = await bcrypt.hash(password, salt);

      user.password = encryptedPassword;

      const updatedUser1 = await user.save();

      const updatedUser = await User.findById(id).select("-password");

      res.status(201).json({
        updatedUser,
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//reset password logic/controller
const userPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req?.body;
  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      throw new Error("Please Register. User Dosent Exist!");
    }

    const resetPasswordToken = await user.createPasswordResetToken();

    user.passwordResetToken = resetPasswordToken;

    await user.save();

    //send a token to the email and a verification button

    const resetURL = `If you want to reset your password click here: <a href="http://localhost:3000/forgot-passsword-reset/${resetPasswordToken}">Reset Password</a>`;

    const msg = {
      to: email,
      from: "djumaliosmani@gmail.com",
      subject: "Reset Password",
      html: resetURL,
    };

    await sgMail.send(msg);

    res
      .status(200)
      .json(`A reset email was sent to ${email}. the reset url: ${resetURL}`);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//user reset password logic after email has been clicked
const userPasswordResetAfterClick = asyncHandler(async (req, res) => {
  const { password, token } = req?.body;
  try {
    //find if a user exists with the token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    //throw new error if not
    if (!user) throw new Error("User Does not Exist! Please Register!");

    //run if block, hash password, store password, make token undefined, save user, send status
    if (user) {
      const salt = await bcrypt.genSalt(10);
      const encryptedPassword = await bcrypt.hash(password, salt);
      user.password = encryptedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      res.status(201).json(user);
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//verifu account/email logic
const verifyAccount = asyncHandler(async (req, res) => {
  const { email } = req?.body;
  const id = req?.user?._id;
  try {
    const user = await User.findById(id);

    if (!user) throw new Error("No user exists!");

    if (user) {
      const verificationToken = await user.createAccountVerificationToken();
      await user.save();

      const verifyURL = `If you want to verify your account click here: <a href="http://localhost:3000/verify-account/${verificationToken}">Verify Account</a>`;

      const msg = {
        to: user?.email,
        from: "djumaliosmani@gmail.com",
        subject: "Verify Account",
        html: verifyURL,
      };

      await sgMail.send(msg);

      res.status(200).json(verifyURL);
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//verify user account after clikcing the url in the email
const verifyAccountAfterClick = asyncHandler(async (req, res) => {
  //destructuring the variable
  const { token } = req?.body;

  //hash the token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  //find if a user exists with the token in his details
  const user = await User.findOne({
    accountVerificationToken: hashedToken,
    accountVerificationTokenExpires: { $gt: Date.now() },
  });

  try {
    if (!user) throw new Error("Token expired please try again!");

    //if everything is ok then update user
    user.isVerified = true;
    user.accountVerificationToken = undefined;
    user.accountVerificationTokenExpires = undefined;

    await user.save();

    res.status(201).json(user);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//update user field logic
const updateUserField = asyncHandler(async (req, res) => {
  const id = req?.user?._id;

  try {
    const user = await User.findByIdAndUpdate(id, { ...req?.body }).select(
      "-pasword"
    );

    if (!user) throw new Error("No user Found!");

    const updatedUser = await User.findById(id)
      .populate("saved")
      .select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//save a product logic
const saveProduct = asyncHandler(async (req, res) => {
  const { productId } = req?.body;
  const id = req?.user?._id;

  const targetUser = await User.findById(id);
  const savedLog = targetUser?.saved?.map((prod) => {
    return prod?._id;
  });

  const isSaved = targetUser?.saved?.includes(productId);
  if (isSaved) throw new Error("Already Saved this Product!");

  try {
    const user = await User.findByIdAndUpdate(
      id,
      {
        $push: { saved: productId },
      },
      { new: true }
    );

    const updatedUser = await User.findById(id).populate("saved");

    //send the status code and user
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//unsave product or dislike logic
const unSaveProduct = asyncHandler(async (req, res) => {
  const { productId } = req?.body;
  const id = req?.user?._id;

  const targetUser = await User.findById(id);
  const savedLog = targetUser?.saved?.map((prod) => {
    return prod?._id;
  });

  const isSaved = targetUser?.saved?.includes(productId);

  try {
    if (isSaved) {
      const user = await User.findByIdAndUpdate(
        id,
        {
          $pull: { saved: productId },
        },
        { new: true }
      );

      const updatedUser = await User.findById(id).populate("saved");

      res.status(200).json(updatedUser);
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//create subscription window hosted by stripe
const createSubWindow = asyncHandler(async (req, res) => {
  const id = req?.user?._id;

  try {
    const targetUser = await User.findById(id);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: req?.body?.priceId,
          quantity: 1,
        },
      ],
      customer: targetUser?.stripe_customer_id,
      success_url: process.env.APP_STRIPE_SUCCESS_URL,
      cancel_url: process.env.APP_STRIPE_CANCEL_URL,
    });

    res.status(200).json(session.url);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//stripe subscription status
const subStatusUpdate = asyncHandler(async (req, res) => {
  const id = req?.user?._id;
  const targetUser = await User.findById(id);

  const customerId = await targetUser?.stripe_customer_id;

  try {
    const subStatus = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    const updateSubStatus = await User.findByIdAndUpdate(
      id,
      {
        subscriptions: subStatus.data,
        role: "subscriber",
      },
      { new: true }
    );

    const updatedUser = await User.findById(id).populate("saved");

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//customer subscriptions portal, manage subscriptions
const customerPortal = asyncHandler(async (req, res) => {
  const id = req?.user?._id;
  const targetUser = await User.findById(id);

  const customerId = await targetUser?.stripe_customer_id;

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.APP_STRIPE_HOME_URL,
    });

    res.status(200).json(portalSession.url);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//update user role and subscription after cancel
const updateSubAfterCancel = asyncHandler(async (req, res) => {
  const id = req?.user?._id;
  const targetUser = await User.findById(id);

  const customerId = await targetUser?.stripe_customer_id;

  try {
    const subStatus = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    const updateSubStatus = await User.findByIdAndUpdate(
      id,
      {
        subscriptions: subStatus.data,
      },
      { new: true }
    );

    const hasCanceld = updateSubStatus.subscriptions[0].cancel_at_period_end;
    const periodEnd = updateSubStatus.subscriptions[0].current_period_end;

    function hasSubscriptionEnded(periodEnd) {
      const currentDate = new Date();
      const endDate = new Date(periodEnd * 1000);

      return currentDate > endDate;
    }

    console.log(hasSubscriptionEnded(periodEnd));

    if (hasCanceld && hasSubscriptionEnded(periodEnd)) {
      //revoke his priviledge
      const foundUser = await User.findByIdAndUpdate(id, {
        role: "freeuser",
      });
      res.status(200).json(foundUser);
    }
    if (hasCanceld && !hasSubscriptionEnded(periodEnd)) {
      const foundUser = await User.findByIdAndUpdate(
        id,
        {
          isSubCanceled: "ActiveTillEnd",
        },
        { new: true }
      );
      res.status(200).json(foundUser);
    } else {
      res.status(200).json(targetUser);
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

//check if user renews plan
const renewSub = asyncHandler(async (req, res) => {
  const id = req?.user?._id;
  const targetUser = await User.findById(id);
  const customerId = await targetUser?.stripe_customer_id;

  try {
    const subStatus = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    const updateSubStatus = await User.findByIdAndUpdate(
      id,
      {
        subscriptions: subStatus.data,
        role: "subscriber",
      },
      { new: true }
    );

    if (
      updateSubStatus.subscriptions[0].cancel_at_period_end === false &&
      updateSubStatus.isSubCanceled === "ActiveTillEnd"
    ) {
      const subStatus = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        expand: ["data.default_payment_method"],
      });

      const updateSubStatus = await User.findByIdAndUpdate(
        id,
        {
          subscriptions: subStatus.data,
          role: "subscriber",
          isSubCanceled: "Active",
        },
        { new: true }
      );

      const updatedUser = await User.findById(id);

      res.status(200).json(updatedUser);
    } else {
      res.status(200).json(targetUser);
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = {
  registerUser,
  userLogin,
  userDetails,
  fetchAllUsers,
  stripePrices,
  userPasswordUpdate,
  userPasswordReset,
  userPasswordResetAfterClick,
  verifyAccount,
  verifyAccountAfterClick,
  updateUserField,
  saveProduct,
  unSaveProduct,
  createSubWindow,
  subStatusUpdate,
  customerPortal,
  updateSubAfterCancel,
  renewSub,
};
