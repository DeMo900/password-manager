import express , {Request,Response} from "express"
import * as bcrypt from "bcrypt-ts"
import UserModel from "./model"
import validation from "./validation"
const router = express.Router()
// Get signup
router.get("/signup",(req:Request,res:Response)=>{
res.render("signup",{error:""})
})
// Get login
router.get("/login",(req:Request,res:Response)=>{
    res.render("login",{error:""})
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
    const user = await UserModel.findOne({$or:[{email,username}]})
    if(user) return res.status(409).render("signup",{error:`user with the same username already exists`})
//hashing
const hashedPassword = await bcrypt.hash(password,8)
//creating user
const newUser = new UserModel({
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
const user = await UserModel.findOne({email});
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

export default router;