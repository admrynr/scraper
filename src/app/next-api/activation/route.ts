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

function getMidtransCore() {
  return new Midtrans.CoreApi({
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
    .select('id, email, full_name, phone, is_activated, purchased_credits')
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

  // ── Cek apakah ada pending request dengan snap_token yang dibuat < 5 menit lalu ──
  // Window 5 menit: cukup untuk retry langsung setelah tutup popup, tapi tidak reuse
  // jika user navigasi ke halaman lain (biasanya lebih dari beberapa menit)
  const reuseWindow = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: existingReq } = await adminClient
    .from('activation_requests')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', type)
    .eq('status', 'pending')
    .not('snap_token', 'is', null)
    .gt('created_at', reuseWindow)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingReq?.snap_token) {
    // Reuse token yang masih fresh (< 5 menit) — user hanya tutup popup sebelumnya
    console.log('Reusing existing snap token for order:', existingReq.midtrans_order_id);
    return NextResponse.json({
      snapToken: existingReq.snap_token,
      orderId: existingReq.midtrans_order_id,
      amount: existingReq.amount,
      credits: existingReq.credits,
      resumed: true,
    });
  }

  // ── Hapus pending lama yang sudah expired (bersihkan DB) ──
  await adminClient
    .from('activation_requests')
    .delete()
    .eq('user_id', user.id)
    .eq('type', type)
    .eq('status', 'pending');

  // ── Buat transaksi baru ──
  const orderId = `PROSPEKTO-${type.toUpperCase()}-${user.id.slice(0, 8).toUpperCase()}-${Date.now()}`;

  // Midtrans snap token berlaku 24 jam — kita simpan 23 jam sebagai safety margin
  const tokenExpiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();

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
      snap_token_expires_at: tokenExpiresAt,
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
        ...(profile.phone ? { phone: profile.phone } : {}),
      },
      enabled_payments: [
        'gopay',
        'bank_transfer',
        'bca_klikbca',
        'bca_klikpay',
        'cimb_clicks',
        'danamon_online',
        'mandiri_clickpay',
        'bri_epay',
        'echannel',
        'permata_va',
        'bca_va',
        'bni_va',
        'bri_va',
        'other_va',
        'indomaret',
        'alfamart',
        'akulaku',
        'shopeepay',
      ],
      gopay: {
        enable_callback: true,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade`,
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade/success?order_id=${orderId}`,
        error: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade/failed?order_id=${orderId}`,
      },
    });

    // Simpan snap_token ke DB
    await adminClient
      .from('activation_requests')
      .update({ snap_token: transaction.token })
      .eq('id', activationReq.id);

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


// GET /next-api/activation?order_id=xxx[&include_expiry=1] — cek status transaksi
// include_expiry=1: panggil Midtrans status API untuk dapat expiry_time real (per payment method)
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

  // Jika include_expiry=1 dan status masih pending, ambil expiry time real dari Midtrans
  // (hanya dipanggil sekali dari frontend saat pertama load, bukan tiap poll)
  let midtransExpiryAt: string | null = null;
  const includeExpiry = request.nextUrl.searchParams.get('include_expiry') === '1';
  if (includeExpiry && req.status === 'pending') {
    try {
      const core = getMidtransCore();
      const mtStatus = await core.transaction.status(orderId);
      if (mtStatus?.expiry_time) {
        // Midtrans returns "YYYY-MM-DD HH:MM:SS" dalam WIB (UTC+7)
        midtransExpiryAt = new Date(
          mtStatus.expiry_time.replace(' ', 'T') + '+07:00'
        ).toISOString();
      }
    } catch {
      // Jika gagal (belum pilih metode / Midtrans error), biarkan null
    }
  }

  return NextResponse.json({ ...req, midtrans_expiry_at: midtransExpiryAt });
}

// DELETE /next-api/activation?type=xxx — hapus pending record yang tokennya expired/stale
// Dipanggil dari frontend saat onError di Snap popup (misal: "transaction has expired")
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type');

  const adminClient = createAdminClient();
  const query = adminClient
    .from('activation_requests')
    .delete()
    .eq('user_id', user.id)
    .eq('status', 'pending');

  // Jika type disertakan, hanya hapus untuk tipe itu
  if (type && ['activation', 'topup'].includes(type)) {
    query.eq('type', type);
  }

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

