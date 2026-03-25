import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile) setFullName(profile.full_name || "");

      // Check org membership
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
          .select("id, name")
          .eq("id", membership.organization_id)
          .single();
        if (org) {
          setOrgId(org.id);
          setOrgName(org.name);
        }
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) toast.error("Opslaan mislukt: " + error.message);
    else toast.success("Profiel opgeslagen!");
    setSaving(false);
  };

  const handleSaveOrg = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (orgId) {
      const { error } = await supabase
        .from("organizations")
        .update({ name: orgName, updated_at: new Date().toISOString() })
        .eq("id", orgId);
      if (error) toast.error("Opslaan mislukt: " + error.message);
      else toast.success("Organisatie opgeslagen!");
    } else {
      const { data, error } = await supabase
        .from("organizations")
        .insert({ name: orgName, owner_id: user.id })
        .select()
        .single();
      if (error) toast.error("Aanmaken mislukt: " + error.message);
      else {
        setOrgId(data.id);
        await supabase.from("organization_members").insert({
          organization_id: data.id,
          user_id: user.id,
          status: "active",
        });
        toast.success("Organisatie aangemaakt!");
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer je account en organisatie</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profiel</CardTitle>
          <CardDescription>Beheer je persoonlijke gegevens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Volledige naam</label>
            <Input
              placeholder="Je naam"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">E-mailadres</label>
            <Input value={email} disabled />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Opslaan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organisatie</CardTitle>
          <CardDescription>Beheer je team en organisatie</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Organisatienaam</label>
            <Input
              placeholder="Naam van je organisatie"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveOrg} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {orgId ? "Opslaan" : "Organisatie aanmaken"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
