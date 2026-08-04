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

export default router;