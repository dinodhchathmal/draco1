import { createClient } from "@/lib/supabase/server";

export type Product = {
  id: string; name: string; slug: string; description: string; price_lkr: number;
  compare_at_lkr: number | null; featured: boolean; images: string[];
  product_variants?: { id: string; size: string; color: string; sku: string; stock: number; active: boolean }[];
};

export async function getProducts(collectionSlug?:string) {
  const supabase = await createClient();
  if (!supabase) return [] as Product[];
  let collectionId:string|undefined;
  if(collectionSlug){const {data:collection}=await supabase.from("collections").select("id").eq("slug",collectionSlug).eq("active",true).maybeSingle();if(!collection)return [] as Product[];collectionId=collection.id;}
  let query=supabase.from("products").select("*, product_variants(*)").eq("status", "active").order("position");
  if(collectionId)query=query.eq("collection_id",collectionId);
  const { data, error } = await query;
  if (error) return [] as Product[];
  return (data ?? []) as Product[];
}

export async function getProduct(slug: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("products").select("*, product_variants(*)").eq("slug", slug).eq("status", "active").maybeSingle();
  return data as Product | null;
}
