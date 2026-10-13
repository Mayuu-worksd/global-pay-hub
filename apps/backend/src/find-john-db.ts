import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../../../.env") });

const supabaseUrl = process.env.SUPABASE_URL || "https://gcztbdlbvcjtnwicdiqc.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log("🔍 Checking virtual_accounts for 'john'...");
  const { data: accounts, error: err1 } = await supabase
    .from("virtual_accounts")
    .select("*")
    .ilike("account_name", "%john%");
  
  if (err1) {
    console.error("Error fetching virtual_accounts:", err1.message);
  } else {
    console.log("Virtual Accounts:", JSON.stringify(accounts, null, 2));
  }

  console.log("\n🔍 Checking profiles for 'john'...");
  const { data: profiles, error: err2 } = await supabase
    .from("profiles")
    .select("*")
    .ilike("full_name", "%john%");

  if (err2) {
    console.error("Error fetching profiles:", err2.message);
  } else {
    console.log("Profiles:", JSON.stringify(profiles, null, 2));
  }
}

run();
