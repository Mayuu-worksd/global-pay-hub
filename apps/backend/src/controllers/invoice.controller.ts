import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/database";

export async function createInvoice(req: AuthenticatedRequest, res: Response) {
  try {
    const merchantId = req.user?.id;
    const { amount, currency, customer_email, expires_in_minutes } = req.body;

    if (!amount || !currency || !customer_email) {
      return res.status(400).json({ error: "amount, currency, and customer_email are required." });
    }

    const expiresIn = expires_in_minutes || 60;
    const expiresAt = new Date(Date.now() + expiresIn * 60000).toISOString();

    const { data: invoice, error } = await supabaseAdmin.from("invoices").insert({
      merchant_id: merchantId,
      amount,
      currency: currency.toUpperCase(),
      customer_email,
      status: "pending",
      expires_at: expiresAt,
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(invoice);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getInvoice(req: AuthenticatedRequest, res: Response) {
  try {
    const merchantId = req.user?.id;
    const { id } = req.params;

    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("merchant_id", merchantId)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!invoice) return res.status(404).json({ error: "Invoice not found." });

    return res.json(invoice);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getReports(req: AuthenticatedRequest, res: Response) {
  try {
    const merchantId = req.user?.id;

    // Aggregate transactions by status and count
    const { data: txs, error } = await supabaseAdmin
      .from("transactions")
      .select("amount, currency, status, type, created_at")
      .eq("user_id", merchantId);

    if (error) return res.status(500).json({ error: error.message });

    const totalVolume = (txs || []).reduce((acc: number, tx: any) => acc + parseFloat(tx.amount), 0);

    return res.json({
      merchantId,
      totalVolume,
      transactionsCount: txs?.length || 0,
      transactions: txs,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
