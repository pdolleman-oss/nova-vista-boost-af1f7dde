import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "client_owner" | "client_member";

interface UserRoleInfo {
  roles: AppRole[];
  isAdmin: boolean;
  isOwner: boolean;
  hasFreeAccess: boolean;
  subscriptionTier: string;
  loading: boolean;
  userId: string | null;
}

export function useUserRole(): UserRoleInfo {
  const [state, setState] = useState<UserRoleInfo>({
    roles: [],
    isAdmin: false,
    isOwner: false,
    hasFreeAccess: false,
    subscriptionTier: "hobby",
    loading: true,
    userId: null,
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState(s => ({ ...s, loading: false })); return; }

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const userRoles = (roles || []).map(r => r.role) as AppRole[];
      const isAdmin = userRoles.includes("admin");
      const isOwner = userRoles.includes("client_owner");

      // Get org subscription tier
      let tier = "hobby";
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (membership) {
        const { data: org } = await supabase
          .from("organizations")
          .select("subscription_tier")
          .eq("id", membership.organization_id)
          .single();
        if (org) tier = org.subscription_tier;
      }

      // Admins and owners always have free access
      const hasFreeAccess = isAdmin || isOwner;

      setState({
        roles: userRoles,
        isAdmin,
        isOwner,
        hasFreeAccess,
        subscriptionTier: tier,
        loading: false,
        userId: user.id,
      });
    };
    load();
  }, []);

  return state;
}
