import  Router from "express";
import *  as transactionController from "../controllers/transaction.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/" , authMiddleware , asyncHandler(transactionController.createTransaction));
router.get("/getMyTransactions" , authMiddleware , asyncHandler(transactionController.getMyTransactions)); // this route is used to get the transactions for a user
router.patch("/:id" , authMiddleware, asyncHandler(transactionController.updateTransaction)); 
router.delete("/:id", authMiddleware ,asyncHandler(transactionController.deleteTransaction));
// this makes sure that only an authticated user can create a request 

export default router;
