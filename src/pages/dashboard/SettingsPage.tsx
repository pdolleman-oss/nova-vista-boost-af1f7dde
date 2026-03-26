import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, Crown } from "lucide-react";

const tiers = [
  {
    id: "starter",
    name: "Starter",
    price: "€49/mnd",
    features: ["1 platform", "Social Media tool", "2 teamleden"],
  },
  {
    id: "professional",
    name: "Professional",
    price: "€149/mnd",
    features: ["5 platforms", "Alle tools", "10 teamleden", "PDF/Word export"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "€399/mnd",
    features: ["Onbeperkt", "White-label", "API toegang", "Dedicated manager"],
  },
];

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("hobby");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

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
          .select("id, name, subscription_tier")
          .eq("id", membership.organization_id)
          .single();
        if (org) {
          setOrgId(org.id);
          setOrgName(org.name);
          setCurrentTier(org.subscription_tier || "hobby");
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

  const handleSubscribe = async (tierId: string) => {
    if (!orgId) {
      toast.error("Maak eerst een organisatie aan.");
      return;
    }
    setCheckoutLoading(tierId);
    try {
      const { data, error } = await supabase.functions.invoke("mollie-checkout", {
        body: { tier: tierId, organizationId: orgId },
      });
      if (error) throw error;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("Kon geen betaallink aanmaken.");
      }
    } catch (err: any) {
      toast.error("Betaling starten mislukt: " + (err.message || "Onbekende fout"));
    }
    setCheckoutLoading(null);
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
        <p className="text-muted-foreground mt-1">Beheer je account, organisatie en abonnement</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Abonnement
          </CardTitle>
          <CardDescription>
            Huidig plan: <span className="font-semibold text-foreground capitalize">{currentTier === "hobby" ? "Geen actief abonnement" : currentTier}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {tiers.map((tier) => {
              const isActive = currentTier === tier.id;
              return (
                <div
                  key={tier.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${isActive ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{tier.name}</p>
                      {isActive && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Actief</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{tier.price}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {tier.features.map((f) => (
                        <span key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3 text-primary" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  {!isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={checkoutLoading === tier.id}
                      onClick={() => handleSubscribe(tier.id)}
                    >
                      {checkoutLoading === tier.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upgraden"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
