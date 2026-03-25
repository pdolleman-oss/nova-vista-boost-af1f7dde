import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompts: Record<string, string> = {
  blog: `Je bent een professionele Nederlandse SEO-copywriter. Schrijf een uitgebreid, SEO-geoptimaliseerd blogartikel in het Nederlands. Gebruik H2/H3 koppen, bullet points en een duidelijke structuur. Minimaal 500 woorden.`,
  social: `Je bent een social media expert. Schrijf professionele Nederlandse social media posts geschikt voor LinkedIn, Instagram en Facebook. Voeg hashtags en emoji's toe. Geef 3 varianten.`,
  email: `Je bent een e-mail marketing specialist. Schrijf een overtuigende Nederlandse marketing e-mail met een pakkend onderwerp, duidelijke CTA en professionele toon. Geef onderwerpregel en body apart.`,
  ad: `Je bent een advertentie copywriter. Schrijf overtuigende Nederlandse advertentieteksten voor Google Ads en Meta (Facebook/Instagram). Geef per platform 3 varianten met koppen en beschrijvingen. Houd rekening met tekenlimieten.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { toolType, prompt } = await req.json();

    if (!toolType || !prompt) {
      return new Response(JSON.stringify({ error: "toolType and prompt required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = systemPrompts[toolType] || systemPrompts.blog;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "Geen resultaat.";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
