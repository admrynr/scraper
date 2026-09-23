"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  credits: number;
  status: "pending" | "paid" | "failed" | "expired";
  midtrans_order_id: string | null;
  midtrans_payment_type: string | null;
  created_at: string;
  updated_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  activation: "Aktivasi Akun",
  topup_lite: "Top Up Lite",
  topup_pro: "Top Up Pro",
  topup_agency: "Top Up Agency",
  test_topup: "[TEST] Top Up",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: string }
> = {
  paid: { label: "Berhasil", className: "badge-success", icon: "✓" },
  pending: { label: "Menunggu", className: "badge-warning", icon: "⏳" },
  failed: { label: "Gagal", className: "badge-error", icon: "✗" },
  expired: { label: "Kedaluwarsa", className: "badge-error badge-outline", icon: "⊘" },
};

const PAYMENT_LABEL: Record<string, string> = {
  gopay: "GoPay",
  qris: "QRIS",
  bank_transfer: "Transfer Bank",
  bca_va: "BCA Virtual Account",
  bni_va: "BNI Virtual Account",
  bri_va: "BRI Virtual Account",
  mandiri_bill: "Mandiri Bill",
  other_va: "Virtual Account Lain",
  echannel: "Mandiri Bill",
  dana: "Dana",
  shopeepay: "ShopeePay",
  credit_card: "Kartu Kredit/Debit",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal copy");
    }
  };
  return (
    <button
      onClick={handleCopy}
      title="Salin Order ID"
      className="btn btn-xs btn-ghost opacity-60 hover:opacity-100 transition-opacity ml-1"
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}

