"use client";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatLkr } from "@/lib/config";
import { useDeliveryCharge } from "@/components/use-store-config";
import { calculateTotals } from "@/lib/pricing.mjs";
export default function CartPage() {
  const {items,remove,setQuantity}=useCart(); const delivery=useDeliveryCharge();const totals=calculateTotals(items.map(i=>({price:i.price,quantity:i.quantity})),delivery);
  return <section className="page-shell"><p className="eyebrow">DRACO / YOUR SELECTION</p><h1>THE<br/><em>BAG</em></h1>{!items.length?<div className="page-empty"><h2>Your bag is empty.</h2><p>Take a look at the collection.</p><Link className="text-link" href="/collection">Discover pieces ↗</Link></div>:<div className="cart-layout"><div className="cart-items">{items.map(item=><article key={item.variantId} className="cart-item"><div className="cart-thumb" style={item.image?{backgroundImage:`url(${item.image})`}:undefined}/><div className="cart-item-info"><Link href={`/products/${item.slug}`}>{item.name}</Link><p>{item.size} / {item.color}</p><button onClick={()=>remove(item.variantId)}>Remove</button></div><input aria-label={`Quantity for ${item.name}`} type="number" min={1} max={10} value={item.quantity} onChange={e=>setQuantity(item.variantId,Number(e.target.value))}/><strong>{formatLkr(item.price*item.quantity)}</strong></article>)}</div><aside className="cart-summary"><p className="eyebrow">ORDER SUMMARY</p><div><span>Subtotal</span><span>{formatLkr(totals.subtotal)}</span></div><div><span>Delivery</span><span>{formatLkr(totals.delivery)}</span></div><div className="cart-total"><span>Total</span><strong>{formatLkr(totals.total)}</strong></div><Link className="button button-light" href="/checkout">Continue to checkout <span>↗</span></Link><p>Bank transfer / advance payment</p></aside></div>}</section>;
}
