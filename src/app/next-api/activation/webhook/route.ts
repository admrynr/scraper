import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
// @ts-ignore
import Midtrans from "midtrans-client";

// Midtrans Payment Notification Webhook
// Terdaftar di: Midtrans Dashboard → Settings → Configuration → Payment Notification URL
// URL: https://prospekto.id/next-api/activation/webhook

const PAID_STATUSES = ["capture", "settlement"];
const FAILED_STATUSES = ["deny", "cancel", "expire", "failure"];

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { order_id, transaction_status, payment_type } = body;

  if (!order_id || !transaction_status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verifikasi ulang ke Midtrans — JANGAN percaya body mentah-mentah (anti-spoofing)
  const core = new Midtrans.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY,
  });

  let verified: any;
  try {
    verified = await core.transaction.status(order_id);
  } catch (err: any) {
    console.error("[webhook] Midtrans verification failed:", err?.message);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }

  const verifiedStatus = verified.transaction_status;
  const verifiedFraud = verified.fraud_status;

  const isPaid =
    PAID_STATUSES.includes(verifiedStatus) &&
    (verifiedFraud === "accept" || verifiedFraud === undefined);
  const isFailed = FAILED_STATUSES.includes(verifiedStatus);

  if (!isPaid && !isFailed) {
    console.log(`[webhook] order=${order_id} status=${verifiedStatus} — no action needed`);
    return NextResponse.json({ ok: true });
  }

  const adminClient = createAdminClient();

  // Cari activation request berdasarkan order_id
  const { data: req, error: findErr } = await adminClient
    .from("activation_requests")
    .select("*")
    .eq("midtrans_order_id", order_id)
    .single();

  if (findErr || !req) {
    console.error("[webhook] Order not found in DB:", order_id);
    // Return 200 agar Midtrans tidak retry terus (kita tidak kenal order ini)
    return NextResponse.json({ ok: true });
  }

  // Idempotent — jika sudah diproses sebelumnya, skip
  if (req.status === "paid" || req.status === "failed") {
    console.log(`[webhook] order=${order_id} already ${req.status} — skip`);
    return NextResponse.json({ ok: true });
  }

  if (isFailed) {
    await adminClient
      .from("activation_requests")
      .update({
        status: "failed",
        midtrans_payment_type: verified.payment_type || payment_type || null,
      })
      .eq("id", req.id);
    console.log(`[webhook] order=${order_id} → FAILED`);
    return NextResponse.json({ ok: true });
  }

  // === PAID: update DB ===
  await adminClient
    .from("activation_requests")
    .update({
      status: "paid",
      midtrans_transaction_id: verified.transaction_id || null,
      midtrans_payment_type: verified.payment_type || payment_type || null,
    })
    .eq("id", req.id);

  // Ambil data profile user
  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, is_activated, purchased_credits")
    .eq("id", req.user_id)
    .single();

  if (!profile) {
    console.error("[webhook] Profile not found for user_id:", req.user_id);
    return NextResponse.json({ ok: true });
  }

  if (req.type === "activation") {
    // Aktifkan akun + tambah credits
    await adminClient
      .from("profiles")
      .update({
        is_activated: true,
        purchased_credits: (profile.purchased_credits ?? 0) + req.credits,
      })
      .eq("id", req.user_id);
    console.log(`[webhook] order=${order_id} → ACTIVATED user=${req.user_id} +${req.credits} credits`);
  } else {
    // Top-up: tambah credits saja
    await adminClient
      .from("profiles")
      .update({
        purchased_credits: (profile.purchased_credits ?? 0) + req.credits,
      })
      .eq("id", req.user_id);
    console.log(`[webhook] order=${order_id} → TOPUP user=${req.user_id} +${req.credits} credits`);
  }

  return NextResponse.json({ ok: true });
}
