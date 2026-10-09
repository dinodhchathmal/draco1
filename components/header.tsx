"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";

export function Header() {
  const { count } = useCart();
  return <header className="site-header"><Link href="/" className="wordmark" aria-label="DRACO home">DRACO<span>®</span></Link><nav aria-label="Main navigation"><Link href="/collection">Collection</Link><Link href="/world">World</Link><Link href="/contact">Contact</Link></nav><Link href="/cart" className="header-cart">Bag <span>({count})</span><b>↗</b></Link></header>;
}
