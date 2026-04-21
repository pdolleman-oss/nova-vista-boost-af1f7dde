import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, BarChart3, TrendingUp, Loader2, Clock, ArrowRight, CheckCircle2, CalendarClock, AlertTriangle, Wifi, XCircle, Activity } from "lucide-react";
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

interface SocialHealthItem {
  id: string;
  channel: string;
  page_name: string;
  is_active: boolean;
  is_test_connection: boolean;
  last_validated_at: string | null;
  last_validation_status: string | null;
  last_error_message: string | null;
  last_check_status: string | null;
  last_check_at: string | null;
}

const DashboardHome = () => {
  const [stats, setStats] = useState({ leads: 0, audits: 0, pipeline: 0, won: 0 });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [contentItems, setContentItems] = useState<{ published: ContentItem[]; scheduled: ContentItem[]; failed: ContentItem[] }>({ published: [], scheduled: [], failed: [] });
  const [socialHealth, setSocialHealth] = useState<SocialHealthItem[]>([]);
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

      // Fetch content outputs summary
      const [publishedRes, scheduledRes, failedRes] = await Promise.all([
        supabase.from("content_outputs").select("id, title, status, publish_channel, scheduled_at, published_at, updated_at, last_publish_error").eq("status", "published").order("published_at", { ascending: false }).limit(3),
        supabase.from("content_outputs").select("id, title, status, publish_channel, scheduled_at, published_at, updated_at, last_publish_error").eq("status", "scheduled").order("scheduled_at", { ascending: true }).limit(3),
        supabase.from("content_outputs").select("id, title, status, publish_channel, scheduled_at, published_at, updated_at, last_publish_error").eq("status", "failed").order("updated_at", { ascending: false }).limit(3),
      ]);

      setContentItems({
        published: (publishedRes.data || []) as ContentItem[],
        scheduled: (scheduledRes.data || []) as ContentItem[],
        failed: (failedRes.data || []) as ContentItem[],
      });

      // Fetch social connections + latest health checks
      const { data: connections } = await supabase
        .from("social_connections")
        .select("id, channel, page_name, is_active, is_test_connection, last_validated_at, last_validation_status, last_error_message")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("connected_at", { ascending: false });

      let healthItems: SocialHealthItem[] = [];
      if (connections && connections.length > 0) {
        const connIds = connections.map(c => c.id);
        const { data: checks } = await supabase
          .from("social_health_checks")
          .select("connection_id, status, checked_at")
          .in("connection_id", connIds)
          .order("checked_at", { ascending: false });
        const latestCheck = new Map<string, { status: string; checked_at: string }>();
        (checks || []).forEach(c => {
          if (c.connection_id && !latestCheck.has(c.connection_id)) {
            latestCheck.set(c.connection_id, { status: c.status, checked_at: c.checked_at });
          }
        });
        healthItems = connections.map(c => ({
          id: c.id,
          channel: c.channel,
          page_name: c.page_name,
          is_active: c.is_active,
          is_test_connection: c.is_test_connection,
          last_validated_at: c.last_validated_at,
          last_validation_status: c.last_validation_status,
          last_error_message: c.last_error_message,
          last_check_status: latestCheck.get(c.id)?.status || null,
          last_check_at: latestCheck.get(c.id)?.checked_at || null,
        }));
      }
      setSocialHealth(healthItems);

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

          {/* Content summary widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Content overzicht</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/content/overview")} className="gap-1 text-xs">
                Bekijk alles <ArrowRight className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Published */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Gepubliceerd</span>
                    <Badge variant="secondary" className="ml-auto text-xs">{contentItems.published.length}</Badge>
                  </div>
                  {contentItems.published.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-6">Nog geen publicaties</p>
                  ) : contentItems.published.map(item => (
                    <div key={item.id} className="pl-6 space-y-0.5 cursor-pointer hover:bg-secondary/30 rounded p-1 -ml-1" onClick={() => navigate("/dashboard/content", { state: { highlightId: item.id } })}>
                      <p className="text-sm truncate">{item.title || "Zonder titel"}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.published_at ? new Date(item.published_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Scheduled */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CalendarClock className="w-4 h-4 text-primary" />
                    <span>Ingepland</span>
                    <Badge variant="secondary" className="ml-auto text-xs">{contentItems.scheduled.length}</Badge>
                  </div>
                  {contentItems.scheduled.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-6">Niets ingepland</p>
                  ) : contentItems.scheduled.map(item => (
                    <div key={item.id} className="pl-6 space-y-0.5 cursor-pointer hover:bg-secondary/30 rounded p-1 -ml-1" onClick={() => navigate("/dashboard/content", { state: { highlightId: item.id } })}>
                      <p className="text-sm truncate">{item.title || "Zonder titel"}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Failed */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span>Mislukt</span>
                    <Badge variant="destructive" className="ml-auto text-xs">{contentItems.failed.length}</Badge>
                  </div>
                  {contentItems.failed.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-6">Geen fouten 🎉</p>
                  ) : contentItems.failed.map(item => (
                    <div key={item.id} className="pl-6 space-y-0.5 cursor-pointer hover:bg-secondary/30 rounded p-1 -ml-1" onClick={() => navigate("/dashboard/content", { state: { highlightId: item.id } })}>
                      <p className="text-sm truncate">{item.title || "Zonder titel"}</p>
                      <p className="text-xs text-destructive/80 truncate">
                        {item.last_publish_error || "Onbekende fout"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social health summary widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Social status
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/social-health")} className="gap-1 text-xs">
                Bekijk alles <ArrowRight className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {socialHealth.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <Wifi className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Nog geen actieve social koppelingen.</p>
                  <Button size="sm" onClick={() => navigate("/dashboard/social-publisher")}>
                    Koppel een pagina
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {socialHealth.map(item => {
                    const status = item.last_check_status || item.last_validation_status || "unknown";
                    const isHealthy = status === "healthy" || status === "success";
                    const isDegraded = status === "degraded" || status === "warning";
                    const Icon = isHealthy ? CheckCircle2 : isDegraded ? AlertTriangle : XCircle;
                    const iconClass = isHealthy ? "text-green-500" : isDegraded ? "text-yellow-500" : "text-destructive";
                    const checkedAt = item.last_check_at || item.last_validated_at;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => navigate("/dashboard/social-health")}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`w-5 h-5 shrink-0 ${iconClass}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{item.page_name || "Onbekende pagina"}</p>
                              {item.is_test_connection && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Test</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">
                              {item.channel} · {checkedAt
                                ? new Date(checkedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                                : "Nooit gecontroleerd"}
                            </p>
                            {item.last_error_message && !isHealthy && (
                              <p className="text-xs text-destructive/80 truncate mt-0.5">{item.last_error_message}</p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={isHealthy ? "secondary" : isDegraded ? "outline" : "destructive"}
                          className="text-[10px] shrink-0"
                        >
                          {isHealthy ? "Gezond" : isDegraded ? "Beperkt" : status === "unknown" ? "Onbekend" : "Fout"}
                        </Badge>
                      </div>
                    );
                  })}
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
