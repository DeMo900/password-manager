import express , {Request,Response} from "express"
import * as bcrypt from "bcrypt-ts"
import {userModel,tokenModel}  from "./model"
import db from "./app"
import validation from "./validation"
import { body ,validationResult} from "express-validator"
import {createTransport} from "nodemailer"
import crypto from "crypto";    
const router = express.Router()
// Get signup
router.get("/signup",(req:Request,res:Response)=>{
res.render("signup",{error:""})
})
// Get login
router.get("/login",(req:Request,res:Response)=>{
    res.render("login",{error:""})
})
//get verify
router.get("/verifyemail",(req:Request,res:Response)=>{
    res.render("emailverify",{error:""})
})
// Post signup
router.post("/signup", async (req: Request, res: Response) => {
    console.log(req.session)
    const { email, password, username } = req.body
try{
    //validating
  const validate =  validation(req.body)
  if(!validate.success)  return res.status(400).render("signup",{error:validate.error.issues[0]!.message})//return the first error message
    //checking if user exists
    const user = await userModel.findOne({$or:[{username},{email}]})
    if(user) return res.status(409).render("signup",{error:`user with the same username already exists`})
//hashing
const hashedPassword = await bcrypt.hash(password,8)
//creating user
const newUser = new userModel({
    username,
    email,
    password: hashedPassword,
})
await newUser.save()//saving
//redirect
res.redirect("/login")
}catch(err){
    console.log(`Error from post signup: ${err}`)
    return res.status(500).send("Internal Server Error")
} 
})
router.post("/login",body("password").notEmpty().withMessage("Password is required"),
body("email").isEmail().withMessage("invalid email format")
,async(req:Request,res:Response)=>{
const {email,password} = req.body;
const results = validationResult(req);
if(!results.isEmpty()) return res.status(400).render("login",{error:results.array()[0]!.msg});
try{
//checking if user exists
const user = await userModel.findOne({email}).select("-username");
if(!user) return res.status(409).render("login",{error:"user not found"});
//comparing password
const isCorrect =await bcrypt.compare(password,user.password!);
if(!isCorrect) return res.status(401).render("login",{error:"wrong password"});


(req.session as any).user ={id:user._id}
res.redirect("/");
}catch(err){
    console.log(`error from post login ${err}`)
    return res.status(500).render("500");
}
})
//post verify email
router.post("/verifyemail",body("email").isEmail().withMessage("invalid email format")
,async(req:Request,res:Response)=>{
    //validation
const {email} = req.body;
const oldCookie = req.cookies.otpToken
const results = validationResult(req);
if(!results.isEmpty()) return res.status(400).render("login",{error:results.array()[0]!.msg});
try{
    if(oldCookie){
        //checking if user was on Blacklist
 if(await db.exists(`blackListed:${email}`)===1) return res.status(429).json({error:"you were blocked,try again later"});
//getting requests
    const requests = await db.incr(`otpRequests:${email}`);
    if(requests === 1){
        //expire after 60s
        console.log("1st request was made")
      await db.expire(`otpRequests:${email}`, 60);
    }
    if(requests>1 && requests <5){
console.log(requests)
return res.status(429).json({error:"too many requests, please try again later"});
    }
if (requests >=5){
    //levels
    enum blockLevels {
        LOW = 600,
        MEDIUM = 3600,
        HIGH = 86400
    }
type blockOptions = "LOW" | "MEDIUM" | "HIGH";
    //checking for past record
    if(await db.exists(`record:${email}`) && await db.exists(`blackListed:${email}`)===0){
    const recordLevel = await db.get(`record:${email}`)as blockOptions | null; 
        switch(recordLevel){
            case "LOW":
           await db.set(`blackListed:${email}`, "MEDIUM", {EX: blockLevels.MEDIUM});
                await db.set(`record:${email}`, "MEDIUM", {EX: 86400});
                break;
            case "MEDIUM":
                await db.set(`blackListed:${email}`, "HIGH", {EX: blockLevels.HIGH});
                await db.set(`record:${email}`, "HIGH", {EX: 86400});
                break;
            case "HIGH":
                await db.set(`blackListed:${email}`, "HIGH", {EX: blockLevels.HIGH});
                await db.set(`record:${email}`, "HIGH", {EX: 86400});
                break;
        }
        return res.status(429).json({error:"you were blocked,try again later"});
    }
   //if no record create one and blacklist
    await db.set(`blackListed:${email}`,"LOW", {EX: blockLevels.LOW});
    //setting record
    await db.set(`record:${email}`, "LOW" , {EX:blockLevels.LOW});
    return res.status(429).json({error:"you were blocked,try again later"});
    }
 await db.del(`otpToken:${oldCookie}`);
res.clearCookie("otpToken");
console.log("cookie cleared")

   }  
//getting and filtering user
const user = await userModel.findOne({email})
.select("-username")
.select("-password")
if(!user) return res.status(409).json({error:"user not found"});
//cooldown
//generating code
const code = []
for(let i=0;i<6;i++){
    code.push(crypto.randomInt(0, 9).toString());
}
const otp = code.join("");
//generating otpToken
const otpToken = crypto.randomUUID()
//creating email object before storing
const tokenObject = {
email ,
otp
};
//storing
await db.set(`otpToken:${otpToken}`, JSON.stringify(tokenObject),{EX: 5 * 60});//5minutes
//seting cookies
res.cookie("otpToken", otpToken, 
    { httpOnly: true, secure: true, sameSite: "strict", maxAge: 5 * 60 * 1000 }
);
//sending email
await createTransport({
    host: "smtp.gmail.com", 
  port: 465,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.APPCODE,
    },
}).sendMail({
    from: "password master",
    to: email,
    subject: "Verify your email",
    text: `Your verification code is ${otp}`,
});
res.json({message:"code sent to email"});
}catch(err){
    console.log(`error from vetify email ${err}`)
    return res.status(500).render("500");
}
})
//checking if code exists
router.post("/verifycode",async(req:Request,res:Response)=>{
const {code} = req.body;
const pattern = /^\d{6}$/
//validation
if(!code || !pattern.test(code)) return res.status(400).json({error:"code must be 6 digits"});
try{
    //get token
    const otpToken = req.cookies.otpToken
    //checking if otpToken exists
    if(!otpToken) return res.status(400).json({error:"auth error"}) ;
//checking if code exists
const getData = await db.get(`otpToken:${otpToken}`);
if(!getData) return res.status(400).json({error:"invalid token"});
const parsedData = JSON.parse(getData);
//getting email
const email = parsedData.email;
//checking if code is right
if(code !== parsedData.otp) return res.status(400).json({error:"invalid code,please enter the received code or resend"});
//deleting the otp
await db.del(`otpToken:${otpToken}`);
//deleting otp cookies
res.clearCookie(`otpToken`);
//generating token
const passwordToken = crypto.randomUUID();
await db.set(`passwordToken:${passwordToken}`, email,{EX: 5 * 60});//5minutes
//fuck vscode auto complete
//sending token in cookies
res.cookie("passwordToken", passwordToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 5 * 60 * 1000 });
res.json({ msg:"otp confirmed" });
}catch(err){
     console.log(`error from vetify code ${err}`)
    return res.status(500).render("500");
}
})
//reset password
router.post("/resetpassword",
    body("password").isStrongPassword(),
    async(req:Request,res:Response)=>{
    try{
    const {password} = req.body;
    const token = req.cookies.passwordToken;
//validation
const errors = validationResult(req);
if(!errors.isEmpty()) return res.status(400).json({error:"password must be atleast 8 characters long with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"});
//getting email
const email = await db.get(`passwordToken:${token}`);
const user = await userModel.findOne({email});
if(!user) return res.status(404).json({error:"user not found"});
//updating password
user.password = await bcrypt.hash(password,8);
await user.save();
//deleting token
await db.del(`passwordToken:${token}`);
//clearing cookie
res.clearCookie("passwordToken");
res.redirect("/login");
}catch(err){
    console.log(`error from password reset ${err}`)
    return res.status(500).render("500");
}
})

export default router;