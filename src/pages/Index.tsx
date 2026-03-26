import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Zap, Target, TrendingUp, Shield, Globe, Check } from "lucide-react";
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

const plans = [
  {
    name: "Starter",
    price: "49",
    desc: "Perfect voor startende bureaus",
    features: ["1 platform", "Social Media tool", "2 teamleden", "E-mail support"],
    excluded: ["Geen documentexport", "Geen API toegang"],
    cta: "Start met Starter",
    popular: false,
  },
  {
    name: "Professional",
    price: "149",
    desc: "Voor groeiende marketingbureaus",
    features: ["5 platforms", "Alle AI tools", "10 teamleden", "PDF & Word export", "Prioriteit support"],
    excluded: ["Geen white-label", "Geen API toegang"],
    cta: "Start met Professional",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "399",
    desc: "Voor gevestigde bureaus op schaal",
    features: ["Onbeperkte platforms", "Alle AI tools", "Onbeperkt teamleden", "White-label", "API toegang", "Dedicated manager"],
    excluded: [],
    cta: "Start met Enterprise",
    popular: false,
  },
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
          <a href="#pricing">
            <Button variant="outline" size="lg">Bekijk prijzen</Button>
          </a>
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

    {/* Pricing */}
    <section id="pricing" className="py-20 px-4 bg-muted/30">
      <div className="container max-w-5xl">
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
          Transparante <span className="text-primary">prijzen</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12">Kies het plan dat past bij jouw bureau. Maandelijks opzegbaar.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]" : "border-border/50"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Populairst
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.desc}</p>
                <div className="pt-4">
                  <span className="text-4xl font-bold text-foreground">€{plan.price}</span>
                  <span className="text-muted-foreground">/maand</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.excluded.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground line-through">
                      <span className="w-4 h-4 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="w-full">
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
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
