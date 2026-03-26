import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MOLLIE_API_KEY = Deno.env.get("MOLLIE_API_KEY");
    if (!MOLLIE_API_KEY) {
      throw new Error("MOLLIE_API_KEY niet geconfigureerd");
    }

    // Mollie sends form-urlencoded body with payment id
    const formData = await req.formData();
    const paymentId = formData.get("id") as string;

    if (!paymentId) {
      return new Response("Missing payment id", { status: 400, headers: corsHeaders });
    }

    // Fetch payment details from Mollie
    const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MOLLIE_API_KEY}` },
    });

    if (!mollieRes.ok) {
      throw new Error(`Mollie fetch failed: ${mollieRes.status}`);
    }

    const payment = await mollieRes.json();
    console.log("Mollie webhook payment:", JSON.stringify({ id: payment.id, status: payment.status, metadata: payment.metadata }));

    if (payment.status === "paid" && payment.metadata) {
      const { organizationId, tier, userId } = payment.metadata;

      // Update organization subscription tier
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { error: updateError } = await supabase
        .from("organizations")
        .update({ subscription_tier: tier, updated_at: new Date().toISOString() })
        .eq("id", organizationId);

      if (updateError) {
        console.error("Failed to update org tier:", updateError);
      }

      // Create notification for user
      if (userId) {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "Abonnement geactiveerd",
          message: `Je ${tier.charAt(0).toUpperCase() + tier.slice(1)} abonnement is succesvol geactiveerd!`,
          type: "billing",
          link: "/dashboard/settings",
        });
      }

      console.log(`Subscription updated: org=${organizationId}, tier=${tier}`);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
