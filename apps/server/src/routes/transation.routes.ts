import  Router from "express";
import *  as transactionController from "../controllers/transaction.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/" , authMiddleware , asyncHandler(transactionController.createTransaction));
router.get("/getMyTransactions" , authMiddleware , asyncHandler(transactionController.getMyTransactions)); // this route is used to get the transactions for a user

// this makes sure that only an authticated user can create a request 

export default router;
