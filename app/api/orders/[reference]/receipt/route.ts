import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  if (!await allowRequest(request, "receipt-upload", 10, 3600)) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });
  const { reference } = await params;
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  const token = String(form.get("accessToken") ?? "");
  const file = form.get("receipt");
  if (!/^[0-9a-f-]{36}$/i.test(token) || !(file instanceof File)) return NextResponse.json({ error: "Choose a receipt file and confirm your access token." }, { status: 400 });
  if (file.size < 1 || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, or PDF up to 5 MB." }, { status: 400 });
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const valid = file.type === "image/jpeg" ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff : file.type === "image/png" ? bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 : new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (!valid) return NextResponse.json({ error: "The file contents don't match the selected file type." }, { status: 400 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Receipt upload is not configured." }, { status: 503 });
  const hash = createHash("sha256").update(token).digest("hex");
  const { data: order } = await db.from("orders").select("id,order_status").eq("public_reference", reference).eq("access_token_hash", hash).maybeSingle();
  if (!order || order.order_status !== "pending_payment") return NextResponse.json({ error: "We couldn't find an order awaiting payment." }, { status: 404 });
  const { data: setting } = await db.from("store_settings").select("value").eq("key", "payment_instructions").maybeSingle();
  if (!setting?.value?.text) return NextResponse.json({ error: "DRACO payment instructions are not configured yet." }, { status: 409 });
  const path = `${order.id}/${randomUUID()}`;
  const { error: uploadError } = await db.storage.from("payment-receipts").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "Receipt upload failed. Please try again." }, { status: 500 });
  const { error: rowError } = await db.from("payment_receipts").insert({ order_id: order.id, storage_path: path, mime_type: file.type, file_size: file.size });
  if (rowError) { await db.storage.from("payment-receipts").remove([path]); return NextResponse.json({ error: "Receipt could not be attached to the order." }, { status: 500 }); }
  const { error: updateError } = await db.from("orders").update({ payment_status: "receipt_submitted", reservation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }).eq("id", order.id);
  if (updateError) { await db.from("payment_receipts").delete().eq("storage_path", path); await db.storage.from("payment-receipts").remove([path]); return NextResponse.json({ error: "Receipt could not be attached to the order." }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
