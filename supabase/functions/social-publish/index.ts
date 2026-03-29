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

/** Extract user_id from JWT without calling auth.getUser (see memory) */
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
  if (!userId) {
    return jsonRes({ success: false, error: "Unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Routes: /social-publish/connect, /social-publish/status,
  //         /social-publish/posts, /social-publish/posts/:id,
  //         /social-publish/posts/:id/publish
  const action = pathParts[1] || "";

  try {
    // ── Facebook Connect: exchange short-lived token for page token ──
    if (action === "connect" && req.method === "POST") {
      const { user_access_token, page_id } = await req.json();
      if (!user_access_token) {
        return jsonRes({ success: false, error: "user_access_token is required" }, 400);
      }

      // Get long-lived user token
      const metaAppId = Deno.env.get("META_APP_ID");
      const metaAppSecret = Deno.env.get("META_APP_SECRET");
      if (!metaAppId || !metaAppSecret) {
        return jsonRes({ success: false, error: "Meta app credentials not configured" }, 500);
      }

      const llRes = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${user_access_token}`
      );
      const llData = await llRes.json();
      if (llData.error) {
        return jsonRes({ success: false, error: llData.error.message }, 400);
      }
      const longLivedToken = llData.access_token;

      // Get pages the user manages
      const pagesRes = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedToken}`
      );
      const pagesData = await pagesRes.json();
      if (pagesData.error) {
        return jsonRes({ success: false, error: pagesData.error.message }, 400);
      }

      const pages = pagesData.data || [];
      if (pages.length === 0) {
        return jsonRes({ success: false, error: "No Facebook Pages found for this account" }, 400);
      }

      // If page_id specified, find that page; otherwise use first
      const selectedPage = page_id
        ? pages.find((p: any) => p.id === page_id)
        : pages[0];

      if (!selectedPage) {
        return jsonRes({ success: false, error: "Specified page not found", pages: pages.map((p: any) => ({ id: p.id, name: p.name })) }, 400);
      }

      // Upsert connection
      const { error: upsertErr } = await supabase
        .from("social_connections")
        .upsert({
          user_id: userId,
          channel: "facebook",
          page_id: selectedPage.id,
          page_name: selectedPage.name,
          page_access_token: selectedPage.access_token,
          is_active: true,
          connected_at: new Date().toISOString(),
        }, { onConflict: "user_id,channel,page_id" });

      if (upsertErr) {
        return jsonRes({ success: false, error: upsertErr.message }, 500);
      }

      // Log
      await supabase.from("logs").insert({
        user_id: userId,
        log_type: "social_connect",
        message: `Facebook Page connected: ${selectedPage.name} (${selectedPage.id})`,
      });

      return jsonRes({
        success: true,
        data: { page_id: selectedPage.id, page_name: selectedPage.name },
      });
    }

    // ── Connection status ──
    if (action === "status" && req.method === "GET") {
      const { data: connections } = await supabase
        .from("social_connections")
        .select("id, channel, page_id, page_name, connected_at, is_active")
        .eq("user_id", userId)
        .eq("is_active", true);

      return jsonRes({ success: true, data: connections || [] });
    }

    // ── Posts CRUD ──
    if (action === "posts") {
      const postId = pathParts[2];
      const subAction = pathParts[3];

      // POST /posts/:id/publish
      if (postId && subAction === "publish" && req.method === "POST") {
        // Get the post
        const { data: post, error: postErr } = await supabase
          .from("social_posts")
          .select("*")
          .eq("id", postId)
          .eq("user_id", userId)
          .single();

        if (postErr || !post) {
          return jsonRes({ success: false, error: "Post not found" }, 404);
        }

        if (post.status === "published") {
          return jsonRes({ success: false, error: "Post already published" }, 400);
        }

        // Get active connection for this channel
        const { data: conn } = await supabase
          .from("social_connections")
          .select("*")
          .eq("user_id", userId)
          .eq("channel", post.channel)
          .eq("is_active", true)
          .limit(1)
          .single();

        if (!conn) {
          return jsonRes({ success: false, error: "No active Facebook connection found. Connect your page first." }, 400);
        }

        // Log attempt
        await supabase.from("logs").insert({
          user_id: userId,
          log_type: "social_publish_attempt",
          message: `Publishing post ${postId} to Facebook Page ${conn.page_name}`,
          metadata_json: { post_id: postId, page_id: conn.page_id },
        });

        // Publish to Facebook Graph API
        const fbBody: Record<string, string> = { message: post.post_text };
        if (post.media_url) fbBody.link = post.media_url;

        const fbRes = await fetch(
          `https://graph.facebook.com/v21.0/${conn.page_id}/feed`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...fbBody,
              access_token: conn.page_access_token,
            }),
          }
        );
        const fbData = await fbRes.json();

        if (fbData.error) {
          // Update post as failed
          await supabase.from("social_posts").update({
            status: "failed",
            error_message: fbData.error.message,
          }).eq("id", postId);

          await supabase.from("logs").insert({
            user_id: userId,
            log_type: "social_publish_failed",
            message: `Publish failed: ${fbData.error.message}`,
            metadata_json: { post_id: postId, fb_error: fbData.error },
          });

          return jsonRes({ success: false, error: fbData.error.message }, 400);
        }

        // Success
        await supabase.from("social_posts").update({
          status: "published",
          external_post_id: fbData.id,
          published_at: new Date().toISOString(),
        }).eq("id", postId);

        await supabase.from("logs").insert({
          user_id: userId,
          log_type: "social_publish_success",
          message: `Post ${postId} published to Facebook as ${fbData.id}`,
          metadata_json: { post_id: postId, external_post_id: fbData.id },
        });

        return jsonRes({
          success: true,
          data: { external_post_id: fbData.id, status: "published" },
        });
      }

      // GET /posts/:id
      if (postId && req.method === "GET") {
        const { data, error } = await supabase
          .from("social_posts")
          .select("*")
          .eq("id", postId)
          .eq("user_id", userId)
          .single();

        if (error) return jsonRes({ success: false, error: error.message }, 404);
        return jsonRes({ success: true, data });
      }

      // PATCH /posts/:id
      if (postId && req.method === "PATCH") {
        const updates = await req.json();
        const allowedFields = ["title", "post_text", "media_url", "status"];
        const filtered: Record<string, unknown> = {};
        for (const key of allowedFields) {
          if (key in updates) filtered[key] = updates[key];
        }

        const { data, error } = await supabase
          .from("social_posts")
          .update(filtered)
          .eq("id", postId)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) return jsonRes({ success: false, error: error.message }, 400);
        return jsonRes({ success: true, data });
      }

      // POST /posts (create)
      if (!postId && req.method === "POST") {
        const body = await req.json();
        const { project_id, channel, title, post_text, media_url } = body;
        if (!post_text) {
          return jsonRes({ success: false, error: "post_text is required" }, 400);
        }

        const { data, error } = await supabase
          .from("social_posts")
          .insert({
            user_id: userId,
            project_id: project_id || null,
            channel: channel || "facebook",
            title: title || "",
            post_text,
            media_url: media_url || null,
            status: "draft",
          })
          .select()
          .single();

        if (error) return jsonRes({ success: false, error: error.message }, 500);
        return jsonRes({ success: true, data }, 201);
      }

      // GET /posts (list)
      if (!postId && req.method === "GET") {
        const status = url.searchParams.get("status");
        let query = supabase
          .from("social_posts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (status) query = query.eq("status", status);

        const { data, error } = await query;
        if (error) return jsonRes({ success: false, error: error.message }, 500);
        return jsonRes({ success: true, data });
      }
    }

    return jsonRes({ success: false, error: "Not found" }, 404);
  } catch (err) {
    console.error("Social publish error:", err);
    return jsonRes({ success: false, error: err.message || "Internal error" }, 500);
  }
});
