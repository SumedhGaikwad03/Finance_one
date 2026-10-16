import { Router } from "express";
import * as insightsController from "../controllers/insights.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
    "/monthly",
    authMiddleware,
    asyncHandler(insightsController.getMonthlyInsights)
);

export default router;
