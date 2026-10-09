import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApiAdmin } from "@/lib/api-admin";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const auth = await createClient(); const { data: { user } } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const db = createAdminClient(); if (!db) return NextResponse.json({ error: "Server is not configured." }, { status: 503 });
  const { data: profile } = await db.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || typeof body.slug !== "string" || !Number.isSafeInteger(body.price_lkr) || body.price_lkr < 1 || body.name.length > 120 || body.slug.length > 140 || !Array.isArray(body.variants) || body.variants.length < 1 || body.variants.length > 40) return NextResponse.json({ error: "Invalid product details." }, { status: 400 });
  const images = Array.isArray(body.images) ? body.images.filter((x:unknown)=>typeof x==="string"&&x.startsWith("https://")).slice(0,8) : [];
  const category=(["tshirt","hoodie","bottoms","accessory"]as string[]).includes(body.category)?body.category:"tshirt";
  const { data, error } = await db.from("products").insert({ name: body.name, slug: body.slug, description: String(body.description ?? "").slice(0, 2000), price_lkr: body.price_lkr, images, category, status: body.status === "active" ? "active" : "draft", featured: body.featured === true }).select("id,slug").single();
  if (error) return NextResponse.json({ error: "Product could not be saved. Check that its slug is unique." }, { status: 400 });
  const variants=body.variants.map((v:Record<string,unknown>)=>({product_id:data.id,size:String(v.size??"").slice(0,20),color:String(v.color??"").slice(0,50),sku:String(v.sku??"").slice(0,80),stock:Number.isSafeInteger(v.stock)?v.stock:0,active:true}));
  const {error:variantError}=await db.from("product_variants").insert(variants);
  if(variantError){await db.from("products").delete().eq("id",data.id);return NextResponse.json({error:"Product variants could not be saved. Confirm each SKU and size/color is unique."},{status:400});}
  return NextResponse.json(data, { status: 201 });
}
export async function PATCH(request:Request){const auth=await getApiAdmin();if("error"in auth)return NextResponse.json({error:auth.error},{status:auth.status});const body=await request.json().catch(()=>null);if(!body||typeof body.id!=="string"||!(["draft","active","archived"]as string[]).includes(body.status)||!(["tshirt","hoodie","bottoms","accessory"]as string[]).includes(body.category)||!Number.isSafeInteger(body.price_lkr)||body.price_lkr<1||typeof body.name!=="string"||body.name.length<1||body.name.length>120)return NextResponse.json({error:"Invalid product update."},{status:400});const {error}=await auth.db.from("products").update({name:body.name,price_lkr:body.price_lkr,status:body.status,category:body.category,updated_at:new Date().toISOString()}).eq("id",body.id);if(error)return NextResponse.json({error:"Product update failed."},{status:400});return NextResponse.json({ok:true});}
