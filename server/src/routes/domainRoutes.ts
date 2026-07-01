import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { upload } from "../lib/upload";
import {
  listSections,
  createSection,
  updateSection,
  deleteSection,
} from "../controllers/sectionController";
import {
  listExercises,
  createExercise,
  getExercise,
  deleteExercise,
  updateExercisePhoto,
} from "../controllers/exerciseController";
import {
  listSets,
  createSet,
  deleteSet,
  getProgress,
} from "../controllers/setController";
import {
  listBodyWeight,
  createBodyWeight,
  deleteBodyWeight,
} from "../controllers/bodyweightController";

const router = Router();

// All domain routes require auth.
router.use(requireAuth);

// Sections
router.get("/sections", asyncHandler(listSections));
router.post("/sections", asyncHandler(createSection));
router.put("/sections/:id", asyncHandler(updateSection));
router.delete("/sections/:id", asyncHandler(deleteSection));

// Exercises (nested under section + top-level)
router.get("/sections/:sectionId/exercises", asyncHandler(listExercises));
router.post(
  "/sections/:sectionId/exercises",
  upload.single("photo"),
  asyncHandler(createExercise)
);
router.get("/exercises/:id", asyncHandler(getExercise));
router.delete("/exercises/:id", asyncHandler(deleteExercise));
router.put(
  "/exercises/:id/photo",
  upload.single("photo"),
  asyncHandler(updateExercisePhoto)
);

// Sets
router.get("/exercises/:id/sets", asyncHandler(listSets));
router.post("/exercises/:id/sets", asyncHandler(createSet));
router.delete("/sets/:id", asyncHandler(deleteSet));
router.get("/exercises/:id/progress", asyncHandler(getProgress));

// Body weight
router.get("/bodyweight", asyncHandler(listBodyWeight));
router.post("/bodyweight", asyncHandler(createBodyWeight));
router.delete("/bodyweight/:id", asyncHandler(deleteBodyWeight));

export default router;
