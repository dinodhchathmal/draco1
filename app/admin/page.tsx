import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatLkr } from "@/lib/config";
import { AdminNav } from "@/components/admin-nav";
type RecentOrder={public_reference:string;order_status:string;total_lkr:number;created_at:string};
type VariantWatch={size:string;color:string;stock:number;reserved_stock:number;products:{name:string}[]};
export const dynamic="force-dynamic";
export default async function AdminHome(){
  const {db}=await requireAdmin();
  const [{count:orders},{count:pending},{count:verification},{data:paid},{data:recent},{data:low}]=await Promise.all([
    db.from("orders").select("id",{count:"exact",head:true}),db.from("orders").select("id",{count:"exact",head:true}).in("order_status",["pending_payment","confirmed"]),db.from("orders").select("id",{count:"exact",head:true}).eq("payment_status","receipt_submitted"),db.from("orders").select("total_lkr").eq("payment_status","verified"),db.from("orders").select("public_reference,order_status,total_lkr,created_at").order("created_at",{ascending:false}).limit(8),db.from("product_variants").select("size,color,stock,reserved_stock,products(name)").order("stock").limit(8)
  ]);
  const revenue=(paid??[]).reduce((sum:number,o:{total_lkr:number})=>sum+o.total_lkr,0);const recentRows=(recent??[]) as RecentOrder[];const lowRows=((low??[]) as VariantWatch[]).filter(v=>v.stock-v.reserved_stock<=3);
  return <section className="page-shell admin-shell"><p className="eyebrow">DRACO / PRIVATE STUDIO</p><h1>CONTROL<br/><em>ROOM.</em></h1><AdminNav/><div className="admin-stats"><article><span>ALL ORDERS</span><strong>{orders??0}</strong></article><article><span>OPEN ORDERS</span><strong>{pending??0}</strong></article><article><span>PAYMENT REVIEW</span><strong>{verification??0}</strong></article><article><span>VERIFIED REVENUE</span><strong>{formatLkr(revenue)}</strong></article></div><div className="admin-columns"><div><div className="admin-section-head"><h2>Recent orders</h2><Link href="/admin/orders">View all ↗</Link></div><div className="admin-table">{recentRows.map(o=><div className="admin-row" key={o.public_reference}><span>{o.public_reference}</span><span>{o.order_status.replaceAll("_"," ")}</span><span>{formatLkr(o.total_lkr)}</span><span>{new Date(o.created_at).toLocaleDateString()}</span></div>)}{!recentRows.length&&<p className="admin-empty">No orders yet.</p>}</div></div><div><div className="admin-section-head"><h2>Low stock / unavailable</h2><Link href="/admin/inventory">Manage ↗</Link></div><div className="admin-table">{lowRows.map((v,i)=><div className="admin-row" key={`${v.size}-${v.color}-${i}`}><span>{v.products[0]?.name??"Product"}</span><span>{v.size} / {v.color}</span><span>{Math.max(0,v.stock-v.reserved_stock)} available</span></div>)}{!lowRows.length&&<p className="admin-empty">No low-stock variants.</p>}</div></div></div></section>
}
