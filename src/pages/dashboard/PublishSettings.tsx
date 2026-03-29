import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Shield, Zap, FlaskConical, Settings2 } from "lucide-react";
import { nvbProjects, type Project } from "@/services/nvbApi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PublishSettingsData {
  test_mode_enabled: boolean;
  safe_mode_enabled: boolean;
  auto_mode_enabled: boolean;
  default_test_page_id: string | null;
}

export default function PublishSettings() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PublishSettingsData>({
    test_mode_enabled: false,
    safe_mode_enabled: true,
    auto_mode_enabled: false,
    default_test_page_id: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) loadSettings(selectedProjectId);
  }, [selectedProjectId]);

  const loadProjects = async () => {
    const { data } = await nvbProjects.list();
    const list = (data || []) as Project[];
    setProjects(list);
    if (list.length > 0) setSelectedProjectId(list[0].id);
    setLoading(false);
  };

  const loadSettings = async (projectId: string) => {
    const { data } = await supabase
      .from("projects")
      .select("test_mode_enabled, safe_mode_enabled, auto_mode_enabled, default_test_page_id")
      .eq("id", projectId)
      .single();
    if (data) {
      setSettings({
        test_mode_enabled: data.test_mode_enabled ?? false,
        safe_mode_enabled: data.safe_mode_enabled ?? true,
        auto_mode_enabled: data.auto_mode_enabled ?? false,
        default_test_page_id: data.default_test_page_id || null,
      });
    }
  };

  const handleSave = async () => {
    if (!selectedProjectId) return;
    setSaving(true);
    const { error } = await supabase
      .from("projects")
      .update({
        test_mode_enabled: settings.test_mode_enabled,
        safe_mode_enabled: settings.safe_mode_enabled,
        auto_mode_enabled: settings.auto_mode_enabled,
        default_test_page_id: settings.default_test_page_id || null,
      })
      .eq("id", selectedProjectId);

    if (error) toast.error("Opslaan mislukt: " + error.message);
    else toast.success("Publish instellingen opgeslagen");
    setSaving(false);
  };

  const toggle = (key: keyof PublishSettingsData) => {
    setSettings(s => ({ ...s, [key]: !s[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Publish Instellingen</h1>
        <Card className="bg-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            Maak eerst een project aan om publish instellingen te beheren.
          </CardContent>
        </Card>
      </div>
    );
  }

  const modes = [
    {
      key: "safe_mode_enabled" as const,
      label: "Safe Mode",
      icon: Shield,
      description: "Publicatie alleen na expliciete goedkeuring en handmatige actie. Aanbevolen voor productieomgevingen.",
      color: "text-green-500",
    },
    {
      key: "auto_mode_enabled" as const,
      label: "Auto Mode",
      icon: Zap,
      description: "Laag-risico content wordt automatisch gepubliceerd bij geldige connectie. Alleen voor vertrouwde workflows.",
      color: "text-amber-500",
    },
    {
      key: "test_mode_enabled" as const,
      label: "Test Mode",
      icon: FlaskConical,
      description: "Publiceert alleen naar de testpagina. Draait automatisch post-publicatie validatie.",
      color: "text-blue-500",
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings2 className="h-6 w-6" /> Publish Instellingen
        </h1>
        <p className="text-muted-foreground mt-1">Beheer hoe content gepubliceerd wordt per project</p>
      </div>

      {projects.length > 1 && (
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Project</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={selectedProjectId || ""}
            onChange={e => setSelectedProjectId(e.target.value)}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-4">
        {modes.map(mode => {
          const Icon = mode.icon;
          const enabled = settings[mode.key] as boolean;
          return (
            <Card key={mode.key} className={`bg-card border-border ${enabled ? "border-primary/30" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${mode.color}`} />
                    <div>
                      <p className="font-medium text-foreground">{mode.label}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{mode.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(mode.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                      enabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                        enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {settings.test_mode_enabled && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Test Page ID</CardTitle>
            <CardDescription>Facebook Page ID die gebruikt wordt voor test-publicaties</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Bijv. 123456789012345"
              value={settings.default_test_page_id || ""}
              onChange={e => setSettings(s => ({ ...s, default_test_page_id: e.target.value || null }))}
              className="bg-background"
            />
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Opslaan
      </Button>
    </div>
  );
}
