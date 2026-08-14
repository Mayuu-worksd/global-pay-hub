import { Router } from "express";
import {
  handleUnitWebhook,
  handleCurrencycloudWebhook,
  handleCryptoWebhook,
  handleSumsubWebhook,
  handleBridgeWebhook,
  handleGridWebhook,
  handleBankingCircleWebhook,
} from "../controllers/webhooks.controller";

const router = Router();

router.post("/unit", handleUnitWebhook);
router.post("/currencycloud", handleCurrencycloudWebhook);
router.post("/crypto", handleCryptoWebhook);
router.post("/sumsub", handleSumsubWebhook);
router.post("/stablecoin/bridge", handleBridgeWebhook);
router.post("/stablecoin/grid", handleGridWebhook);
router.post("/banking-circle", handleBankingCircleWebhook);

export default router;

