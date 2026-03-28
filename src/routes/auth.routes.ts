import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { body } from "express-validator";

const router = Router();

router.get("/signup", authController.getSignup);
router.get("/login", authController.getLogin);
router.get("/verifyemail", authController.getVerifyEmail);
router.post("/signup", authController.postSignup);
router.post("/login", 
    body("password").notEmpty().withMessage("Password is required"),
    body("email").isEmail().withMessage("invalid email or password"),
    authController.postLogin
);
router.post("/verifyemail", 
    body("email").isEmail().withMessage("invalid email format"),
    authController.postVerifyEmail
);
router.post("/verifycode", authController.postVerifyCode);
router.post("/resetpassword", 
    body("password").isStrongPassword(),
    authController.postResetPassword
);
router.get("/verifyDevice", authController.getVerifyDevice);
router.post("/verifyDevice", authController.postVerifyDevice);
router.post("/logout", authController.postLogout);

export default router;
