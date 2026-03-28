import { Router } from "express";
import passport from "../config/passport";
import * as oauthController from "../controllers/oauth.controller";

const router = Router();

router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    oauthController.googleAuthCallback
);

export default router;
