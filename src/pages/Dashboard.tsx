import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Globe, TrendingUp, LogOut } from "lucide-react";
import Logo from "@/components/Logo";

const stats = [
  { icon: Users, label: "Leads", value: "0" },
  { icon: Globe, label: "Website Audits", value: "0" },
  { icon: BarChart3, label: "Campagnes", value: "0" },
  { icon: TrendingUp, label: "Conversies", value: "0%" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/auth");
      else setUser(data.user);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-card/50">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
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
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Welkom bij Nova Vista Boost. Begin met het toevoegen van leads.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
