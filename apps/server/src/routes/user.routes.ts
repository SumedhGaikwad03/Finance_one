import { Router } from "express";
import {
  findUser,
  getUsers,
  me,
  updateCurrentUser,
  changePassword,
  updateUserdata,
} from "../controllers/user.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Specific authenticated user profile & security endpoints (MUST be defined before /:id)
router.get("/me", authMiddleware, asyncHandler(me));
router.patch("/me", authMiddleware, asyncHandler(updateCurrentUser));
router.patch("/me/password", authMiddleware, asyncHandler(changePassword));

router.get("/", authMiddleware, asyncHandler(getUsers));
router.get("/:id", authMiddleware, asyncHandler(findUser));
router.patch("/:id", authMiddleware, asyncHandler(updateUserdata));

export default router;

//  now each of these routes are on track to be passed through the async controller as each  request may take long and
// and we should be able to handel async requests 
