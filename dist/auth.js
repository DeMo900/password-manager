"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt = __importStar(require("bcrypt-ts"));
const model_1 = require("./model");
const app_1 = __importDefault(require("./app"));
const validation_1 = __importDefault(require("./validation"));
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
// Get signup
router.get("/signup", (req, res) => {
    res.render("signup", { error: "" });
});
// Get login
router.get("/login", (req, res) => {
    res.render("login", { error: "" });
});
//get verify
router.get("/verifyemail", (req, res) => {
    res.render("emailverify", { error: "" });
});
// Post signup
router.post("/signup", async (req, res) => {
    console.log(req.session);
    const { email, password, username } = req.body;
    try {
        //validating
        const validate = (0, validation_1.default)(req.body);
        if (!validate.success)
            return res.status(400).render("signup", { error: validate.error.issues[0].message }); //return the first error message
        //checking if user exists
        const user = await model_1.userModel.findOne({ $or: [{ username }, { email }] });
        if (user)
            return res.status(409).render("signup", { error: `user with the same username already exists` });
        //hashing
        const hashedPassword = await bcrypt.hash(password, 8);
        //creating user
        const newUser = new model_1.userModel({
            username,
            email,
            password: hashedPassword,
        });
        await newUser.save(); //saving
        //redirect
        res.redirect("/login");
    }
    catch (err) {
        console.log(`Error from post signup: ${err}`);
        return res.status(500).send("Internal Server Error");
    }
});
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (password.length > 16)
        return res.status(400).render("login", { error: "invalid password data" });
    const pattern = /^(?!\.)(?!\.*\.\.)([\na-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i;
    if (pattern.test(email) === false)
        return res.status(400).render("login", { error: "invalid email" });
    try {
        //checking if user exists
        const user = await model_1.userModel.findOne({ email }).select("-username");
        if (!user)
            return res.status(409).render("login", { error: "user not found" });
        //comparing password
        const isCorrect = await bcrypt.compare(password, user.password);
        if (!isCorrect)
            return res.status(401).render("login", { error: "wrong password" });
        req.session.user = { id: user._id };
        res.redirect("/");
    }
    catch (err) {
        return res.status(500).send("error");
    }
});
//post verify email
router.post("/verifyemail", async (req, res) => {
    //validation
    const { email } = req.body;
    const pattern = /^(?!\.)(?!\.*\.\.)([\na-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i;
    if (!email.match(pattern))
        return res.status(400).json({ error: "invalid email" });
    try {
        //getting and filtering user
        const user = await model_1.userModel.findOne({ email })
            .select("-username")
            .select("-password");
        if (!user)
            return res.status(409).json({ error: "user not found" });
        //generating code
        const code = [];
        for (let i = 0; i < 6; i++) {
            code.push(crypto_1.default.randomInt(0, 9).toString());
        }
        const otp = code.join("");
        //storing
        await app_1.default.set(`otp:${otp}`, email, { EX: 5 * 60 });
        //sending email
        res.json({ message: "code sent to email", code: otp });
    }
    catch (err) {
        return res.status(500).send("error");
    }
});
//checking if code exists
router.post("/verifycode", async (req, res) => {
    const { code } = req.body;
    const parsed = parseInt(code);
    //validation
    if (!code || parsed.toString().length !== 6)
        return res.status(400).json({ error: "code must be 6 digits" });
    //checking if code exists
    const getcode = await app_1.default.keys(`otp:${code}`);
    if (getcode.length === 0)
        return res.status(400).json({ error: "invalid code" });
    res.json({ message: "code verified" });
});
exports.default = router;
//# sourceMappingURL=auth.js.map