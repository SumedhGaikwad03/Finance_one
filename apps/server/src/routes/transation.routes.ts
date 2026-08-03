import  Router from "express";
import { createTransaction } from "../controllers/transaction.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/" , authMiddleware , asyncHandler(createTransaction));

// this makes sure that only an authticated user can create a request 

export default router;
