import { requireAdmin } from "@/lib/admin";
import { formatLkr } from "@/lib/config";
import { AdminNav } from "@/components/admin-nav";
import { AdminProductForm } from "@/components/admin-product-form";
import { ProductEditor } from "@/components/product-editor";
export const dynamic="force-dynamic";
export default async function AdminProducts(){const {db}=await requireAdmin();const {data}=await db.from("products").select("id,name,slug,status,price_lkr,category,product_variants(size,color,stock,reserved_stock)").order("created_at",{ascending:false});return <section className="page-shell admin-shell"><p className="eyebrow">DRACO / ADMINISTRATION</p><h1>PRODUCT<br/><em>STUDIO.</em></h1><AdminNav/><AdminProductForm/><div className="admin-section-head"><h2>Catalog</h2><span>{data?.length??0} pieces</span></div><div className="admin-table">{(data??[]).map(p=><article className="admin-product-row" key={p.id}><div className="admin-row"><span>{p.name}<small>/{p.slug}</small></span><span>{p.status}</span><span>{formatLkr(p.price_lkr)}</span><span>{p.product_variants?.length??0} variants</span></div><ProductEditor product={p}/></article>)}{!data?.length&&<p className="admin-empty">No catalog items. Add a first piece above.</p>}</div></section>}
