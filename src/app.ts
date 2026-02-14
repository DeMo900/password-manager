import express, { Request, Response } from "express";
import isAllowed from "./middlewares";
import * as redis from "redis";
import mongoose from "mongoose"
import crypto from "crypto";
import dotenv from "dotenv";
import * as helmet from "helmet";
import auth from "./auth"
import Oauthrouter from "./oauth";
import session from "express-session";
import { RedisStore } from "connect-redis";
import cookieParser from "cookie-parser"
import {userModel,passwordModel}  from "./model"
dotenv.config();
const port = process.env.PORT ;
const app = express();
// redis client
const db = redis.createClient();

(async()=>await db.connect())();
db.on('error',async (err)=>{
console.log(`Redis Client Error ${err}`)
})
//mongo client
mongoose.connect(process.env.MONGO_URL!)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
// middlewares
app.use(session({
  store: new RedisStore({ client: db }),
  secret: process.env.SESSION_SECRET_!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 15
  }
}));
app.use(cookieParser());
app.set("view engine","ejs")
app.use(helmet.default())
app.use(express.json());
app.use(express.static("assets"));
app.use(express.urlencoded({ extended: true }));
app.use(Oauthrouter)
app.use(auth)

//functions
  interface delbody {
    appName:string
  }
  interface delparam extends delbody{}
const deletePassword = async (req: Request<delparam,delparam,delparam>, res: Response) => {
  try{
    const appName = req.params.appName;
    //deleting cache
    const userId = (req.session as any).user._id;//geting user from the session
    await db.del(`userId:${userId}`)//deleting

  const find = await passwordModel.findOne({appname:appName})
  if(!find){
    return res.status(404).send("password not found")
  }
 await passwordModel.deleteOne({appname:appName,id:userId})
  return res.status(200).json({url:"/"})
}catch(err){
  return res.status(500).send("Internal Server Error")
}
}
// routes
app.get("/",isAllowed, async (req: Request, res: Response) => {
  try{
   interface UserData {
     id: string;
     appname: string;
     password: string;
   }
const userId = (req.session as any).user._id;
  const userData : string | null = await db.get(`userId:${userId}`);
  //check if user was cached
if (userData) {
  // User exists in Redis
  const parsedData: UserData[] = JSON.parse(userData);
  //decrypt from redis
   parsedData.map((current:any,index,array)=>{
    const [encrypted,IV,authTag] = current.password.split(":")
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm"
      ,key
      ,Buffer.from(IV, "base64")
    )
    decipher.setAuthTag(Buffer.from(authTag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64")),
      decipher.final()
    ])
    current.password = decrypted.toString("utf8")
    return current 
    })
    console.log((req.session as any).user)
 return res.render("index",{data:parsedData,recent:parsedData[0],username:(req.session as any).user.username});
}
const passwords = await passwordModel.find({ id: userId }).sort({_id:-1})
//if no passwrods
if(passwords.length===0){
  return res.render("index",{data:[],recent:{appname:"AppName",password:"Password"},username:(req.session as any ).user.username})  
}
await db.set(`userId:${userId}`, JSON.stringify(passwords),{EX:600});//after 10 minutes
//decrypting
 passwords.map((current:any,index,array)=>{
const [encrypted,IV,authTag] = current.password.split(":")
const key = Buffer.from(process.env.ENCRYPTION_KEY!, "base64");
const decipher = crypto.createDecipheriv("aes-256-gcm"
  ,key
  ,Buffer.from(IV, "base64")
)
decipher.setAuthTag(Buffer.from(authTag, "base64"));
const decrypted = Buffer.concat([
  decipher.update(Buffer.from(encrypted, "base64")),
  decipher.final()
])
current.password = decrypted.toString("utf8")
return current 
})
//rendering
return res.render("index",{data:passwords,recent:passwords[0],username:(req.session as any).user.username})
  }catch(err){
  console.error("Error fetching user data:", err);
  return res.status(500).send("Internal Server Error");
}
});
//post
interface body {
  length: string;
  appName: string;
}
app.post("/generate", async(req: Request<{},{},body>, res: Response) => {
 const { length, appName } = req.body;
const userId = (req.session as any).user._id;
//validation
const parsedLength = parseInt(length);
 if (!length || parsedLength <= 0) {
   return res.status(400).send("Invalid length");
 }
 if (!appName) {
   return res.status(400).send("App name is required");
 }
 //generate password
 const password : string = crypto.randomBytes(Math.ceil(parsedLength / 2)).toString("hex").slice(0, parsedLength);
 //encrypting
 //key
 const key = Buffer.from(process.env.ENCRYPTION_KEY!, "base64");
 const IV = crypto.randomBytes(12);
 const cypher = crypto.createCipheriv("aes-256-gcm",key,IV) ;
 //encrypting 
 const encrypted = Buffer.concat([
  cypher.update(password, "utf8"),
  cypher.final()
]);
const getAuthTag = cypher.getAuthTag()
const encryptedData = `${encrypted.toString("base64")}:${IV.toString("base64")}:${cypher.getAuthTag().toString("base64")}`;

 //storing password
await passwordModel.insertOne(
  {
    id: userId,
    appname: appName,
    password:encryptedData
  }
);
 //deleting caching
 await db.del(`userId:${userId}`);
 return res.status(302).redirect("/");
});
 //delete existing password
 app.delete("/delete/:appName",deletePassword)
 //clearing
 app.delete("/clear",async(req:Request,res:Response)=>{
  try{
  //getting user id
  const userId = (req.session as any).user._id;
  //checking if there is passwords
  const passwords = await passwordModel.find({id:userId})
  if(passwords.length===0) return res.status(400).json({msg:"no data to clear"})
  //deleting all passwords associated with that id
  await passwordModel.deleteMany({id:userId})
  //removing cache
  await db.del(`userId:${userId}`)
  //returning json with the  url /
  return res.json({url:"/"}) 
  }catch(err){
  return res.status(500).send("internal servr error")
  }
 })
 //loging out
 app.post("/logout",(req:Request,res:Response)=>{
  //clearing session
  req.session.destroy((err)=>{
    if(err){
      return res.status(500).send("error while logging out")
    }
  })
  res.clearCookie("connect-ssid")
  //redirect
return res.status(200).json({url:"/"})
 })
//listening 
app.listen(port, (err) =>{
    if(err){
        console.error("Error starting the server:", err);
        process.exit(1);
    }
    console.log(`server is listening to port ${port} `)
})
export default db ;