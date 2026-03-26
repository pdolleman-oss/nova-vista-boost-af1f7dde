import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Verify caller is admin
  const authHeader = req.headers.get("authorization") || "";
  const anonClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { authorization: authHeader } },
  });
  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Check admin role
  const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", user.id);
  const isAdmin = (roles || []).some((r: any) => r.role === "admin");
  if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

  const { action, ...body } = await req.json();

  if (action === "list") {
    // Get all profiles with their roles
    const { data: profiles } = await adminClient.from("profiles").select("id, email, full_name, created_at");
    const { data: allRoles } = await adminClient.from("user_roles").select("user_id, role");
    const { data: memberships } = await adminClient.from("organization_members").select("user_id, organization_id, status");
    const { data: orgs } = await adminClient.from("organizations").select("id, name, subscription_tier");

    const users = (profiles || []).map((p: any) => {
      const userRoles = (allRoles || []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role);
      const membership = (memberships || []).find((m: any) => m.user_id === p.id && m.status === "active");
      const org = membership ? (orgs || []).find((o: any) => o.id === membership.organization_id) : null;
      return {
        ...p,
        roles: userRoles,
        organization: org ? { id: org.id, name: org.name, tier: org.subscription_tier } : null,
      };
    });

    return new Response(JSON.stringify({ users }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "set_role") {
    const { userId, role, remove } = body;
    if (!userId || !role) return new Response(JSON.stringify({ error: "Missing userId or role" }), { status: 400, headers: corsHeaders });

    if (remove) {
      await adminClient.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    } else {
      await adminClient.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
    }
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "set_tier") {
    const { organizationId, tier } = body;
    if (!organizationId || !tier) return new Response(JSON.stringify({ error: "Missing params" }), { status: 400, headers: corsHeaders });

    await adminClient.from("organizations").update({ subscription_tier: tier }).eq("id", organizationId);
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
});
