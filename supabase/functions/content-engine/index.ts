import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ success: false, error: "Unauthorized" }, 401);

  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) return json({ success: false, error: "Unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1];
    const body = req.method !== "GET" ? await req.json() : {};

    switch (action) {
      case "analyze":
        if (!lovableApiKey) return json({ success: false, error: "AI service not configured" }, 500);
        return await handleAnalyze(body, user.id, admin, lovableApiKey);
      case "generate":
        if (!lovableApiKey) return json({ success: false, error: "AI service not configured" }, 500);
        return await handleGenerate(body, user.id, admin, lovableApiKey);
      case "approve":
        return await handleApprove(body, user.id, admin);
      case "schedule":
        return await handleSchedule(body, user.id, admin);
      case "publish":
        return await handlePublish(body, user.id, admin);
      default:
        return json({ success: false, error: "Unknown action. Use /analyze, /generate, /approve, /schedule, or /publish" }, 400);
    }
  } catch (error: any) {
    console.error("content-engine error:", error);
    return json({ success: false, error: error.message || "Unknown error" }, 500);
  }
});

// ─── Analyze ──────────────────────────────────────────────────
async function handleAnalyze(body: any, userId: string, admin: any, apiKey: string) {
  const { content_request_id } = body;
  if (!content_request_id) return json({ success: false, error: "content_request_id is required" }, 400);

  const { data: cr } = await admin.from("content_requests").select("*").eq("id", content_request_id).single();
  if (!cr) return json({ success: false, error: "Content request not found" }, 404);

  await admin.from("content_requests").update({ status: "analyzing" }).eq("id", content_request_id);

  const systemPrompt = `Je bent NVB Content Advisor. Analyseer de contentbriefing en geef strategisch advies als JSON.
Geef exact dit JSON-formaat terug, zonder markdown codeblokken:
{
  "suggested_tone_of_voice": "string",
  "suggested_audience": "string",
  "suggested_length": "string (bijv. '150-200 woorden')",
  "suggested_cta_style": "string",
  "suggested_publish_time": "string (dag en tijd, bijv. 'Dinsdag 10:00')",
  "risk_flags": ["string array van waarschuwingen zoals too_generic, too_salesy, weak_cta, tone_mismatch, missing_context"],
  "reasoning_summary": "string met korte motivatie"
}
Baseer timing-advies op kanaal, doelgroep en doel:
- Facebook: di-do 9-12, za 10-11 voor B2C; di-do 9-11 voor B2B
- Instagram: ma-vr 11-13, za-zo 10-14 voor B2C
- LinkedIn: di-do 8-10, 12-13 voor B2B
- E-mail: di-do 9-11 voor alle segmenten
- Blog: di-do publicatie voor SEO
Pas aan op basis van prijssegment (premium = rustigere momenten, budget = piekuren).`;

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
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: briefing }],
      max_tokens: 2000,
    }),
  });

  if (!aiRes.ok) {
    await admin.from("content_requests").update({ status: "failed" }).eq("id", content_request_id);
    if (aiRes.status === 429) return json({ success: false, error: "Rate limit bereikt, probeer het later opnieuw." }, 429);
    if (aiRes.status === 402) return json({ success: false, error: "AI credits op, vul tegoed aan." }, 402);
    return json({ success: false, error: `AI error: ${aiRes.status}` }, 500);
  }

  const aiData = await aiRes.json();
  let rawText = (aiData.choices?.[0]?.message?.content || "").replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  let recommendation: any;
  try { recommendation = JSON.parse(rawText); } catch {
    recommendation = { suggested_tone_of_voice: "", suggested_audience: "", suggested_length: "", suggested_cta_style: "", suggested_publish_time: "", risk_flags: [], reasoning_summary: rawText };
  }

  const { data: rec, error: recErr } = await admin.from("content_recommendations").insert({
    content_request_id,
    suggested_tone_of_voice: recommendation.suggested_tone_of_voice || "",
    suggested_audience: recommendation.suggested_audience || "",
    suggested_length: recommendation.suggested_length || "",
    suggested_cta_style: recommendation.suggested_cta_style || "",
    suggested_publish_time: recommendation.suggested_publish_time || "",
    risk_flags: recommendation.risk_flags || [],
    reasoning_summary: recommendation.reasoning_summary || "",
  }).select().single();

  if (recErr) throw new Error(`Failed to save recommendation: ${recErr.message}`);

  await admin.from("content_requests").update({ status: "analyzed" }).eq("id", content_request_id);
  await admin.from("logs").insert({ user_id: userId, project_id: cr.project_id, log_type: "content_analyzed", message: `Content briefing analyzed: ${cr.campaign_title || cr.content_type}`, metadata_json: { content_request_id, recommendation_id: rec.id } });

  return json({ success: true, data: rec });
}

