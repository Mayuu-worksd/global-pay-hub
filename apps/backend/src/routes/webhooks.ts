import { Router } from "express";
import {
  handleUnitWebhook,
  handleCurrencycloudWebhook,
  handleCryptoWebhook,
  handleSumsubWebhook,
} from "../controllers/webhooks.controller";

const router = Router();

router.post("/unit", handleUnitWebhook);
router.post("/currencycloud", handleCurrencycloudWebhook);
router.post("/crypto", handleCryptoWebhook);
router.post("/sumsub", handleSumsubWebhook);

export default router;
