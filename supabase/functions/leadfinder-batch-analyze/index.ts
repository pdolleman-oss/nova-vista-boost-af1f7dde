import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyIds } = await req.json();
    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
      return new Response(JSON.stringify({ error: "companyIds array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId: string | null = null;
    if (authHeader) {
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await anonClient.auth.getUser(token);
      userId = user?.id || null;
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Get companies with domains
    const { data: companies, error: fetchErr } = await supabase
      .from("companies_master")
      .select("id, company_name, website_domain")
      .in("id", companyIds)
      .not("website_domain", "is", null);

    if (fetchErr) throw fetchErr;
    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({ error: "No companies with domains found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { companyId: string; domain: string; success: boolean; score?: number }[] = [];

    for (const company of companies) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `Je bent een website audit expert. Analyseer het domein en geef een JSON object terug met exact deze velden:
{
  "website_score": <0-100>,
  "has_ssl": <boolean>,
  "has_meta_tags": <boolean>,
  "has_sitemap": <boolean>,
  "is_mobile_friendly": <boolean>,
  "has_blog": <boolean>,
  "has_analytics": <boolean>,
  "has_contact_form": <boolean>,
  "has_cta": <boolean>,
  "has_social_links": <boolean>,
  "has_heading_structure": <boolean>,
  "content_quality": "<kort oordeel>",
  "design_assessment": "<kort oordeel>",
  "technology_stack": ["<tech1>"],
  "detected_problems": ["<probleem1>"],
  "recommended_services": ["<dienst1>"],
  "marketing_opportunity_score": <0-100>
}
Antwoord ALLEEN met valid JSON.`
              },
              { role: "user", content: `Analyseer: ${company.website_domain}` },
            ],
            max_tokens: 800,
          }),
        });

        if (!aiResponse.ok) {
          results.push({ companyId: company.id, domain: company.website_domain!, success: false });
          continue;
        }

        const aiData = await aiResponse.json();
        let text = aiData.choices?.[0]?.message?.content || "{}";
        text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        let analysis;
        try { analysis = JSON.parse(text); } catch { analysis = { website_score: 50, marketing_opportunity_score: 50 }; }

        // Insert audit
        await supabase.from("website_audits").insert({
          company_id: company.id,
          domain: company.website_domain!,
          audited_by: userId,
          website_score: analysis.website_score || 0,
          has_ssl: analysis.has_ssl || false,
          has_meta_tags: analysis.has_meta_tags || false,
          has_sitemap: analysis.has_sitemap || false,
          is_mobile_friendly: analysis.is_mobile_friendly || false,
          has_blog: analysis.has_blog || false,
          has_analytics: analysis.has_analytics || false,
          has_contact_form: analysis.has_contact_form || false,
          has_cta: analysis.has_cta || false,
          has_social_links: analysis.has_social_links || false,
          has_heading_structure: analysis.has_heading_structure || false,
          content_quality: analysis.content_quality || null,
          design_assessment: analysis.design_assessment || null,
          technology_stack: analysis.technology_stack || [],
          raw_analysis: analysis,
        });

        // Update company
        await supabase.from("companies_master").update({
          website_score: analysis.website_score || 0,
          marketing_opportunity_score: analysis.marketing_opportunity_score || 0,
          detected_problems: analysis.detected_problems || [],
          recommended_services: analysis.recommended_services || [],
          last_analysis_at: new Date().toISOString(),
          opportunity_level: (analysis.marketing_opportunity_score || 0) >= 70 ? "high" :
            (analysis.marketing_opportunity_score || 0) >= 40 ? "medium" : "low",
        }).eq("id", company.id);

        results.push({ companyId: company.id, domain: company.website_domain!, success: true, score: analysis.website_score });

        // Small delay between requests to avoid rate limits
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        results.push({ companyId: company.id, domain: company.website_domain!, success: false });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
