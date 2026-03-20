import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BarChart3, Zap, Target, TrendingUp, Shield, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const features = [
  { icon: Zap, title: "AI Content Generator", desc: "Genereer blogs, social media posts en advertenties in seconden." },
  { icon: Target, title: "Lead Prospecting", desc: "Vind en analyseer potentiële klanten automatisch." },
  { icon: BarChart3, title: "Website Audit", desc: "Scan websites en ontdek marketing-kansen voor je prospects." },
  { icon: TrendingUp, title: "Campagne Optimalisatie", desc: "Optimaliseer je campagnes met data-gedreven AI inzichten." },
  { icon: Shield, title: "Brand Monitoring", desc: "Monitor je merk en concurrenten in real-time." },
  { icon: Globe, title: "Multi-channel", desc: "Beheer al je kanalen vanuit één dashboard." },
];

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* Hero */}
    <section className="pt-32 pb-20 px-4">
      <div className="container max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
          <Zap className="w-3.5 h-3.5" /> AI-Powered Marketing Platform
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
          Versnel je groei met{" "}
          <span className="text-primary">AI Marketing</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Automatiseer je marketing, genereer content en vind nieuwe klanten. 
          Nova Vista Boost is het all-in-one platform voor slimme groei.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              Gratis starten <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="lg">Demo bekijken</Button>
          </Link>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="py-20 px-4">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
          Alles wat je nodig hebt voor <span className="text-primary">groei</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 px-4">
      <div className="container max-w-2xl text-center">
        <h2 className="text-3xl font-bold mb-4 text-foreground">Klaar om te groeien?</h2>
        <p className="text-muted-foreground mb-8">Start vandaag nog gratis en ontdek hoe AI je marketing kan versnellen.</p>
        <Link to="/auth">
          <Button size="lg" className="gap-2">
            Start gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>

    <Footer />
  </div>
);

export default Index;
