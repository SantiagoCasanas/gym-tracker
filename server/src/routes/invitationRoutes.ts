import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  createInvitation,
  listInvitations,
  getInvitation,
  acceptInvitation,
  resendInvitation,
} from "../controllers/invitationController";

const router = Router();

// Admin-only
router.post("/", requireAuth, requireAdmin, asyncHandler(createInvitation));
router.get("/", requireAuth, requireAdmin, asyncHandler(listInvitations));
router.post("/:id/resend", requireAuth, requireAdmin, asyncHandler(resendInvitation));

// Public
router.get("/:token", asyncHandler(getInvitation));
router.post("/:token/accept", asyncHandler(acceptInvitation));

export default router;
