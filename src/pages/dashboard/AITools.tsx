import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, MessageSquare, Mail, Image } from "lucide-react";

const tools = [
  { icon: FileText, title: "Blog Generator", desc: "Genereer SEO-geoptimaliseerde blogartikelen met AI.", action: "Genereer blog" },
  { icon: MessageSquare, title: "Social Media Posts", desc: "Maak social media content voor alle platformen.", action: "Maak post" },
  { icon: Mail, title: "E-mail Campagne", desc: "Schrijf overtuigende marketing e-mails.", action: "Schrijf e-mail" },
  { icon: Image, title: "Ad Copy Generator", desc: "Creëer advertentieteksten voor Google en Meta.", action: "Maak advertentie" },
];

const AITools = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold">AI Tools</h1>
      <p className="text-muted-foreground mt-1">Genereer marketing content met AI</p>
    </div>

    <div className="grid sm:grid-cols-2 gap-4">
      {tools.map((tool) => (
        <Card key={tool.title} className="hover:border-primary/30 transition-colors">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <tool.icon className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{tool.title}</CardTitle>
            <CardDescription>{tool.desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" /> {tool.action}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default AITools;
