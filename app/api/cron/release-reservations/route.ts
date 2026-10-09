import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
export const runtime="nodejs";
export async function GET(request:Request){const secret=process.env.CRON_SECRET;if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorized"},{status:401});const db=createAdminClient();if(!db)return NextResponse.json({error:"Server is not configured."},{status:503});const {data,error}=await db.rpc("release_expired_reservations");if(error)return NextResponse.json({error:"Reservation release failed."},{status:500});return NextResponse.json({released:data});}
