import { resolveBillingConfig, subscriptionGrantsAccess, tierForPrice } from "../_shared/billing.ts";
import { adminDb, cryptoProvider, stripeClient, type Stripe } from "../_shared/stripe.ts";

const text = (b: string, status = 200) => new Response(b, { status });

const HANDLED = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

function subscriptionIdOf(event: Stripe.Event): string | null {
  const o: any = event.data.object;
  if (event.type.startsWith("customer.subscription.")) return o.id;
  if (event.type.startsWith("checkout.session.")) return typeof o.subscription === "string" ? o.subscription : o.subscription?.id ?? null;
  if (event.type.startsWith("invoice.")) {
    const s = o.subscription ?? o.parent?.subscription_details?.subscription;
    return typeof s === "string" ? s : s?.id ?? null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return text("method_not_allowed", 405);
  const config = resolveBillingConfig((k) => Deno.env.get(k));
  const whSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!config.ok || !whSecret) return text("not_configured", 503);

  const sig = req.headers.get("stripe-signature");
  if (!sig) return text("missing_signature", 400);
  const raw = await req.text();
  const stripe = stripeClient(config.secretKey);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, whSecret, undefined, cryptoProvider);
  } catch {
    return text("invalid_signature", 400);
  }
  if (event.livemode !== (config.mode === "live")) return text("mode_mismatch", 400);

  const db = adminDb();
  // Persistent idempotency: one row per event id; skip if already processed.
  const { data: prior } = await db.from("stripe_webhook_events").select("processed_at").eq("event_id", event.id).maybeSingle();
  if (prior?.processed_at) return text("duplicate");
  if (!prior) {
    const { error } = await db.from("stripe_webhook_events").insert({ event_id: event.id, event_type: event.type, livemode: event.livemode });
    if (error && error.code !== "23505") return text("store_failed", 500);
  }

  if (HANDLED.has(event.type)) {
    const subId = subscriptionIdOf(event);
    if (subId) {
      // Always re-read current state from Stripe so event ordering can't regress access.
      const sub = await stripe.subscriptions.retrieve(subId);
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const { data: binding } = await db.from("billing_customers").select("organization_id").eq("stripe_customer_id", customerId).maybeSingle();
      if (!binding) {
        console.error("webhook: unbound customer", event.id);
      } else {
        const item: any = sub.items.data[0];
        const priceId = item?.price?.id ?? null;
        const periodEnd: number | null = item?.current_period_end ?? (sub as any).current_period_end ?? null;
        const { error } = await db.from("billing_subscriptions").upsert({
          stripe_subscription_id: sub.id,
          organization_id: binding.organization_id,
          stripe_customer_id: customerId,
          price_id: priceId,
          tier: tierForPrice(priceId, config.prices),
          status: sub.status,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end,
          livemode: sub.livemode,
          last_event_created: event.created,
          updated_at: new Date().toISOString(),
        });
        if (error) return text("upsert_failed", 500);

        // Sync display tier from entitled subscriptions only.
        const { data: subs } = await db.from("billing_subscriptions").select("tier,status,current_period_end").eq("organization_id", binding.organization_id);
        const now = Math.floor(Date.now() / 1000);
        const entitled = (subs ?? []).find((s) => s.tier && subscriptionGrantsAccess(s.status, s.current_period_end ? Date.parse(s.current_period_end) / 1000 : null, now));
        await db.from("organizations").update({ subscription_tier: entitled?.tier ?? "hobby" }).eq("id", binding.organization_id);
      }
    }
  }

  await db.from("stripe_webhook_events").update({ processed_at: new Date().toISOString() }).eq("event_id", event.id);
  return text("ok");
});
