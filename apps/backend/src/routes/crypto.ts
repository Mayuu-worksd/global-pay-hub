import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createCryptoWallet,
  getCryptoBalance,
  generateCryptoAddress,
  generateDepositAddress,
  sendCrypto,
  getCryptoTransactions,
} from "../controllers/crypto.controller";

const router = Router();

router.post("/wallet/create", requireAuth, createCryptoWallet as any);
router.get("/balance/:walletId", requireAuth, getCryptoBalance as any);
router.post("/address/generate", requireAuth, generateCryptoAddress as any);
router.post("/address", requireAuth, generateDepositAddress as any); // called by web app on wallet creation
router.post("/send", requireAuth, sendCrypto as any);
router.get("/transactions", requireAuth, getCryptoTransactions as any);

export default router;
