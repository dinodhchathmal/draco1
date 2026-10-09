import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowRequest } from "@/lib/rate-limit";
export async function POST(request:Request){if(!await allowRequest(request,"unsubscribe",10,3600))return NextResponse.json({error:"Please try again later."},{status:429});const body=z.object({token:z.string().uuid()}).safeParse(await request.json().catch(()=>null));if(!body.success)return NextResponse.json({error:"Invalid unsubscribe link."},{status:400});const db=createAdminClient();if(!db)return NextResponse.json({error:"Subscription management is not configured."},{status:503});const hash=createHash("sha256").update(body.data.token).digest("hex");const {data,error}=await db.from("newsletter_subscribers").update({status:"unsubscribed",unsubscribed_at:new Date().toISOString()}).eq("unsubscribe_token_hash",hash).select("id").maybeSingle();if(error||!data)return NextResponse.json({error:"This link is invalid or has already been used."},{status:404});return NextResponse.json({ok:true});}
