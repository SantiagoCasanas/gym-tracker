import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { getPhoto } from "../controllers/photoController";

const router = Router();

// Public: serve raw image bytes from the database.
router.get("/:id", asyncHandler(getPhoto));

export default router;
