import express, { Request,Response } from 'express'; 
import passport from 'passport';
import * as google from "passport-google-oauth20";
import {userModel} from "./model"
require("dotenv").config()
const Oauthrouter  = express.Router()
passport.use(new google.Strategy({
    clientID: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    callbackURL: "/auth/callback"
},
async(accessToken, refreshToken, profile, done) => {
    // Here you can save the user information to your database
    if (!profile) {
        return done(new Error('No profile received'));
    }
    try{
    const email = profile.emails && profile.emails[0] && profile.emails[0].value
        ? profile.emails[0].value
        : undefined;
        if(!email) return done(new Error('No email received'));

    const user = await userModel.findOne({$or:[{googleId:profile.id},{email:email}]});
    if(user){
        return done(null, user);
    }
    const newu = new userModel({
        googleId: profile.id,
        username: profile.displayName,
        email: email
    });
    await newu.save();
   return done(null, newu);
    
}catch(err){
    return done(err)
}
}
))
//interfaces
interface IUser {
  _id: String,
  email: String,
}
passport.serializeUser((user:any, done) => {
    done(null, user._id);
});
passport.deserializeUser(async (id:any, done) => {
    const user = await userModel.findById(id);
    done(null,user);
});

Oauthrouter.get('/google',
passport.authenticate('google', { scope: ['profile', 'email'] })
);
Oauthrouter.get('/auth/callback',
passport.authenticate('google', { failureRedirect: '/' }),
(req, res) => {
    // Successful authentication, save user info to session
    if (req.user) {
  (req.session as any).user= (req.user as IUser);
} else {
 return res.status(401).send('User not authenticated');
}
    // Successful authentication, redirect home.
    res.redirect('/');
}
);
export default Oauthrouter;