import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin-nav";
import { PromotionEditor } from "@/components/promotion-editor";
export const dynamic="force-dynamic";
type Redemption = { qualifying_quantity: number; status: string };
type PromotionRow = { id: string; name: string; discount_type: "percentage" | "fixed"; discount_value: number; eligible_category: string; max_qualifying_quantity: number; active: boolean; starts_at: string | null; ends_at: string | null; promotion_redemptions: Redemption[] | null };
export default async function PromotionsPage(){
  const {db}=await requireAdmin();const {data}=await db.from("promotions").select("id,name,discount_type,discount_value,eligible_category,max_qualifying_quantity,active,starts_at,ends_at,promotion_redemptions(qualifying_quantity,status)").order("created_at");
  const promotions=(data??[]) as PromotionRow[];
  return <section className="page-shell admin-shell"><p className="eyebrow">DRACO / ADMINISTRATION</p><h1>THE<br/><em>OFFER.</em></h1><AdminNav/>{promotions.map(p=>{const used=(p.promotion_redemptions??[]).filter(r=>r.status!=="released").reduce((sum,r)=>sum+r.qualifying_quantity,0);return <article className="promotion-card" key={p.id}><div className="admin-section-head"><h2>{p.name}</h2><span>{p.active?"ACTIVE":"INACTIVE"}</span></div><p>Qualifying units: {used} of {p.max_qualifying_quantity} reserved or used. Released reservations do not count.</p><PromotionEditor id={p.id} initialType={p.discount_type} initialValue={p.discount_value} active={p.active} startsAt={p.starts_at} endsAt={p.ends_at} category={p.eligible_category} maxQuantity={p.max_qualifying_quantity}/></article>})}{!promotions.length&&<p className="admin-empty">No promotions configured.</p>}</section>
}
