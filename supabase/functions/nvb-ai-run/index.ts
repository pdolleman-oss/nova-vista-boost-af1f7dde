import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Valid task types
const VALID_TASK_TYPES = [
  "analysis", "product_copy", "email_draft", "homepage_review",
  "strategy", "seo", "ad_copy", "action_plan",
  "blog", "social", "email", "ad", // legacy tool types
];

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

  // Authenticate user
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
    const body = await req.json();
    const { project_id, task_type, module_name, input_text, context } = body;

    // Validate required fields
    if (!task_type || !input_text) {
      return new Response(JSON.stringify({ success: false, error: "task_type and input_text are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!VALID_TASK_TYPES.includes(task_type)) {
      return new Response(JSON.stringify({ success: false, error: `Invalid task_type. Valid: ${VALID_TASK_TYPES.join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch system prompts from database
    const { data: prompts } = await adminClient
      .from("system_prompts")
      .select("prompt_key, prompt_text")
      .in("prompt_key", ["nvb_core", task_type])
      .eq("is_active", true);

    const corePrompt = prompts?.find(p => p.prompt_key === "nvb_core")?.prompt_text || "";
    const subPrompt = prompts?.find(p => p.prompt_key === task_type)?.prompt_text || "";
    const fullSystemPrompt = `${corePrompt}\n\n${subPrompt}`.trim();

    // Determine model from project settings or default
    let model = "google/gemini-3-flash-preview";
    if (project_id) {
      const { data: project } = await adminClient
        .from("projects")
        .select("preferred_model, ai_mode")
        .eq("id", project_id)
        .single();
      if (project?.preferred_model) model = project.preferred_model;
    }

    // Log: AI request started
    await adminClient.from("logs").insert({
      user_id: user.id,
      project_id: project_id || null,
      log_type: "ai_request_started",
      message: `AI request started: ${task_type}`,
      metadata_json: { task_type, module_name, model },
    });

    // Insert AI request record
    const { data: aiRequest, error: reqError } = await adminClient
      .from("ai_requests")
      .insert({
        user_id: user.id,
        project_id: project_id || null,
        task_type,
        module_name: module_name || task_type,
        input_text,
        system_prompt_used: fullSystemPrompt,
        subprompt_used: subPrompt,
        status: "processing",
      })
      .select("id")
      .single();

    if (reqError) throw new Error(`Failed to log request: ${reqError.message}`);

    // Build messages
    const messages: any[] = [
      { role: "system", content: fullSystemPrompt },
    ];
    if (context) {
      messages.push({ role: "user", content: `Context: ${context}` });
    }
    messages.push({ role: "user", content: input_text });

    // Call AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, max_tokens: 4000 }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      // Update request status
      await adminClient.from("ai_requests").update({ status: "failed" }).eq("id", aiRequest.id);
      // Log failure
      await adminClient.from("logs").insert({
        user_id: user.id,
        project_id: project_id || null,
        log_type: "ai_request_failed",
        message: `AI request failed: ${aiResponse.status}`,
        metadata_json: { request_id: aiRequest.id, status: aiResponse.status, error: errText },
      });

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit bereikt, probeer het later opnieuw." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "AI credits op, vul tegoed aan." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const outputText = aiData.choices?.[0]?.message?.content || "";

    // Update request status
    await adminClient.from("ai_requests").update({ status: "completed" }).eq("id", aiRequest.id);

    // Determine risk level based on task type
    let riskLevel: "low" | "medium" | "high" = "low";
    if (["ad_copy", "email_draft"].includes(task_type)) riskLevel = "medium";
    if (["strategy", "action_plan"].includes(task_type)) riskLevel = "medium";

    // Determine initial output status based on ai_mode
    let outputStatus: "draft" | "approved" = "draft";
    if (project_id) {
      const { data: project } = await adminClient
        .from("projects")
        .select("ai_mode")
        .eq("id", project_id)
        .single();
      if (project?.ai_mode === "auto" && riskLevel === "low") {
        outputStatus = "approved";
      }
    }

    // Save AI output
    const { data: aiOutput, error: outError } = await adminClient
      .from("ai_outputs")
      .insert({
        request_id: aiRequest.id,
        user_id: user.id,
        project_id: project_id || null,
        module_name: module_name || task_type,
        title: `${task_type}: ${input_text.substring(0, 80)}`,
        output_text: outputText,
        status: outputStatus,
        risk_level: riskLevel,
      })
      .select("id, status, risk_level")
      .single();

    if (outError) throw new Error(`Failed to save output: ${outError.message}`);

    // Log success
    await adminClient.from("logs").insert({
      user_id: user.id,
      project_id: project_id || null,
      log_type: "ai_request_succeeded",
      message: `AI request completed: ${task_type}`,
      metadata_json: { request_id: aiRequest.id, output_id: aiOutput.id, risk_level: riskLevel },
    });

    // Also save to chat_history for backward compatibility
    await adminClient.from("chat_history").insert({
      user_id: user.id,
      tool_type: task_type,
      prompt: input_text,
      result: outputText,
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        request_id: aiRequest.id,
        output_id: aiOutput.id,
        output_text: outputText,
        status: aiOutput.status,
        risk_level: aiOutput.risk_level,
        task_type,
        model,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("nvb-ai-run error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
