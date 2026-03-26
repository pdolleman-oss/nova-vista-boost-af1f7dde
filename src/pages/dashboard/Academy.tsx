import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen, PlayCircle, ArrowLeft, CheckSquare, Square, Search,
  Building2, TrendingUp, FileText, Wrench, PenTool, Headphones, Calculator, Layers
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const icons = [Building2, TrendingUp, FileText, Wrench, Layers, PenTool, Headphones, Calculator];

interface Lesson {
  title: string;
  content: string;
  checklist?: string[];
}

interface Module {
  title: string;
  icon: typeof Building2;
  desc: string;
  lessons: Lesson[];
}

const modules: Module[] = [
  {
    title: "Fundament", icon: Building2, desc: "De basis van je bureau: positionering, branding en strategie.",
    lessons: [
      { title: "SOP 1: Brand Identity opzetten", content: "Definieer je merkidentiteit: missie, visie, waarden, tone of voice en visuele stijl. Dit is de basis voor alle communicatie.", checklist: ["Missie & visie geformuleerd", "Tone of voice bepaald", "Kleurenpalet & typografie vastgelegd", "Logo-varianten gemaakt", "Brand guidelines document opgesteld"] },
      { title: "SOP 2: Doelgroep & ICP definiëren", content: "Bepaal je Ideal Customer Profile (ICP). Wie zijn je ideale klanten? Welke pijnpunten hebben ze? Waar bevinden ze zich online?", checklist: ["ICP-profiel ingevuld", "3-5 buyer personas gemaakt", "Pijnpunten en behoeften geïdentificeerd", "Online kanalen van doelgroep in kaart gebracht"] },
      { title: "SOP 3: Concurrentieanalyse uitvoeren", content: "Analyseer minimaal 5 concurrenten op diensten, prijzen, positionering en online aanwezigheid.", checklist: ["5 concurrenten geïdentificeerd", "SWOT-analyse per concurrent", "Pricing benchmark uitgevoerd", "Unieke differentiators vastgesteld"] },
      { title: "SOP 4: Serviceportfolio samenstellen", content: "Ontwikkel een helder dienstenaanbod met pakketten en pricing die aansluiten bij je ICP.", checklist: ["Diensten gedefinieerd", "3 pakketten samengesteld (basis, pro, enterprise)", "Prijsmodel bepaald", "Upsell-mogelijkheden geïdentificeerd"] },
    ],
  },
  {
    title: "Sales", icon: TrendingUp, desc: "Leadgeneratie, acquisitie en closing-technieken.",
    lessons: [
      { title: "SOP 5: Outbound prospecting workflow", content: "Systematische aanpak voor het benaderen van prospects via e-mail, LinkedIn en telefoon.", checklist: ["Target list opgesteld (min. 50 prospects)", "E-mail templates geschreven (intro, follow-up, break-up)", "LinkedIn connectieverzoek template gemaakt", "Belscript opgesteld", "CRM-pipeline ingericht"] },
      { title: "SOP 6: Discovery call checklist", content: "Structuur voor het eerste gesprek met een prospect: van rapport opbouwen tot behoefteanalyse.", checklist: ["Rapport-opbouw vragen voorbereid", "SPIN-vragen opgesteld", "Budget-kwalificatie vragen klaar", "Timeline en decision-making proces vragen", "Volgende stappen template"] },
      { title: "SOP 7: Inbound leadgeneratie", content: "Strategieën voor het aantrekken van inbound leads via content, SEO en social media.", checklist: ["Lead magnet gecreëerd", "Landing page live", "E-mail nurture sequence gemaakt", "Retargeting campagne opgezet"] },
      { title: "SOP 8: Closing & negotiation", content: "Technieken voor het sluiten van deals en omgaan met bezwaren.", checklist: ["Bezwaren-document opgesteld", "Urgentie-triggers geïdentificeerd", "Contract template gemaakt", "Onboarding flow voorbereid"] },
    ],
  },
  {
    title: "Offertes", icon: FileText, desc: "Professionele offertes en proposals die converteren.",
    lessons: [
      { title: "SOP 9: Offerte template & structuur", content: "Standaard offerte-template met executive summary, scope, timeline, investering en garanties.", checklist: ["Template ontworpen", "Executive summary sectie", "Scope of work sectie", "Pricing tabel", "Terms & conditions"] },
      { title: "SOP 10: Pricing strategieën", content: "Value-based pricing, project-based vs retainer, en hoe je je prijzen verdedigt.", checklist: ["Value-based pricing model opgesteld", "Retainer-opties gedefinieerd", "ROI-calculator gemaakt", "Prijsverdedigings-script"] },
      { title: "SOP 11: Case studies maken", content: "Maak overtuigende case studies met resultaten, testimonials en visuele bewijslast.", checklist: ["Template voor case study", "3 klantresultaten gedocumenteerd", "Before/after metrics verzameld", "Testimonials verzameld"] },
      { title: "SOP 12: Proposal follow-up workflow", content: "Gestructureerde follow-up na het versturen van een offerte.", checklist: ["Follow-up schema (dag 1, 3, 7, 14)", "E-mail templates per follow-up moment", "Escalatie-procedure bij geen reactie"] },
    ],
  },
  {
    title: "Delivery", icon: Wrench, desc: "Projectmanagement en kwaliteitsborging bij oplevering.",
    lessons: [
      { title: "SOP 13: Klant-onboarding proces", content: "Gestructureerde onboarding: welkomstmail, kickoff-call, toegang tot tools en planning.", checklist: ["Welkomstmail template", "Kickoff-agenda template", "Toegang tot projecttools ingericht", "Timeline en milestones vastgelegd", "Communicatiekanalen bepaald"] },
      { title: "SOP 14: Projectmanagement workflow", content: "Gebruik van projecttools, sprints, en statusupdates voor een soepele oplevering.", checklist: ["Projecttool ingericht (Trello/Asana/ClickUp)", "Sprint-planning template", "Wekelijkse status-update template", "Quality checklist per deliverable"] },
      { title: "SOP 15: Kwaliteitscontrole (QA)", content: "Checklists voor het controleren van deliverables voordat ze naar de klant gaan.", checklist: ["QA-checklist per type deliverable", "Peer review proces", "Klant-goedkeuringsworkflow", "Revisie-beleid gedocumenteerd"] },
      { title: "SOP 16: Klantcommunicatie protocol", content: "Richtlijnen voor professionele communicatie met klanten.", checklist: ["Reactietijd-normen vastgesteld", "Escalatieprocedure gedocumenteerd", "Maandelijkse rapportage template", "NPS/feedback formulier"] },
    ],
  },
  {
    title: "Techniek", icon: Layers, desc: "Technische marketing: tracking, automation en tools.",
    lessons: [
      { title: "SOP 17: Analytics & tracking setup", content: "Google Analytics 4, Tag Manager, conversietracking en event-tracking correct implementeren.", checklist: ["GA4 account opgezet", "GTM container geïnstalleerd", "Conversiedoelen ingesteld", "UTM-parameter strategie", "Dashboard met KPI's gemaakt"] },
      { title: "SOP 18: Marketing automation", content: "E-mail automation flows, lead scoring en CRM-integraties opzetten.", checklist: ["E-mail automation tool gekozen", "Welcome flow gemaakt", "Lead scoring model opgesteld", "CRM-integratie geconfigureerd"] },
      { title: "SOP 19: SEO technische audit", content: "Technische SEO-checklist: site speed, mobile-first, structured data, crawlability.", checklist: ["PageSpeed Insights check", "Mobile-friendly test", "Structured data geïmplementeerd", "XML sitemap & robots.txt gecheckt", "Core Web Vitals geoptimaliseerd"] },
      { title: "SOP 20: Advertising pixel setup", content: "Facebook Pixel, LinkedIn Insight Tag, Google Ads tag en server-side tracking.", checklist: ["Facebook Pixel geïnstalleerd", "LinkedIn Insight Tag actief", "Google Ads tag geconfigureerd", "Custom audiences aangemaakt"] },
    ],
  },
  {
    title: "Content", icon: PenTool, desc: "Contentstrategie, productie en distributie.",
    lessons: [
      { title: "SOP 21: Contentstrategie ontwikkelen", content: "Bouw een contentstrategie gebaseerd op pillar content, clusters en een contentkalender.", checklist: ["Content pillars gedefinieerd (3-5)", "Topic clusters per pillar", "Contentkalender gemaakt (3 maanden)", "Distributiekanalen bepaald"] },
      { title: "SOP 22: Blog & SEO content", content: "Schrijf SEO-geoptimaliseerde content die rankt en converteert.", checklist: ["Keyword research uitgevoerd", "Content brief template", "SEO-checklist per artikel", "Interne linking strategie"] },
      { title: "SOP 23: Social media management", content: "Consistente social media aanwezigheid met templates, planning en community management.", checklist: ["Content templates per platform", "Posting schema gemaakt", "Hashtag strategie", "Community management protocol"] },
      { title: "SOP 24: Video & visual content", content: "Video-productie workflow: van script tot publicatie.", checklist: ["Video script template", "Productie-checklist", "Thumbnail ontwerp template", "Video SEO optimalisatie"] },
    ],
  },
  {
    title: "Service", icon: Headphones, desc: "Klantbehoud, upselling en klanttevredenheid.",
    lessons: [
      { title: "SOP 25: Maandelijkse rapportage", content: "Gestructureerde maandrapportages met KPI's, inzichten en aanbevelingen.", checklist: ["Rapportage template ontworpen", "KPI-dashboard per klant", "Inzichten & aanbevelingen sectie", "Volgende maand planning"] },
      { title: "SOP 26: Klantretentie strategie", content: "Strategieën om churn te verminderen en klanttevredenheid te verhogen.", checklist: ["NPS-meting ingevoerd", "Quarterly Business Review agenda", "Klant-health score model", "Proactieve check-in schema"] },
      { title: "SOP 27: Upselling & cross-selling", content: "Identificeer upsell-mogelijkheden en voer ze effectief uit.", checklist: ["Upsell-triggers geïdentificeerd", "Cross-sell matrix gemaakt", "Upsell-pitch templates", "Timing-strategie vastgelegd"] },
      { title: "SOP 28: Klacht- en escalatiemanagement", content: "Professioneel omgaan met klachten en escalaties.", checklist: ["Klachtenprotocol gedocumenteerd", "Escalatie-niveaus gedefinieerd", "Compensatie-richtlijnen", "Root cause analysis template"] },
    ],
  },
  {
    title: "Administratie", icon: Calculator, desc: "Facturatie, contracten en financieel beheer.",
    lessons: [
      { title: "SOP 29: Facturatie & betalingsflow", content: "Gestroomlijnde facturatie met automatische herinneringen en betalingsopvolging.", checklist: ["Factuur template gemaakt", "Automatische herinneringen ingesteld", "Betalingstermijnen vastgelegd", "Incassoprotocol"] },
      { title: "SOP 30: Contractbeheer", content: "Standaard contracten, SLA's en juridische dekking.", checklist: ["Standaard dienstverleningscontract", "SLA-template", "NDA-template", "Verwerkersovereenkomst (AVG)"] },
      { title: "SOP 31: Financieel dashboard", content: "Inzicht in omzet, kosten, marges en forecasting.", checklist: ["MRR/ARR tracking opgezet", "Kostenposten gecategoriseerd", "Margeberekening per dienst", "Kwartaal-forecast model"] },
    ],
  },
];

