import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowRequest } from "@/lib/rate-limit";
const schema=z.object({items:z.array(z.object({variantId:z.uuid(),quantity:z.number().int().min(1).max(10)})).min(1).max(20)});
export async function POST(request:Request){if(!await allowRequest(request,"quote",40,3600))return NextResponse.json({error:"Please wait before updating your quote."},{status:429});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid items."},{status:400});const db=createAdminClient();if(!db)return NextResponse.json({error:"Checkout is not configured yet."},{status:503});const {data,error}=await db.rpc("quote_store_order",{p_items:parsed.data.items});if(error)return NextResponse.json({error:error.message.includes("stock")||error.message.includes("available")?"One or more pieces are no longer available.":"We couldn't calculate the current order total."},{status:409});return NextResponse.json(data,{headers:{"cache-control":"no-store"}});}
