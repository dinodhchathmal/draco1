import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin-nav";
import { InventoryAdjustment } from "@/components/inventory-adjustment";
type VariantRow={id:string;size:string;color:string;sku:string;stock:number;reserved_stock:number;products:{name:string}[]};
type MovementRow={created_at:string;movement_type:string;quantity_delta:number;note:string;product_variants:{size:string;color:string;sku:string;products:{name:string}[]}[];orders:{public_reference:string}[]};
export const dynamic="force-dynamic";
export default async function InventoryPage(){
  const {db}=await requireAdmin();const [{data},{data:movementData}]=await Promise.all([
    db.from("product_variants").select("id,size,color,sku,stock,reserved_stock,products(name)").order("products(name)"),
    db.from("inventory_movements").select("created_at,movement_type,quantity_delta,note,product_variants(size,color,sku,products(name)),orders(public_reference)").order("created_at",{ascending:false}).limit(30)
  ]);const variants=(data??[]) as VariantRow[];const movements=(movementData??[]) as MovementRow[];
  return <section className="page-shell admin-shell"><p className="eyebrow">DRACO / ADMINISTRATION</p><h1>STOCK<br/><em>ROOM.</em></h1><AdminNav/><div className="admin-table">{variants.map(v=><article className="inventory-row" key={v.id}><div><strong>{v.products[0]?.name}</strong><span>{v.size} / {v.color} · SKU {v.sku}</span></div><div className="stock-metric"><strong>{v.stock-v.reserved_stock}</strong><span>available / {v.reserved_stock} reserved</span></div><InventoryAdjustment variantId={v.id}/></article>)}{!variants.length&&<p className="admin-empty">Add a product with variants before adjusting inventory.</p>}</div><div className="admin-section-head"><h2>Recent stock movements</h2><span>Last 30</span></div><div className="admin-table">{movements.map((m,i)=>{const variant=m.product_variants[0];return <div className="admin-row movement-row" key={`${m.created_at}-${i}`}><span>{variant?.products[0]?.name} / {variant?.size} {variant?.color}</span><span>{m.movement_type}</span><span>{m.quantity_delta>0?"+":""}{m.quantity_delta}</span><span>{m.orders[0]?.public_reference??m.note}</span></div>})}{!movements.length&&<p className="admin-empty">No inventory movements yet.</p>}</div></section>
}