const STORAGE_KEY = "nvb-academy-progress";

const Academy = () => {
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setProgress(JSON.parse(saved));

    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setHasAccess(false); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const userRoles = (roles || []).map(r => r.role);
      setHasAccess(userRoles.includes("admin") || userRoles.includes("client_owner") || userRoles.length === 0);
    };
    checkAccess();
  }, []);

  const saveProgress = (key: string, checked: boolean) => {
    const updated = { ...progress, [key]: checked };
    setProgress(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const getModuleProgress = (moduleIdx: number) => {
    const mod = modules[moduleIdx];
    let total = 0, done = 0;
    mod.lessons.forEach((lesson, li) => {
      (lesson.checklist || []).forEach((_, ci) => {
        total++;
        if (progress[`${moduleIdx}-${li}-${ci}`]) done++;
      });
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const filteredModules = useMemo(() => {
    if (!search.trim()) return modules.map((m, i) => ({ ...m, origIdx: i }));
    const q = search.toLowerCase();
    return modules
      .map((m, i) => ({ ...m, origIdx: i }))
      .filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.desc.toLowerCase().includes(q) ||
        m.lessons.some(l => l.title.toLowerCase().includes(q) || l.content.toLowerCase().includes(q))
      );
  }, [search]);

  if (hasAccess === null) return null;
  if (hasAccess === false) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold">Geen toegang</h2>
            <p className="text-sm text-muted-foreground">Je hebt geen toegang tot de Academy. Neem contact op met je organisatie-eigenaar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lesson detail view
  if (activeModule !== null && activeLesson !== null) {
    const mod = modules[activeModule];
    const lesson = mod.lessons[activeLesson];
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveLesson(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">{mod.title}</p>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground leading-relaxed">{lesson.content}</p>
          </CardContent>
        </Card>
        {lesson.checklist && lesson.checklist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lesson.checklist.map((item, ci) => {
                const key = `${activeModule}-${activeLesson}-${ci}`;
                const checked = progress[key] || false;
                return (
                  <button
                    key={ci}
                    onClick={() => saveProgress(key, !checked)}
                    className="flex items-start gap-3 w-full text-left hover:bg-secondary/30 p-2 rounded-lg transition-colors"
                  >
                    {checked ? (
                      <CheckSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <span className={checked ? "line-through text-muted-foreground" : ""}>{item}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Module detail view
  if (activeModule !== null) {
    const mod = modules[activeModule];
    const Icon = mod.icon;
    const prog = getModuleProgress(activeModule);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveModule(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{mod.title}</h1>
              <p className="text-sm text-muted-foreground">{mod.desc}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{mod.lessons.length} SOP's</span>
          <span>•</span>
          <span>{prog}% voltooid</span>
          <div className="flex-1 h-2 bg-secondary rounded-full max-w-[200px]">
            <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${prog}%` }} />
          </div>
        </div>
        <div className="grid gap-3">
          {mod.lessons.map((lesson, li) => {
            const lessonChecks = (lesson.checklist || []).length;
            const lessonDone = (lesson.checklist || []).filter((_, ci) => progress[`${activeModule}-${li}-${ci}`]).length;
            return (
              <Card
                key={li}
                className="hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setActiveLesson(li)}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                      {li + 1}
                    </div>
                    <div>
                      <p className="font-medium">{lesson.title}</p>
                      {lessonChecks > 0 && (
                        <p className="text-xs text-muted-foreground">{lessonDone}/{lessonChecks} items afgevinkt</p>
                      )}
                    </div>
                  </div>
                  <PlayCircle className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Module overview
  const totalProgress = modules.reduce((sum, _, i) => sum + getModuleProgress(i), 0);
  const avgProgress = Math.round(totalProgress / modules.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Academy</h1>
        <p className="text-muted-foreground mt-1">
          8 modules • 31 SOP's • Totale voortgang: {avgProgress}%
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Zoek in modules en lessen..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filteredModules.map((mod) => {
          const Icon = mod.icon;
          const prog = getModuleProgress(mod.origIdx);
          return (
            <Card
              key={mod.origIdx}
              className="hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setActiveModule(mod.origIdx)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{prog}%</span>
                </div>
                <CardTitle className="text-lg">{mod.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{mod.desc}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{mod.lessons.length} SOP's</span>
                  </div>
                  <div className="w-20 h-1.5 bg-secondary rounded-full">
                    <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${prog}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Academy;
