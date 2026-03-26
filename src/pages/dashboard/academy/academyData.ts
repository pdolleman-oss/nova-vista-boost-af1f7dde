import {
  Building2, TrendingUp, FileText, Wrench, Layers, PenTool, Headphones, Calculator
} from "lucide-react";

export interface Lesson {
  title: string;
  content: string;
  checklist?: string[];
  demoCase?: string;
}

export interface Module {
  title: string;
  icon: typeof Building2;
  desc: string;
  lessons: Lesson[];
}

export const modules: Module[] = [
  {
    title: "Fundament", icon: Building2, desc: "De basis van je bureau: positionering, branding en strategie.",
    lessons: [
      {
        title: "SOP 1: Brand Identity opzetten",
        content: "Definieer je merkidentiteit: missie, visie, waarden, tone of voice en visuele stijl. Dit is de basis voor alle communicatie. Begin met het formuleren van je kernwaarden — wat maakt jouw bureau anders? Documenteer alles in een brand guidelines-document dat je team en freelancers kunnen gebruiken.",
        checklist: ["Missie & visie geformuleerd", "Tone of voice bepaald", "Kleurenpalet & typografie vastgelegd", "Logo-varianten gemaakt", "Brand guidelines document opgesteld"],
        demoCase: "Demo-case: Bureau 'DigitalFirst' wilde zich herpositioneren van generalist naar specialist in e-commerce marketing. Ze definieerden hun missie als 'E-commerce bedrijven helpen 2x sneller te groeien met data-gedreven marketing'. Ze kozen een strakke, moderne visuele stijl met een donkerblauw/oranje kleurenpalet en een directe, resultaatgerichte tone of voice. Resultaat: binnen 3 maanden 40% meer gekwalificeerde leads door helderere positionering."
      },
      {
        title: "SOP 2: Doelgroep & ICP definiëren",
        content: "Bepaal je Ideal Customer Profile (ICP). Wie zijn je ideale klanten? Welke pijnpunten hebben ze? Waar bevinden ze zich online? Maak minimaal 3 gedetailleerde buyer personas met demografische data, gedragspatronen, doelen en frustraties. Gebruik interviews met bestaande klanten als basis.",
        checklist: ["ICP-profiel ingevuld", "3-5 buyer personas gemaakt", "Pijnpunten en behoeften geïdentificeerd", "Online kanalen van doelgroep in kaart gebracht"],
        demoCase: "Demo-case: Bureau 'GrowthLab' analyseerde hun 10 meest winstgevende klanten en ontdekte dat 80% B2B SaaS-bedrijven waren met 20-100 medewerkers, een marketingbudget van €5K-15K/maand, en een CEO die zelf de marketingbeslissingen nam. Door hun ICP hierop aan te passen en content te maken die specifiek deze doelgroep aansprak, steeg hun conversie van website-bezoek naar discovery call van 1.2% naar 4.8%."
      },
      {
        title: "SOP 3: Concurrentieanalyse uitvoeren",
        content: "Analyseer minimaal 5 concurrenten op diensten, prijzen, positionering en online aanwezigheid. Gebruik tools als SEMrush, Ahrefs en SimilarWeb. Documenteer per concurrent: sterke/zwakke punten, prijsniveau, unieke propositie, contentaanpak en klantreviews.",
        checklist: ["5 concurrenten geïdentificeerd", "SWOT-analyse per concurrent", "Pricing benchmark uitgevoerd", "Unieke differentiators vastgesteld"],
        demoCase: "Demo-case: Bureau 'MarketPro' deed een grondige concurrentieanalyse en ontdekte dat alle 5 concurrenten zich richtten op 'full-service marketing'. Geen enkele concurrent bood een gespecialiseerde LinkedIn Ads-dienst aan. MarketPro positioneerde zich als dé LinkedIn Ads-specialist voor B2B, verhoogde hun prijzen met 30%, en zag hun close rate stijgen van 15% naar 35% omdat prospects hen als expert zagen."
      },
      {
        title: "SOP 4: Serviceportfolio samenstellen",
        content: "Ontwikkel een helder dienstenaanbod met pakketten en pricing die aansluiten bij je ICP. Creëer 3 duidelijke pakketten (basis, pro, enterprise) met stijgende waarde. Definieer per pakket: deliverables, tijdsinvestering, tools, en verwachte resultaten.",
        checklist: ["Diensten gedefinieerd", "3 pakketten samengesteld (basis, pro, enterprise)", "Prijsmodel bepaald", "Upsell-mogelijkheden geïdentificeerd"],
        demoCase: "Demo-case: Bureau 'ScaleUp Agency' bood eerst alles à la carte aan, wat leidde tot eindeloze offertetrajecten. Na het samenstellen van 3 pakketten — Starter (€1.500/m: SEO + content), Growth (€3.500/m: + advertising + reporting) en Enterprise (€7.500/m: + strategy + dedicated manager) — daalde hun offertetijd van 2 weken naar 2 dagen. 70% van de klanten koos het Growth-pakket, precies zoals gepland."
      },
    ],
  },
  {
    title: "Sales", icon: TrendingUp, desc: "Leadgeneratie, acquisitie en closing-technieken.",
    lessons: [
      {
        title: "SOP 5: Outbound prospecting workflow",
        content: "Systematische aanpak voor het benaderen van prospects via e-mail, LinkedIn en telefoon. Bouw een herhaalbaar proces: identificeer 50+ prospects per week, segmenteer op pijnpunt, personaliseer je bericht per segment, en volg een vast cadans (dag 1: e-mail, dag 3: LinkedIn, dag 7: follow-up, dag 14: telefoon).",
        checklist: ["Target list opgesteld (min. 50 prospects)", "E-mail templates geschreven (intro, follow-up, break-up)", "LinkedIn connectieverzoek template gemaakt", "Belscript opgesteld", "CRM-pipeline ingericht"],
        demoCase: "Demo-case: Bureau 'LeadGen Pro' implementeerde een 5-staps outbound cadans voor webshops met >€1M omzet. Week 1: personalized e-mail met audit-inzicht, Week 2: LinkedIn connectie + voice note, Week 3: follow-up e-mail met case study, Week 4: telefonisch contact, Week 5: break-up e-mail. Resultaat: 12% reply rate, 4% booking rate, gemiddeld 6 discovery calls per maand uit een lijst van 150 prospects."
      },
      {
        title: "SOP 6: Discovery call checklist",
        content: "Structuur voor het eerste gesprek met een prospect. Begin met rapport opbouwen (2 min), dan situatievragen (5 min), probleemvragen (10 min), implicatievragen (5 min), en oplossingsverkenning (8 min). Eindig altijd met een concrete next step. Gebruik de SPIN-methode voor gestructureerde behoefteanalyse.",
        checklist: ["Rapport-opbouw vragen voorbereid", "SPIN-vragen opgesteld", "Budget-kwalificatie vragen klaar", "Timeline en decision-making proces vragen", "Volgende stappen template"],
        demoCase: "Demo-case: Bureau 'ConvertFlow' gebruikte een vaste discovery call structuur met vooraf gedeelde agenda. Door de SPIN-vragen systematisch toe te passen, ontdekten ze dat 60% van de prospects niet hun oorspronkelijke pijnpunt als belangrijkste probleem had. De echte pijn zat vaak dieper (bijv. niet 'we willen meer traffic' maar 'onze sales funnel converteert niet'). Door dit bloot te leggen steeg hun close rate van 20% naar 38%."
      },
      {
        title: "SOP 7: Inbound leadgeneratie",
        content: "Strategieën voor het aantrekken van inbound leads via content, SEO en social media. Creëer een lead magnet (e-book, template, audit-tool) die een specifiek probleem van je ICP oplost. Bouw een landingspagina met duidelijke CTA, koppel aan een e-mail nurture sequence van 5-7 mails, en retarget bezoekers via Meta en LinkedIn.",
        checklist: ["Lead magnet gecreëerd", "Landing page live", "E-mail nurture sequence gemaakt", "Retargeting campagne opgezet"],
        demoCase: "Demo-case: Bureau 'InboundWorks' creëerde een gratis 'Website Audit Scorecard' als lead magnet. Bezoekers vulden hun URL in en ontvingen een automatisch rapport met 10 verbeterpunten. Na download volgde een 5-delige e-mail serie met verdiepende tips, eindigend in een aanbod voor een gratis strategiegesprek. Maandelijks 80+ downloads, 15% boekte een gesprek, 30% daarvan werd klant. CAC: €180 per klant vs. €650 via cold outreach."
      },
      {
        title: "SOP 8: Closing & negotiation",
        content: "Technieken voor het sluiten van deals en omgaan met bezwaren. Bereid je voor op de 5 meest voorkomende bezwaren: te duur, moeten overleggen, niet het juiste moment, doen het intern, en concurrent is goedkoper. Gebruik de 'feel-felt-found' methode en creëer urgentie zonder druk.",
        checklist: ["Bezwaren-document opgesteld", "Urgentie-triggers geïdentificeerd", "Contract template gemaakt", "Onboarding flow voorbereid"],
        demoCase: "Demo-case: Bureau 'CloseDeal' verloor 40% van deals in de 'offerte verstuurd'-fase. Na analyse bleek dat prospects gemiddeld 3 weken wachtten. Ze implementeerden: (1) live proposal walkthrough ipv PDF mailen, (2) een vervaldatum van 14 dagen op offertes, (3) een 'quick-start bonus' bij tekenen binnen 7 dagen. Resultaat: gemiddelde beslissingstijd daalde van 21 naar 9 dagen, close rate steeg van 25% naar 42%."
      },
    ],
  },
  {
    title: "Offertes", icon: FileText, desc: "Professionele offertes en proposals die converteren.",
    lessons: [
      {
        title: "SOP 9: Offerte template & structuur",
        content: "Standaard offerte-template met executive summary, probleemdefinitie, voorgestelde aanpak, timeline, investering en garanties. De executive summary is het belangrijkste deel — hier vat je samen waarom deze prospect bij jou moet zijn. Gebruik visuele elementen en houd het onder 10 pagina's.",
        checklist: ["Template ontworpen", "Executive summary sectie", "Scope of work sectie", "Pricing tabel", "Terms & conditions"],
        demoCase: "Demo-case: Bureau 'ProposalPro' A/B-testte twee offerte-stijlen: een traditioneel Word-document (10 pagina's, zwart-wit) vs. een visueel aantrekkelijk format (6 pagina's, branded, met infographics en een ROI-calculator). Het visuele format had een 55% hogere close rate. De executive summary werd nu persoonlijk per prospect geschreven met referenties naar hun discovery call. Gemiddelde dealwaarde steeg met 20% omdat klanten het professioneler ervoeren."
      },
      {
        title: "SOP 10: Pricing strategieën",
        content: "Value-based pricing, project-based vs retainer, en hoe je je prijzen verdedigt. Stop met uurtje-factuurtje en switch naar waarde-gebaseerde pricing. Bereken de ROI die je voor de klant genereert en prijs je diensten als percentage daarvan. Bied altijd 3 opties aan (anchor pricing).",
        checklist: ["Value-based pricing model opgesteld", "Retainer-opties gedefinieerd", "ROI-calculator gemaakt", "Prijsverdedigings-script"],
        demoCase: "Demo-case: Bureau 'ValueFirst' factureerde voorheen €85/uur. Na een switch naar value-based pricing voor een e-commerce klant: 'Onze Google Ads-campagnes genereren gemiddeld 5x ROAS. Bij een advertentiebudget van €10K/maand is dat €50K omzet. Onze fee van €3.000/maand is 6% van de gegenereerde omzet.' De klant zag dit als een no-brainer. Het bureau verdubbelde hun marges terwijl klanten gelukkiger waren vanwege het resultaatfocus."
      },
      {
        title: "SOP 11: Case studies maken",
        content: "Maak overtuigende case studies met resultaten, testimonials en visuele bewijslast. Gebruik de STAR-methode: Situatie (uitgangspositie klant), Taak (de opdracht), Actie (wat je hebt gedaan), Resultaat (meetbare uitkomsten). Voeg altijd screenshots, grafieken en quotes toe.",
        checklist: ["Template voor case study", "3 klantresultaten gedocumenteerd", "Before/after metrics verzameld", "Testimonials verzameld"],
        demoCase: "Demo-case: Bureau 'ResultDriven' maakte een case study voor hun beste klant: 'Hoe we de online omzet van [Webshop X] in 6 maanden met 180% verhoogden.' Structuur: uitgangssituatie (€30K/m omzet, geen SEO, slechte ad performance), aanpak (SEO-audit, contentplan, Google Ads optimalisatie), resultaten (€84K/m omzet, 320% ROI). Met grafieken, screenshots van Analytics en een video-testimonial van de CEO. Deze ene case study genereerde 12 inbound leads in 2 maanden."
      },
      {
        title: "SOP 12: Proposal follow-up workflow",
        content: "Gestructureerde follow-up na het versturen van een offerte. De meeste deals worden niet verloren door een slecht aanbod, maar door gebrek aan follow-up. Implementeer een vast schema: dag 1 (bevestiging + video walkthrough), dag 3 (check-in), dag 7 (waarde toevoegen met extra inzicht), dag 14 (urgentie + alternatief aanbod).",
        checklist: ["Follow-up schema (dag 1, 3, 7, 14)", "E-mail templates per follow-up moment", "Escalatie-procedure bij geen reactie"],
        demoCase: "Demo-case: Bureau 'FollowUp Masters' analyseerde 100 verstuurde offertes. 35% werd nooit beantwoord. Na implementatie van een 4-staps follow-up: (1) Dag 1: Loom-video walkthrough van offerte, (2) Dag 3: 'Nog vragen?'-mail met extra case study, (3) Dag 7: LinkedIn bericht met relevant artikel, (4) Dag 14: 'Last chance'-mail met aangepast mini-pakket. Resultaat: non-response daalde van 35% naar 8%, 15% extra deals gesloten."
      },
    ],
  },
  {
    title: "Delivery", icon: Wrench, desc: "Projectmanagement en kwaliteitsborging bij oplevering.",
    lessons: [
      {
        title: "SOP 13: Klant-onboarding proces",
        content: "Gestructureerde onboarding: welkomstmail, kickoff-call, toegang tot tools en planning. De eerste 48 uur bepalen de klanttevredenheid voor de komende maanden. Stuur binnen 2 uur een welkomstpakket, plan de kickoff binnen 3 dagen, en lever het eerste kleine resultaat binnen week 1.",
        checklist: ["Welkomstmail template", "Kickoff-agenda template", "Toegang tot projecttools ingericht", "Timeline en milestones vastgelegd", "Communicatiekanalen bepaald"],
        demoCase: "Demo-case: Bureau 'OnboardPro' had een churn rate van 25% in de eerste 3 maanden. Na implementatie van een gestandaardiseerde onboarding: (1) Automatische welkomstmail met branded video, (2) Kickoff-call met vaste agenda en gedeeld Notion-board, (3) Week 1: quick-win oplevering (bijv. website speed fix), (4) Wekelijkse check-ins eerste maand. Churn in eerste 3 maanden daalde naar 5%. NPS steeg van 32 naar 67."
      },
      {
        title: "SOP 14: Projectmanagement workflow",
        content: "Gebruik van projecttools, sprints, en statusupdates voor een soepele oplevering. Werk in 2-wekelijkse sprints met duidelijke deliverables. Gebruik een tool als ClickUp of Asana met vaste kolommen: Backlog, In Progress, Review, Done. Stuur elke vrijdag een korte status-update.",
        checklist: ["Projecttool ingericht (Trello/Asana/ClickUp)", "Sprint-planning template", "Wekelijkse status-update template", "Quality checklist per deliverable"],
        demoCase: "Demo-case: Bureau 'SprintAgency' werkte met losse e-mails en vergat regelmatig deadlines. Na implementatie van ClickUp met 2-wekelijkse sprints: elke maandag sprint planning (30 min), elke vrijdag een geautomatiseerde status-mail naar de klant met voltooide taken en resultaten. Missed deadlines daalde van 30% naar 3%. Klanten gaven aan zich 'veel beter geïnformeerd' te voelen zonder extra meetings."
      },
      {
        title: "SOP 15: Kwaliteitscontrole (QA)",
        content: "Checklists voor het controleren van deliverables voordat ze naar de klant gaan. Elke deliverable doorloopt een QA-proces: (1) zelfcontrole door maker, (2) peer review door collega, (3) klant-preview met feedbackoptie. Documenteer je QA-standaarden per type deliverable.",
        checklist: ["QA-checklist per type deliverable", "Peer review proces", "Klant-goedkeuringsworkflow", "Revisie-beleid gedocumenteerd"],
        demoCase: "Demo-case: Bureau 'QualityFirst' leverde regelmatig content met tikfouten en verkeerde links. Na het invoeren van een QA-checklist (spelling, links, SEO-check, mobile preview, brand consistency) en verplichte peer review, daalde het aantal revisie-rondes van gemiddeld 3.2 naar 1.1 per deliverable. Klanttevredenheid op deliverables steeg van 7.2 naar 9.1."
      },
      {
        title: "SOP 16: Klantcommunicatie protocol",
        content: "Richtlijnen voor professionele communicatie met klanten. Stel duidelijke verwachtingen: reactietijd max 4 uur op werkdagen, maandelijkse rapportage op vaste dag, escalatieprocedure bij problemen. Gebruik een gedeeld kanaal (Slack/Teams) voor dagelijkse communicatie en e-mail voor formele zaken.",
        checklist: ["Reactietijd-normen vastgesteld", "Escalatieprocedure gedocumenteerd", "Maandelijkse rapportage template", "NPS/feedback formulier"],
        demoCase: "Demo-case: Bureau 'CommFlow' had klachten over trage communicatie. Ze implementeerden: (1) Slack-kanaal per klant met max 4u reactietijd, (2) Maandelijkse video-rapportage (Loom, 5 min) ipv PDF, (3) Kwartaal NPS-meting met follow-up bij score <8, (4) Escalatie: probleem → teamlead (1u) → directie (4u). Klanttevredenheid steeg van 6.8 naar 8.9, zero klanten verloren door communicatieproblemen in 12 maanden."
      },
    ],
  },
  {
    title: "Techniek", icon: Layers, desc: "Technische marketing: tracking, automation en tools.",
    lessons: [
      {
        title: "SOP 17: Analytics & tracking setup",
        content: "Google Analytics 4, Tag Manager, conversietracking en event-tracking correct implementeren. Begin met een measurement plan: welke KPI's wil je meten? Stel GA4 in via GTM, configureer conversiedoelen (form submits, aankopen, calls), en bouw een dashboard dat je wekelijks met de klant deelt.",
        checklist: ["GA4 account opgezet", "GTM container geïnstalleerd", "Conversiedoelen ingesteld", "UTM-parameter strategie", "Dashboard met KPI's gemaakt"],
        demoCase: "Demo-case: Bureau 'TrackAll' ontdekte bij een klant-audit dat 60% van de conversies niet gemeten werd (telefoonverkeer, chat, cross-device). Na een volledige tracking setup met GTM, call tracking (CallRail), en enhanced conversions in Google Ads, bleek de werkelijke ROAS 3.2x te zijn ipv de gerapporteerde 1.4x. De klant verhoogde hun advertentiebudget met 80% op basis van de juiste data."
      },
      {
        title: "SOP 18: Marketing automation",
        content: "E-mail automation flows, lead scoring en CRM-integraties opzetten. Bouw minimaal 4 flows: welkom-serie (5 mails), lead nurture (7 mails), onboarding (3 mails), en win-back (3 mails). Implementeer lead scoring gebaseerd op engagement en fit-criteria.",
        checklist: ["E-mail automation tool gekozen", "Welcome flow gemaakt", "Lead scoring model opgesteld", "CRM-integratie geconfigureerd"],
        demoCase: "Demo-case: Bureau 'AutomateNow' implementeerde een lead scoring systeem voor een B2B SaaS-klant. Scoring: website bezoek (+5), whitepaper download (+15), pricing pagina (+25), demo aanvraag (+50). Leads met score >60 werden automatisch doorgestuurd naar sales. Resultaat: sales besteedde 40% minder tijd aan ongekwalificeerde leads, en de gemiddelde deal-cycle daalde van 45 naar 28 dagen."
      },
      {
        title: "SOP 19: SEO technische audit",
        content: "Technische SEO-checklist: site speed, mobile-first, structured data, crawlability. Voer een volledige technische audit uit met Screaming Frog, PageSpeed Insights en Search Console. Prioriteer fixes op impact: Core Web Vitals, indexeringsproblemen, duplicate content, broken links.",
        checklist: ["PageSpeed Insights check", "Mobile-friendly test", "Structured data geïmplementeerd", "XML sitemap & robots.txt gecheckt", "Core Web Vitals geoptimaliseerd"],
        demoCase: "Demo-case: Bureau 'TechSEO' auditte een webshop met 5.000 producten. Bevindingen: LCP 6.2s (slecht), 1.200 404-pagina's, geen structured data, duplicate meta descriptions op 80% van producten. Na fixes: LCP naar 1.8s, alle 404's redirect, ProductSchema op alle producten, unieke meta's. Resultaat: organisch verkeer +120% in 4 maanden, 340 nieuwe keywords in top 10."
      },
      {
        title: "SOP 20: Advertising pixel setup",
        content: "Facebook Pixel, LinkedIn Insight Tag, Google Ads tag en server-side tracking. Implementeer alle pixels via GTM voor betere controle. Configureer custom audiences (website bezoekers, converters, lookalikes) en zet server-side tracking op voor betere datakwaliteit na iOS 14.",
        checklist: ["Facebook Pixel geïnstalleerd", "LinkedIn Insight Tag actief", "Google Ads tag geconfigureerd", "Custom audiences aangemaakt"],
        demoCase: "Demo-case: Bureau 'PixelPerfect' switchte een klant van browser-side naar server-side tracking via Google Tag Manager Server-Side. Gemeten conversies stegen met 35% doordat server-side tracking niet geblokkeerd werd door adblockers en iOS privacy-instellingen. Facebook ROAS rapportage ging van 1.8x naar 2.9x, waardoor het advertentiebudget verantwoord verhoogd kon worden."
      },
    ],
  },
  {
    title: "Content", icon: PenTool, desc: "Contentstrategie, productie en distributie.",
    lessons: [
      {
        title: "SOP 21: Contentstrategie ontwikkelen",
        content: "Bouw een contentstrategie gebaseerd op pillar content, clusters en een contentkalender. Identificeer 3-5 pillar topics die aansluiten bij je diensten en je ICP's zoekvragen. Creëer per pillar een uitgebreid artikel (2000+ woorden) en 5-10 cluster-artikelen die intern linken.",
        checklist: ["Content pillars gedefinieerd (3-5)", "Topic clusters per pillar", "Contentkalender gemaakt (3 maanden)", "Distributiekanalen bepaald"],
        demoCase: "Demo-case: Bureau 'ContentKing' definieerde 4 pillars voor een HR-tech klant: 'Recruitment Marketing', 'Employer Branding', 'HR Analytics', 'Employee Experience'. Per pillar: 1 ultimate guide (3000 woorden), 8 cluster-artikelen, en 4 social posts. Na 6 maanden: organisch verkeer +200%, 45 keywords in top 3, en de pillar pages genereerden 60% van alle demo-aanvragen."
      },
      {
        title: "SOP 22: Blog & SEO content",
        content: "Schrijf SEO-geoptimaliseerde content die rankt en converteert. Gebruik een vaste content brief: target keyword, zoekintentie, SERP-analyse, headingstructuur, interne links, CTA. Elk artikel moet een duidelijke volgende stap bieden (lead magnet, demo, contact).",
        checklist: ["Keyword research uitgevoerd", "Content brief template", "SEO-checklist per artikel", "Interne linking strategie"],
        demoCase: "Demo-case: Bureau 'RankWriter' produceerde 4 SEO-artikelen per maand voor een SaaS-klant. Elke brief bevatte: primair keyword (volume + difficulty), 3 secundaire keywords, top-5 SERP-analyse, voorgestelde headings, en 2 interne links. Na 8 maanden: 28 van 32 artikelen rankten in top 10, organisch verkeer steeg van 2K naar 18K/maand, en blog-bezoekers converteerden 3x beter dan paid traffic."
      },
      {
        title: "SOP 23: Social media management",
        content: "Consistente social media aanwezigheid met templates, planning en community management. Kies max 3 kanalen waar je ICP actief is. Creëer content templates per format (carousel, video, poll, article). Plan minimaal 2 weken vooruit en reageer binnen 2 uur op comments.",
        checklist: ["Content templates per platform", "Posting schema gemaakt", "Hashtag strategie", "Community management protocol"],
        demoCase: "Demo-case: Bureau 'SocialScale' beheerde LinkedIn voor een consultancy. Strategie: 3x/week posten (maandag: thought leadership, woensdag: case study/resultaat, vrijdag: persoonlijk verhaal). Templates in Canva, planning via Buffer, hashtag-sets per contenttype. Na 4 maanden: 500% groei in impressies, 12 inbound leads via DM, en de founder werd uitgenodigd als spreker op 3 events."
      },
      {
        title: "SOP 24: Video & visual content",
        content: "Video-productie workflow: van script tot publicatie. Begin met een 1-minuut concept: wat is de hook, het probleem, en de CTA? Neem op met goede belichting en audio. Edit kort en krachtig. Publiceer op YouTube (SEO) en hergebruik als Reels, Shorts en LinkedIn clips.",
        checklist: ["Video script template", "Productie-checklist", "Thumbnail ontwerp template", "Video SEO optimalisatie"],
        demoCase: "Demo-case: Bureau 'VideoFirst' produceerde wekelijks 1 YouTube-video (8-12 min) met tips voor webshop-eigenaren. Script template: hook (15 sec) → probleem (1 min) → 3 tips (6 min) → CTA (30 sec). Elke video werd geknipt tot 3 Reels en 2 LinkedIn-clips. Na 6 maanden: 2.500 subscribers, 45K views/maand, en YouTube werd de #2 bron van inbound leads (na Google organisch)."
      },
    ],
  },
  {
    title: "Service", icon: Headphones, desc: "Klantbehoud, upselling en klanttevredenheid.",
    lessons: [
      {
        title: "SOP 25: Maandelijkse rapportage",
        content: "Gestructureerde maandrapportages met KPI's, inzichten en aanbevelingen. Gebruik een vast format: executive summary (3 zinnen), KPI-dashboard (traffic, conversies, ROI), highlights & lowlights, inzichten & learnings, plan volgende maand. Lever altijd op dezelfde dag.",
        checklist: ["Rapportage template ontworpen", "KPI-dashboard per klant", "Inzichten & aanbevelingen sectie", "Volgende maand planning"],
        demoCase: "Demo-case: Bureau 'ReportMasters' switchte van PDF-rapportages naar interactieve Loom-video's (5 min) met een gedeeld Google Data Studio dashboard. Format: 1 min highlights, 2 min KPI-walkthrough, 1 min inzichten, 1 min next month plan. Klanttevredenheid op rapportages steeg van 6.5 naar 9.2. 80% van de klanten keek de video dezelfde dag, vs. 30% die de PDF opende."
      },
      {
        title: "SOP 26: Klantretentie strategie",
        content: "Strategieën om churn te verminderen en klanttevredenheid te verhogen. Meet NPS elke kwartaal, doe proactieve check-ins, identificeer churn-signalen vroegtijdig (dalend engagement, minder communicatie, uitgestelde betalingen). Plan Quarterly Business Reviews voor je top-klanten.",
        checklist: ["NPS-meting ingevoerd", "Quarterly Business Review agenda", "Klant-health score model", "Proactieve check-in schema"],
        demoCase: "Demo-case: Bureau 'RetainMore' had een jaarlijkse churn van 35%. Na implementatie van een health score systeem (groen/oranje/rood) gebaseerd op: communicatiefrequentie, resultaten vs. targets, betalingsgedrag, en NPS-score. 'Oranje' klanten kregen automatisch een check-in call van de accountmanager. 'Rode' klanten kregen een directie-escalatie binnen 48u. Churn daalde naar 12% binnen een jaar."
      },
      {
        title: "SOP 27: Upselling & cross-selling",
        content: "Identificeer upsell-mogelijkheden en voer ze effectief uit. De beste upsell komt voort uit resultaten: als je kunt laten zien dat een extra investering meer oplevert, is het een service — geen verkooptruc. Timing: na een succesvolle milestone, in de QBR, of bij contractverlenging.",
        checklist: ["Upsell-triggers geïdentificeerd", "Cross-sell matrix gemaakt", "Upsell-pitch templates", "Timing-strategie vastgelegd"],
        demoCase: "Demo-case: Bureau 'GrowthPartner' creëerde een cross-sell matrix: SEO-klanten kregen na 3 maanden een content-upsell aanbod, Ads-klanten een CRO-audit, en content-klanten een social media add-on. De upsell werd altijd gepresenteerd als: 'Op basis van jullie resultaten zien we een kans om [X] te bereiken door [Y] toe te voegen.' Gemiddelde klantwaarde steeg met 45% na implementatie, en 60% van upsells werd geaccepteerd."
      },
      {
        title: "SOP 28: Klacht- en escalatiemanagement",
        content: "Professioneel omgaan met klachten en escalaties. Elke klacht is een kans om de relatie te versterken. Protocol: (1) erken binnen 2 uur, (2) onderzoek de oorzaak binnen 24 uur, (3) communiceer de oplossing binnen 48 uur, (4) volg op na 1 week. Documenteer elke klacht voor procesverbetering.",
        checklist: ["Klachtenprotocol gedocumenteerd", "Escalatie-niveaus gedefinieerd", "Compensatie-richtlijnen", "Root cause analysis template"],
        demoCase: "Demo-case: Bureau 'ServicePro' kreeg een klacht van hun grootste klant over een gemiste campagnedeadline. Reactie: (1) Binnen 1 uur erkenning + persoonlijk telefoontje van directie, (2) Root cause: onderbezetting door ziekte zonder backup, (3) Oplossing: campagne live binnen 24u + gratis extra A/B test als compensatie, (4) Structureel: buddy-systeem ingevoerd zodat elke account 2 contactpersonen heeft. Klant verlengde contract met 2 jaar."
      },
    ],
  },
  {
    title: "Administratie", icon: Calculator, desc: "Facturatie, contracten en financieel beheer.",
    lessons: [
      {
        title: "SOP 29: Facturatie & betalingsflow",
        content: "Gestroomlijnde facturatie met automatische herinneringen en betalingsopvolging. Factureer op vaste momenten (1e van de maand voor retainers, bij milestone voor projecten). Stel automatische herinneringen in op dag 7, 14 en 28 na vervaldatum. Bied iDEAL en automatische incasso aan.",
        checklist: ["Factuur template gemaakt", "Automatische herinneringen ingesteld", "Betalingstermijnen vastgelegd", "Incassoprotocol"],
        demoCase: "Demo-case: Bureau 'CashFlow' had gemiddeld €45K uitstaand met een gemiddelde betaaltermijn van 38 dagen. Na implementatie van: (1) Mollie iDEAL betaallink op elke factuur, (2) automatische herinnering dag 3, 7, 14, (3) persoonlijk telefoontje bij 21 dagen, (4) opschorting diensten bij 30 dagen. Resultaat: gemiddelde betaaltermijn daalde naar 11 dagen, uitstaand bedrag naar €12K."
      },
      {
        title: "SOP 30: Contractbeheer",
        content: "Standaard contracten, SLA's en juridische dekking. Gebruik een standaard dienstverleningscontract met duidelijke scope, termijn, opzegtermijn, aansprakelijkheid en IP-rechten. Voeg een SLA toe voor retainerklanten met gegarandeerde reactietijden en uptime percentages.",
        checklist: ["Standaard dienstverleningscontract", "SLA-template", "NDA-template", "Verwerkersovereenkomst (AVG)"],
        demoCase: "Demo-case: Bureau 'LegalReady' werkte 2 jaar zonder contracten en kreeg een geschil over intellectueel eigendom van een website. Na juridisch advies: (1) standaardcontract met IP-clausule (IP gaat over bij volledige betaling), (2) verwerkersovereenkomst voor AVG-compliance, (3) SLA met 99% uptime garantie voor hosting-klanten. Investering: €2.500 voor juridisch advies. Besparing: onschatbaar aan risicoreductie."
      },
      {
        title: "SOP 31: Financieel dashboard",
        content: "Inzicht in omzet, kosten, marges en forecasting. Bouw een dashboard met: MRR (monthly recurring revenue), churn rate, gemiddelde klantwaarde, CAC (customer acquisition cost), LTV (lifetime value), en bruto/nettomarge per dienst. Review maandelijks en stuur bij op basis van trends.",
        checklist: ["MRR/ARR tracking opgezet", "Kostenposten gecategoriseerd", "Margeberekening per dienst", "Kwartaal-forecast model"],
        demoCase: "Demo-case: Bureau 'NumbersClear' had geen financieel overzicht en ontdekte na analyse dat hun SEO-dienst een marge van 65% had, terwijl social media management slechts 15% opleverde door hoge contentkosten. Actie: (1) social media pricing +40%, (2) video-content deels ge-outsourced, (3) focus op verkoop van SEO-pakketten. Binnen 6 maanden steeg de overall marge van 28% naar 45%, en de MRR groeide van €32K naar €48K."
      },
    ],
  },
];
