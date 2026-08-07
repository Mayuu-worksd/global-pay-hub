import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createInvoice,
  getInvoice,
  getReports,
} from "../controllers/invoice.controller";

const router = Router();

router.post("/invoices", requireAuth, createInvoice as any);
router.get("/invoices/:id", requireAuth, getInvoice as any);
router.get("/reports", requireAuth, getReports as any);

export default router;
