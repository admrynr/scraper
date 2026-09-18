/**
 * Lead Scoring Engine — CariProspek CRM
 *
 * Scoring dihitung otomatis oleh sistem saat data masuk dari DataForSEO.
 * Konstanta dipisah sebagai config agar bisa di-tune tanpa perubahan logic.
 *
 * DataForSEO field mapping yang dipakai:
 *   rating.value       → rating
 *   rating.votes_count → reviews
 *   phone              → phone
 *   url                → website
 *   is_claimed         → is_claimed
 *   work_hours         → work_hours  (object { timetable: { monday:[], ... } })
 *   main_image         → main_image
 *   business_status    → business_status
 *   title              → name
 *   keyword (search)   → keyword_used (proxy untuk category match)
 */

// ─── Scoring Constants (tunable) ──────────────────────────────────────────────

export const SCORE_WEIGHTS = {
  /** Rating ≥ 4.0 DAN votes ≥ 10 */
  RATING_HIGH: 30,
  /** Rating ≥ 3.0 DAN votes ≥ 5 */
  RATING_MID: 15,
  /** Reviews sangat sedikit (< 5) */
  REVIEW_FEW: 5,
  /** Tidak ada website — peluang jasa digital */
  NO_WEBSITE: 20,
  /** Profil GMB belum diklaim */
  NOT_CLAIMED: 15,
  /** Jam operasional terisi lengkap (7 hari) */
  FULL_HOURS: 10,
  /** Keyword user cocok (partial) dengan nama bisnis */
  KEYWORD_MATCH: 10,
  /** Punya foto profil utama */
  HAS_IMAGE: 5,
} as const;

export const SCORE_THRESHOLDS = {
  HOT: 70,
  WARM: 40,
} as const;

export type ScoreLabel = 'hot' | 'warm' | 'cold' | 'unreachable';

// ─── Input type ────────────────────────────────────────────────────────────────

export interface ScoringInput {
  name: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  is_claimed: boolean | null;
  business_status: string | null;
  work_hours: any | null;    // DataForSEO work_hours object
  main_image: string | null;
  keyword_used: string;
}

export interface ScoreResult {
  score: number;
  score_label: ScoreLabel;
}

// ─── Hard Filters ──────────────────────────────────────────────────────────────

/**
 * Kembalikan true jika bisnis ini harus dieksklusi sama sekali dari hasil.
 * (business_status === 'permanently_closed')
 */
export function isPermanentlyClosed(item: Pick<ScoringInput, 'business_status'>): boolean {
  const status = (item.business_status || '').toLowerCase();
  return status === 'permanently_closed' || status === 'closed_permanently';
}

// ─── Scoring Function ──────────────────────────────────────────────────────────

/**
 * Hitung skor lead berdasarkan data DataForSEO.
 * Jika phone null → score_label = 'unreachable' (tidak dihitung skor numerik).
 */
export function calculateScore(item: ScoringInput): ScoreResult {
  // Hard filter: tidak ada phone → unreachable
  if (!item.phone || item.phone.trim() === '') {
    return { score: 0, score_label: 'unreachable' };
  }

  let score = 0;

  // ── Rating & Reviews ────────────────────────────────────────────────────────
  const rating = item.rating ?? 0;
  const reviews = item.reviews ?? 0;

  if (rating >= 4.0 && reviews >= 10) {
    score += SCORE_WEIGHTS.RATING_HIGH;
  } else if (rating >= 3.0 && reviews >= 5) {
    score += SCORE_WEIGHTS.RATING_MID;
  } else if (reviews < 5) {
    score += SCORE_WEIGHTS.REVIEW_FEW;
  }

  // ── Tidak ada website ───────────────────────────────────────────────────────
  if (!item.website) {
    score += SCORE_WEIGHTS.NO_WEBSITE;
  }

  // ── Profil GMB belum diklaim ────────────────────────────────────────────────
  if (item.is_claimed === false) {
    score += SCORE_WEIGHTS.NOT_CLAIMED;
  }

  // ── Jam operasional lengkap (7 hari) ────────────────────────────────────────
  if (hasFullWorkHours(item.work_hours)) {
    score += SCORE_WEIGHTS.FULL_HOURS;
  }

  // ── Keyword match (proxy untuk category match) ──────────────────────────────
  // Cek apakah keyword yang dipakai user ada (partial, case-insensitive) di nama bisnis
  if (item.keyword_used && item.name) {
    const kwLower = item.keyword_used.toLowerCase().trim();
    const nameLower = item.name.toLowerCase();
    if (kwLower && nameLower.includes(kwLower)) {
      score += SCORE_WEIGHTS.KEYWORD_MATCH;
    }
  }

  // ── Punya foto profil ───────────────────────────────────────────────────────
  if (item.main_image) {
    score += SCORE_WEIGHTS.HAS_IMAGE;
  }

  // ── Map skor ke label ───────────────────────────────────────────────────────
  let score_label: ScoreLabel;
  if (score >= SCORE_THRESHOLDS.HOT) {
    score_label = 'hot';
  } else if (score >= SCORE_THRESHOLDS.WARM) {
    score_label = 'warm';
  } else {
    score_label = 'cold';
  }

  return { score, score_label };
}

// ─── Helper: work_hours completeness ──────────────────────────────────────────

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Periksa apakah work_hours memiliki data untuk semua 7 hari.
 * DataForSEO work_hours format: { timetable: { monday: [...], tuesday: [...], ... } }
 */
function hasFullWorkHours(workHours: any): boolean {
  if (!workHours) return false;
  // Support both direct object dan nested timetable
  const timetable = workHours.timetable ?? workHours;
  if (typeof timetable !== 'object' || timetable === null) return false;
  return DAYS.every(day => {
    const dayData = timetable[day];
    return Array.isArray(dayData) ? dayData.length > 0 : !!dayData;
  });
}

// ─── Score badge config (untuk UI) ────────────────────────────────────────────

export const SCORE_BADGE_CONFIG: Record<ScoreLabel, { label: string; className: string; emoji: string }> = {
  hot:         { label: 'Hot',                  className: 'badge-error',   emoji: '🔥' },
  warm:        { label: 'Warm',                 className: 'badge-warning', emoji: '☀️' },
  cold:        { label: 'Cold',                 className: 'badge-info',    emoji: '❄️' },
  unreachable: { label: 'Tidak Bisa Dihubungi', className: 'badge-ghost',   emoji: '📵' },
};
