import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { socialHealthApi } from "@/services/socialHealthApi";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Trash2, Play, Shield, Wifi, Clock,
} from "lucide-react";

interface HealthConnection {
  connection: {
    id: string;
    channel: string;
    page_id: string;
    page_name: string;
    is_test_connection: boolean;
    is_active: boolean;
    last_validated_at: string | null;
    last_validation_status: string | null;
    last_error_message: string | null;
  };
  last_health_check: any;
  last_successful_publish: any;
}

interface TestRun {
  id: string;
  status: string;
  created_test_post: boolean;
  retrieved_test_post: boolean;
  deleted_test_post: boolean;
  external_post_id: string | null;
  summary: string;
  warnings: string[];
  errors: string[];
  started_at: string;
  finished_at: string;
  connection_id: string;
}

function statusBadge(status: string | null) {
  if (!status || status === "unknown") return <Badge variant="secondary">Onbekend</Badge>;
  if (status === "healthy" || status === "success") return <Badge className="bg-green-600 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Gezond</Badge>;
  if (status === "degraded") return <Badge className="bg-yellow-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Beperkt</Badge>;
  return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Ongezond</Badge>;
}

export default function SocialHealth() {
  const [healthData, setHealthData] = useState<HealthConnection[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);
  const [testText, setTestText] = useState("Dit is een NVB testpublicatie 🚀");
  const [testing, setTesting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [health, runs] = await Promise.all([
      socialHealthApi.getHealth(),
      socialHealthApi.getTestRunHistory(),
    ]);
    if (health.success) setHealthData(health.data);
    if (runs.success) setTestRuns(runs.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleHealthCheck = async (connectionId: string) => {
    setChecking(connectionId);
    const res = await socialHealthApi.runHealthCheck(connectionId);
    if (res.success) {
      toast.success(`Health check: ${res.data.status}`);
    } else {
      toast.error(res.error || "Health check mislukt");
    }
    await loadData();
    setChecking(null);
  };

  const handleTestRun = async (connectionId: string) => {
    if (!testText.trim()) return toast.error("Voer een testtekst in");
    setTesting(true);
    const res = await socialHealthApi.runTestPublish({
      connection_id: connectionId,
      post_text: testText,
      cleanup: true,
    });
    if (res.success) {
      toast.success(`Test run: ${res.data.status}`);
    } else {
      toast.error(res.error || "Test run mislukt");
    }
    await loadData();
    setTesting(false);
  };

  const handleDeleteTestPost = async (externalPostId: string, connectionId: string) => {
    const res = await socialHealthApi.deleteTestPost(externalPostId, connectionId);
    if (res.success) {
      toast.success("Testpost verwijderd");
    } else {
      toast.error(res.error || "Verwijderen mislukt");
    }
  };

  const handleToggleTest = async (connectionId: string, current: boolean) => {
    await socialHealthApi.setTestConnection(connectionId, !current);
    toast.success(!current ? "Ingesteld als testverbinding" : "Testverbinding uitgeschakeld");
    await loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Social Health & Test</h1>
        <p className="text-muted-foreground">Controleer en test je Facebook-koppelingen</p>
      </div>

      {/* Health Cards */}
      <div className="grid gap-4">
        {loading && <p className="text-muted-foreground">Laden...</p>}
        {!loading && healthData.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Geen actieve Facebook-koppelingen gevonden. Koppel eerst een pagina via Social Publisher.
            </CardContent>
          </Card>
        )}
        {healthData.map((item) => (
          <Card key={item.connection.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{item.connection.page_name}</CardTitle>
                    <CardDescription>Page ID: {item.connection.page_id}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.connection.is_test_connection && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">Test</Badge>
                  )}
                  {statusBadge(item.connection.last_validation_status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Token</p>
                  <p className="font-medium flex items-center gap-1">
                    {item.last_health_check?.token_valid ? (
                      <><CheckCircle2 className="w-4 h-4 text-green-500" /> Geldig</>
                    ) : (
                      <><XCircle className="w-4 h-4 text-destructive" /> Onbekend</>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Pagina</p>
                  <p className="font-medium flex items-center gap-1">
                    {item.last_health_check?.page_connected ? (
                      <><CheckCircle2 className="w-4 h-4 text-green-500" /> Verbonden</>
                    ) : (
                      <><XCircle className="w-4 h-4 text-destructive" /> Onbekend</>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Laatste check</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {item.connection.last_validated_at
                      ? new Date(item.connection.last_validated_at).toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                      : "Nooit"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Laatste publish</p>
                  <p className="font-medium">
                    {item.last_successful_publish?.published_at
                      ? new Date(item.last_successful_publish.published_at).toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                      : "Geen"}
                  </p>
                </div>
              </div>

              {item.connection.last_error_message && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">
                  {item.connection.last_error_message}
                </div>
              )}

              {/* Warnings from last check */}
              {item.last_health_check?.warnings?.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 text-sm space-y-1">
                  {item.last_health_check.warnings.map((w: string, i: number) => (
                    <p key={i} className="text-yellow-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {w}
                    </p>
                  ))}
                </div>
              )}

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={checking === item.connection.id}
                  onClick={() => handleHealthCheck(item.connection.id)}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${checking === item.connection.id ? "animate-spin" : ""}`} />
                  Valideren
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleTest(item.connection.id, item.connection.is_test_connection)}
                >
                  <Shield className="w-4 h-4 mr-1" />
                  {item.connection.is_test_connection ? "Test uitzetten" : "Als test instellen"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Run Section */}
      {healthData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Play className="w-5 h-5" /> Test Publish</CardTitle>
            <CardDescription>Publiceer een testbericht en valideer het resultaat automatisch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Testtekst voor publicatie..."
            />
            <div className="flex flex-wrap gap-2">
              {healthData.map((item) => (
                <Button
                  key={item.connection.id}
                  size="sm"
                  disabled={testing}
                  onClick={() => handleTestRun(item.connection.id)}
                >
                  <Activity className={`w-4 h-4 mr-1 ${testing ? "animate-spin" : ""}`} />
                  Test naar {item.connection.page_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Run History */}
      {testRuns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Run Geschiedenis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testRuns.map((run) => (
                <div key={run.id} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {run.status === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="font-medium text-sm">{run.summary}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {run.started_at && new Date(run.started_at).toLocaleString("nl-NL")}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Gepubliceerd: {run.created_test_post ? "✅" : "❌"}</span>
                    <span>Opgehaald: {run.retrieved_test_post ? "✅" : "❌"}</span>
                    <span>Opgeruimd: {run.deleted_test_post ? "✅" : "❌"}</span>
                  </div>
                  {run.errors?.length > 0 && (
                    <div className="text-xs text-destructive">{run.errors.join(", ")}</div>
                  )}
                  {run.warnings?.length > 0 && (
                    <div className="text-xs text-yellow-600">{run.warnings.join(", ")}</div>
                  )}
                  {run.external_post_id && !run.deleted_test_post && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteTestPost(run.external_post_id!, run.connection_id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Testpost verwijderen
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
