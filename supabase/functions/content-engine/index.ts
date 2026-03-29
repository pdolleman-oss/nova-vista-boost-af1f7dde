import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!lovableApiKey) {
    return new Response(JSON.stringify({ success: false, error: "AI service not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Routes: /content-engine/analyze, /content-engine/generate
    const action = pathParts[pathParts.length - 1];

    const body = await req.json();

    if (action === "analyze") {
      return await handleAnalyze(body, user.id, adminClient, lovableApiKey);
    } else if (action === "generate") {
      return await handleGenerate(body, user.id, adminClient, lovableApiKey);
    } else {
      return new Response(JSON.stringify({ success: false, error: "Unknown action. Use /analyze or /generate" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error("content-engine error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleAnalyze(body: any, userId: string, admin: any, apiKey: string) {
  const { content_request_id } = body;
  if (!content_request_id) {
    return new Response(JSON.stringify({ success: false, error: "content_request_id is required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch the content request
  const { data: cr, error: crErr } = await admin
    .from("content_requests")
    .select("*")
    .eq("id", content_request_id)
    .single();
  if (crErr || !cr) {
    return new Response(JSON.stringify({ success: false, error: "Content request not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Update status
  await admin.from("content_requests").update({ status: "analyzing" }).eq("id", content_request_id);

  const systemPrompt = `Je bent NVB Content Advisor. Analyseer de volgende contentbriefing en geef een strategisch advies terug als JSON.
Geef exact dit JSON-formaat terug, zonder markdown codeblokken:
{
  "suggested_tone_of_voice": "string",
  "suggested_audience": "string", 
  "suggested_length": "string (bijv. '150-200 woorden')",
  "suggested_cta_style": "string",
  "suggested_publish_time": "string (dag en tijd)",
  "risk_flags": ["string array van waarschuwingen"],
  "reasoning_summary": "string met korte motivatie"
}
Baseer je advies op het kanaal, contenttype, doelgroep, merkintensiteit en doel.`;

  const briefing = `Kanaal: ${cr.channel}
Contenttype: ${cr.content_type}
Doel: ${cr.goal}
Campagne: ${cr.campaign_title}
Doelgroep: ${cr.audience_primary} (${cr.audience_age_group}, ${cr.price_segment})
Doelgroep omschrijving: ${cr.audience_description}
Tone of voice: ${(cr.tone_of_voice || []).join(", ")}
Merkintensiteit: ${cr.brand_intensity}/5
CTA-stijl: ${cr.cta_style}
Verboden woorden: ${cr.forbidden_words}
Kernboodschap: ${cr.core_message}
USPs: ${(cr.usp_points || []).join(", ")}
Hashtags: ${cr.hashtags_enabled ? "ja" : "nee"}
Emoji: ${cr.emoji_allowed ? "ja" : "nee"}
Media beschikbaar: ${cr.has_media ? "ja" : "nee"}`;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: briefing },
      ],
      max_tokens: 2000,
    }),
  });

  if (!aiRes.ok) {
    await admin.from("content_requests").update({ status: "failed" }).eq("id", content_request_id);
    return new Response(JSON.stringify({ success: false, error: `AI error: ${aiRes.status}` }), {
      status: aiRes.status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiData = await aiRes.json();
  let rawText = aiData.choices?.[0]?.message?.content || "";
  
  // Strip markdown code blocks if present
  rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  let recommendation: any;
  try {
    recommendation = JSON.parse(rawText);
  } catch {
    recommendation = {
      suggested_tone_of_voice: rawText.substring(0, 200),
      suggested_audience: "",
      suggested_length: "",
      suggested_cta_style: "",
      suggested_publish_time: "",
      risk_flags: [],
      reasoning_summary: rawText,
    };
  }

  // Save recommendation
  const { data: rec, error: recErr } = await admin
    .from("content_recommendations")
    .insert({
      content_request_id,
      suggested_tone_of_voice: recommendation.suggested_tone_of_voice || "",
      suggested_audience: recommendation.suggested_audience || "",
      suggested_length: recommendation.suggested_length || "",
      suggested_cta_style: recommendation.suggested_cta_style || "",
      suggested_publish_time: recommendation.suggested_publish_time || "",
      risk_flags: recommendation.risk_flags || [],
      reasoning_summary: recommendation.reasoning_summary || "",
    })
    .select()
    .single();

  if (recErr) throw new Error(`Failed to save recommendation: ${recErr.message}`);

  await admin.from("content_requests").update({ status: "analyzed" }).eq("id", content_request_id);

  // Log
  await admin.from("logs").insert({
    user_id: userId,
    project_id: cr.project_id,
    log_type: "content_analyzed",
    message: `Content briefing analyzed: ${cr.campaign_title || cr.content_type}`,
    metadata_json: { content_request_id, recommendation_id: rec.id },
  });

  return new Response(JSON.stringify({ success: true, data: rec }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGenerate(body: any, userId: string, admin: any, apiKey: string) {
  const { content_request_id } = body;
  if (!content_request_id) {
    return new Response(JSON.stringify({ success: false, error: "content_request_id is required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: cr } = await admin.from("content_requests").select("*").eq("id", content_request_id).single();
  if (!cr) {
    return new Response(JSON.stringify({ success: false, error: "Content request not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get recommendation if exists
  const { data: rec } = await admin
    .from("content_recommendations")
    .select("*")
    .eq("content_request_id", content_request_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await admin.from("content_requests").update({ status: "generating" }).eq("id", content_request_id);

  const systemPrompt = `Je bent NVB Content Generator. Genereer content op basis van de briefing.
Geef exact dit JSON-formaat terug, zonder markdown codeblokken:
{
  "title": "pakkende titel",
  "body": "de volledige contenttekst",
  "short_version": "korte versie (max 2 zinnen)",
  "cta_text": "call-to-action tekst",
  "hashtags": ["relevante", "hashtags"]
}
Houd rekening met kanaal, doelgroep, tone of voice en merkintensiteit.
${cr.forbidden_words ? `Gebruik NOOIT: ${cr.forbidden_words}` : ""}
${!cr.emoji_allowed ? "Gebruik GEEN emoji." : ""}
${!cr.hashtags_enabled ? "Gebruik GEEN hashtags." : ""}`;

  let userMsg = `Briefing:
Kanaal: ${cr.channel} | Type: ${cr.content_type} | Doel: ${cr.goal}
Kernboodschap: ${cr.core_message}
USPs: ${(cr.usp_points || []).join(", ")}
Doelgroep: ${cr.audience_primary} (${cr.audience_age_group})
Tone of voice: ${(cr.tone_of_voice || []).join(", ")}
Merkintensiteit: ${cr.brand_intensity}/5
CTA-stijl: ${cr.cta_style}
Verplichte elementen: ${cr.required_elements}
Visual briefing: ${cr.visual_brief}`;

  if (rec) {
    userMsg += `\n\nNVB Advies:
Voorgestelde toon: ${rec.suggested_tone_of_voice}
Voorgestelde lengte: ${rec.suggested_length}
Voorgestelde CTA: ${rec.suggested_cta_style}`;
  }

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
      max_tokens: 3000,
    }),
  });

  if (!aiRes.ok) {
    await admin.from("content_requests").update({ status: "failed" }).eq("id", content_request_id);
    return new Response(JSON.stringify({ success: false, error: `AI error: ${aiRes.status}` }), {
      status: aiRes.status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiData = await aiRes.json();
  let rawText = aiData.choices?.[0]?.message?.content || "";
  rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  let generated: any;
  try {
    generated = JSON.parse(rawText);
  } catch {
    generated = { title: "", body: rawText, short_version: "", cta_text: "", hashtags: [] };
  }

  // Save output
  const { data: output, error: outErr } = await admin
    .from("content_outputs")
    .insert({
      content_request_id,
      project_id: cr.project_id,
      user_id: userId,
      title: generated.title || "",
      body: generated.body || "",
      short_version: generated.short_version || "",
      cta_text: generated.cta_text || "",
      hashtags: generated.hashtags || [],
      status: "generated",
      approval_status: "pending",
      publish_channel: cr.channel,
    })
    .select()
    .single();

  if (outErr) throw new Error(`Failed to save output: ${outErr.message}`);

  await admin.from("content_requests").update({ status: "generated" }).eq("id", content_request_id);

  // Log
  await admin.from("logs").insert({
    user_id: userId,
    project_id: cr.project_id,
    log_type: "content_generated",
    message: `Content generated: ${generated.title || cr.content_type}`,
    metadata_json: { content_request_id, output_id: output.id },
  });

  return new Response(JSON.stringify({ success: true, data: output }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
