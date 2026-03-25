import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Loader2, Globe, Star, StarOff, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Company = Tables<"companies_master">;

const LeadFinder = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from("companies_master").select("*").order("created_at", { ascending: false }).limit(100);
    if (search.trim()) {
      query = query.or(`company_name.ilike.%${search}%,website_domain.ilike.%${search}%`);
    }

    const [companiesRes, savedRes] = await Promise.all([
      query,
      supabase.from("saved_leads").select("company_id").eq("user_id", user.id),
    ]);

    setCompanies(companiesRes.data || []);
    setSavedIds(new Set((savedRes.data || []).map((s) => s.company_id)));
    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSave = async (companyId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (savedIds.has(companyId)) {
      await supabase.from("saved_leads").delete().eq("user_id", user.id).eq("company_id", companyId);
      setSavedIds((prev) => { const n = new Set(prev); n.delete(companyId); return n; });
      toast.success("Lead verwijderd uit opgeslagen");
    } else {
      await supabase.from("saved_leads").insert({ user_id: user.id, company_id: companyId });
      setSavedIds((prev) => new Set(prev).add(companyId));
      toast.success("Lead opgeslagen!");
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error("Bedrijfsnaam is verplicht"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("companies_master").insert({
      company_name: newName,
      website_domain: newDomain || null,
      industry: newIndustry || null,
      created_by: user.id,
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Bedrijf toegevoegd!");
      setNewName(""); setNewDomain(""); setNewIndustry(""); setShowAdd(false);
      loadData();
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-accent";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leadfinder</h1>
          <p className="text-muted-foreground mt-1">Vind en analyseer potentiële klanten</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4" /> Bedrijf toevoegen
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Input placeholder="Bedrijfsnaam *" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="Website domein (optioneel)" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
            <Input placeholder="Branche (optioneel)" value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Toevoegen</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Annuleren</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op bedrijfsnaam of domein..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {search ? "Geen resultaten gevonden." : "Nog geen bedrijven. Voeg je eerste bedrijf toe."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {companies.map((c) => (
            <Card key={c.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{c.company_name}</h3>
                    {c.industry && (
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{c.industry}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {c.website_domain && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {c.website_domain}
                      </span>
                    )}
                    {c.website_score != null && (
                      <span className={getScoreColor(c.website_score)}>Score: {c.website_score}/100</span>
                    )}
                    {c.opportunity_level && c.opportunity_level !== "unknown" && (
                      <span className="capitalize">{c.opportunity_level}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="icon" onClick={() => toggleSave(c.id)} title={savedIds.has(c.id) ? "Verwijderen" : "Opslaan"}>
                    {savedIds.has(c.id) ? <Star className="w-4 h-4 text-accent fill-accent" /> : <StarOff className="w-4 h-4" />}
                  </Button>
                  {c.website_domain && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`https://${c.website_domain}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadFinder;
