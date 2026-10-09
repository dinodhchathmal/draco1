import type { Metadata } from "next";
import { DM_Mono, Manrope } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";
const manrope=Manrope({subsets:["latin"],variable:"--font-manrope",display:"swap"});
const dmMono=DM_Mono({subsets:["latin"],weight:["400","500"],variable:"--font-mono",display:"swap"});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "DRACO — No Ordinary Form", template: "%s — DRACO" },
  description: "Considered silhouettes. Premium materials. Made for the uncompromising.",
  referrer: "no-referrer",
  openGraph: { title: "DRACO — No Ordinary Form", description: "The first chapter. Colombo, Sri Lanka.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body id="top" className={`${manrope.variable} ${dmMono.variable}`}><CartProvider><Header/><main>{children}</main><Footer/></CartProvider></body></html>;
}
