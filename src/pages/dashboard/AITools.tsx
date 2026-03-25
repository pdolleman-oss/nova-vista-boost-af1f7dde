import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, FileText, MessageSquare, Mail, Image, Loader2, Copy, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const tools = [
  { id: "blog", icon: FileText, title: "Blog Generator", desc: "Genereer SEO-geoptimaliseerde blogartikelen met AI.", placeholder: "Onderwerp van je blog..." },
  { id: "social", icon: MessageSquare, title: "Social Media Posts", desc: "Maak social media content voor alle platformen.", placeholder: "Waar moet de post over gaan..." },
  { id: "email", icon: Mail, title: "E-mail Campagne", desc: "Schrijf overtuigende marketing e-mails.", placeholder: "Doel van de e-mail..." },
  { id: "ad", icon: Image, title: "Ad Copy Generator", desc: "Creëer advertentieteksten voor Google en Meta.", placeholder: "Product of dienst..." },
];

const AITools = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || !activeTool) return;
    setGenerating(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke("ai-content", {
        body: { toolType: activeTool, prompt },
      });

      if (error) throw error;
      setResult(data.result || "Geen resultaat ontvangen.");

      // Save to history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("chat_history").insert({
          user_id: user.id,
          tool_type: activeTool,
          prompt,
          result: data.result || "",
        });
      }
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
          <Button variant="ghost" size="icon" onClick={() => { setActiveTool(null); setResult(""); setPrompt(""); }}>
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
              <CardTitle className="text-lg">Resultaat</CardTitle>
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
        <p className="text-muted-foreground mt-1">Genereer marketing content met AI</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
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
