import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, BarChart3, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const DashboardHome = () => {
  const [stats, setStats] = useState({ leads: 0, audits: 0, pipeline: 0, won: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [companiesRes, auditsRes, pipelineRes, wonRes] = await Promise.all([
        supabase.from("companies_master").select("id", { count: "exact", head: true }),
        supabase.from("website_audits").select("id", { count: "exact", head: true }),
        supabase.from("lead_pipeline").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("lead_pipeline").select("won_value").eq("user_id", user.id).eq("status", "gewonnen"),
      ]);

      const wonTotal = (wonRes.data || []).reduce((sum, r) => sum + (Number(r.won_value) || 0), 0);

      setStats({
        leads: companiesRes.count || 0,
        audits: auditsRes.count || 0,
        pipeline: pipelineRes.count || 0,
        won: wonTotal,
      });
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { icon: Users, label: "Leads in database", value: stats.leads.toString() },
    { icon: Globe, label: "Website Audits", value: stats.audits.toString() },
    { icon: BarChart3, label: "In pipeline", value: stats.pipeline.toString() },
    { icon: TrendingUp, label: "Gewonnen waarde", value: `€${stats.won.toLocaleString("nl-NL")}` },
  ];

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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label}>
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
      )}

      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Klaar om te starten?</h3>
            <p className="text-muted-foreground">Gebruik de Leadfinder om je eerste prospects te vinden.</p>
            <Button onClick={() => navigate("/dashboard/leads")}>Ga naar Leadfinder</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
