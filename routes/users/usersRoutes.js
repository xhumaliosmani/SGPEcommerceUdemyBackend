const express = require('express');
const { registerUser, userLogin, userDetails, fetchAllUsers, stripePrices, userPasswordUpdate, userPasswordReset, userPasswordResetAfterClick, verifyAccount, verifyAccountAfterClick, updateUserField, saveProduct, unSaveProduct, createSubWindow, subStatusUpdate, customerPortal, updateSubAfterCancel, renewSub } = require('../../controllers/Users/userController.js');
const userAuth = require('../../middleware/auth/Auth.js');

const route = express.Router();

route.post('/register', registerUser);
route.post("/login", userLogin);
route.get("/userDetails", userAuth ,userDetails);
route.get("/allUsers", fetchAllUsers);
route.get("/stripePrices", userAuth, stripePrices);
route.put("/updatePassword", userAuth, userPasswordUpdate);
route.put("/passwordReset",  userPasswordReset);
route.put("/passwordResetAfter", userPasswordResetAfterClick);
route.post("/verifyAccount", userAuth, verifyAccount);
route.put("/verifyAccountAfter", userAuth, verifyAccountAfterClick);
route.put("/updateUser", userAuth, updateUserField);
route.put("/saveProduct", userAuth, saveProduct);
route.put("/unSaveProduct", userAuth, unSaveProduct);
route.post("/createSessionStripe", userAuth, createSubWindow);
route.put("/subStatusUpdate", userAuth, subStatusUpdate);
route.get("/customerPortal", userAuth, customerPortal);
route.put("/subStatusUpdateCancel", userAuth, updateSubAfterCancel);
route.put("/subStatusUpdateRenew", userAuth, renewSub);
module.exports = route;