import { RETURN_URL, resolveBillingConfig, TIERS, type Tier } from "../_shared/billing.ts";
import { adminDb, cors, json, requireOrgOwner, requireUser, stripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const userId = await requireUser(req);
  if (!userId) return json({ error: "Niet ingelogd" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Ongeldige aanvraag" }, 400); }

  const config = resolveBillingConfig((k) => Deno.env.get(k));

  if (body?.action === "status") {
    return json({ available: config.ok, mode: config.ok ? config.mode : null, reason: config.ok ? null : config.reason });
  }
  if (!config.ok) return json({ error: "Online betalen is nog niet beschikbaar.", reason: config.reason }, 503);

  const tier = body?.tier as Tier;
  if (!TIERS.includes(tier)) return json({ error: "Ongeldig abonnement" }, 400);

  const db = adminDb();
  const org = await requireOrgOwner(db, body?.organizationId, userId);
  if (!org) return json({ error: "Alleen de eigenaar van de organisatie kan een abonnement afsluiten." }, 403);

  const { data: existing } = await db.from("billing_subscriptions").select("status")
    .eq("organization_id", org.id).in("status", ["active", "trialing", "past_due", "incomplete"]).limit(1);
  if (existing && existing.length) return json({ error: "Er is al een abonnement. Gebruik Abonnement beheren.", reason: "has_subscription" }, 409);

  const stripe = stripeClient(config.secretKey);
  const livemode = config.mode === "live";

  let { data: cust } = await db.from("billing_customers").select("stripe_customer_id, livemode").eq("organization_id", org.id).maybeSingle();
  if (cust && cust.livemode !== livemode) return json({ error: "Klantkoppeling hoort bij andere Stripe-modus." }, 409);
  if (!cust) {
    const { data: u } = await db.from("profiles").select("email").eq("id", userId).maybeSingle();
    const customer = await stripe.customers.create(
      { name: org.name, email: u?.email ?? undefined, metadata: { organization_id: org.id } },
      { idempotencyKey: `org-customer-${org.id}-${config.mode}` },
    );
    const { error } = await db.from("billing_customers").insert({
      organization_id: org.id, stripe_customer_id: customer.id, livemode, created_by: userId,
    });
    if (error) {
      const { data: again } = await db.from("billing_customers").select("stripe_customer_id, livemode").eq("organization_id", org.id).maybeSingle();
      if (!again) return json({ error: "Klant koppelen mislukt" }, 500);
      cust = again;
    } else cust = { stripe_customer_id: customer.id, livemode };
  }

  // No payment_method_types (dynamic methods) and no automatic_tax (no verified registration).
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: cust.stripe_customer_id,
    client_reference_id: org.id,
    line_items: [{ price: config.prices[tier], quantity: 1 }],
    success_url: `${RETURN_URL}?checkout=success`,
    cancel_url: `${RETURN_URL}?checkout=cancelled`,
    metadata: { organization_id: org.id, tier },
    subscription_data: { metadata: { organization_id: org.id, tier } },
  });

  return json({ url: session.url });
});
