import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { KYCService } from "../services/KYCService";
import { kycSchema } from "../validators/schema";
import { supabaseAdmin } from "../config/database";

export async function submitKyc(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const validated = kycSchema.parse(req.body);

    const kycProvider = KYCService.getProvider();
    const verification = await kycProvider.createVerification(userId, validated.email);

    // Save to database kyc table
    const { error: dbErr } = await supabaseAdmin.from("kyc").upsert({
      user_id: userId,
      first_name: validated.first_name,
      last_name: validated.last_name,
      status: "pending",
      submitted_at: new Date().toISOString(),
    });

    if (dbErr) {
      return res.status(500).json({ error: `Database error: ${dbErr.message}` });
    }

    return res.json({
      status: "pending",
      verificationId: verification.id,
      url: verification.url,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || err });
  }
}
