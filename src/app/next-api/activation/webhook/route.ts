import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
// @ts-ignore
import Midtrans from 'midtrans-client';
import crypto from 'crypto';

// POST /next-api/activation/webhook — dipanggil Midtrans saat pembayaran berhasil
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Verifikasi signature dari Midtrans
  // Format: SHA512(order_id + status_code + gross_amount + server_key)
  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;

  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const expectedSig = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex');

  if (signature_key !== expectedSig) {
    console.error('Midtrans webhook: Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // Cari activation request berdasarkan order_id
  const { data: activationReq } = await adminClient
    .from('activation_requests')
    .select('*')
    .eq('midtrans_order_id', order_id)
    .single();

  if (!activationReq) {
    console.error(`Webhook: activation request not found for order ${order_id}`);
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Cek apakah sudah diproses sebelumnya
  if (activationReq.status === 'paid') {
    return NextResponse.json({ message: 'Already processed' });
  }

  // Tentukan apakah pembayaran berhasil
  const isSuccess =
    (transaction_status === 'capture' && fraud_status === 'accept') ||
    transaction_status === 'settlement';

  const isFailed =
    transaction_status === 'cancel' ||
    transaction_status === 'deny' ||
    transaction_status === 'expire' ||
    transaction_status === 'failure';

  if (isSuccess) {
    // Update status activation request
    await adminClient
      .from('activation_requests')
      .update({
        status: 'paid',
        midtrans_transaction_id: body.transaction_id,
        midtrans_payment_type: body.payment_type,
      })
      .eq('id', activationReq.id);

    // Update profil user
    const { data: currentProfile } = await adminClient
      .from('profiles')
      .select('purchased_credits, is_activated')
      .eq('id', activationReq.user_id)
      .single();

    const currentCredits = currentProfile?.purchased_credits ?? 0;
    const updates: any = {
      purchased_credits: currentCredits + activationReq.credits,
    };

    if (activationReq.type === 'activation') {
      updates.is_activated = true;
    }

    await adminClient
      .from('profiles')
      .update(updates)
      .eq('id', activationReq.user_id);

    console.log(`✅ Payment success: user ${activationReq.user_id}, type ${activationReq.type}, +${activationReq.credits} credits`);
  } else if (isFailed) {
    await adminClient
      .from('activation_requests')
      .update({ status: transaction_status === 'expire' ? 'expired' : 'failed' })
      .eq('id', activationReq.id);
  }

  return NextResponse.json({ message: 'OK' });
}
