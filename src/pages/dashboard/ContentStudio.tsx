import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText, Sparkles, Send, Save, Loader2, CheckCircle2, Clock,
  ArrowLeft, Plus, ChevronRight, AlertTriangle, Copy, ThumbsUp,
  Calendar, Upload, Edit3, X,
} from "lucide-react";
import { contentApi, type ContentRecommendation, type ContentOutput } from "@/services/contentApi";
import { nvbProjects, type Project } from "@/services/nvbApi";
import { toast } from "sonner";

type View = "list" | "create" | "detail";
type Step = "basis" | "doelgroep" | "merktoon" | "inhoud" | "publicatie";

const STEPS: { key: Step; label: string }[] = [
  { key: "basis", label: "Basis" },
  { key: "doelgroep", label: "Doelgroep" },
  { key: "merktoon", label: "Merktoon" },
  { key: "inhoud", label: "Inhoud" },
  { key: "publicatie", label: "Publicatie" },
];

const CHANNELS = ["Facebook", "Instagram", "LinkedIn", "Blog", "E-mail", "Advertentie"];
const CONTENT_TYPES = ["Post", "Story", "Artikel", "Newsletter", "Advertentie", "Productpagina"];
const TONES = ["Professioneel", "Informeel", "Speels", "Urgent", "Luxe", "Warm", "Zakelijk", "Inspirerend"];
const CTA_STYLES = ["Direct", "Subtiel", "Vraagvorm", "Geen"];
const AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const PRICE_SEGMENTS = ["Budget", "Midden", "Premium", "Luxe"];

const emptyForm = {
  project_id: null as string | null,
  channel: "Facebook",
  content_type: "Post",
  goal: "",
  campaign_title: "",
  audience_primary: "",
  audience_age_group: "",
  price_segment: "",
  audience_description: "",
  tone_of_voice: [] as string[],
  brand_intensity: 3,
  cta_style: "Direct",
  forbidden_words: "",
  core_message: "",
  usp_points: [] as string[],
  required_elements: "",
  destination_url: "",
  hashtags_enabled: true,
  emoji_allowed: true,
  has_media: false,
  visual_brief: "",
  post_action: "draft",
  publish_timing_mode: "manual",
  scheduled_at: null as string | null,
  allow_nvb_timing_advice: true,
};

