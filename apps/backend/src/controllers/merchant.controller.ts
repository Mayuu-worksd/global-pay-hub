import { Response } from "express";
import crypto from "crypto";
import { AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/database";

export async function generateApiKey(req: AuthenticatedRequest, res: Response) {
  try {
    const merchantId = req.user?.id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "API Key description name is required." });

    // Generate prefix and key secret
    const prefix = "gp_live_";
    const secret = crypto.randomBytes(24).toString("hex");
    const plainTextKey = `${prefix}${secret}`;
    const hash = crypto.createHash("sha256").update(plainTextKey).digest("hex");

    const { data, error } = await supabaseAdmin.from("merchant_api_keys").insert({
      merchant_id: merchantId,
      name,
      api_key_prefix: prefix,
      api_key_hash: hash,
      is_live: true,
      is_active: true,
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });

    // Return the plainTextKey ONLY ONCE here
    return res.json({
      id: data.id,
      name: data.name,
      apiKey: plainTextKey,
      created_at: data.created_at,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function listApiKeys(req: AuthenticatedRequest, res: Response) {
  try {
    const merchantId = req.user?.id;
    const { data, error } = await supabaseAdmin
      .from("merchant_api_keys")
      .select("id, name, api_key_prefix, is_live, is_active, created_at")
      .eq("merchant_id", merchantId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function revokeApiKey(req: AuthenticatedRequest, res: Response) {
  try {
    const merchantId = req.user?.id;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("merchant_api_keys")
      .update({ is_active: false })
      .eq("id", id)
      .eq("merchant_id", merchantId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
