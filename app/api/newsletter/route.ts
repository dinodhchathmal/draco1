import { NextResponse } from "next/server";
import { createHash,randomUUID } from "node:crypto";
import { newsletterSchema } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowRequest } from "@/lib/rate-limit";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!await allowRequest(request,"newsletter",5,3600)) return NextResponse.json({error:"Please try again later."},{status:429});
  const body=await request.json().catch(()=>null);
  if(typeof body?.website==="string"&&body.website)return NextResponse.json({ok:true});
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and confirm consent." }, { status: 400 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Newsletter is not configured yet." }, { status: 503 });
  const email = parsed.data.email.trim().toLowerCase();
  const unsubscribeToken=randomUUID();const unsubscribeHash=createHash("sha256").update(unsubscribeToken).digest("hex");
  const { error } = await db.from("newsletter_subscribers").upsert({ email, unsubscribe_token_hash:unsubscribeHash,consented_at: new Date().toISOString(), status: "active",unsubscribed_at:null }, { onConflict: "email" });
  if (error) return NextResponse.json({ error: "We couldn't save your subscription. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true,unsubscribeUrl:`/unsubscribe?token=${unsubscribeToken}` }, { status: 201 });
}
