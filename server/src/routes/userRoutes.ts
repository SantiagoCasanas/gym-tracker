import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  listUsers,
  adminResetPassword,
  deleteUser,
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
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteUser));

export default router;
