import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-admin";
const categories=["tshirt","hoodie","bottoms","accessory","all"];
export async function POST(request:Request){
  const auth=await getApiAdmin();if("error"in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  const b=await request.json().catch(()=>null);
  if(!b||typeof b.id!=="string"||!(b.discount_type==="fixed"||b.discount_type==="percent")||!Number.isSafeInteger(b.discount_value)||b.discount_value<=0||b.discount_value>(b.discount_type==="percent"?100:1000000)||!categories.includes(b.eligible_category)||!Number.isSafeInteger(b.max_qualifying_quantity)||b.max_qualifying_quantity<1||b.max_qualifying_quantity>10000)return NextResponse.json({error:"Set a valid discount, eligibility, and usage limit."},{status:400});
  const startsAt=b.starts_at?new Date(b.starts_at):null;const endsAt=b.ends_at?new Date(b.ends_at):null;
  if((startsAt&&Number.isNaN(startsAt.getTime()))||(endsAt&&Number.isNaN(endsAt.getTime()))||(startsAt&&endsAt&&startsAt>=endsAt))return NextResponse.json({error:"Promotion end must be after its start."},{status:400});
  const {error}=await auth.db.from("promotions").update({discount_type:b.discount_type,discount_value:b.discount_value,eligible_category:b.eligible_category,max_qualifying_quantity:b.max_qualifying_quantity,active:b.active===true,starts_at:startsAt?.toISOString()??null,ends_at:endsAt?.toISOString()??null,updated_at:new Date().toISOString()}).eq("id",b.id);
  if(error)return NextResponse.json({error:"Promotion could not be saved."},{status:400});return NextResponse.json({ok:true});
}
