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
