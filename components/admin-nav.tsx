import Link from "next/link";
const links=[["Overview","/admin"],["Products","/admin/products"],["Orders","/admin/orders"],["Inventory","/admin/inventory"],["Promotions","/admin/promotions"],["Settings","/admin/settings"]];
export function AdminNav(){return <nav className="admin-nav">{links.map(([name,href])=><Link key={href} href={href}>{name}</Link>)}<form action="/api/admin/signout" method="post"><button>Sign out</button></form></nav>}
