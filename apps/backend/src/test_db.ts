import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../../.env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

console.log("Supabase URL:", supabaseUrl);
console.log("Key Prefix:", supabaseKey.substring(0, 10) + "...");

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  "profiles",
  "business_profiles",
  "kyc_records",
  "kyb_records",
  "fiat_wallets",
  "crypto_wallets",
  "transactions",
  "merchant_api_keys",
  "webhook_events"
];

async function check() {
  try {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      console.error("Error reading profiles:", error.message);
    } else {
      console.log("Profiles found:", data);
    }
  } catch (e: any) {
    console.error("Exception:", e.message);
  }
}

check();
