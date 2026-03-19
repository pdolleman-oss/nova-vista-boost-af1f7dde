import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, BarChart3, TrendingUp } from "lucide-react";

const stats = [
  { icon: Users, label: "Leads", value: "0", change: "+0%" },
  { icon: Globe, label: "Website Audits", value: "0", change: "+0%" },
  { icon: BarChart3, label: "Campagnes", value: "0", change: "+0%" },
  { icon: TrendingUp, label: "Conversies", value: "0%", change: "+0%" },
];

const DashboardHome = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-1">Welkom terug bij Nova Vista Boost</p>
    </div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            <s.icon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{s.change} vs vorige maand</p>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardContent className="flex items-center justify-center py-16">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Klaar om te starten?</h3>
          <p className="text-muted-foreground">Gebruik de Leadfinder om je eerste prospects te vinden.</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default DashboardHome;
