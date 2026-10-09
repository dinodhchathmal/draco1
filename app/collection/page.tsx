import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
export const metadata: Metadata = { title: "Collection", description: "Explore the DRACO first chapter." };
export default async function CollectionPage({searchParams}:{searchParams:Promise<{chapter?:string}>}) {
  const {chapter}=await searchParams;const products = await getProducts(chapter);
  const title=chapter?chapter.replaceAll("-"," ").toUpperCase():"THE COLLECTION";
  return <section className="page-shell"><p className="eyebrow">DRACO STUDIO / 001</p><div className="page-title-row"><div><h1>{chapter?<>CHAPTER<br/><em>{title}</em></>:<>THE<br/><em>COLLECTION</em></>}</h1><p className="page-lede">Considered forms for everyday life. Designed in Colombo, Sri Lanka.</p></div><span className="eyebrow">{String(products.length).padStart(2,"0")} PIECES</span></div><nav className="collection-filters" aria-label="Collection filters"><Link href="/collection">All pieces</Link>{[["Obsidian","obsidian"],["Form","form"],["Night Shift","night-shift"],["Static","static"]].map(([label,value])=><Link key={value} aria-current={chapter===value?"page":undefined} href={`/collection?chapter=${value}`}>{label}</Link>)}</nav>{products.length ? <div className="product-grid">{products.map((p)=><ProductCard key={p.id} product={p}/>)}</div> : <div className="page-empty"><h2>{chapter?"NO PIECES IN THIS CHAPTER YET.":"THE FIRST CHAPTER IS IN PROGRESS."}</h2><p>Pieces will appear here when the studio is ready to release them.</p></div>}</section>;
}
