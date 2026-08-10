import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../config/database";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

import crypto from "crypto";

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. Missing authentication token." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized. Invalid authentication token." });
    }

    req.user = {
      id: user.id,
      email: user.email || "",
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Token verification failed." });
  }
}

export async function requireMerchantApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string;
  if (!apiKey) {
    return res.status(401).json({ error: "Unauthorized. Missing API key." });
  }

  try {
    const hash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const { data: keyRecord, error } = await supabaseAdmin
      .from("merchant_api_keys")
      .select("merchant_id, is_active")
      .eq("api_key_hash", hash)
      .maybeSingle();

    if (error || !keyRecord || !keyRecord.is_active) {
      return res.status(401).json({ error: "Unauthorized. Invalid or inactive API key." });
    }

    req.user = {
      id: keyRecord.merchant_id,
      email: "", // Not available in key record, but we set user id
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. API key validation failed." });
  }
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized. User session not found." });
  }

  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile || profile.role !== "admin") {
      return res.status(403).json({ error: "Forbidden. Admin access required." });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: "Internal server error during admin validation." });
  }
}

