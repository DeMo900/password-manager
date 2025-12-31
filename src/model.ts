import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    googleId:{type:String},
    username: { type: String, required: true, unique:true },
    email: { type: String, required: true ,unique:true},
    password: { type: String}
})
const userModel = mongoose.model("User", userSchema);


const tokenSchema = new mongoose.Schema({
    email : { type: String, required: true},
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: "1h" }
});

const tokenModel = mongoose.model("Token", tokenSchema);

export { userModel, tokenModel };

