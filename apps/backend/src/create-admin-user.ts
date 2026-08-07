import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase URL or Service Role Key in .env");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = "admin@globalpay.com";
  const password = "admin@12321";

  console.log(`🚀 Creating admin user in Supabase Auth: ${email}...`);

  // 1. Create or get user in Supabase Auth
  let userId: string;
  
  // Try to find the user first
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Failed to list users:", listError.message);
    process.exit(1);
  }

  const existingUser = users.users.find(u => u.email === email);
  
  if (existingUser) {
    console.log(`ℹ️ User already exists in auth.users with ID: ${existingUser.id}`);
    userId = existingUser.id;
    
    // Update password just in case
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password
    });
    if (updateError) {
      console.warn("⚠️ Warning: Could not update user password:", updateError.message);
    } else {
      console.log("🔑 Password successfully updated/reset.");
    }
  } else {
    // Create new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError) {
      console.error("❌ Failed to create user:", createError.message);
      process.exit(1);
    }

    console.log(`✅ Auth user created successfully with ID: ${newUser.user.id}`);
    userId = newUser.user.id;
  }

  // 2. Set profile role = 'admin' in profiles table
  console.log("⚙️ Setting profile role to 'admin'...");
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: userId,
      email: email,
      role: "admin",
      full_name: "System Admin",
      onboarding_completed: true,
      kyc_completed: true
    }, { onConflict: "id" });

  if (profileError) {
    console.error("❌ Failed to update profiles table:", profileError.message);
    process.exit(1);
  }

  console.log("🎉 SUCCESS: Admin account admin@globalpay.com is set up and active!");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
