"use client";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/lib/products";
import { formatLkr } from "@/lib/config";
export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart(); const variants = (product.product_variants ?? []).filter(v => v.active && v.stock > 0);
  const [variantId, setVariantId] = useState(variants[0]?.id ?? ""); const [quantity, setQuantity] = useState(1); const [message, setMessage] = useState("");
  const variant = variants.find(v => v.id === variantId); const image = product.images?.[0] ?? "";
  return <div className="buy-box"><p className="buy-price">{formatLkr(product.price_lkr)}</p><p className="buy-description">{product.description}</p><label className="field-label" htmlFor="variant">SIZE / COLOUR</label><select id="variant" value={variantId} onChange={e=>setVariantId(e.target.value)} disabled={!variants.length}><option value="">{variants.length ? "Choose a size & colour" : "Currently unavailable"}</option>{variants.map(v=><option key={v.id} value={v.id}>{v.size} / {v.color} — {v.stock} available</option>)}</select><label className="field-label" htmlFor="quantity">QUANTITY</label><input id="quantity" type="number" min={1} max={Math.min(10,variant?.stock ?? 10)} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/><button className="button button-light buy-button" disabled={!variant} onClick={()=>{if(!variant)return;add({variantId:variant.id,productId:product.id,slug:product.slug,name:product.name,size:variant.size,color:variant.color,price:product.price_lkr,quantity,image});setMessage("Added to your bag.")}}>Add to bag <span>↗</span></button><p className="buy-message" role="status">{message}</p><p className="buy-note">Bank transfer / advance payment. Delivery calculated at checkout.</p></div>;
}
