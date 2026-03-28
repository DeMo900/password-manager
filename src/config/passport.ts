import passport from "passport";
import * as google from "passport-google-oauth20";
import { userModel } from "../model";
import dotenv from "dotenv";

dotenv.config();

passport.use(new google.Strategy({
    clientID: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    callbackURL: "/auth/callback"
}, async (accessToken, refreshToken, profile, done) => {
    if (!profile) return done(new Error('No profile received'));
    try {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value
            ? profile.emails[0].value
            : undefined;
        if (!email) return done(new Error('No email received'));

        let user = await userModel.findOne({ $or: [{ googleId: profile.id }, { email: email }] });
        if (user) return done(null, user);

        user = new userModel({
            googleId: profile.id,
            username: profile.displayName,
            email: email
        });
        await user.save();
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user: any, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id: any, done) => {
    const user = await userModel.findById(id);
    done(null, user);
});

export default passport;
