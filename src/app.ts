import express, { Request, Response } from "express";
import * as redis from "redis";
import crypto from "crypto";
import dotenv from "dotenv";
import * as helmet from "helmet";
dotenv.config();
const port = process.env.PORT ;
const app = express();

// redis client
const db = redis.createClient({
  url: "redis://127.0.0.1:6379"
});
(async()=>await db.connect())();
db.on('error',(err)=>{
console.log(`Redis Client Error ${err}`)
})

// middlewares
app.set("view engine","ejs")
app.use(helmet.default())
app.use(express.json());
app.use(express.static("assets"));
app.use(express.urlencoded({ extended: true }));
//functions
  interface delbody {
    appName:string
  }
  interface delparam extends delbody{}
const deletePassword = async (req: Request<delparam,delparam,delparam>, res: Response) => {
  try{
  let key = await db.get(req.params.appName)
  console.log(req.params.appName)
  if(!key){
    return res.status(404).send("password not found")
  }
 await db.del(req.params.appName)
  return res.status(200).send(`password  deleted`);
}catch(err){
  return res.status(500).send("Internal Server Error")
}
}
// routes
app.get("/", async (req: Request, res: Response) => {
   let arr:object[] = []
  let key = await db.keys("*")
  //console.log(key)
  for (let i = 0; i < key.length; i++){

  let value = await db.get(key[i]!)
   arr.push({app:key[i]! , password:value})
 
}
  console.log(arr)
res.render("index",{data:arr})
});
//post
interface delbody {
length:string,
}
app.post("/generate", async(req: Request<{},{},delbody>, res: Response) => {
 let { length, appName } = req.body;
let  plength = parseInt(length);
 if (!length || plength <= 0) {
   return res.status(400).send("Invalid length");
 }
 if (!appName) {
   return res.status(400).send("App name is required");
 }
 //generate password
 const password = crypto.randomBytes(Math.ceil(plength / 2)).toString("hex").slice(0, plength);
 await db.set(appName, password);
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
