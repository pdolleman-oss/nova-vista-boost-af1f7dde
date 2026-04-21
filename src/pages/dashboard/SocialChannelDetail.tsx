import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock, Loader2, Wifi, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { socialHealthApi } from "@/services/socialHealthApi";
import { toast } from "sonner";

interface Connection {
  id: string;
  channel: string;
  page_id: string;
  page_name: string;
  is_active: boolean;
  is_test_connection: boolean;
  connected_at: string;
  last_validated_at: string | null;
  last_validation_status: string | null;
  last_error_message: string | null;
}

interface HealthCheck {
  id: string;
  status: string;
  mode: string;
  token_valid: boolean | null;
  page_connected: boolean | null;
  publish_test_success: boolean | null;
  retrievable: boolean | null;
  external_post_id: string | null;
  warnings: string[] | null;
  errors: string[] | null;
  checked_at: string | null;
  created_at: string | null;
}

function statusBadge(status: string | null) {
  if (!status || status === "unknown" || status === "pending") return <Badge variant="secondary">Onbekend</Badge>;
  if (status === "healthy" || status === "success") return <Badge className="bg-green-600 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Gezond</Badge>;
  if (status === "degraded" || status === "warning") return <Badge className="bg-yellow-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Beperkt</Badge>;
  return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Fout</Badge>;
}

function boolIcon(v: boolean | null) {
  if (v === true) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (v === false) return <XCircle className="w-4 h-4 text-destructive" />;
  return <span className="text-muted-foreground text-xs">—</span>;
}

export default function SocialChannelDetail() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [history, setHistory] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    if (!connectionId) return;
    setLoading(true);
    const [{ data: conn }, { data: checks }] = await Promise.all([
      supabase
        .from("social_connections")
        .select("id, channel, page_id, page_name, is_active, is_test_connection, connected_at, last_validated_at, last_validation_status, last_error_message")
        .eq("id", connectionId)
        .maybeSingle(),
      supabase
        .from("social_health_checks")
        .select("id, status, mode, token_valid, page_connected, publish_test_success, retrievable, external_post_id, warnings, errors, checked_at, created_at")
        .eq("connection_id", connectionId)
        .order("checked_at", { ascending: false })
        .limit(25),
    ]);
    setConnection(conn as Connection | null);
    setHistory((checks || []) as HealthCheck[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [connectionId]);

  const handleRunCheck = async () => {
    if (!connectionId) return;
    setRunning(true);
    const res = await socialHealthApi.runHealthCheck(connectionId);
    if (res.success) {
      toast.success(`Health check: ${res.data.status}`);
    } else {
      toast.error(res.error || "Health check mislukt");
    }
    await load();
    setRunning(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/social/health")} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Terug
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Koppeling niet gevonden of geen toegang.
          </CardContent>
        </Card>
      </div>
    );
  }

  const failedChecks = history.filter(h => h.status !== "healthy" && h.status !== "success");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/social/health")} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Terug naar overzicht
        </Button>
        <Button size="sm" onClick={handleRunCheck} disabled={running}>
          <RefreshCw className={`w-4 h-4 mr-1 ${running ? "animate-spin" : ""}`} />
          Nieuwe check
        </Button>
      </div>

      {/* Connection header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Wifi className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-xl">{connection.page_name || "Onbekende pagina"}</CardTitle>
                <CardDescription className="capitalize">
                  {connection.channel} · Page ID: {connection.page_id}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connection.is_test_connection && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-600">Test</Badge>
              )}
              {statusBadge(connection.last_validation_status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Verbonden sinds</p>
              <p className="font-medium">{new Date(connection.connected_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Laatste validatie</p>
              <p className="font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {connection.last_validated_at
                  ? new Date(connection.last_validated_at).toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                  : "Nooit"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Totaal checks</p>
              <p className="font-medium">{history.length}</p>
            </div>
          </div>
          {connection.last_error_message && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">
              <p className="font-medium mb-1">Laatste foutmelding</p>
              {connection.last_error_message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Failed-only summary */}
      {failedChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Recente foutmeldingen ({failedChecks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {failedChecks.slice(0, 5).map(c => (
              <div key={c.id} className="border border-destructive/30 bg-destructive/5 rounded-md p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {c.checked_at ? new Date(c.checked_at).toLocaleString("nl-NL") : "—"}
                  </span>
                  {statusBadge(c.status)}
                </div>
                {c.errors?.length ? (
                  <ul className="list-disc list-inside text-destructive">
                    {c.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic">Geen specifieke foutdetails opgeslagen</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Full history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Health check historie</CardTitle>
          <CardDescription>Laatste {history.length} controles</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nog geen health checks uitgevoerd.</p>
          ) : (
            <div className="space-y-3">
              {history.map(check => (
                <div key={check.id} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {statusBadge(check.status)}
                      <Badge variant="outline" className="text-xs capitalize">{check.mode}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {check.checked_at ? new Date(check.checked_at).toLocaleString("nl-NL") : "—"}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1">{boolIcon(check.token_valid)} <span>Token</span></div>
                    <div className="flex items-center gap-1">{boolIcon(check.page_connected)} <span>Pagina</span></div>
                    <div className="flex items-center gap-1">{boolIcon(check.publish_test_success)} <span>Publish</span></div>
                    <div className="flex items-center gap-1">{boolIcon(check.retrievable)} <span>Ophalen</span></div>
                  </div>
                  {check.warnings && check.warnings.length > 0 && (
                    <div className="text-xs text-yellow-600 bg-yellow-500/10 rounded p-2 space-y-0.5">
                      {check.warnings.map((w, i) => (
                        <p key={i} className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {w}</p>
                      ))}
                    </div>
                  )}
                  {check.errors && check.errors.length > 0 && (
                    <div className="text-xs text-destructive bg-destructive/10 rounded p-2 space-y-0.5">
                      {check.errors.map((e, i) => (
                        <p key={i} className="flex items-center gap-1"><XCircle className="w-3 h-3" /> {e}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
