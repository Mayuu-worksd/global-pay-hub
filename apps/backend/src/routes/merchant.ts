import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
} from "../controllers/merchant.controller";

const router = Router();

router.post("/keys", requireAuth, generateApiKey as any);
router.get("/keys", requireAuth, listApiKeys as any);
router.post("/keys/:id/revoke", requireAuth, revokeApiKey as any);

export default router;
