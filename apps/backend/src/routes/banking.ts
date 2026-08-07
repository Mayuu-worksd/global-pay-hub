import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getWallets,
  createWallet,
  executeExchange,
  createBeneficiary,
  executeWithdraw,
  getStatements,
  createVirtualAccount,
} from "../controllers/banking.controller";

const router = Router();

router.get("/wallets", requireAuth, getWallets as any);
router.post("/wallet/create", requireAuth, createWallet as any);
router.post("/exchange", requireAuth, executeExchange as any);
router.post("/beneficiaries", requireAuth, createBeneficiary as any);
router.post("/withdraw", requireAuth, executeWithdraw as any);
router.get("/statements", requireAuth, getStatements as any);
router.post("/virtual-account/create", requireAuth, createVirtualAccount as any);

export default router;
