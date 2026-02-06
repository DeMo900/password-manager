import express, { Request, Response } from "express";
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
  return res.status(200).send("password deleted successfully")
}catch(err){
  return res.status(500).send("Internal Server Error")
}
}
// routes
app.get("/", async (req: Request, res: Response) => {
  try{
   interface UserData {
     id: string;
     appname: string;
     password: string;
    
   }
const userId = (req.session as any).user._id;
  const userData : string | null = await db.get(`userId:${userId}`);
if (userData) {
  // User exists in Redis
  const parsedData: UserData[] = JSON.parse(userData);
 return res.render("index",{data:parsedData});
}
const passwords: UserData[] = await passwordModel.find({ id: userId });
await db.set(`userId:${userId}`, JSON.stringify(passwords),{EX:600});//after 10 minutes
return res.render("index",{data:passwords});
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
 //storing password
await passwordModel.insertOne(
  {
    id: userId,
    appname: appName,
    password
  }
);
 //deleting caching
 await db.del(`userId:${userId}`);
 return res.status(302).redirect("/");
});
 //delete existing password
 app.delete("/delete/:appName",deletePassword)
//listening 
app.listen(port, (err) =>{
    if(err){
        console.error("Error starting the server:", err);
        process.exit(1);
    }
    console.log(`server is listening to port ${port} `)
})
export default db ;