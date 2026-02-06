import mongoose from "mongoose";
//user
const userSchema = new mongoose.Schema({
    googleId:{type:String},
    username: { type: String, required: true, unique:true },
    email: { type: String, required: true ,unique:true},
    password: { type: String}
})
const userModel = mongoose.model("User", userSchema);

///token
const tokenSchema = new mongoose.Schema({
    email : { type: String, required: true},
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: "1h" }
});

const tokenModel = mongoose.model("Token", tokenSchema);
//password
const passwordSchema = new mongoose.Schema({
    id: { type: String, required: true },
    appname:{ type: String, required: true },
    password: { type: String}
})
passwordSchema.index({ appname: 1 });
 passwordSchema.index({ id: 1 }); 
const passwordModel = mongoose.model("Password", passwordSchema);



export { userModel, tokenModel , passwordModel};

/*
READ  => get password by userid
WRITE => new password schema ,store password,appname,userid from the sess
 */