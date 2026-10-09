import Link from "next/link";
import { formatLkr } from "@/lib/config";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  return <article className="product-card"><Link href={`/products/${product.slug}`} className="product-photo" style={image ? { backgroundImage: `url(${image})` } : undefined} aria-label={`View ${product.name}`}><span className="product-tag">DRACO STUDIO</span><span className="product-open">↗</span></Link><div className="product-meta"><div><Link href={`/products/${product.slug}`}>{product.name}</Link><p>Essential collection</p></div><strong>{formatLkr(product.price_lkr)}</strong></div></article>;
}
