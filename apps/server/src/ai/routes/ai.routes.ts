import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as aiController from "../controllers/ai.controller";

const router = Router();

// POST /api/ai/query - Process authenticated natural-language financial queries
router.post("/query", authMiddleware, aiController.queryTransactions);

export default router;
