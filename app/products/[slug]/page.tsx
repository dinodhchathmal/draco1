import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct } from "@/lib/products";
import { AddToCart } from "@/components/add-to-cart";
export async function generateMetadata({ params }: { params: Promise<{slug:string}> }): Promise<Metadata> { const {slug}=await params; const product=await getProduct(slug); return { title: product?.name ?? "Piece", description: product?.description }; }
export default async function ProductPage({ params }: { params: Promise<{slug:string}> }) {
  const {slug}=await params; const product=await getProduct(slug); if(!product) notFound(); const image=product.images?.[0];const available=(product.product_variants??[]).some(v=>v.active&&v.stock>0);
  const structuredData={"@context":"https://schema.org","@type":"Product",name:product.name,description:product.description,image:product.images,offers:{"@type":"Offer",priceCurrency:"LKR",price:product.price_lkr,availability:available?"https://schema.org/InStock":"https://schema.org/OutOfStock",url:`${process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"}/products/${product.slug}`}};
  return <section className="product-page page-shell"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,"\\u003c")}}/><div className="product-detail-image" style={image?{backgroundImage:`url(${image})`}:undefined}><span className="eyebrow">DRACO STUDIO / 001</span></div><div className="product-detail-copy"><p className="eyebrow">THE FIRST CHAPTER</p><h1>{product.name}</h1><AddToCart product={product}/><div className="detail-notes"><p>Thoughtfully considered in Colombo.</p><p>Secure order confirmation. Bank transfer payment instructions follow checkout.</p><a href="/shipping-returns">Shipping & returns ↗</a></div></div></section>;
}
