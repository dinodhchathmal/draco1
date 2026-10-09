import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireAdmin() {
  const auth = await createClient();
  if (!auth) redirect("/admin/login?setup=required");

  const {
    data: { user },
    error: userError,
  } = await auth.auth.getUser();

  if (userError || !user) redirect("/admin/login");

  // Read the caller's own profile with their authenticated session. This uses
  // the profiles_read_self RLS policy and avoids relying on service-role access
  // for the authorization decision itself.
  const { data: profile, error: profileError } = await auth
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Admin profile lookup failed:", profileError.message);
    redirect("/admin/login?setup=required");
  }

  if (profile?.role !== "admin") redirect("/admin/login?unauthorized=1");

  const db = createAdminClient();
  if (!db) redirect("/admin/login?setup=required");

  return { user, db };
}
