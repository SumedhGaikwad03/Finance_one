import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as importController from "../controllers/import.controller";
import { IMPORT_LIMITS } from "../parsers/file-detector";
import { ValidationError } from "../../error/AppError";

const router = Router();

// Configure Multer for in-memory uploads with strict limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: IMPORT_LIMITS.MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    if (ext === "csv" || ext === "xlsx" || ext === "txt") {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          `Invalid file format: '.${ext}'. Only CSV (.csv) and Excel (.xlsx) files are supported.`
        )
      );
    }
  },
});

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  asyncHandler(importController.uploadStatement)
);

router.post(
  "/change-worksheet",
  authMiddleware,
  asyncHandler(importController.switchWorksheet)
);

router.post(
  "/preview",
  authMiddleware,
  asyncHandler(importController.previewStatement)
);

router.post(
  "/confirm",
  authMiddleware,
  asyncHandler(importController.confirmImport)
);

export default router;
