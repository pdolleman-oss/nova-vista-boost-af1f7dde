import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Search, Plus, Loader2, CheckCircle, XCircle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Audit {
  id: string;
  domain: string;
  website_score: number | null;
  has_ssl: boolean | null;
  has_meta_tags: boolean | null;
  has_sitemap: boolean | null;
  is_mobile_friendly: boolean | null;
  has_blog: boolean | null;
  has_analytics: boolean | null;
  has_contact_form: boolean | null;
  has_cta: boolean | null;
  created_at: string;
  design_assessment: string | null;
}

const WebsiteAudits = () => {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [url, setUrl] = useState("");

  const loadAudits = async () => {
    const { data } = await supabase
      .from("website_audits")
      .select("id, domain, website_score, has_ssl, has_meta_tags, has_sitemap, is_mobile_friendly, has_blog, has_analytics, has_contact_form, has_cta, created_at, design_assessment")
      .order("created_at", { ascending: false })
      .limit(50);
    setAudits(data || []);
    setLoading(false);
  };

  useEffect(() => { loadAudits(); }, []);

  const handleScan = async () => {
    if (!url.trim()) { toast.error("Voer een URL in"); return; }
    setScanning(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const domain = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();

      // Check/create company
      let { data: existing } = await supabase
        .from("companies_master")
        .select("id")
        .eq("website_domain", domain)
        .maybeSingle();

      let companyId: string;
      if (existing) {
        companyId = existing.id;
      } else {
        const { data: newCo, error } = await supabase
          .from("companies_master")
          .insert({ company_name: domain, website_domain: domain, created_by: user.id })
          .select("id")
          .single();
        if (error) throw error;
        companyId = newCo.id;
      }

      // Call edge function for AI analysis
      const { data: result, error: fnError } = await supabase.functions.invoke("analyze-website", {
        body: { domain, companyId },
      });

      if (fnError) throw fnError;

      toast.success("Website analyse voltooid!");
      setUrl("");
      loadAudits();
    } catch (err: any) {
      toast.error("Scan mislukt: " + (err.message || "Onbekende fout"));
    } finally {
      setScanning(false);
    }
  };

  const Check = ({ value }: { value: boolean | null }) =>
    value ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-destructive/60" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Website Audits</h1>
          <p className="text-muted-foreground mt-1">Scan en analyseer websites van prospects</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Voer een website URL in om te scannen..."
            className="pl-10"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
          />
        </div>
        <Button onClick={handleScan} disabled={scanning}>
          {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Scannen
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : audits.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nog geen website audits. Start je eerste scan hierboven.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {audits.map((audit) => (
            <Card key={audit.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    {audit.domain}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${
                      (audit.website_score || 0) >= 70 ? "text-green-400" :
                      (audit.website_score || 0) >= 40 ? "text-accent" : "text-destructive"
                    }`}>
                      {audit.website_score || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(audit.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Check value={audit.has_ssl} /> SSL</div>
                  <div className="flex items-center gap-2"><Check value={audit.has_meta_tags} /> Meta tags</div>
                  <div className="flex items-center gap-2"><Check value={audit.has_sitemap} /> Sitemap</div>
                  <div className="flex items-center gap-2"><Check value={audit.is_mobile_friendly} /> Mobiel</div>
                  <div className="flex items-center gap-2"><Check value={audit.has_blog} /> Blog</div>
                  <div className="flex items-center gap-2"><Check value={audit.has_analytics} /> Analytics</div>
                  <div className="flex items-center gap-2"><Check value={audit.has_contact_form} /> Contactformulier</div>
                  <div className="flex items-center gap-2"><Check value={audit.has_cta} /> CTA</div>
                </div>
                {audit.design_assessment && (
                  <p className="mt-3 text-sm text-muted-foreground border-t border-border/50 pt-3">{audit.design_assessment}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WebsiteAudits;
