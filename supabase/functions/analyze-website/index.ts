import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, companyId } = await req.json();
    if (!domain || !companyId) {
      return new Response(JSON.stringify({ error: "domain and companyId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user from JWT
    let userId: string | null = null;
    if (authHeader) {
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await anonClient.auth.getUser(token);
      userId = user?.id || null;
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Use AI to analyze the website
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Je bent een website audit expert. Analyseer het domein en geef een JSON object terug met exact deze velden:
{
  "website_score": <0-100 integer>,
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
  "design_assessment": "<kort oordeel in 1-2 zinnen>",
  "technology_stack": ["<tech1>", "<tech2>"],
  "detected_problems": ["<probleem1>", "<probleem2>"],
  "recommended_services": ["<dienst1>", "<dienst2>"],
  "marketing_opportunity_score": <0-100 integer>
}
Baseer je analyse op wat je weet over het domein. Geef realistische schattingen. Antwoord ALLEEN met valid JSON, geen andere tekst.`
          },
          { role: "user", content: `Analyseer dit domein: ${domain}` },
        ],
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} - ${errText}`);
    }

    const aiData = await aiResponse.json();
    let analysisText = aiData.choices?.[0]?.message?.content || "{}";
    
    // Clean markdown code blocks if present
    analysisText = analysisText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      analysis = {
        website_score: 50, has_ssl: true, has_meta_tags: false, has_sitemap: false,
        is_mobile_friendly: true, has_blog: false, has_analytics: false,
        has_contact_form: false, has_cta: false, has_social_links: false,
        has_heading_structure: false, content_quality: "Onbekend",
        design_assessment: "Kon niet analyseren", technology_stack: [],
        detected_problems: [], recommended_services: [],
        marketing_opportunity_score: 50,
      };
    }

    // Insert audit record
    const { error: insertError } = await supabase.from("website_audits").insert({
      company_id: companyId,
      domain,
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

    if (insertError) throw insertError;

    // Update company master with scores
    await supabase.from("companies_master").update({
      website_score: analysis.website_score || 0,
      marketing_opportunity_score: analysis.marketing_opportunity_score || 0,
      detected_problems: analysis.detected_problems || [],
      recommended_services: analysis.recommended_services || [],
      last_analysis_at: new Date().toISOString(),
      scan_count: 1, // Will be incremented in a future version
      opportunity_level: (analysis.marketing_opportunity_score || 0) >= 70 ? "high" :
        (analysis.marketing_opportunity_score || 0) >= 40 ? "medium" : "low",
    }).eq("id", companyId);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
