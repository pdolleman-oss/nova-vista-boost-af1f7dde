// Pure billing rules (no network) so they can be unit-tested.
export const RETURN_URL = "https://novavistamarketing.nl/dashboard/settings";

export type Tier = "starter" | "professional" | "enterprise";
export const TIERS: Tier[] = ["starter", "professional", "enterprise"];

// LIVE prices (tax-inclusive, EUR/month: 49 / 149 / 399) on acct_1S01UH2dV33Tvs9y.
export const LIVE_PRICES: Record<Tier, string> = {
  starter: "price_1UPLQg2dV33Tvs9yurLrS5nB",
  professional: "price_1UPLQt2dV33Tvs9ymtFKQGkA",
  enterprise: "price_1UPLQy2dV33Tvs9yEoRGDqg0",
};

export type BillingConfig =
  | { ok: true; mode: "test" | "live"; secretKey: string; prices: Record<Tier, string> }
  | { ok: false; reason: string };

export function resolveBillingConfig(env: (k: string) => string | undefined): BillingConfig {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) return { ok: false, reason: "stripe_not_configured" };
  const mode = /^(sk|rk)_live_/.test(key) ? "live" : /^(sk|rk)_test_/.test(key) ? "test" : null;
  if (!mode) return { ok: false, reason: "invalid_key_format" };

  if (mode === "live") {
    if (env("STRIPE_LIVE_CHECKOUT_ENABLED") !== "true") return { ok: false, reason: "live_checkout_disabled" };
    return { ok: true, mode, secretKey: key, prices: { ...LIVE_PRICES } };
  }
  const prices = {
    starter: env("STRIPE_TEST_PRICE_STARTER") ?? "",
    professional: env("STRIPE_TEST_PRICE_PROFESSIONAL") ?? "",
    enterprise: env("STRIPE_TEST_PRICE_ENTERPRISE") ?? "",
  };
  const live = Object.values(LIVE_PRICES);
  for (const t of TIERS) {
    if (!prices[t]) return { ok: false, reason: "test_prices_missing" };
    if (live.includes(prices[t])) return { ok: false, reason: "live_price_in_test_mode" };
  }
  return { ok: true, mode, secretKey: key, prices };
}

export function tierForPrice(priceId: string | null | undefined, prices: Record<Tier, string>): Tier | null {
  if (!priceId) return null;
  return TIERS.find((t) => prices[t] === priceId) ?? null;
}

// Only a paid, current subscription grants access. past_due/unpaid/canceled/incomplete do not.
export function subscriptionGrantsAccess(status: string, periodEndUnix: number | null, nowUnix: number): boolean {
  if (status !== "active" && status !== "trialing") return false;
  return periodEndUnix == null || periodEndUnix > nowUnix;
}

// ---- Admin billing grants (free access / discounts) ----
export type GrantKind = "free" | "percent" | "amount";
export interface GrantInput { kind: GrantKind; percentOff?: number | null; amountOffCents?: number | null; startsAt?: string | null; endsAt?: string | null; reason?: string }
export interface Grant { kind: GrantKind; percent_off: number | null; amount_off_cents: number | null; starts_at: string; ends_at: string | null; revoked_at: string | null }

export function validateGrantInput(i: GrantInput, nowMs: number): string | null {
  if (!["free", "percent", "amount"].includes(i?.kind)) return "invalid_kind";
  if (!i.reason || i.reason.trim().length < 3 || i.reason.length > 500) return "reason_required";
  if (i.kind === "percent" && !(typeof i.percentOff === "number" && i.percentOff > 0 && i.percentOff < 100)) return "invalid_percent";
  if (i.kind === "amount" && !(Number.isInteger(i.amountOffCents) && (i.amountOffCents as number) > 0)) return "invalid_amount";
  const start = i.startsAt ? Date.parse(i.startsAt) : nowMs;
  if (Number.isNaN(start)) return "invalid_start";
  if (i.endsAt != null) {
    const end = Date.parse(i.endsAt);
    if (Number.isNaN(end) || end <= start || end <= nowMs) return "invalid_end";
  }
  return null;
}

export function grantActive(g: Grant | null | undefined, nowMs: number): boolean {
  if (!g || g.revoked_at) return false;
  if (Date.parse(g.starts_at) > nowMs) return false;
  return g.ends_at == null || Date.parse(g.ends_at) > nowMs;
}

// Stripe coupon params. Tax-inclusive prices: Stripe applies the discount to the gross amount,
// so the invoice total and contained VAT are both reduced proportionally by Stripe itself.
export function couponParamsForGrant(g: Grant, nowMs: number) {
  if (g.kind === "free") throw new Error("free grants never create a Stripe coupon");
  const base: Record<string, unknown> = g.kind === "percent"
    ? { percent_off: Number(g.percent_off) }
    : { amount_off: g.amount_off_cents, currency: "eur" };
  if (g.ends_at == null) return { ...base, duration: "forever" };
  const months = Math.max(1, Math.ceil((Date.parse(g.ends_at) - nowMs) / (30.44 * 86400000)));
  return { ...base, duration: "repeating", duration_in_months: months };
}
