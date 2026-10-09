import { NextResponse } from "next/server";
import { randomUUID, createHash } from "node:crypto";
import { orderSchema } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowRequest } from "@/lib/rate-limit";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!await allowRequest(request,"checkout",10,3600)) return NextResponse.json({error:"Too many order attempts. Please wait and try again."},{status:429});
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the delivery details and order items." }, { status: 400 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Checkout is not configured yet. Please contact DRACO." }, { status: 503 });
  const token = parsed.data.idempotencyKey || randomUUID();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await db.rpc("create_store_order", { p_customer: parsed.data.customer, p_items: parsed.data.items, p_idempotency_key: token, p_access_token_hash: tokenHash });
  if (error) {
    const status = error.message.includes("stock") || error.message.includes("available") ? 409 : 400;
    return NextResponse.json({ error: status === 409 ? "One or more selected items are no longer available in that quantity." : "We couldn't create the order. Check your details and try again." }, { status });
  }
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ reference: row.public_reference, total: row.total_lkr, accessToken: token }, { status: 201 });
}
