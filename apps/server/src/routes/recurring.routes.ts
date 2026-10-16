import { Router } from "express";
import * as recurringController from "../controllers/recurring.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// All recurring endpoints require authentication
router.use(authMiddleware);

// GET /api/recurring - List detected recurring payment patterns
router.get("/", asyncHandler(recurringController.getRecurringPatterns));

// GET /api/recurring/:id - Get specific pattern with evidence
router.get("/:id", asyncHandler(recurringController.getRecurringPatternById));

// POST /api/recurring/:id/confirm - Mark as confirmed recurring payment
router.post("/:id/confirm", asyncHandler(recurringController.confirmRecurringPattern));

// POST /api/recurring/:id/dismiss - Dismiss pattern from active view
router.post("/:id/dismiss", asyncHandler(recurringController.dismissRecurringPattern));

// POST /api/recurring/:id/reset - Reset pattern status back to possible
router.post("/:id/reset", asyncHandler(recurringController.resetRecurringPattern));

export default router;
