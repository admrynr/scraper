import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
// @ts-ignore – midtrans-client doesn't have official typings
import Midtrans from 'midtrans-client';

// Pricing config
const PRICING = {
  activation: {
    amount: 50000,      // Rp 50.000
    credits: 50,        // 50 credits bonus
    label: 'Aktivasi Akun Prospekto',
  },
  topup: {
    amount: 50000,      // Rp 50.000
    credits: 70,        // 70 credits
    label: 'Top Up 70 Credits Prospekto',
  },
} as const;

type PricingType = keyof typeof PRICING;

function getMidtransSnap() {
  return new Midtrans.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
  });
}

// POST /next-api/activation — buat transaksi Midtrans
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, email, full_name, is_activated, purchased_credits')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profil tidak ditemukan.' }, { status: 404 });
  }

  const body = await request.json();
  const type: PricingType = body.type;

  if (!type || !PRICING[type]) {
    return NextResponse.json({ error: 'Tipe tidak valid. Gunakan "activation" atau "topup".' }, { status: 400 });
  }

  // Cek jika user sudah aktif dan mencoba aktivasi lagi
  if (type === 'activation' && profile.is_activated) {
    return NextResponse.json({ error: 'Akun Anda sudah aktif. Gunakan top-up untuk menambah credits.' }, { status: 400 });
  }

  const pricing = PRICING[type];

  // Buat unique order ID
  const orderId = `PROSPEKTO-${type.toUpperCase()}-${user.id.slice(0, 8).toUpperCase()}-${Date.now()}`;

  // Simpan activation request ke DB
  const { data: activationReq, error: insertError } = await adminClient
    .from('activation_requests')
    .insert({
      user_id: user.id,
      type,
      amount: pricing.amount,
      credits: pricing.credits,
      status: 'pending',
      midtrans_order_id: orderId,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Insert activation_requests error:', insertError);
    return NextResponse.json({ error: 'Gagal membuat transaksi.' }, { status: 500 });
  }

  // Buat Midtrans Snap token
  try {
    const snap = getMidtransSnap();
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: pricing.amount,
      },
      item_details: [
        {
          id: type,
          price: pricing.amount,
          quantity: 1,
          name: pricing.label,
        },
      ],
      customer_details: {
        first_name: profile.full_name || 'User',
        email: profile.email,
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade/success?order_id=${orderId}`,
        error: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade/failed?order_id=${orderId}`,
      },
    });

    return NextResponse.json({
      snapToken: transaction.token,
      orderId,
      amount: pricing.amount,
      credits: pricing.credits,
    });
  } catch (err: any) {
    console.error('Midtrans error:', err);
    // Hapus activation request jika Midtrans gagal
    await adminClient.from('activation_requests').delete().eq('id', activationReq.id);
    return NextResponse.json({ error: 'Gagal menghubungi payment gateway.' }, { status: 502 });
  }
}

// GET /next-api/activation?order_id=xxx — cek status transaksi
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orderId = request.nextUrl.searchParams.get('order_id');
  if (!orderId) {
    return NextResponse.json({ error: 'order_id diperlukan.' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: req } = await adminClient
    .from('activation_requests')
    .select('*')
    .eq('midtrans_order_id', orderId)
    .eq('user_id', user.id)
    .single();

  if (!req) {
    return NextResponse.json({ error: 'Transaksi tidak ditemukan.' }, { status: 404 });
  }

  return NextResponse.json(req);
}
