import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Loader2, Phone, Mail, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const stages = [
  { key: "nieuw", label: "Nieuw" },
  { key: "contact_gelegd", label: "Contact gelegd" },
  { key: "offerte_verstuurd", label: "Offerte verstuurd" },
  { key: "gewonnen", label: "Gewonnen" },
  { key: "verloren", label: "Verloren" },
];

interface PipelineLead {
  id: string;
  company_id: string;
  status: string;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  won_value: number | null;
  company_name?: string;
}

const Pipeline = () => {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: pipelineData } = await supabase
      .from("lead_pipeline")
      .select("id, company_id, status, contact_person, contact_email, contact_phone, notes, won_value")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (pipelineData && pipelineData.length > 0) {
      const companyIds = [...new Set(pipelineData.map((p) => p.company_id))];
      const { data: companyData } = await supabase
        .from("companies_master")
        .select("id, company_name")
        .in("id", companyIds);

      const companyMap = new Map((companyData || []).map((c) => [c.id, c.company_name]));
      setLeads(pipelineData.map((p) => ({ ...p, company_name: companyMap.get(p.company_id) || "Onbekend" })));
    } else {
      setLeads([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const moveToStage = async (leadId: string, newStatus: string) => {
    const { error } = await supabase
      .from("lead_pipeline")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", leadId);

    if (error) toast.error(error.message);
    else {
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
      toast.success(`Verplaatst naar ${stages.find((s) => s.key === newStatus)?.label}`);
    }
  };

  const openAdd = async () => {
    const { data } = await supabase.from("companies_master").select("id, company_name").order("company_name").limit(200);
    setCompanies(data || []);
    setShowAdd(true);
  };

  const handleAdd = async () => {
    if (!selectedCompany) { toast.error("Selecteer een bedrijf"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("lead_pipeline").insert({
      company_id: selectedCompany,
      user_id: user.id,
      contact_person: contactPerson || null,
      status: "nieuw",
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Lead toegevoegd aan pipeline!");
      setShowAdd(false); setSelectedCompany(""); setContactPerson("");
      loadData();
    }
  };

  const getLeadsByStage = (stageKey: string) => leads.filter((l) => l.status === stageKey);

  const nextStage = (current: string) => {
    const idx = stages.findIndex((s) => s.key === current);
    return idx < stages.length - 1 ? stages[idx + 1].key : null;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground mt-1">Beheer je sales pipeline</p>
        </div>
        <Button className="gap-2" onClick={openAdd}><Plus className="w-4 h-4" /> Lead toevoegen</Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <option value="">Selecteer bedrijf...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
            <Input placeholder="Contactpersoon (optioneel)" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Toevoegen</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Annuleren</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.key);
          return (
            <Card key={stage.key} className="min-h-[300px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {stage.label}
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                    {stageLeads.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stageLeads.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Geen leads</p>
                ) : (
                  stageLeads.map((lead) => (
                    <div key={lead.id} className="p-3 rounded-lg bg-secondary/50 border border-border/50 space-y-1">
                      <p className="font-medium text-sm truncate">{lead.company_name}</p>
                      {lead.contact_person && (
                        <p className="text-xs text-muted-foreground truncate">{lead.contact_person}</p>
                      )}
                      {lead.won_value != null && stage.key === "gewonnen" && (
                        <p className="text-xs text-green-400">€{lead.won_value.toLocaleString("nl-NL")}</p>
                      )}
                      {nextStage(stage.key) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-1 h-7 text-xs gap-1"
                          onClick={() => moveToStage(lead.id, nextStage(stage.key)!)}
                        >
                          Naar {stages.find((s) => s.key === nextStage(stage.key))?.label}
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Pipeline;
