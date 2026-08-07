import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { sendNotification } from "../controllers/notifications.controller";

const router = Router();

router.post("/notifications", requireAuth, sendNotification as any);

export default router;
