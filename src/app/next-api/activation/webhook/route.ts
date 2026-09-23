import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

// Midtrans Payment Notification Webhook
// URL: https://prospekto.id/next-api/activation/webhook
//
// Verifikasi menggunakan SHA512 signature lokal (cara resmi Midtrans):
// signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
// Tidak butuh roundtrip ke Midtrans API — lebih cepat & tidak ada single point of failure.

const PAID_STATUSES = ["capture", "settlement"];
const FAILED_STATUSES = ["deny", "cancel", "expire", "failure"];

function verifySignature(body: any): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    console.error("[webhook] MIDTRANS_SERVER_KEY not set!");
    return false;
  }
  const { order_id, status_code, gross_amount, signature_key } = body;
  if (!order_id || !status_code || !gross_amount || !signature_key) return false;

  const expected = createHash("sha512")
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest("hex");

  return expected === signature_key;
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    console.error("[webhook] Invalid JSON body");
    return NextResponse.json({ ok: true });
  }

  const { order_id, transaction_status, fraud_status, payment_type, transaction_id } = body;

  console.log(`[webhook] order=${order_id} status=${transaction_status} payment=${payment_type}`);

  // Verifikasi signature — tolak jika tidak valid (anti-spoofing)
  if (!verifySignature(body)) {
    console.error("[webhook] Invalid signature for order:", order_id);
    return NextResponse.json({ ok: true });
  }

  const isPaid =
    PAID_STATUSES.includes(transaction_status) &&
    (fraud_status === "accept" || fraud_status === undefined);
  const isFailed = FAILED_STATUSES.includes(transaction_status);

  // Status lain (pending, dll) — tidak perlu aksi DB
  if (!isPaid && !isFailed) {
    console.log(`[webhook] order=${order_id} status=${transaction_status} — no action`);
    return NextResponse.json({ ok: true });
  }

  try {
    const adminClient = createAdminClient();

    const { data: req, error: findErr } = await adminClient
      .from("activation_requests")
      .select("*")
      .eq("midtrans_order_id", order_id)
      .single();

    if (findErr || !req) {
      console.error("[webhook] Order not found:", order_id);
      return NextResponse.json({ ok: true });
    }

    // Idempotent — jika sudah diproses, skip
    if (req.status === "paid" || req.status === "failed") {
      console.log(`[webhook] order=${order_id} already ${req.status} — skip`);
      return NextResponse.json({ ok: true });
    }

    if (isFailed) {
      await adminClient
        .from("activation_requests")
        .update({ status: "failed", midtrans_payment_type: payment_type || null })
        .eq("id", req.id);
      console.log(`[webhook] order=${order_id} → FAILED`);
      return NextResponse.json({ ok: true });
    }

    // === PAID ===
    await adminClient
      .from("activation_requests")
      .update({
        status: "paid",
        midtrans_transaction_id: transaction_id || null,
        midtrans_payment_type: payment_type || null,
      })
      .eq("id", req.id);

    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, is_activated, purchased_credits")
      .eq("id", req.user_id)
      .single();

    if (!profile) {
      console.error("[webhook] Profile not found:", req.user_id);
      return NextResponse.json({ ok: true });
    }

    if (req.type === "activation") {
      await adminClient
        .from("profiles")
        .update({
          is_activated: true,
          purchased_credits: (profile.purchased_credits ?? 0) + req.credits,
        })
        .eq("id", req.user_id);
      console.log(`[webhook] ACTIVATED user=${req.user_id} +${req.credits} credits`);
    } else {
      await adminClient
        .from("profiles")
        .update({
          purchased_credits: (profile.purchased_credits ?? 0) + req.credits,
        })
        .eq("id", req.user_id);
      console.log(`[webhook] TOPUP user=${req.user_id} +${req.credits} credits`);
    }

    return NextResponse.json({ ok: true });

  } catch (err: any) {
    // Selalu return 200 — jangan biarkan Midtrans retry loop
    console.error("[webhook] Error:", err?.message);
    return NextResponse.json({ ok: true });
  }
}
