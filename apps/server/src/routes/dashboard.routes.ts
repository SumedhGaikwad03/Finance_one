import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
    "/",
    authMiddleware,
    asyncHandler(dashboardController.getDashboard)
);

export default router;