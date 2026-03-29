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
  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Find scheduled outputs ready for publish
    const { data: outputs, error: fetchErr } = await admin
      .from("content_outputs")
      .select("*")
      .eq("status", "scheduled")
      .eq("approval_status", "approved")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(50);

    if (fetchErr) throw fetchErr;
    if (!outputs || outputs.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0, message: "No scheduled outputs to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ output_id: string; status: string; error?: string }> = [];

    for (const output of outputs) {
      // ── Duplicate guard ──
      if (output.external_post_id && output.external_post_id.trim() !== "") {
        await admin.from("content_outputs").update({ status: "failed", last_publish_error: "Duplicate publish blocked: external_post_id already exists" }).eq("id", output.id);
        await admin.from("logs").insert({ user_id: output.user_id, project_id: output.project_id, log_type: "duplicate_publish_blocked", message: `Scheduled publish blocked: duplicate for output ${output.id}`, metadata_json: { output_id: output.id } });
        results.push({ output_id: output.id, status: "blocked_duplicate" });
        continue;
      }

      const channel = (output.publish_channel || "").toLowerCase();

      if (channel === "facebook") {
        // Get active connection for the user
        const { data: conn } = await admin
          .from("social_connections")
          .select("*")
          .eq("user_id", output.user_id)
          .eq("channel", "facebook")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (!conn) {
          await admin.from("content_outputs").update({
            status: "failed",
            last_publish_error: "Geen actieve Facebook-koppeling gevonden",
            last_publish_attempt_at: new Date().toISOString(),
          }).eq("id", output.id);
          await admin.from("logs").insert({ user_id: output.user_id, project_id: output.project_id, log_type: "scheduled_publish_failed", message: `No Facebook connection for scheduled output ${output.id}`, metadata_json: { output_id: output.id } });
          results.push({ output_id: output.id, status: "failed", error: "No Facebook connection" });

          // Notify user
          await admin.from("notifications").insert({
            user_id: output.user_id,
            title: "Geplande publicatie mislukt",
            message: `"${output.title || "Content"}" kon niet gepubliceerd worden: geen actieve Facebook-koppeling.`,
            type: "warning",
            link: "/dashboard/content/overview",
          });
          continue;
        }

        // Build post text
        let postText = output.body || "";
        if (output.cta_text) postText += `\n\n${output.cta_text}`;
        if (output.hashtags?.length > 0) {
          postText += `\n\n${output.hashtags.map((h: string) => h.startsWith("#") ? h : `#${h}`).join(" ")}`;
        }

        await admin.from("content_outputs").update({ last_publish_attempt_at: new Date().toISOString() }).eq("id", output.id);

        // Publish to Facebook
        const fbRes = await fetch(`https://graph.facebook.com/v21.0/${conn.page_id}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: postText, access_token: conn.page_access_token }),
        });
        const fbData = await fbRes.json();

        if (fbData.error) {
          const errorMsg = fbData.error.message || "Unknown Facebook error";
          await admin.from("content_outputs").update({
            status: "failed",
            last_publish_error: errorMsg,
          }).eq("id", output.id);
          await admin.from("content_requests").update({ status: "failed" }).eq("id", output.content_request_id);
          await admin.from("logs").insert({ user_id: output.user_id, project_id: output.project_id, log_type: "scheduled_publish_failed", message: `Scheduled publish failed: ${errorMsg}`, metadata_json: { output_id: output.id, fb_error: fbData.error } });

          await admin.from("notifications").insert({
            user_id: output.user_id,
            title: "Geplande publicatie mislukt",
            message: `"${output.title || "Content"}" kon niet gepubliceerd worden: ${errorMsg}`,
            type: "warning",
            link: "/dashboard/content/overview",
          });
          results.push({ output_id: output.id, status: "failed", error: errorMsg });
          continue;
        }

        // Success - update output, create social_posts record
        await admin.from("content_outputs").update({
          status: "published",
          published_at: new Date().toISOString(),
          external_post_id: fbData.id,
          publish_mode: "scheduled",
        }).eq("id", output.id);

        await admin.from("content_requests").update({ status: "published" }).eq("id", output.content_request_id);

        await admin.from("social_posts").insert({
          user_id: output.user_id,
          project_id: output.project_id,
          channel: "facebook",
          title: output.title || "",
          post_text: postText,
          status: "published",
          external_post_id: fbData.id,
          published_at: new Date().toISOString(),
          content_output_id: output.id,
          connection_id: conn.id,
          mode: "scheduled",
        });

        await admin.from("logs").insert({ user_id: output.user_id, project_id: output.project_id, log_type: "scheduled_publish_success", message: `Scheduled publish successful: ${output.title} -> ${fbData.id}`, metadata_json: { output_id: output.id, external_post_id: fbData.id } });

        await admin.from("notifications").insert({
          user_id: output.user_id,
          title: "Content gepubliceerd",
          message: `"${output.title || "Content"}" is succesvol gepubliceerd op Facebook.`,
          type: "success",
          link: "/dashboard/content/overview",
        });

        results.push({ output_id: output.id, status: "published" });
      } else {
        // Non-social: mark as published
        await admin.from("content_outputs").update({
          status: "published",
          published_at: new Date().toISOString(),
          publish_mode: "scheduled",
        }).eq("id", output.id);
        await admin.from("content_requests").update({ status: "published" }).eq("id", output.content_request_id);
        results.push({ output_id: output.id, status: "published" });
      }
    }

    console.log(`Scheduled publish completed: ${results.length} outputs processed`);
    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Scheduled publish error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
