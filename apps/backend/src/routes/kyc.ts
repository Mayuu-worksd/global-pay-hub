import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { submitKyc, startKyc, uploadKycDocument, getKycStatus } from "../controllers/kyc.controller";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const router = Router();

// Keep existing kyc endpoint for backward compatibility
router.post("/kyc", requireAuth, submitKyc as any);

router.post("/kyc/start", requireAuth, startKyc as any);
router.post("/kyc/upload", requireAuth, upload.single("file"), uploadKycDocument as any);
router.get("/kyc/status/:userId", requireAuth, getKycStatus as any);

export default router;
