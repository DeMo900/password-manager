import { Request, Response, NextFunction } from "express";
import EventEmitter from "events";
import nodemailer from "nodemailer";
import db from "./app"
import { userModel } from "./model";
type user = {
    _id:string,
    email?:string,
    username?:string,
    ip?:[string]
}
// Middleware to check if session user id exists
const isAllowed = (req: Request, res: Response, next: NextFunction) => {
  // Check if session exists and has user with _id (as you're using in app.ts)
  if (!req.session || !(req.session as any).user || !(req.session as any).user._id
||!(req.session as any ).user.verified ) {
    return res.redirect("/login");
  }
  // If user exists, continue to next middleware/route
  //last activeQ
  if((Date.now() - (req.session as any ).user.lastActive) > 30*60*1000){ //30 minutes
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
    });
  res.clearCookie("connect-ssid");
    return res.redirect("/login");
  }
  (req.session as any ).user.lastActive = Date.now();
  

  next();
};
//events
export const eventEmitter = new EventEmitter();
eventEmitter.on("ipChange",async(user:user,newIp:string)=>{
const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a random 6-digit code
try{
  await db.set(`ipChange:${user._id}`,code,{EX:300})
const transport = nodemailer.createTransport({
  service:"gmail",
  auth:{
    user:process.env.EMAIL,
    pass:process.env.APPCODE}
  });
  transport.sendMail({
    from:process.env.EMAIL,
    to:user.email,
    subject:"IP Address Changed",
    html:`<h1>Hello ${user.username}</h1><p>Your IP address has been changed to ${newIp}
    </p>
   <p>If this is you,Please enter theis code </p>
   <h1 align="center">${code}</h1>
   <h4 align="center">This code will expire in 5 minutes</h4>
   `
   
  })
}catch(err){
  console.log(`error while sending email ${err}`)
}
})
export default isAllowed;