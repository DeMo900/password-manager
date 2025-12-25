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
    res.render("login")
})
// Post signup
router.post("/signup", async (req: Request, res: Response) => {
    const { email, password, username } = req.body
try{
    //validating
  const validate = await validation(req.body)
  if(!validate.success)  return res.status(400).render("signup",{error:validate.error.issues[0]!.message})//return the first error message
    //checking if user exists
    const user = await UserModel.findOne({username})
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

export default router;