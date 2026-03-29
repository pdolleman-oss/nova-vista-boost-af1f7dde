import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonRes(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getUserIdFromJwt(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const payload = JSON.parse(atob(authHeader.split(".")[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const userId = getUserIdFromJwt(req.headers.get("authorization"));
  if (!userId) return jsonRes({ success: false, error: "Unauthorized" }, 401);

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Routes: /social-health/<action>[/<id>][/<sub>]
  const action = pathParts[1] || "";
  const paramId = pathParts[2] || "";
  const subAction = pathParts[3] || "";

  try {
    // ── HEALTH CHECK ──
    if (action === "health" && req.method === "GET") {
      // Get all active connections for user + latest health check
      const { data: connections } = await supabase
        .from("social_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      const results = [];
      for (const conn of connections || []) {
        const { data: lastCheck } = await supabase
          .from("social_health_checks")
          .select("*")
          .eq("connection_id", conn.id)
          .order("checked_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: lastPublish } = await supabase
          .from("social_posts")
          .select("published_at, external_post_id")
          .eq("user_id", userId)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        results.push({
          connection: {
            id: conn.id,
            channel: conn.channel,
            page_id: conn.page_id,
            page_name: conn.page_name,
            is_test_connection: conn.is_test_connection,
            is_active: conn.is_active,
            last_validated_at: conn.last_validated_at,
            last_validation_status: conn.last_validation_status,
            last_error_message: conn.last_error_message,
          },
          last_health_check: lastCheck || null,
          last_successful_publish: lastPublish || null,
        });
      }

      return jsonRes({ success: true, data: results });
    }

    // ── RUN HEALTH CHECK for connection ──
    if (action === "check" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const connectionId = body.connection_id || paramId;

      if (!connectionId) {
        return jsonRes({ success: false, error: "connection_id is required" }, 400);
      }

      const { data: conn } = await supabase
        .from("social_connections")
        .select("*")
        .eq("id", connectionId)
        .eq("user_id", userId)
        .single();

      if (!conn) return jsonRes({ success: false, error: "Connection not found" }, 404);

      const warnings: string[] = [];
      const errors: string[] = [];
      let tokenValid = false;
      let pageConnected = false;

      // Validate token by calling /me
      try {
        const meRes = await fetch(
          `https://graph.facebook.com/v21.0/me?access_token=${conn.page_access_token}`
        );
        const meData = await meRes.json();
        if (meData.error) {
          errors.push(`Token error: ${meData.error.message}`);
          if (meData.error.code === 190) errors.push("Token expired or invalid");
        } else {
          tokenValid = true;
        }
      } catch (e) {
        errors.push(`Token validation failed: ${e.message}`);
      }

      // Validate page access
      if (tokenValid) {
        try {
          const pageRes = await fetch(
            `https://graph.facebook.com/v21.0/${conn.page_id}?fields=id,name,access_token&access_token=${conn.page_access_token}`
          );
          const pageData = await pageRes.json();
          if (pageData.error) {
            errors.push(`Page error: ${pageData.error.message}`);
          } else {
            pageConnected = true;
            if (!pageData.access_token) warnings.push("Page access token not directly available");
          }
        } catch (e) {
          errors.push(`Page validation failed: ${e.message}`);
        }
      }

      // Check permissions
      let permissionsJson: string[] = [];
      if (tokenValid) {
        try {
          const permRes = await fetch(
            `https://graph.facebook.com/v21.0/me/permissions?access_token=${conn.page_access_token}`
          );
          const permData = await permRes.json();
          if (permData.data) {
            permissionsJson = permData.data
              .filter((p: any) => p.status === "granted")
              .map((p: any) => p.permission);
            const required = ["pages_manage_posts", "pages_read_engagement"];
            for (const r of required) {
              if (!permissionsJson.includes(r)) {
                warnings.push(`Missing permission: ${r}`);
              }
            }
          }
        } catch (e) {
          warnings.push(`Could not check permissions: ${e.message}`);
        }
      }

      const status = errors.length > 0 ? "unhealthy" : warnings.length > 0 ? "degraded" : "healthy";

      // Save health check
      await supabase.from("social_health_checks").insert({
        connection_id: conn.id,
        channel: conn.channel,
        status,
        token_valid: tokenValid,
        page_connected: pageConnected,
        warnings,
        errors,
      });

      // Update connection
      await supabase.from("social_connections").update({
        permissions_json: permissionsJson,
        last_validated_at: new Date().toISOString(),
        last_validation_status: status,
        last_error_message: errors.length > 0 ? errors[0] : null,
      }).eq("id", conn.id);

      await supabase.from("logs").insert({
        user_id: userId,
        log_type: "social_health_check",
        message: `Health check ${status} for ${conn.page_name}`,
        metadata_json: { connection_id: conn.id, status, warnings, errors },
      });

      return jsonRes({
        success: true,
        data: { status, token_valid: tokenValid, page_connected: pageConnected, permissions: permissionsJson, warnings, errors },
      });
    }

    // ── TEST RUN ──
    if (action === "test-run" && req.method === "POST") {
      const body = await req.json();
      const { connection_id, project_id, post_text, cleanup } = body;

      if (!connection_id || !post_text) {
        return jsonRes({ success: false, error: "connection_id and post_text are required" }, 400);
      }

      const { data: conn } = await supabase
        .from("social_connections")
        .select("*")
        .eq("id", connection_id)
        .eq("user_id", userId)
        .single();

      if (!conn) return jsonRes({ success: false, error: "Connection not found" }, 404);

      const startedAt = new Date().toISOString();
      const warnings: string[] = [];
      const errors: string[] = [];
      let createdTestPost = false;
      let retrievedTestPost = false;
      let deletedTestPost = false;
      let externalPostId = "";
      let contentValid = false;
      let ctaDetected = false;
      let hashtagsDetected = false;

      // 1. Publish test post
      const testMessage = `[NVB TEST] ${post_text}`;
      const fbRes = await fetch(
        `https://graph.facebook.com/v21.0/${conn.page_id}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: testMessage, access_token: conn.page_access_token }),
        }
      );
      const fbData = await fbRes.json();

      if (fbData.error) {
        errors.push(`Publish failed: ${fbData.error.message}`);
      } else {
        createdTestPost = true;
        externalPostId = fbData.id;
      }

      // 2. Retrieve and validate
      if (externalPostId) {
        await new Promise((r) => setTimeout(r, 2000)); // wait for propagation
        try {
          const getRes = await fetch(
            `https://graph.facebook.com/v21.0/${externalPostId}?fields=message&access_token=${conn.page_access_token}`
          );
          const getData = await getRes.json();
          if (getData.message) {
            retrievedTestPost = true;
            contentValid = getData.message.length > 0;
            ctaDetected = /klik|bekijk|ontdek|lees|bestel|download|koop|probeer|start/i.test(getData.message);
            hashtagsDetected = /#\w+/.test(getData.message);
          } else {
            warnings.push("Post retrieved but message was empty");
          }
        } catch (e) {
          warnings.push(`Could not retrieve test post: ${e.message}`);
        }
      }

      // 3. Cleanup
      if (cleanup && externalPostId) {
        try {
          await fetch(
            `https://graph.facebook.com/v21.0/${externalPostId}?access_token=${conn.page_access_token}`,
            { method: "DELETE" }
          );
          deletedTestPost = true;
        } catch (e) {
          warnings.push(`Cleanup failed: ${e.message}`);
        }
      }

      const status = errors.length > 0 ? "failed" : "success";

      // Save test run
      const { data: testRun } = await supabase.from("social_test_runs").insert({
        project_id: project_id || null,
        connection_id: conn.id,
        channel: conn.channel,
        initiated_by_user_id: userId,
        test_type: "publish_and_validate",
        request_payload: { post_text: testMessage, cleanup },
        response_payload: fbData,
        status,
        created_test_post: createdTestPost,
        retrieved_test_post: retrievedTestPost,
        deleted_test_post: deletedTestPost,
        external_post_id: externalPostId,
        summary: `Test ${status}: published=${createdTestPost}, retrieved=${retrievedTestPost}, valid=${contentValid}`,
        warnings,
        errors,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      }).select().single();

      // Save health check from test
      await supabase.from("social_health_checks").insert({
        project_id: project_id || null,
        connection_id: conn.id,
        channel: conn.channel,
        mode: "test",
        status,
        token_valid: createdTestPost,
        page_connected: createdTestPost,
        publish_test_success: createdTestPost,
        retrievable: retrievedTestPost,
        content_valid: contentValid,
        cta_detected: ctaDetected,
        hashtags_detected: hashtagsDetected,
        external_post_id: externalPostId,
        warnings,
        errors,
      });

      await supabase.from("logs").insert({
        user_id: userId,
        log_type: "social_test_run",
        message: `Test run ${status} on ${conn.page_name}`,
        metadata_json: { test_run_id: testRun?.id, status, external_post_id: externalPostId },
      });

      return jsonRes({ success: true, data: testRun });
    }

    // ── GET TEST RUN HISTORY ──
    if (action === "test-runs" && req.method === "GET") {
      const { data } = await supabase
        .from("social_test_runs")
        .select("*")
        .eq("initiated_by_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      return jsonRes({ success: true, data: data || [] });
    }

    // ── DELETE TEST POST ──
    if (action === "delete-test-post" && req.method === "POST") {
      const { external_post_id, connection_id } = await req.json();
      if (!external_post_id || !connection_id) {
        return jsonRes({ success: false, error: "external_post_id and connection_id required" }, 400);
      }

      const { data: conn } = await supabase
        .from("social_connections")
        .select("page_access_token")
        .eq("id", connection_id)
        .eq("user_id", userId)
        .single();

      if (!conn) return jsonRes({ success: false, error: "Connection not found" }, 404);

      const delRes = await fetch(
        `https://graph.facebook.com/v21.0/${external_post_id}?access_token=${conn.page_access_token}`,
        { method: "DELETE" }
      );
      const delData = await delRes.json();

      if (delData.error) {
        return jsonRes({ success: false, error: delData.error.message }, 400);
      }

      return jsonRes({ success: true, data: { deleted: true } });
    }

    // ── CONNECTIONS: set test ──
    if (action === "set-test-connection" && req.method === "POST") {
      const { connection_id, is_test } = await req.json();
      const { error } = await supabase
        .from("social_connections")
        .update({ is_test_connection: is_test ?? true })
        .eq("id", connection_id)
        .eq("user_id", userId);

      if (error) return jsonRes({ success: false, error: error.message }, 400);
      return jsonRes({ success: true });
    }

    return jsonRes({ success: false, error: "Not found" }, 404);
  } catch (err) {
    console.error("Social health error:", err);
    return jsonRes({ success: false, error: err.message || "Internal error" }, 500);
  }
});
