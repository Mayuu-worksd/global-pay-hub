import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { submitKyc } from "../controllers/kyc.controller";

const router = Router();

router.post("/kyc", requireAuth, submitKyc as any);

export default router;
