import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER_PRICES: Record<string, { amount: string; description: string }> = {
  starter: { amount: "49.00", description: "Nova Vista Boost – Starter (maandelijks)" },
  professional: { amount: "149.00", description: "Nova Vista Boost – Professional (maandelijks)" },
  enterprise: { amount: "399.00", description: "Nova Vista Boost – Enterprise (maandelijks)" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MOLLIE_API_KEY = Deno.env.get("MOLLIE_API_KEY");
    if (!MOLLIE_API_KEY) {
      throw new Error("MOLLIE_API_KEY is niet geconfigureerd. Neem contact op met de beheerder.");
    }

    // Verify user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Niet ingelogd" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tier, organizationId } = await req.json();

    if (!tier || !TIER_PRICES[tier]) {
      return new Response(JSON.stringify({ error: "Ongeldig abonnement" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!organizationId) {
      return new Response(JSON.stringify({ error: "Organisatie ID is vereist" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceInfo = TIER_PRICES[tier];
    const redirectUrl = `${req.headers.get("origin") || "https://nova-vista-boost.lovable.app"}/dashboard/settings`;

    // Create Mollie payment
    const mollieRes = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MOLLIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: { currency: "EUR", value: priceInfo.amount },
        description: priceInfo.description,
        redirectUrl: `${redirectUrl}?payment=success&tier=${tier}`,
        webhookUrl: `${supabaseUrl}/functions/v1/mollie-webhook`,
        method: "ideal",
        metadata: {
          userId: user.id,
          organizationId,
          tier,
        },
      }),
    });

    if (!mollieRes.ok) {
      const errBody = await mollieRes.text();
      console.error("Mollie error:", errBody);
      throw new Error(`Mollie API fout: ${mollieRes.status}`);
    }

    const mollieData = await mollieRes.json();

    return new Response(
      JSON.stringify({ checkoutUrl: mollieData._links.checkout.href, paymentId: mollieData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Er ging iets mis" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
