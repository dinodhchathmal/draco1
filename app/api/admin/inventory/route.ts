import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiAdmin } from "@/lib/api-admin";
const schema=z.object({variantId:z.uuid(),delta:z.number().int().min(-10000).max(10000).refine(x=>x!==0),note:z.string().max(500).default("")});
export async function POST(request:Request){const auth=await getApiAdmin();if("error"in auth)return NextResponse.json({error:auth.error},{status:auth.status});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Enter a valid stock adjustment."},{status:400});const {error}=await auth.db.rpc("admin_adjust_inventory",{p_variant:parsed.data.variantId,p_delta:parsed.data.delta,p_note:parsed.data.note,p_actor:auth.user.id});if(error)return NextResponse.json({error:"Stock adjustment would violate available inventory."},{status:409});return NextResponse.json({ok:true});}