// ─── Generate ─────────────────────────────────────────────────
async function handleGenerate(body: any, userId: string, admin: any, apiKey: string) {
  const { content_request_id } = body;
  if (!content_request_id) return json({ success: false, error: "content_request_id is required" }, 400);

  const { data: cr } = await admin.from("content_requests").select("*").eq("id", content_request_id).single();
  if (!cr) return json({ success: false, error: "Content request not found" }, 404);

  const { data: rec } = await admin.from("content_recommendations").select("*").eq("content_request_id", content_request_id).order("created_at", { ascending: false }).limit(1).maybeSingle();

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
${!cr.hashtags_enabled ? "Gebruik GEEN hashtags, laat het array leeg." : ""}`;

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
    userMsg += `\n\nNVB Advies:\nVoorgestelde toon: ${rec.suggested_tone_of_voice}\nVoorgestelde lengte: ${rec.suggested_length}\nVoorgestelde CTA: ${rec.suggested_cta_style}`;
  }

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }],
      max_tokens: 3000,
    }),
  });

  if (!aiRes.ok) {
    await admin.from("content_requests").update({ status: "failed" }).eq("id", content_request_id);
    if (aiRes.status === 429) return json({ success: false, error: "Rate limit bereikt, probeer het later opnieuw." }, 429);
    if (aiRes.status === 402) return json({ success: false, error: "AI credits op, vul tegoed aan." }, 402);
    return json({ success: false, error: `AI error: ${aiRes.status}` }, 500);
  }

  const aiData = await aiRes.json();
  let rawText = (aiData.choices?.[0]?.message?.content || "").replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  let generated: any;
  try { generated = JSON.parse(rawText); } catch {
    generated = { title: "", body: rawText, short_version: "", cta_text: "", hashtags: [] };
  }

  const { data: output, error: outErr } = await admin.from("content_outputs").insert({
    content_request_id, project_id: cr.project_id, user_id: userId,
    title: generated.title || "", body: generated.body || "", short_version: generated.short_version || "",
    cta_text: generated.cta_text || "", hashtags: generated.hashtags || [],
    status: "generated", approval_status: "pending", publish_channel: cr.channel,
  }).select().single();

  if (outErr) throw new Error(`Failed to save output: ${outErr.message}`);

  await admin.from("content_requests").update({ status: "generated" }).eq("id", content_request_id);
  await admin.from("logs").insert({ user_id: userId, project_id: cr.project_id, log_type: "content_generated", message: `Content generated: ${generated.title || cr.content_type}`, metadata_json: { content_request_id, output_id: output.id } });

  return json({ success: true, data: output });
}

// ─── Approve ──────────────────────────────────────────────────
async function handleApprove(body: any, userId: string, admin: any) {
  const { output_id } = body;
  if (!output_id) return json({ success: false, error: "output_id is required" }, 400);

  const { data: output } = await admin.from("content_outputs").select("*").eq("id", output_id).single();
  if (!output) return json({ success: false, error: "Output not found" }, 404);

  const { data, error } = await admin.from("content_outputs")
    .update({ approval_status: "approved", status: "approved" })
    .eq("id", output_id).select().single();
  if (error) throw error;

  // Update parent request
  await admin.from("content_requests").update({ status: "approved" }).eq("id", output.content_request_id);
  await admin.from("logs").insert({ user_id: userId, project_id: output.project_id, log_type: "content_approved", message: `Content approved: ${output.title}`, metadata_json: { output_id } });

  return json({ success: true, data });
}

// ─── Schedule ─────────────────────────────────────────────────
async function handleSchedule(body: any, userId: string, admin: any) {
  const { output_id, scheduled_at } = body;
  if (!output_id || !scheduled_at) return json({ success: false, error: "output_id and scheduled_at are required" }, 400);

  const { data: output } = await admin.from("content_outputs").select("*").eq("id", output_id).single();
  if (!output) return json({ success: false, error: "Output not found" }, 404);
  if (output.approval_status !== "approved") return json({ success: false, error: "Output must be approved before scheduling" }, 400);

  const { data, error } = await admin.from("content_outputs")
    .update({ status: "scheduled", scheduled_at })
    .eq("id", output_id).select().single();
  if (error) throw error;

  await admin.from("content_requests").update({ status: "scheduled" }).eq("id", output.content_request_id);
  await admin.from("logs").insert({ user_id: userId, project_id: output.project_id, log_type: "content_scheduled", message: `Content scheduled: ${output.title} for ${scheduled_at}`, metadata_json: { output_id, scheduled_at } });

  return json({ success: true, data });
}

// ─── Publish ──────────────────────────────────────────────────
async function handlePublish(body: any, userId: string, admin: any) {
  const { output_id } = body;
  if (!output_id) return json({ success: false, error: "output_id is required" }, 400);

  const { data: output } = await admin.from("content_outputs").select("*").eq("id", output_id).single();
  if (!output) return json({ success: false, error: "Output not found" }, 404);
  if (output.approval_status !== "approved") return json({ success: false, error: "Output must be approved before publishing" }, 400);

  // Check if channel connection exists (for social channels)
  const socialChannels = ["facebook", "instagram", "linkedin"];
  const channel = (output.publish_channel || "").toLowerCase();

  if (socialChannels.includes(channel)) {
    const { data: conn } = await admin.from("social_connections")
      .select("id").eq("user_id", userId).eq("channel", channel).eq("is_active", true).maybeSingle();

    if (!conn) {
      await admin.from("logs").insert({ user_id: userId, project_id: output.project_id, log_type: "content_publish_failed", message: `Publish failed: no ${channel} connection`, metadata_json: { output_id } });
      return json({ success: false, error: `Geen actieve ${output.publish_channel}-koppeling gevonden. Koppel eerst je account via Social Publisher.` }, 400);
    }
  }

  // Mark as published (actual external publish via Social Publisher integration)
  const { data, error } = await admin.from("content_outputs")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", output_id).select().single();
  if (error) throw error;

  await admin.from("content_requests").update({ status: "published" }).eq("id", output.content_request_id);
  await admin.from("logs").insert({ user_id: userId, project_id: output.project_id, log_type: "content_published", message: `Content published: ${output.title}`, metadata_json: { output_id, channel } });

  return json({ success: true, data });
}
