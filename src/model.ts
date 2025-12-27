import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    googleId:{type:String},
    username: { type: String, required: true, unique:true },
    email: { type: String, required: true ,unique:true},
    password: { type: String}
})
const um = mongoose.model("User", userSchema);
export default um;
