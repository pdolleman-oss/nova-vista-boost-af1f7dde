import { useState, useEffect, useMemo } from "react";
import { contentApi, ContentOutput } from "@/services/contentApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { FileText, Filter, Calendar, Hash, Eye, CheckCircle, Clock, Send, AlertTriangle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS = [
  { value: "", label: "Alle statussen" },
  { value: "draft", label: "Concept" },
  { value: "generated", label: "Gegenereerd" },
  { value: "approved", label: "Goedgekeurd" },
  { value: "scheduled", label: "Ingepland" },
  { value: "published", label: "Gepubliceerd" },
  { value: "failed", label: "Mislukt" },
];

const CHANNEL_OPTIONS = [
  { value: "", label: "Alle kanalen" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "E-mail" },
  { value: "website", label: "Website" },
];

const statusConfig: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  draft: { icon: FileText, color: "text-muted-foreground", label: "Concept" },
  generated: { icon: Eye, color: "text-blue-500", label: "Gegenereerd" },
  approved: { icon: CheckCircle, color: "text-green-500", label: "Goedgekeurd" },
  scheduled: { icon: Clock, color: "text-orange-500", label: "Ingepland" },
  published: { icon: Send, color: "text-primary", label: "Gepubliceerd" },
  failed: { icon: AlertTriangle, color: "text-destructive", label: "Mislukt" },
};

export default function ContentOverview() {
  const [outputs, setOutputs] = useState<ContentOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadOutputs();
  }, []);

  const loadOutputs = async () => {
    setLoading(true);
    const { data } = await contentApi.listOutputs();
    setOutputs((data as ContentOutput[]) || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return outputs.filter((o) => {
      if (statusFilter && o.status !== statusFilter && o.approval_status !== statusFilter) return false;
      if (channelFilter && o.publish_channel !== channelFilter) return false;
      if (dateFrom && o.created_at < dateFrom) return false;
      if (dateTo && o.created_at > dateTo + "T23:59:59") return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!o.title?.toLowerCase().includes(q) && !o.body?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [outputs, statusFilter, channelFilter, dateFrom, dateTo, searchQuery]);

  const stats = useMemo(() => ({
    total: outputs.length,
    draft: outputs.filter((o) => o.status === "draft").length,
    approved: outputs.filter((o) => o.approval_status === "approved").length,
    published: outputs.filter((o) => o.status === "published").length,
  }), [outputs]);

  const getStatus = (o: ContentOutput) => {
    if (o.status === "published") return statusConfig.published;
    if (o.approval_status === "approved") return statusConfig.approved;
    if (o.scheduled_at) return statusConfig.scheduled;
    if (o.status === "failed") return statusConfig.failed;
    if (o.body) return statusConfig.generated;
    return statusConfig.draft;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Overzicht</h1>
          <p className="text-muted-foreground text-sm">Alle gegenereerde content op één plek</p>
        </div>
        <Button onClick={() => navigate("/dashboard/content")} size="sm">
          <FileText className="mr-2 h-4 w-4" /> Nieuwe briefing
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Totaal", value: stats.total, icon: FileText },
          { label: "Concepten", value: stats.draft, icon: Eye },
          { label: "Goedgekeurd", value: stats.approved, icon: CheckCircle },
          { label: "Gepubliceerd", value: stats.published, icon: Send },
        ].map((s) => (
          <Card key={s.label} className="bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoeken..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm"
            >
              {CHANNEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-xs" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-xs shrink-0">t/m</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <p className="text-muted-foreground text-center py-12">Laden...</p>
      ) : filtered.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Geen content gevonden</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/dashboard/content")}>
              Maak je eerste briefing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((output) => {
            const s = getStatus(output);
            const StatusIcon = s.icon;
            return (
              <Card key={output.id} className="bg-card hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className={`h-4 w-4 shrink-0 ${s.color}`} />
                        <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
                        {output.publish_channel && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                            <Hash className="inline h-3 w-3 mr-0.5" />
                            {output.publish_channel}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground truncate">
                        {output.title || "Zonder titel"}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {output.body?.substring(0, 150) || "Geen inhoud"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{format(new Date(output.created_at), "d MMM yyyy HH:mm", { locale: nl })}</span>
                        {output.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Gepland: {format(new Date(output.scheduled_at), "d MMM HH:mm", { locale: nl })}
                          </span>
                        )}
                        {output.hashtags?.length > 0 && (
                          <span>{output.hashtags.length} hashtags</span>
                        )}
                      </div>
                    </div>
                    {output.cta_text && (
                      <div className="hidden md:block text-right shrink-0">
                        <span className="text-xs text-muted-foreground">CTA</span>
                        <p className="text-sm font-medium text-foreground">{output.cta_text}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
