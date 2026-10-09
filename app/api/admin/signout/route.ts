import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(){const db=await createClient();if(db)await db.auth.signOut();return NextResponse.redirect(new URL("/admin/login",process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"),303)}
