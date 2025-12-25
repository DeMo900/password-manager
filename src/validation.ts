import * as z from "zod";
 //defining schema
 function validation (value:object){
 const schema = z.object({
    username:z.string().nonempty("username is required").min(3 ,"username must be at least 3 characters long").max(20 ,"username must be at most 20 characters long"),
    email:z.email("Invalid email").nonempty("email is required"),
    password:z.string().nonempty("password is required").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
, "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number"),
    confirmpassword:z.string().nonempty("confirm password is required"),
 }).refine((data) => data.password === data.confirmpassword, {
  message: "Passwords must match!",
  path: ["confirmpassword"],
});

return schema.safeParse(value)
 }

 export default  validation;