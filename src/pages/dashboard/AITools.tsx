import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, FileText, MessageSquare, Mail, Image, Loader2, Copy, ArrowLeft,
  Search, BarChart3, Target, Megaphone, ClipboardList,
} from "lucide-react";
import { nvbAi, type TaskType } from "@/services/nvbApi";
import { toast } from "sonner";

const tools = [
  { id: "blog" as TaskType, icon: FileText, title: "Blog Generator", desc: "Genereer SEO-geoptimaliseerde blogartikelen.", placeholder: "Onderwerp van je blog..." },
  { id: "social" as TaskType, icon: MessageSquare, title: "Social Media Posts", desc: "Maak social media content voor alle platformen.", placeholder: "Waar moet de post over gaan..." },
  { id: "email_draft" as TaskType, icon: Mail, title: "E-mail Campagne", desc: "Schrijf overtuigende marketing e-mails.", placeholder: "Doel van de e-mail..." },
  { id: "ad_copy" as TaskType, icon: Image, title: "Ad Copy Generator", desc: "Creëer advertentieteksten voor Google en Meta.", placeholder: "Product of dienst..." },
  { id: "analysis" as TaskType, icon: BarChart3, title: "Analyse", desc: "Diepgaande marketing- en businessanalyse.", placeholder: "Wat wil je laten analyseren..." },
  { id: "product_copy" as TaskType, icon: Megaphone, title: "Productteksten", desc: "Overtuigende productteksten voor webshops.", placeholder: "Beschrijf je product..." },
  { id: "seo" as TaskType, icon: Search, title: "SEO Optimalisatie", desc: "Verbeter je vindbaarheid in zoekmachines.", placeholder: "Website of pagina om te optimaliseren..." },
  { id: "homepage_review" as TaskType, icon: Target, title: "Homepage Review", desc: "Krijg concrete verbeterpunten voor je homepage.", placeholder: "Beschrijf je homepage of plak de URL..." },
  { id: "strategy" as TaskType, icon: ClipboardList, title: "Strategie", desc: "Ontwikkel een concrete marketingstrategie.", placeholder: "Wat is je doel en doelgroep..." },
  { id: "action_plan" as TaskType, icon: ClipboardList, title: "Actieplan", desc: "Krijg een stapsgewijs uitvoerbaar plan.", placeholder: "Wat wil je bereiken..." },
];

const AITools = () => {
  const [activeTool, setActiveTool] = useState<TaskType | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastOutput, setLastOutput] = useState<{ output_id: string; status: string; risk_level: string } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || !activeTool) return;
    setGenerating(true);
    setResult("");
    setLastOutput(null);

    try {
      const response = await nvbAi.run({
        task_type: activeTool,
        input_text: prompt,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || "Geen resultaat ontvangen.");
      }

      setResult(response.data.output_text);
      setLastOutput({
        output_id: response.data.output_id,
        status: response.data.status,
        risk_level: response.data.risk_level,
      });
      toast.success("Content gegenereerd en opgeslagen!");
    } catch (err: any) {
      toast.error("Generatie mislukt: " + (err.message || "Onbekende fout"));
    } finally {
      setGenerating(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    toast.success("Gekopieerd naar klembord!");
  };

  if (activeTool) {
    const tool = tools.find((t) => t.id === activeTool)!;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setActiveTool(null); setResult(""); setPrompt(""); setLastOutput(null); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{tool.title}</h1>
            <p className="text-muted-foreground mt-1">{tool.desc}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder={tool.placeholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} className="gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "Genereren..." : "Genereer content"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Resultaat</CardTitle>
                {lastOutput && (
                  <CardDescription>
                    Status: {lastOutput.status} · Risico: {lastOutput.risk_level}
                  </CardDescription>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={copyResult} className="gap-2">
                <Copy className="w-4 h-4" /> Kopiëren
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">{result}</div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Tools</h1>
        <p className="text-muted-foreground mt-1">Genereer marketing content met de NVB AI Engine</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Card key={tool.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setActiveTool(tool.id)}>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <tool.icon className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{tool.title}</CardTitle>
              <CardDescription>{tool.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="gap-2">
                <Sparkles className="w-4 h-4" /> Start
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AITools;
