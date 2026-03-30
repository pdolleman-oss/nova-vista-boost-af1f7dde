import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, BarChart3, TrendingUp, Loader2, Clock, ArrowRight, CheckCircle2, CalendarClock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RecentLead {
  id: string;
  status: string;
  company_name: string;
  updated_at: string;
}

interface ContentItem {
  id: string;
  title: string;
  status: string;
  publish_channel: string;
  scheduled_at: string | null;
  published_at: string | null;
  updated_at: string | null;
  last_publish_error: string | null;
}

const DashboardHome = () => {
  const [stats, setStats] = useState({ leads: 0, audits: 0, pipeline: 0, won: 0 });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [contentItems, setContentItems] = useState<{ published: ContentItem[]; scheduled: ContentItem[]; failed: ContentItem[] }>({ published: [], scheduled: [], failed: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [companiesRes, auditsRes, pipelineRes, wonRes, recentRes] = await Promise.all([
        supabase.from("companies_master").select("id", { count: "exact", head: true }),
        supabase.from("website_audits").select("id", { count: "exact", head: true }),
        supabase.from("lead_pipeline").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("lead_pipeline").select("won_value").eq("user_id", user.id).eq("status", "gewonnen"),
        supabase.from("lead_pipeline")
          .select("id, status, company_id, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(5),
      ]);

      const wonTotal = (wonRes.data || []).reduce((sum, r) => sum + (Number(r.won_value) || 0), 0);

      // Resolve company names for recent leads
      const recentData = recentRes.data || [];
      let resolvedLeads: RecentLead[] = [];
      if (recentData.length > 0) {
        const companyIds = [...new Set(recentData.map(r => r.company_id))];
        const { data: companies } = await supabase
          .from("companies_master")
          .select("id, company_name")
          .in("id", companyIds);
        const map = new Map((companies || []).map(c => [c.id, c.company_name]));
        resolvedLeads = recentData.map(r => ({
          id: r.id,
          status: r.status,
          company_name: map.get(r.company_id) || "Onbekend",
          updated_at: r.updated_at,
        }));
      }

      setStats({
        leads: companiesRes.count || 0,
        audits: auditsRes.count || 0,
        pipeline: pipelineRes.count || 0,
        won: wonTotal,
      });
      setRecentLeads(resolvedLeads);
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { icon: Users, label: "Leads in database", value: stats.leads.toString(), link: "/dashboard/leads" },
    { icon: Globe, label: "Website Audits", value: stats.audits.toString(), link: "/dashboard/audits" },
    { icon: BarChart3, label: "In pipeline", value: stats.pipeline.toString(), link: "/dashboard/pipeline" },
    { icon: TrendingUp, label: "Gewonnen waarde", value: `€${stats.won.toLocaleString("nl-NL")}`, link: "/dashboard/pipeline" },
  ];

  const statusLabels: Record<string, string> = {
    nieuw: "Nieuw",
    contact_gelegd: "Contact gelegd",
    offerte_verstuurd: "Offerte verstuurd",
    gewonnen: "Gewonnen",
    verloren: "Verloren",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welkom terug bij Nova Vista Boost</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <Card
                key={s.label}
                className="hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => navigate(s.link)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <s.icon className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent pipeline activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recente pipeline activiteit</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/pipeline")} className="gap-1 text-xs">
                Bekijk alles <ArrowRight className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentLeads.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Nog geen pipeline activiteit.</p>
                  <Button size="sm" onClick={() => navigate("/dashboard/leads")}>
                    Ga naar Leadfinder
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLeads.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div>
                        <p className="font-medium text-sm">{lead.company_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(lead.updated_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        lead.status === "gewonnen" ? "bg-green-500/20 text-green-400" :
                        lead.status === "verloren" ? "bg-destructive/20 text-destructive" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {statusLabels[lead.status] || lead.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate("/dashboard/leads")}>
              <CardContent className="flex items-center gap-3 py-4">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">Leads zoeken</span>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate("/dashboard/audits")}>
              <CardContent className="flex items-center gap-3 py-4">
                <Globe className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">Website scannen</span>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate("/dashboard/ai-tools")}>
              <CardContent className="flex items-center gap-3 py-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">AI Content maken</span>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHome;