const ContentStudio = () => {
  const [view, setView] = useState<View>("list");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("basis");
  const [form, setForm] = useState({ ...emptyForm });
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState<ContentRecommendation | null>(null);
  const [output, setOutput] = useState<ContentOutput | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [uspInput, setUspInput] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [reqRes, projRes] = await Promise.all([
      contentApi.listRequests(),
      nvbProjects.list(),
    ]);
    setRequests(reqRes.data || []);
    setProjects(projRes.data || []);
    setLoading(false);
  };

  const handleSaveBriefing = async () => {
    if (!form.core_message.trim()) {
      toast.error("Voer een kernboodschap in");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await contentApi.createRequest(form);
      if (error) throw error;
      setCurrentRequestId(data.id);
      toast.success("Briefing opgeslagen");
      setStep("basis");
    } catch (e: any) {
      toast.error(e.message || "Fout bij opslaan");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!currentRequestId) return;
    setAnalyzing(true);
    try {
      const { data, error } = await contentApi.analyze(currentRequestId);
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Analyse mislukt");
      setRecommendation(data.data);
      toast.success("Analyse compleet");
    } catch (e: any) {
      toast.error(e.message || "Analyse mislukt");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!currentRequestId) return;
    setGenerating(true);
    try {
      const { data, error } = await contentApi.generate(currentRequestId);
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Genereren mislukt");
      setOutput(data.data);
      toast.success("Content gegenereerd");
    } catch (e: any) {
      toast.error(e.message || "Genereren mislukt");
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!output) return;
    try {
      const { data, error } = await contentApi.approve(output.id);
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Goedkeuren mislukt");
      setOutput(data.data);
      toast.success("Content goedgekeurd");
    } catch (e: any) {
      toast.error(e.message || "Goedkeuren mislukt");
    }
  };

  const handleSchedule = async (scheduledAt: string) => {
    if (!output) return;
    try {
      const { data, error } = await contentApi.schedule(output.id, scheduledAt);
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Inplannen mislukt");
      setOutput(data.data);
      toast.success("Content ingepland");
    } catch (e: any) {
      toast.error(e.message || "Inplannen mislukt");
    }
  };

  const handlePublish = async () => {
    if (!output) return;
    try {
      const { data, error } = await contentApi.publish(output.id);
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Publiceren mislukt");
      setOutput(data.data);
      toast.success("Content gepubliceerd");
    } catch (e: any) {
      toast.error(e.message || "Publiceren mislukt");
    }
  };

  const handleSaveEdit = async (updates: { body: string; cta_text: string; title: string }) => {
    if (!output) return;
    try {
      const { error } = await contentApi.updateOutput(output.id, updates);
      if (error) throw error;
      setOutput({ ...output, ...updates });
      toast.success("Wijzigingen opgeslagen");
    } catch {
      toast.error("Opslaan mislukt");
    }
  };

  const handleCopy = () => {
    if (!output) return;
    const text = `${output.title}\n\n${output.body}\n\n${output.cta_text}${output.hashtags?.length ? "\n\n" + output.hashtags.map(h => `#${h}`).join(" ") : ""}`;
    navigator.clipboard.writeText(text);
    toast.success("Gekopieerd naar klembord");
  };

  const loadDetail = async (id: string) => {
    setCurrentRequestId(id);
    const [reqRes, recRes, outRes] = await Promise.all([
      contentApi.getRequest(id),
      contentApi.getRecommendation(id),
      contentApi.getOutput(id),
    ]);
    if (reqRes.data) {
      setForm(reqRes.data as any);
    }
    setRecommendation(recRes.data || null);
    setOutput(outRes.data || null);
    setView("detail");
  };

  const resetCreate = () => {
    setForm({ ...emptyForm });
    setStep("basis");
    setCurrentRequestId(null);
    setRecommendation(null);
    setOutput(null);
    setView("create");
  };

  const toggleTone = (t: string) => {
    setForm(f => ({
      ...f,
      tone_of_voice: f.tone_of_voice.includes(t)
        ? f.tone_of_voice.filter(x => x !== t)
        : [...f.tone_of_voice, t],
    }));
  };

  const addUsp = () => {
    if (!uspInput.trim()) return;
    setForm(f => ({ ...f, usp_points: [...f.usp_points, uspInput.trim()] }));
    setUspInput("");
  };

  const removeUsp = (i: number) => {
    setForm(f => ({ ...f, usp_points: f.usp_points.filter((_, idx) => idx !== i) }));
  };

  // ── List View ──
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Content Studio</h1>
            <p className="text-muted-foreground">Maak, analyseer en publiceer content</p>
          </div>
          <Button onClick={resetCreate}><Plus className="mr-2 h-4 w-4" />Nieuwe briefing</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : requests.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nog geen contentbriefings</p>
              <Button onClick={resetCreate}><Plus className="mr-2 h-4 w-4" />Start je eerste briefing</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {requests.map((r: any) => (
              <Card key={r.id} className="bg-card border-border hover:border-primary/40 transition-colors cursor-pointer" onClick={() => loadDetail(r.id)}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{r.campaign_title || r.content_type || "Briefing"}</p>
                      <p className="text-sm text-muted-foreground">{r.channel} · {r.status} · {new Date(r.created_at).toLocaleDateString("nl-NL")}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Detail View ──
  if (view === "detail") {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => { setView("list"); loadData(); }}>
          <ArrowLeft className="mr-2 h-4 w-4" />Terug
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Actions & Recommendation */}
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Acties</CardTitle>
                <CardDescription>{form.campaign_title || form.content_type} — {form.channel}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Analyseren
                </Button>
                <Button onClick={handleGenerate} disabled={generating || !recommendation} variant="secondary">
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  Genereren
                </Button>
              </CardContent>
            </Card>

            {recommendation && <RecommendationPanel rec={recommendation} />}
          </div>

          {/* Right: Output */}
          <div>
            {output ? (
              <OutputPanel output={output} onApprove={handleApprove} onCopy={handleCopy} />
            ) : (
              <Card className="bg-card border-border border-dashed">
                <CardContent className="flex flex-col items-center py-12">
                  <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">Analyseer en genereer eerst content</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Create View (multi-step form) ──
  const stepIndex = STEPS.findIndex(s => s.key === step);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => setView("list")}>
        <ArrowLeft className="mr-2 h-4 w-4" />Terug
      </Button>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStep(s.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              step === s.key
                ? "bg-primary text-primary-foreground"
                : i < stepIndex
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form section (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              {step === "basis" && (
                <>
                  <h3 className="font-semibold text-foreground">Basis</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Project</label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                        value={form.project_id || ""}
                        onChange={e => setForm(f => ({ ...f, project_id: e.target.value || null }))}
                      >
                        <option value="">Geen project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Kanaal</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                        {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Contenttype</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}>
                        {CONTENT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Campagnetitel</label>
                      <Input value={form.campaign_title} onChange={e => setForm(f => ({ ...f, campaign_title: e.target.value }))} placeholder="Bijv. Zomersale 2026" className="bg-background" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Doel van de content</label>
                    <Input value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="Bijv. meer verkeer, conversie, awareness" className="bg-background" />
                  </div>
                </>
              )}

              {step === "doelgroep" && (
                <>
                  <h3 className="font-semibold text-foreground">Doelgroep</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Primaire doelgroep</label>
                      <Input value={form.audience_primary} onChange={e => setForm(f => ({ ...f, audience_primary: e.target.value }))} placeholder="Bijv. webshop-eigenaren" className="bg-background" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Leeftijdsgroep</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={form.audience_age_group} onChange={e => setForm(f => ({ ...f, audience_age_group: e.target.value }))}>
                        <option value="">Selecteer</option>
                        {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Prijssegment</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={form.price_segment} onChange={e => setForm(f => ({ ...f, price_segment: e.target.value }))}>
                        <option value="">Selecteer</option>
                        {PRICE_SEGMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Doelgroepomschrijving</label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[80px] resize-y"
                      value={form.audience_description}
                      onChange={e => setForm(f => ({ ...f, audience_description: e.target.value }))}
                      placeholder="Beschrijf je doelgroep nader..."
                    />
                  </div>
                </>
              )}

              {step === "merktoon" && (
                <>
                  <h3 className="font-semibold text-foreground">Merktoon</h3>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Tone of voice (meerdere mogelijk)</label>
                    <div className="flex flex-wrap gap-2">
                      {TONES.map(t => (
                        <button
                          key={t}
                          onClick={() => toggleTone(t)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            form.tone_of_voice.includes(t)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Merkintensiteit: <span className="text-primary font-semibold">{form.brand_intensity}/5</span>
                    </label>
                    <input
                      type="range" min={1} max={5} step={1}
                      value={form.brand_intensity}
                      onChange={e => setForm(f => ({ ...f, brand_intensity: parseInt(e.target.value) }))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtiel</span><span>Sterk</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">CTA-stijl</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={form.cta_style} onChange={e => setForm(f => ({ ...f, cta_style: e.target.value }))}>
                        {CTA_STYLES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Verboden woorden / stijl</label>
                      <Input value={form.forbidden_words} onChange={e => setForm(f => ({ ...f, forbidden_words: e.target.value }))} placeholder="Bijv. gratis, klik hier" className="bg-background" />
                    </div>
                  </div>
                </>
              )}

              {step === "inhoud" && (
                <>
                  <h3 className="font-semibold text-foreground">Inhoud</h3>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Kernboodschap *</label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[80px] resize-y"
                      value={form.core_message}
                      onChange={e => setForm(f => ({ ...f, core_message: e.target.value }))}
                      placeholder="Wat is het belangrijkste dat je wilt communiceren?"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">USPs / verplichte punten</label>
                    <div className="flex gap-2 mb-2">
                      <Input value={uspInput} onChange={e => setUspInput(e.target.value)} placeholder="Voeg USP toe" className="bg-background" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addUsp())} />
                      <Button variant="secondary" size="sm" onClick={addUsp}>+</Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {form.usp_points.map((u, i) => (
                        <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1">
                          {u}
                          <button onClick={() => removeUsp(i)} className="hover:text-destructive">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Verplichte elementen</label>
                      <Input value={form.required_elements} onChange={e => setForm(f => ({ ...f, required_elements: e.target.value }))} placeholder="Bijv. prijs, link, disclaimer" className="bg-background" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Bestemmingslink</label>
                      <Input value={form.destination_url} onChange={e => setForm(f => ({ ...f, destination_url: e.target.value }))} placeholder="https://..." className="bg-background" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" checked={form.hashtags_enabled} onChange={e => setForm(f => ({ ...f, hashtags_enabled: e.target.checked }))} className="accent-primary" />
                      Hashtags
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" checked={form.emoji_allowed} onChange={e => setForm(f => ({ ...f, emoji_allowed: e.target.checked }))} className="accent-primary" />
                      Emoji
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" checked={form.has_media} onChange={e => setForm(f => ({ ...f, has_media: e.target.checked }))} className="accent-primary" />
                      Media beschikbaar
                    </label>
                  </div>
                  {form.has_media && (
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Visual briefing</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[60px] resize-y"
                        value={form.visual_brief}
                        onChange={e => setForm(f => ({ ...f, visual_brief: e.target.value }))}
                        placeholder="Beschrijf het gewenste beeld..."
                      />
                    </div>
                  )}
                </>
              )}

              {step === "publicatie" && (
                <>
                  <h3 className="font-semibold text-foreground">Publicatie</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Actie na genereren</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={form.post_action} onChange={e => setForm(f => ({ ...f, post_action: e.target.value }))}>
                        <option value="draft">Concept</option>
                        <option value="review">Review</option>
                        <option value="publish">Publiceren</option>
                        <option value="schedule">Inplannen</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Publicatiemoment</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={form.publish_timing_mode} onChange={e => setForm(f => ({ ...f, publish_timing_mode: e.target.value }))}>
                        <option value="now">Nu</option>
                        <option value="manual">Handmatig</option>
                        <option value="nvb_advice">NVB-advies</option>
                      </select>
                    </div>
                  </div>
                  {form.publish_timing_mode === "manual" && (
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Datum/tijd</label>
                      <Input type="datetime-local" value={form.scheduled_at || ""} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value || null }))} className="bg-background" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" checked={form.allow_nvb_timing_advice} onChange={e => setForm(f => ({ ...f, allow_nvb_timing_advice: e.target.checked }))} className="accent-primary" />
                    NVB timingadvies toestaan
                  </label>
                </>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  disabled={stepIndex === 0}
                  onClick={() => setStep(STEPS[stepIndex - 1].key)}
                >
                  Vorige
                </Button>
                <div className="flex gap-2">
                  {stepIndex < STEPS.length - 1 ? (
                    <Button onClick={() => setStep(STEPS[stepIndex + 1].key)}>
                      Volgende <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleSaveBriefing} disabled={saving || !!currentRequestId}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {currentRequestId ? "Opgeslagen" : "Opslaan"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar: AI panel & Output */}
        <div className="space-y-4">
          {/* AI Actions */}
          {currentRequestId && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />NVB AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" size="sm" onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Analyseren
                </Button>
                <Button className="w-full" size="sm" variant="secondary" onClick={handleGenerate} disabled={generating || !recommendation}>
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Genereren
                </Button>
              </CardContent>
            </Card>
          )}

          {recommendation && <RecommendationPanel rec={recommendation} />}

          {output && <OutputPanel output={output} onApprove={handleApprove} onCopy={handleCopy} compact />}
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ──

function RecommendationPanel({ rec }: { rec: ContentRecommendation }) {
  return (
    <Card className="bg-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-primary flex items-center gap-2">
          <Sparkles className="h-4 w-4" />NVB Advies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <InfoRow label="Tone of voice" value={rec.suggested_tone_of_voice} />
        <InfoRow label="Doelgroep" value={rec.suggested_audience} />
        <InfoRow label="Lengte" value={rec.suggested_length} />
        <InfoRow label="CTA-stijl" value={rec.suggested_cta_style} />
        <InfoRow label="Publicatiemoment" value={rec.suggested_publish_time} />
        {rec.risk_flags?.length > 0 && (
          <div>
            <span className="text-muted-foreground">Risico's:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {rec.risk_flags.map((f, i) => (
                <span key={i} className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded-full flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />{f}
                </span>
              ))}
            </div>
          </div>
        )}
        {rec.reasoning_summary && (
          <div>
            <span className="text-muted-foreground">Motivatie:</span>
            <p className="text-foreground mt-1">{rec.reasoning_summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OutputPanel({ output, onApprove, onCopy, compact }: { output: ContentOutput; onApprove: () => void; onCopy: () => void; compact?: boolean }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className={`${compact ? "text-sm" : "text-lg"} text-foreground`}>
          {output.title || "Gegenereerde content"}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            output.approval_status === "approved" ? "bg-green-500/10 text-green-500" : "bg-accent/10 text-accent"
          }`}>
            {output.approval_status === "approved" ? "Goedgekeurd" : "In review"}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted rounded-lg p-4">
          <p className="text-foreground text-sm whitespace-pre-wrap">{output.body}</p>
        </div>
        {output.cta_text && (
          <div>
            <span className="text-xs text-muted-foreground">CTA:</span>
            <p className="text-primary font-medium text-sm">{output.cta_text}</p>
          </div>
        )}
        {output.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {output.hashtags.map((h, i) => (
              <span key={i} className="text-xs text-primary">#{h}</span>
            ))}
          </div>
        )}
        {output.short_version && (
          <div>
            <span className="text-xs text-muted-foreground">Korte versie:</span>
            <p className="text-foreground text-sm mt-1">{output.short_version}</p>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="secondary" onClick={onCopy}>
            <Copy className="mr-1 h-3 w-3" />Kopieer
          </Button>
          {output.approval_status !== "approved" && (
            <Button size="sm" onClick={onApprove}>
              <ThumbsUp className="mr-1 h-3 w-3" />Goedkeuren
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

export default ContentStudio;
