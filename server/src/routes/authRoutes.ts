import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { upload } from "../lib/upload";
import {
  login,
  me,
  updateProfile,
  updateAvatar,
  changePassword,
} from "../controllers/authController";

const router = Router();

router.post("/login", asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));
router.put("/profile", requireAuth, asyncHandler(updateProfile));
router.put(
  "/avatar",
  requireAuth,
  upload.single("photo"),
  asyncHandler(updateAvatar)
);
router.put("/password", requireAuth, asyncHandler(changePassword));

export default router;
