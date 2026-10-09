import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export async function Footer() {
  const db=createAdminClient();let social:Record<string,string>={};if(db){const {data}=await db.from("store_settings").select("value").eq("key","social_links").maybeSingle();social=data?.value??{};}
  return <footer className="footer"><div className="footer-top"><Link href="/" className="wordmark">DRACO<span>®</span></Link><p>Made for the uncompromising.</p><div className="footer-actions">{social.instagram&&<a href={social.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>}{social.tiktok&&<a href={social.tiktok} target="_blank" rel="noreferrer">TikTok ↗</a>}<a href="#top">Back to top ↑</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} DRACO Studio</span><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/shipping-returns">Shipping & returns</Link></div><span>Colombo, Sri Lanka</span></div></footer>;
}
