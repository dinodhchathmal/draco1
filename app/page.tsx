import Link from "next/link";
import { getProducts } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { NewsletterForm } from "@/components/newsletter-form";

const panels = [
  { title: "OBSIDIAN", kicker: "01 / THE FOUNDATION", className: "panel-obsidian", image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1600&q=85", href: "/collection?chapter=obsidian" },
  { title: "FORM", kicker: "02 / ESSENTIALS", className: "panel-form", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85", href: "/collection?chapter=form" },
  { title: "NIGHT SHIFT", kicker: "03 / AFTER HOURS", className: "panel-night", image: "https://images.unsplash.com/photo-1506629905607-d9a7d3bb8332?auto=format&fit=crop&w=1000&q=85", href: "/collection?chapter=night-shift" },
  { title: "STATIC", kicker: "04 / IN MOTION", className: "panel-static", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1800&q=85", href: "/collection?chapter=static" },
];

export default async function Home() {
  const products = await getProducts();
  return <>
    <section className="hero" aria-label="DRACO Autumn Winter 2026 collection">
      <div className="hero-image"/><div className="hero-copy"><p className="eyebrow">DRACO / AUTUMN—WINTER 2026</p><h1>NO ORDINARY<br/><em>FORM.</em></h1><p className="hero-description">Considered silhouettes. Premium materials.<br/>Embroidered streetwear for the uncompromising.</p><Link className="button button-light" href="/collection">Enter the collection <span>↗</span></Link><Link className="hero-secondary" href="/world">Discover DRACO <span>→</span></Link></div>
      <div className="hero-bottom"><p>01—04<br/>The first chapter</p><a href="#collection">Scroll to explore <span>↓</span></a><p>COLOMBO<br/>SRI LANKA</p></div>
      <span className="hero-index">C. 001 / 026</span>
    </section>
    <div className="ticker" aria-label="Made for the uncompromising"><div className="ticker-track"><span>MADE FOR THE UNCOMPROMISING <b>✳</b> DRACO STUDIO <b>✳</b> MADE FOR THE UNCOMPROMISING <b>✳</b> DRACO STUDIO <b>✳</b></span><span aria-hidden="true">MADE FOR THE UNCOMPROMISING <b>✳</b> DRACO STUDIO <b>✳</b> MADE FOR THE UNCOMPROMISING <b>✳</b> DRACO STUDIO <b>✳</b></span></div></div>
    <section className="collection section-wrap" id="collection"><div className="section-heading"><div><p className="eyebrow">THE FIRST CHAPTER</p><h2>BUILT IN<br/><em>SHADOW</em></h2></div><p className="section-intro">Distinct pieces for a considered wardrobe. An exploration of shape, texture, and quiet confidence.</p></div>
      <div className="collection-grid">{panels.map((panel) => <Link key={panel.title} href={panel.href} className={`collection-panel ${panel.className}`} style={{ backgroundImage: `linear-gradient(0deg,rgba(5,5,5,.76),transparent 48%),url(${panel.image})` }}><span className="panel-kicker">{panel.kicker}</span><div className="panel-bottom"><div><span className="eyebrow">DRACO STUDIO</span><h3>{panel.title}</h3></div><span className="panel-arrow">↗</span></div></Link>)}</div>
    </section>
    <section className="manifesto"><div className="manifesto-image" role="img" aria-label="Editorial portrait in sculptural streetwear"/><div className="manifesto-copy"><p className="eyebrow">A POINT OF VIEW</p><h2>DRESS WITH<br/><em>INTENTION.</em></h2><p>Clothing made to stay. Precise silhouettes, thoughtful fabric, and a mark that means something. DRACO is a study in restraint — designed in Colombo, worn on your own terms.</p><Link className="button button-dark" href="/world">Our world <span>↗</span></Link><span className="manifesto-mark">D / 01</span></div></section>
    <section className="featured section-wrap"><div className="section-heading section-heading-line"><div><p className="eyebrow">THE STUDIO SELECTION</p><h2>FIRST<br/><em>DROP</em></h2></div><Link className="text-link" href="/collection">View all pieces ↗</Link></div>{products.length ? <div className="product-grid">{products.slice(0,3).map((p)=><ProductCard key={p.id} product={p}/>)}</div> : <div className="empty-products"><p>THE COLLECTION IS TAKING SHAPE.</p><span>New pieces will be available here soon.</span><Link className="text-link" href="/contact">Ask us about the first drop ↗</Link></div>}</section>
    <section className="newsletter section-wrap"><div className="newsletter-top"><p className="eyebrow">STAY CLOSE / 001</p><p className="newsletter-note">Notes from the studio.<br/>Only when there is something to say.</p></div><h2>THE NEXT DROP<br/><em>IS COMING.</em></h2><NewsletterForm/><span className="newsletter-index">DRACO / COLOMBO</span></section>
  </>;
}