export default function TransactionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!data?.is_approved && !user.email_confirmed_at) {
        await supabase.auth.signOut();
        router.push("/auth/login");
        return;
      }
      setProfile(data);

      try {
        const res = await fetch("/next-api/transactions");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setTransactions(json);
      } catch (err: any) {
        toast.error(err.message || "Gagal memuat riwayat");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const paidCount = transactions.filter((t) => t.status === "paid").length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const totalSpent = transactions
    .filter((t) => t.status === "paid")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="w-full max-w-5xl mx-auto py-6 md:py-8 px-4 sm:px-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span>🧾</span> Riwayat Transaksi
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            Status pembelian kuota kredit, aktivasi akun, dan riwayat pembayaran Midtrans
          </p>
        </div>
        <Link href="/upgrade" className="btn btn-sm btn-primary font-bold shadow-sm">
          + Top Up / Aktivasi
        </Link>
      </div>

        {/* Info Banner */}
        <div className="alert alert-info mb-6 rounded-xl text-sm">
          <span>💡</span>
          <span>
            Simpan <strong>Order ID</strong> transaksi Anda sebagai bukti pembayaran.
            Jika ada kendala, tim CS kami akan meminta Order ID ini untuk mempercepat penanganan.
          </span>
        </div>

        {/* Stats */}
        {!loading && transactions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-300 py-4">
              <div className="stat-title text-xs">Transaksi Berhasil</div>
              <div className="stat-value text-success text-2xl">{paidCount}</div>
            </div>
            {pendingCount > 0 && (
              <div className="stat bg-base-100 rounded-xl shadow-sm border border-warning/30 py-4">
                <div className="stat-title text-xs">Menunggu Pembayaran</div>
                <div className="stat-value text-warning text-2xl">{pendingCount}</div>
                <div className="stat-desc">
                  <Link href="/upgrade" className="link link-warning text-xs font-semibold">Selesaikan →</Link>
                </div>
              </div>
            )}
            <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-300 py-4">
              <div className="stat-title text-xs">Total Dibayar</div>
              <div className="stat-value text-primary text-2xl">{formatRupiah(totalSpent)}</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold">Semua Transaksi</h2>
            <Link href="/upgrade" className="btn btn-sm btn-primary">
              + Top Up / Aktivasi
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 opacity-60">
              <div className="text-5xl mb-4">🧾</div>
              <p className="font-semibold text-lg">Belum ada transaksi.</p>
              <p className="text-sm mt-2 max-w-xs mx-auto">
                Lakukan aktivasi akun atau top-up credits untuk memulai.
              </p>
              <Link href="/upgrade" className="btn btn-primary btn-sm mt-5">
                Aktivasi / Top Up Sekarang
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="text-base-content/60 text-xs uppercase tracking-wide">
                      <th>Tanggal</th>
                      <th>Tipe</th>
                      <th>Nominal</th>
                      <th>Credits</th>
                      <th>Metode</th>
                      <th>Status</th>
                      <th>Order ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const status = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.failed;
                      return (
                        <tr key={tx.id} className="hover:bg-base-200/50 transition-colors">
                          <td className="text-xs text-base-content/60 whitespace-nowrap">
                            {formatDate(tx.created_at)}
                          </td>
                          <td className="font-semibold text-sm">
                            {TYPE_LABEL[tx.type] ?? tx.type}
                          </td>
                          <td className="font-bold text-sm">
                            {formatRupiah(tx.amount)}
                          </td>
                          <td className="text-sm">
                            <span className="badge badge-ghost badge-sm font-semibold">
                              +{tx.credits.toLocaleString()}
                            </span>
                          </td>
                          <td className="text-xs text-base-content/70">
                            {tx.midtrans_payment_type
                              ? (PAYMENT_LABEL[tx.midtrans_payment_type] ?? tx.midtrans_payment_type)
                              : <span className="opacity-30">—</span>}
                          </td>
                          <td>
                            <span className={`badge badge-sm font-semibold ${status.className}`}>
                              {status.icon} {status.label}
                            </span>
                            {tx.status === "pending" && (
                              <Link
                                href="/upgrade"
                                className="btn btn-xs btn-warning ml-2"
                              >
                                Bayar
                              </Link>
                            )}
                          </td>
                          <td>
                            {tx.midtrans_order_id ? (
                              <div className="flex items-center gap-1">
                                <code className="text-xs bg-base-200 px-2 py-0.5 rounded font-mono text-base-content/70">
                                  {tx.midtrans_order_id}
                                </code>
                                <CopyButton text={tx.midtrans_order_id} />
                              </div>
                            ) : (
                              <span className="opacity-30 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {transactions.map((tx) => {
                  const status = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.failed;
                  return (
                    <div
                      key={tx.id}
                      className="border border-base-300 rounded-xl p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm">{TYPE_LABEL[tx.type] ?? tx.type}</p>
                          <p className="text-xs text-base-content/50">{formatDate(tx.created_at)}</p>
                        </div>
                        <span className={`badge badge-sm font-semibold ${status.className}`}>
                          {status.icon} {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-bold text-primary">{formatRupiah(tx.amount)}</span>
                        <span className="badge badge-ghost badge-sm">+{tx.credits} credits</span>
                        {tx.midtrans_payment_type && (
                          <span className="text-xs text-base-content/50">
                            via {PAYMENT_LABEL[tx.midtrans_payment_type] ?? tx.midtrans_payment_type}
                          </span>
                        )}
                      </div>
                      {tx.midtrans_order_id && (
                        <div className="flex items-center gap-1 bg-base-200 rounded-lg px-3 py-1.5">
                          <span className="text-xs text-base-content/50 mr-1">Order ID:</span>
                          <code className="text-xs font-mono text-base-content/70 flex-1 truncate">
                            {tx.midtrans_order_id}
                          </code>
                          <CopyButton text={tx.midtrans_order_id} />
                        </div>
                      )}
                      {tx.status === "pending" && (
                        <Link href="/upgrade" className="btn btn-warning btn-sm w-full mt-1">
                          ⏳ Selesaikan Pembayaran
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-base-content/40 mt-6">
          Butuh bantuan? Hubungi CS kami dan sertakan <strong>Order ID</strong> transaksi Anda.
        </p>
    </div>
  );
}
