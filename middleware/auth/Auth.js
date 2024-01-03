const jwt = require("jsonwebtoken")
const User = require("../../model/User/User.js")
const asyncHandler = require("express-async-handler");

const userAuth = asyncHandler(async(req,res, next)=> {
    //check and get the token/cookie
    const token = req?.headers?.cookie.slice(6) || req?.header("token") || req?.cookies.token;

    try {

        if(!token){
            return res.status(401).json({
                message: "No entry without authentication!"
            })
        }

        const user = jwt.verify(token, process.env.APP_JWT_SECRET_KEY);

        const userFound = await User.findById(user.id).select("-password");

        req.user = userFound;

        //log user see if working
        //console.log(userFound);
        
    } catch (error) {
        return res.json({message: "Error at Authentication", error})
    }

    next();
})

module.exports = userAuth;