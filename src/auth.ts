import express , {Request,Response} from "express"
import * as bcrypt from "bcrypt-ts"
import {userModel,tokenModel}  from "./model"
import db from "./app"
import validation from "./validation"
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
router.post("/login",async(req:Request,res:Response)=>{
const {email,password} = req.body;
if(password.length>16 )return res.status(400).render("login",{error:"invalid password data"});
const pattern = /^(?!\.)(?!\.*\.\.)([\na-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i;
    
if(pattern.test(email) === false) return  res.status(400).render("login",{error:"invalid email"});
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
    return res.status(500).send("error");
}
})
//post verify email
router.post("/verifyemail",async(req:Request,res:Response)=>{
    //validation
const {email} = req.body;
const pattern = /^(?!\.)(?!\.*\.\.)([\na-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i;
if(!email.match(pattern)) return res.status(400).render("emailverify",{error:"invalid email"});
try{
//getting and filtering user
const user = await userModel.findOne({email})
.select("-username")
.select("-password")
if(!user) return res.status(409).render("emailverify",{error:"user not found"});
//generating code
const code = []
for(let i=0;i<6;i++){
    code.push(crypto.randomInt(0, 9).toString());
}
const otp = code.join("");
//storing
await db.set(`otp:${otp}`, email,{EX: 5 * 60});

}catch(err){
    return res.status(500).send("error");
}
})

export default router;