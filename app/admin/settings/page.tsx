import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin-nav";
import { StoreSettingsForm } from "@/components/store-settings-form";
export const dynamic="force-dynamic";
export default async function SettingsPage(){const {db}=await requireAdmin();const {data}=await db.from("store_settings").select("key,value");const s=Object.fromEntries((data??[]).map(r=>[r.key,r.value]));return <section className="page-shell admin-shell"><p className="eyebrow">DRACO / ADMINISTRATION</p><h1>STORE<br/><em>SETTINGS.</em></h1><AdminNav/><StoreSettingsForm delivery={Number(s.delivery_charge_lkr??450)} whatsapp={String(s.whatsapp??"+94741389234")} instructions={String(s.payment_instructions?.text??"")} social={s.social_links??{}}/><div className="policy-callout">Privacy, terms, shipping, return, and cancellation pages are editable source templates and require review against your actual policies.</div></section>}
