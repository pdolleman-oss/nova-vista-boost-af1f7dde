import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get ALL active connections across all users
  const { data: connections, error: connErr } = await supabase
    .from("social_connections")
    .select("*")
    .eq("is_active", true);

  if (connErr || !connections) {
    console.error("Failed to fetch connections:", connErr);
    return new Response(JSON.stringify({ success: false, error: connErr?.message }), { status: 500 });
  }

  const results: { connectionId: string; userId: string; status: string; issues: string[] }[] = [];

  for (const conn of connections) {
    const warnings: string[] = [];
    const errors: string[] = [];
    let tokenValid = false;
    let pageConnected = false;

    // Validate token
    try {
      const meRes = await fetch(
        `https://graph.facebook.com/v21.0/me?access_token=${conn.page_access_token}`
      );
      const meData = await meRes.json();
      if (meData.error) {
        errors.push(`Token error: ${meData.error.message}`);
        if (meData.error.code === 190) errors.push("Token verlopen of ongeldig");
      } else {
        tokenValid = true;
      }
    } catch (e) {
      errors.push(`Token validatie mislukt: ${e.message}`);
    }

    // Validate page access
    if (tokenValid) {
      try {
        const pageRes = await fetch(
          `https://graph.facebook.com/v21.0/${conn.page_id}?fields=id,name&access_token=${conn.page_access_token}`
        );
        const pageData = await pageRes.json();
        if (pageData.error) {
          errors.push(`Pagina error: ${pageData.error.message}`);
        } else {
          pageConnected = true;
        }
      } catch (e) {
        errors.push(`Pagina validatie mislukt: ${e.message}`);
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
              warnings.push(`Ontbrekende permissie: ${r}`);
            }
          }
        }
      } catch (e) {
        warnings.push(`Kan permissies niet controleren: ${e.message}`);
      }
    }

    const status = errors.length > 0 ? "unhealthy" : warnings.length > 0 ? "degraded" : "healthy";

    // Save health check
    await supabase.from("social_health_checks").insert({
      connection_id: conn.id,
      channel: conn.channel,
      mode: "scheduled",
      status,
      token_valid: tokenValid,
      page_connected: pageConnected,
      warnings,
      errors,
    });

    // Update connection status
    await supabase.from("social_connections").update({
      permissions_json: permissionsJson.length > 0 ? permissionsJson : conn.permissions_json,
      last_validated_at: new Date().toISOString(),
      last_validation_status: status,
      last_error_message: errors.length > 0 ? errors[0] : null,
    }).eq("id", conn.id);

    // Send notification if unhealthy or degraded
    if (status !== "healthy") {
      const allIssues = [...errors, ...warnings];
      const message = allIssues.length === 1
        ? allIssues[0]
        : `${allIssues.length} problemen gevonden: ${allIssues.slice(0, 2).join(", ")}${allIssues.length > 2 ? "..." : ""}`;

      await supabase.from("notifications").insert({
        user_id: conn.user_id,
        title: `⚠️ Social Health: ${conn.page_name || conn.channel}`,
        message,
        type: "social_health",
        link: "/dashboard/social/health",
      });
    }

    // Log
    await supabase.from("logs").insert({
      user_id: conn.user_id,
      log_type: "social_health_cron",
      message: `Scheduled health check ${status} for ${conn.page_name}`,
      metadata_json: { connection_id: conn.id, status, warnings, errors },
    });

    results.push({ connectionId: conn.id, userId: conn.user_id, status, issues: [...errors, ...warnings] });
  }

  console.log(`Health check completed: ${results.length} connections checked`);

  return new Response(JSON.stringify({ success: true, checked: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
