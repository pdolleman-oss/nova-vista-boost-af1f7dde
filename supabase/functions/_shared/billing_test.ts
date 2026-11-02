import { assertEquals } from "jsr:@std/assert@1";
import { LIVE_PRICES, resolveBillingConfig, subscriptionGrantsAccess, tierForPrice } from "./billing.ts";

const env = (o: Record<string, string>) => (k: string) => o[k];
const testPrices = { STRIPE_TEST_PRICE_STARTER: "price_t1", STRIPE_TEST_PRICE_PROFESSIONAL: "price_t2", STRIPE_TEST_PRICE_ENTERPRISE: "price_t3" };

Deno.test("no key -> unconfigured", () => {
  assertEquals(resolveBillingConfig(env({})), { ok: false, reason: "stripe_not_configured" });
});
Deno.test("live key stays disabled without explicit flag", () => {
  assertEquals(resolveBillingConfig(env({ STRIPE_SECRET_KEY: "sk_live_x" })).ok, false);
});
Deno.test("live key with flag uses the known live prices", () => {
  const c = resolveBillingConfig(env({ STRIPE_SECRET_KEY: "sk_live_x", STRIPE_LIVE_CHECKOUT_ENABLED: "true" }));
  assertEquals(c.ok && c.prices.starter, "price_1UPLQg2dV33Tvs9yurLrS5nB");
});
Deno.test("test mode refuses live price ids", () => {
  const c = resolveBillingConfig(env({ STRIPE_SECRET_KEY: "sk_test_x", ...testPrices, STRIPE_TEST_PRICE_STARTER: LIVE_PRICES.starter }));
  assertEquals(c, { ok: false, reason: "live_price_in_test_mode" });
});
Deno.test("test mode requires test prices", () => {
  assertEquals(resolveBillingConfig(env({ STRIPE_SECRET_KEY: "sk_test_x" })), { ok: false, reason: "test_prices_missing" });
  assertEquals(resolveBillingConfig(env({ STRIPE_SECRET_KEY: "sk_test_x", ...testPrices })).ok, true);
});
Deno.test("price maps to tier", () => {
  assertEquals(tierForPrice(LIVE_PRICES.enterprise, LIVE_PRICES), "enterprise");
  assertEquals(tierForPrice("price_other", LIVE_PRICES), null);
});
Deno.test("only active/trialing unexpired subscriptions grant access", () => {
  assertEquals(subscriptionGrantsAccess("active", 200, 100), true);
  assertEquals(subscriptionGrantsAccess("trialing", 200, 100), true);
  assertEquals(subscriptionGrantsAccess("active", 50, 100), false);
  assertEquals(subscriptionGrantsAccess("past_due", 200, 100), false);
  assertEquals(subscriptionGrantsAccess("canceled", 200, 100), false);
  assertEquals(subscriptionGrantsAccess("incomplete", 200, 100), false);
  assertEquals(subscriptionGrantsAccess("unpaid", 200, 100), false);
});

import { couponParamsForGrant, grantActive, validateGrantInput } from "./billing.ts";
const NOW = Date.parse("2026-11-02T00:00:00Z");
const g = (o: Partial<any>) => ({ kind: "free", percent_off: null, amount_off_cents: null, starts_at: "2026-11-01T00:00:00Z", ends_at: null, revoked_at: null, ...o });

Deno.test("grant needs a reason", () => assertEquals(validateGrantInput({ kind: "free", reason: "" }, NOW), "reason_required"));
Deno.test("percent must be between 0 and 100 exclusive (100% = free grant)", () => {
  assertEquals(validateGrantInput({ kind: "percent", percentOff: 100, reason: "eigen bedrijf" }, NOW), "invalid_percent");
  assertEquals(validateGrantInput({ kind: "percent", percentOff: 25, reason: "partner" }, NOW), null);
});
Deno.test("fixed amount must be positive whole cents", () => {
  assertEquals(validateGrantInput({ kind: "amount", amountOffCents: 10.5, reason: "partner" }, NOW), "invalid_amount");
  assertEquals(validateGrantInput({ kind: "amount", amountOffCents: 1000, reason: "partner" }, NOW), null);
});
Deno.test("end date in the past is refused", () => {
  assertEquals(validateGrantInput({ kind: "free", reason: "eigen", endsAt: "2026-10-01T00:00:00Z" }, NOW), "invalid_end");
});
Deno.test("revoked, expired or future grants are not active", () => {
  assertEquals(grantActive(g({}), NOW), true);
  assertEquals(grantActive(g({ revoked_at: "2026-11-01T12:00:00Z" }), NOW), false);
  assertEquals(grantActive(g({ ends_at: "2026-11-01T12:00:00Z" }), NOW), false);
  assertEquals(grantActive(g({ starts_at: "2026-12-01T00:00:00Z" }), NOW), false);
});
Deno.test("coupon: percent forever, fixed amount in EUR cents with repeating duration", () => {
  assertEquals(couponParamsForGrant(g({ kind: "percent", percent_off: 20 }), NOW), { percent_off: 20, duration: "forever" });
  assertEquals(couponParamsForGrant(g({ kind: "amount", amount_off_cents: 1000, ends_at: "2027-02-01T00:00:00Z" }), NOW),
    { amount_off: 1000, currency: "eur", duration: "repeating", duration_in_months: 3 });
});
Deno.test("free grant never produces a Stripe coupon", () => {
  let threw = false; try { couponParamsForGrant(g({}), NOW); } catch { threw = true; }
  assertEquals(threw, true);
});
