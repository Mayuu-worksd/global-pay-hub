import { Router } from "express";
import bankingRoutes from "./banking";
import cryptoRoutes from "./crypto";
import kycRoutes from "./kyc";
import notificationRoutes from "./notifications";
import webhookRoutes from "./webhooks";
import merchantRoutes from "./merchant";
import invoiceRoutes from "./invoice";
import adminRoutes from "./admin";

const router = Router();

router.use("/api", bankingRoutes);
router.use("/crypto", cryptoRoutes);
router.use("/api", kycRoutes);
router.use("/api", notificationRoutes);
router.use("/api/webhooks", webhookRoutes);
router.use("/merchant", merchantRoutes);
router.use("/api", invoiceRoutes);
router.use("/api/admin", adminRoutes);

export default router;
