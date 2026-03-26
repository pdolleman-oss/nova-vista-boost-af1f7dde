import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield, ShieldCheck, UserCog, Crown, Users } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface ManagedUser {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  roles: string[];
  organization: { id: string; name: string; tier: string } | null;
}

const ROLE_LABELS: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: "Admin", icon: ShieldCheck, color: "bg-destructive text-destructive-foreground" },
  client_owner: { label: "Eigenaar", icon: Crown, color: "bg-primary text-primary-foreground" },
  client_member: { label: "Teamlid", icon: Users, color: "bg-secondary text-secondary-foreground" },
};

const TIERS = ["hobby", "starter", "professional", "enterprise"];

const UserManagement = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "list" },
    });
    if (error) { toast.error("Kon gebruikers niet laden"); return; }
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!roleLoading && isAdmin) fetchUsers();
    else if (!roleLoading) setLoading(false);
  }, [roleLoading, isAdmin]);

  const toggleRole = async (userId: string, role: string, currentlyHas: boolean) => {
    setActionLoading(`${userId}-${role}`);
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action: "set_role", userId, role, remove: currentlyHas },
    });
    if (error) toast.error("Rol wijzigen mislukt");
    else { toast.success(`Rol ${currentlyHas ? "verwijderd" : "toegewezen"}`); await fetchUsers(); }
    setActionLoading(null);
  };

  const setTier = async (orgId: string, tier: string) => {
    setActionLoading(`tier-${orgId}`);
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action: "set_tier", organizationId: orgId, tier },
    });
    if (error) toast.error("Tier wijzigen mislukt");
    else { toast.success("Abonnement bijgewerkt"); await fetchUsers(); }
    setActionLoading(null);
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold">Geen toegang</h2>
            <p className="text-sm text-muted-foreground">Alleen beheerders kunnen gebruikers beheren.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserCog className="w-8 h-8" /> Gebruikersbeheer
        </h1>
        <p className="text-muted-foreground mt-1">
          Beheer rollen en abonnementen van alle gebruikers ({users.length})
        </p>
      </div>

      <div className="space-y-4">
        {users.map((u) => (
          <Card key={u.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{u.full_name || "Geen naam"}</CardTitle>
                  <CardDescription>{u.email}</CardDescription>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {u.roles.map((r) => {
                    const cfg = ROLE_LABELS[r] || { label: r, color: "bg-muted text-muted-foreground" };
                    return (
                      <span key={r} className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    );
                  })}
                  {u.roles.length === 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Geen rol</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Role toggles */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Rollen toewijzen/verwijderen:</p>
                <div className="flex flex-wrap gap-2">
                  {(["admin", "client_owner", "client_member"] as const).map((role) => {
                    const has = u.roles.includes(role);
                    const cfg = ROLE_LABELS[role];
                    const Icon = cfg.icon;
                    const isLoading = actionLoading === `${u.id}-${role}`;
                    return (
                      <Button
                        key={role}
                        size="sm"
                        variant={has ? "default" : "outline"}
                        className="text-xs"
                        disabled={isLoading}
                        onClick={() => toggleRole(u.id, role, has)}
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Icon className="w-3 h-3 mr-1" />}
                        {cfg.label} {has ? "✓" : ""}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Tier management for users with organizations */}
              {u.organization && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Organisatie: {u.organization.name} — Huidig plan: <span className="capitalize font-semibold">{u.organization.tier}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TIERS.map((tier) => {
                      const isActive = u.organization?.tier === tier;
                      const isLoading = actionLoading === `tier-${u.organization?.id}`;
                      return (
                        <Button
                          key={tier}
                          size="sm"
                          variant={isActive ? "default" : "outline"}
                          className="text-xs capitalize"
                          disabled={isActive || isLoading}
                          onClick={() => u.organization && setTier(u.organization.id, tier)}
                        >
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                          {tier === "hobby" ? "Gratis" : tier}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
