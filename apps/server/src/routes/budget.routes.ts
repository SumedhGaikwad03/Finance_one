import { Router } from "express";
import * as budgetController from "../controllers/budget.controller";
import {authMiddleware} from "../middleware/auth.middleware";
import {asyncHandler} from "../utils/asyncHandler";

const router = Router();

/**
 * Budget Routes
 */

// Create a new budget.
router.post(
    "/",
    authMiddleware,
    asyncHandler(budgetController.createBudget)
);

router.get("/active" , authMiddleware,asyncHandler(budgetController.getActiveBudget));

router.get("/",authMiddleware, asyncHandler(budgetController.getMyBudgets))

router.patch("/:id", authMiddleware,asyncHandler(budgetController.updateBudget)); 

router.delete("/:id",authMiddleware,asyncHandler(budgetController.deleteBudget));

router.patch("/:id/lock",authMiddleware,asyncHandler(budgetController.lockBudget)); 


export default router;