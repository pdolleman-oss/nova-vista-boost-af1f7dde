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
