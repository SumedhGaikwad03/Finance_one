import {Router} from "express";
import {login, register} from "../controllers/auth.controller";
import {asyncHandler} from "../utils/asyncHandler";
import { me } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router(); 

router.post("/register" , asyncHandler(register));

router.post("/login", asyncHandler(login)); 

router.get("/me", authMiddleware, asyncHandler(me));

//router.post("/register", asyncHandler(register));

export default router ; 



