import express , {Request,Response} from "express"


const router = express.Router()

router.get("/signup",(req:Request,res:Response)=>{
res.render("signup")
})


export default router;