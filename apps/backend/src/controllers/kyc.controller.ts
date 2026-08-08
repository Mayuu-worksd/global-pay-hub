import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { KYCService } from "../services/KYCService";
import { supabaseAdmin } from "../config/database";
import { NotificationService } from "../services/NotificationService";
import { z } from "zod";

const startKycSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string().min(1),
  nationality: z.string().min(2),
  phone: z.string().min(6),
  address_line1: z.string().min(3),
  address_line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postal_code: z.string().min(2),
  country: z.string().min(2),
  id_document_type: z.string().min(2),
  id_document_number: z.string().min(3),
  occupation: z.string().min(2),
  employment_status: z.string().optional(),
  source_of_funds: z.string().optional(),
  is_business: z.boolean().optional(),
  business_name: z.string().optional(),
  business_registration_number: z.string().optional(),
  business_country: z.string().optional(),
  business_website: z.string().optional(),
});

// Original submitKyc kept for compatibility
export async function submitKyc(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    return res.json({
      status: "pending",
      message: "Please use /api/kyc/start to begin verification flow",
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || err });
  }
}

export async function startKyc(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;
    if (!userId || !email) return res.status(401).json({ error: "Unauthorized" });

    const validated = startKycSchema.parse(req.body);

    const kycProvider = KYCService.getProvider();
    const verification = await kycProvider.createVerification(userId, email, validated);

    // Save to profiles/kyc
    const fullName = `${validated.first_name} ${validated.last_name}`;
    await supabaseAdmin.from("profiles").update({
      full_name: fullName,
      phone: validated.phone,
      country: validated.country,
      profile_completed: true,
      verification_status: "pending",
    }).eq("id", userId);

    await supabaseAdmin.from("kyc").upsert({
      user_id: userId,
      first_name: validated.first_name,
      last_name: validated.last_name,
      date_of_birth: new Date(validated.date_of_birth),
      nationality: validated.nationality,
      phone: validated.phone,
      address_line1: validated.address_line1,
      address_line2: validated.address_line2,
      city: validated.city,
      state: validated.state,
      postal_code: validated.postal_code,
      country: validated.country,
      occupation: validated.occupation,
      employment_status: validated.employment_status,
      source_of_funds: validated.source_of_funds,
      id_document_type: validated.id_document_type,
      id_document_number: validated.id_document_number,
      is_business: validated.is_business || false,
      business_name: validated.business_name,
      business_registration_number: validated.business_registration_number,
      business_country: validated.business_country,
      business_website: validated.business_website,
      status: "pending",
      submitted_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    // Upsert tracking record in kyc_records
    const { error: upsertErr } = await supabaseAdmin.from("kyc_records").upsert({
      user_id: userId,
      provider_reference: verification.id,
      status: "pending",
      provider: "sumsub",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (upsertErr) {
      console.error("❌ Failed to upsert KYC tracking record:", upsertErr.message);
      throw new Error(`Failed to upsert KYC tracking record: ${upsertErr.message}`);
    }

    // Send notification
    const notification = NotificationService.getProvider();
    await notification.sendEmail(
      email,
      "KYC Verification Submitted",
      `<p>Hi ${validated.first_name},</p><p>Your KYC application has been successfully submitted and is under review.</p>`
    );

    return res.json({
      status: "pending",
      provider_reference: verification.id,
      url: verification.url,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || err });
  }
}

export async function uploadKycDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!req.file) {
      return res.status(400).json({ error: "No document file uploaded" });
    }

    const { document_type } = req.body;
    if (!document_type) {
      return res.status(400).json({ error: "document_type is required" });
    }

    // Validate size (< 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "File size exceeds 10MB limit" });
    }

    // Validate mimetype
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Unsupported file type. Only JPEG, PNG, and PDF are allowed." });
    }

    // Fetch the pending applicant ID from kyc_records
    const { data: record, error: recordErr } = await supabaseAdmin
      .from("kyc_records")
      .select("provider_reference")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (recordErr || !record) {
      return res.status(400).json({ error: "No pending KYC session found. Please start KYC first." });
    }

    // Define file path structure: kyc-documents/user-id/document-type.ext
    const ext = req.file.mimetype.split("/")[1] === "pdf" ? "pdf" : "jpg";
    const filePath = `${userId}/${document_type}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("kyc-documents")
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      return res.status(500).json({ error: `Supabase Storage upload error: ${uploadError.message}` });
    }

    // Get Public URL
    const publicUrl = supabaseAdmin.storage
      .from("kyc-documents")
      .getPublicUrl(filePath).data.publicUrl;

    // Update kyc_records table
    await supabaseAdmin
      .from("kyc_records")
      .update({
        document_type,
        document_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Update id_document_url in kyc table
    if (document_type === "passport" || document_type === "identity_card" || document_type === "id_document") {
      await supabaseAdmin
        .from("kyc")
        .update({ id_document_url: publicUrl })
        .eq("user_id", userId);
    }

    // Send to Sumsub
    const kycProvider = KYCService.getProvider();
    await kycProvider.verifyDocument(
      record.provider_reference,
      document_type,
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    return res.json({
      success: true,
      document_url: publicUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
}

export async function getKycStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "userId param is required" });

    const { data: record, error } = await supabaseAdmin
      .from("kyc_records")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!record) {
      return res.json({ status: "unverified" });
    }

    return res.json({
      id: record.id,
      user_id: record.user_id,
      document_type: record.document_type,
      document_url: record.document_url,
      status: record.status,
      provider: record.provider,
      provider_reference: record.provider_reference,
      rejection_reason: record.rejection_reason,
      created_at: record.created_at,
      updated_at: record.updated_at,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
}
