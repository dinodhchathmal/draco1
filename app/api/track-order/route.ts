import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowRequest } from "@/lib/rate-limit";
const schema=z.object({reference:z.string().regex(/^DR-[A-Z0-9]{16}$/),accessToken:z.string().uuid()});
export async function POST(request:Request){if(!await allowRequest(request,"order-lookup",12,3600))return NextResponse.json({error:"Please wait before trying again."},{status:429});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Enter your order reference and private token."},{status:400});const db=createAdminClient();if(!db)return NextResponse.json({error:"Order lookup is not configured."},{status:503});const hash=createHash("sha256").update(parsed.data.accessToken).digest("hex");const {data,error}=await db.from("orders").select("public_reference,order_status,payment_status,created_at").eq("public_reference",parsed.data.reference).eq("access_token_hash",hash).maybeSingle();if(error||!data)return NextResponse.json({error:"We couldn't find an order with those details."},{status:404});return NextResponse.json({reference:data.public_reference,status:data.order_status,paymentStatus:data.payment_status,createdAt:data.created_at});}
