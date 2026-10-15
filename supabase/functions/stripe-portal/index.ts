import { RETURN_URL, resolveBillingConfig } from "../_shared/billing.ts";
import { adminDb, cors, json, requireOrgOwner, requireUser, stripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const userId = await requireUser(req);
  if (!userId) return json({ error: "Niet ingelogd" }, 401);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Ongeldige aanvraag" }, 400); }

  const config = resolveBillingConfig((k) => Deno.env.get(k));
  if (!config.ok) return json({ error: "Online betalen is nog niet beschikbaar.", reason: config.reason }, 503);

  const db = adminDb();
  const org = await requireOrgOwner(db, body?.organizationId, userId);
  if (!org) return json({ error: "Alleen de eigenaar van de organisatie kan het abonnement beheren." }, 403);

  const { data: cust } = await db.from("billing_customers").select("stripe_customer_id, livemode").eq("organization_id", org.id).maybeSingle();
  if (!cust || cust.livemode !== (config.mode === "live")) return json({ error: "Nog geen abonnement gevonden." }, 404);

  const portal = await stripeClient(config.secretKey).billingPortal.sessions.create({
    customer: cust.stripe_customer_id,
    return_url: RETURN_URL,
  });
  return json({ url: portal.url });
});
