import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  listUsers,
  adminResetPassword,
} from "../controllers/userController";

const router = Router();

// Admin-only
router.get("/", requireAuth, requireAdmin, asyncHandler(listUsers));
router.put(
  "/:id/password",
  requireAuth,
  requireAdmin,
  asyncHandler(adminResetPassword)
);

export default router;
