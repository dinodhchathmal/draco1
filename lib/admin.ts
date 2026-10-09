import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function requireAdmin(){const auth=await createClient();if(!auth)redirect("/admin/login");const {data:{user}}=await auth.auth.getUser();if(!user)redirect("/admin/login");const db=createAdminClient();if(!db)redirect("/admin/login?setup=required");const {data:profile}=await db.from("profiles").select("role").eq("user_id",user.id).maybeSingle();if(profile?.role!=="admin")redirect("/admin/login?unauthorized=1");return {user,db};}
