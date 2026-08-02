import {Router} from "express";
import {register} from "../controllers/auth.controller";
import {asyncHandler} from "../utils/asyncHandler";

const router = Router(); 

router.post("/register" , asyncHandler(register));

export default router ; 



