import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  getAdminData,
  toggleUserSuspension,
  toggleMerchantSuspension,
  toggleWalletFreeze,
  toggleApiKey,
  retryWebhook,
} from "../controllers/admin.controller";

const router = Router();

// Apply auth and admin checks on all admin routes
router.use(requireAuth, requireAdmin as any);

router.get("/data", getAdminData as any);
router.post("/user/toggle-suspension", toggleUserSuspension as any);
router.post("/merchant/toggle-suspension", toggleMerchantSuspension as any);
router.post("/wallet/toggle-freeze", toggleWalletFreeze as any);
router.post("/api-key/toggle", toggleApiKey as any);
router.post("/webhook/retry", retryWebhook as any);

export default router;
