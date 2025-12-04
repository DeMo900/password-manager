import express, { Request, Response } from "express";
import * as redis from "redis";
import crypto from "crypto";
import dotenv from "dotenv";
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//functions
  interface delbody {
    appName:string
  }
const deletePassword = async (req: Request<{},{},delbody>, res: Response) => {
 await db.del(req.body.appName)
  return res.status(200).send(`password  deleted`);
}
// routes
app.get("/", async (req: Request, res: Response) => {
   let arr:object[] = []
  let key = await db.keys("*")
  console.log(key)
  for (let i = 0; i < key.length; i++){

  let value = await db.get(key[i]!)
   arr.push({[key[i]!]  : value})
}
res.send(arr)
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
 return res.status(200).send(`password set${appName}:${password}`);
 
});
 //delete existing password
 app.delete("/delete",deletePassword)
//listening 
app.listen(port, (err) =>{
    if(err){
        console.error("Error starting the server:", err);
        process.exit(1);
    }
    console.log(`server is listening to port ${port} `)
})
