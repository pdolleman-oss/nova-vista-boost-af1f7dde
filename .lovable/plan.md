# Read-only audit: AIdiensten.com

**Status:** uitsluitend geanalyseerd. Er is niets gewijzigd of gepubliceerd.

## Afbakening en belangrijkste constatering

Er zijn twee verschillende producten onderzocht:

1. **Dit NVB-project** (`nova-vista-boost.lovable.app`): een React-klantportaal met één openbare marketingpagina en verder login/dashboardroutes.
2. **AIdiensten.com**: stuurt permanent door naar `https://novavistaprogressus.nl`. De publiek vindbare website staat dus niet in deze repository.

Daardoor kunnen wijzigingen in dit NVB-project AIdiensten.com niet beter laten ranken zolang DNS/hosting en de 301-doorverwijzing naar de andere website ongewijzigd blijven.

## 1. Bestaande pagina's en routes

### Huidige NVB-code

Openbaar:
- `/` — algemene Nova Vista Boost-landingspagina
- `/auth` — inloggen/registreren
- `/reset-password` — wachtwoordherstel
- `*` — 404

Achter login onder `/dashboard`:
- `/dashboard`
- `/dashboard/leads`
- `/dashboard/pipeline`
- `/dashboard/audits`
- `/dashboard/ai-tools`
- `/dashboard/social`
- `/dashboard/social/health`
- `/dashboard/social/health/:connectionId`
- `/dashboard/publish-settings`
- `/dashboard/content`
- `/dashboard/content/overview`
- `/dashboard/academy`
- `/dashboard/settings`
- `/dashboard/users`

Bron: `src/App.tsx:33-52`.

### Live website waar AIdiensten.com naartoe verwijst

In sitemap en navigatie bevestigd:
- `/`
- `/ai-training-bedrijven`
- `/ai-bedrijfsscan`
- `/boeken/onder-de-motorkap-van-chatgpt`
- `/boeken/onder-de-motorkap-van-chatgpt/feedback`
- `/tarieven`
- `/over-mij`
- `/contact`
- `/privacy`
- `/voorwaarden`

Niet aanwezig (404):
- `/quickscan`
- `/ai-advies-mkb`
- `/ai-implementatie-mkb`

## 2. Technische SEO

### Live website: sterke basis

- Server-rendered Nederlandstalige HTML; inhoud is zonder JavaScript leesbaar.
- Homepage heeft één H1: **“AI die werkt binnen uw organisatie.”**
- Unieke titles/descriptions/canonicals op de onderzochte pagina's.
- `robots.txt` staat crawlen toe en verwijst naar de sitemap.
- `sitemap.xml` bevat tien openbare URL's.
- Organization-schema is aanwezig; de bedrijfsscan heeft aanvullend Service + Offer (€495) schema.
- Goede interne hoofdnavigatie naar training, bedrijfsscan, boek, tarieven, over en contact.

### Live website: zwakke punten

- `aidiensten.com` is geen indexeerbare hoofdsite: HTTP/HTTPS en www verwijzen met 301 naar `novavistaprogressus.nl`. Canonicals en schema noemen eveneens alleen Nova Vista Progressus. Zoekmachines zullen daarom de bestemmingssite indexeren, niet AIdiensten.com.
- Rechtstreeks HTTPS-opvragen van AIdiensten.com gaf in deze audit een certificaatnaam-mismatch; na omzeilen volgde alsnog de 301. Dit verdient hosting/DNS-controle.
- Er zijn geen afzonderlijke landingspagina's voor **AI advies MKB** en **AI implementatie MKB**; beide routes geven 404.
- De H1 van de bedrijfsscan bevat het hoofdzoekwoord niet letterlijk. De title en body doen dat wel, maar de H1 **“Waar kan AI binnen uw organisatie werkelijk renderen?”** is minder expliciet.
- De tarievenpagina richt title en H1 primair op AI-websites, niet op scan → advies → implementatie.

### NVB-project: niet geschikt als huidige SEO-voorkant

- `index.html:2` heeft `lang="en"` terwijl de inhoud Nederlands is.
- Metadata en canonical positioneren “Nova Vista Boost / AI Marketing” en wijzen naar het Lovable-domein (`index.html:8-27`), niet naar AIdiensten.com.
- Geen `public/robots.txt`, `public/sitemap.xml` of JSON-LD.
- Eén generieke openbare pagina; geen indexeerbare dienstpagina's.
- Interne links leiden vrijwel uitsluitend naar `/auth`; de footer heeft geen inhoudelijke navigatie (`src/components/Navbar.tsx`, `src/components/Footer.tsx`).
- De H1 **“Versnel je groei met AI Marketing”** en vaste SaaS-prijzen (€49/€149/€399) sluiten niet aan op bedrijfsscan/advies/implementatie (`src/pages/Index.tsx:17-45,57-72`).

Er zijn geen actuele opgeslagen SEO-scans beschikbaar voor dit project; alle scanners staan op `not_scanned`. De conclusies hierboven komen uit broncode en live HTTP/HTML-controle.

## 3. AI-vindbaarheid en entity-signalen

### Goed

- De live site levert volledige HTML aan crawlers.
- `/llms.txt` bestaat en benoemt organisatie, auteur, diensten, €495-scan en menselijke controle.
- Organization- en Service-schema koppelen Nova Vista Progressus, Pascal Dolleman, Nederland en de AI-bedrijfsscan.
- De teksten bevatten nuttige entiteiten: Customer Service, Sales, Marketing, managementregie, menselijke controle, privacy, automatisering en training.

### Onvoldoende

- **AIdiensten.com** bouwt zelf geen entity-signaal op door de 301 en canonicals naar Nova Vista Progressus. Als AIdiensten.com het commerciële merk/domein moet worden, is dit de grootste inconsistentie.
- “MKB” komt niet prominent genoeg terug in titles/H1's en de scanpagina sluit zzp/kleine bedrijven expliciet uit. Dat botst met zoekintentie rond “AI advies MKB”. Segmentatie is nodig: quickscan voor klein MKB, volledige scan voor organisaties met structurele afdelingen.
- Er ontbreken zelfstandige, citeerbare pagina's voor advies en implementatie met duidelijke definities, aanpak, deliverables, KPI's, AI Act/AVG, pilot en borging.
- De actuele expertise is vooral servicecopy. Er is weinig ondersteunende kennisinhoud rond selectie van use-cases, ROI-inschatting, implementatiestappen en governance waarmee zoekmachines en LLM's de expertise breder kunnen verifiëren.

## 4. Funnel-audit

Gewenste route:

```text
Gratis Quickscan → volledige AI-bedrijfsscan €495 → implementatie en/of training
```

Werkelijke route:

```text
Algemene homepage → bedrijfsscanpagina → gratis intake per mailto-link → €495 opdracht
                                            ↘ trainingpagina als losse navigatieroute
```

- Er is **geen gratis Quickscan** of `/quickscan`; alleen een gratis intake zonder analyse of advies.
- De betaalde bedrijfsscan is inhoudelijk helder: €495 excl. btw, maximaal drie afdelingen en vijftien deelnemers, menselijke beoordeling.
- Op de scanpagina ontbreekt een concrete vervolgstap na de prioriteitenlijst, zoals “laat kans 1 implementeren” of “plan teamtraining”.
- De trainingpagina noemt scan, implementatie en borging, maar is geen gerichte bottom-of-funnel pagina voor “AI implementatie MKB”.
- De CTA voor de scan opent een vooraf ingevulde e-mail. Er is geen ingebed intakeformulier, directe bevestiging, planning of meetbare conversiestap.
- Het contactformulier opent eveneens het lokale e-mailprogramma en slaat niets op. Dit faalt voor bezoekers zonder goed ingesteld mailprogramma en maakt funnelmeting beperkt.

## 5. Belangrijkste conversielekken

1. **Domein-/merkverlies:** bezoekers en zoekwaarde eindigen op novavistaprogressus.nl; AIdiensten.com kan geen zelfstandige commerciële autoriteit opbouwen.
2. **Ontbrekende gratis Quickscan:** de beloofde laagdrempelige eerste stap bestaat niet; “gratis intake” heeft een hogere ervaren inspanning en levert geen direct resultaat.
3. **Geen doorlopende offer ladder:** €495-scan heeft geen expliciete, directe vervolg-CTA naar implementatie of training op basis van de uitkomst.
4. **Mailto als conversiemechanisme:** afhankelijk van lokale mailsoftware, geen betrouwbare ontvangstbevestiging en beperkt meetbaar.
5. **Ontbrekende intentiepagina's:** “AI advies MKB” en “AI implementatie MKB” landen op 404 en kunnen niet ranken of converteren.
6. **Doelgroepfrictie:** bedrijfsscan is voor middelgrote/grotere organisaties; de gewenste MKB-termen omvatten ook kleinere bedrijven. Zonder duidelijke segmentkeuze kan verkeer afhaken.
7. **Tarievenverwarring:** `/tarieven` gaat vooral over websites, terwijl bezoekers vanuit scan/advies een prijs- en vervolgoverzicht voor AI-dienstverlening verwachten.

## Exact de 5 wijzigingen met hoogste verwacht rendement

### 1. Kies AIdiensten.com als echte, canonieke commerciële hoofdsite

**Waarom hoogste rendement:** lost in één keer merk-, indexatie-, canonical- en vertrouwensfragmentatie op. Nu draagt AIdiensten.com alle organische waarde over aan een ander domein.

**Gewenste wijziging:** serveer de website op AIdiensten.com met geldig TLS; zet alle self-referencing canonicals, sitemap, robots, schema en interne absolute URL's op dat domein. Redirect juist het oude domein per overeenkomstige route naar AIdiensten.com, niet alles naar de homepage.

**Geraakte live routes/bestanden:** hosting/DNS/TLS; globale metadata/layout; `/robots.txt`; `/sitemap.xml`; `/llms.txt`; alle canonicals en Organization/Service-schema's. Deze live-sitebestanden zitten **niet in de huidige NVB-repository**.

### 2. Bouw een echte gratis Quickscan als primaire instap

**Waarom:** sluit direct aan op de Nederlandse “AI bedrijfsscan”-intentie: snel inzicht, lage drempel, concrete kansen. Het creëert de ontbrekende bovenkant van de funnel.

**Gewenste wijziging:** nieuwe `/quickscan` met 8–12 zakelijke vragen, directe korte uitslag (volwassenheid + 3 kansgebieden), e-mailrapport en één duidelijke vervolgstap naar de €495-scan. Benoem expliciet dat het een indicatie is en menselijke beoordeling pas in de volledige scan volgt.

**Geraakte live routes/bestanden:** nieuwe `/quickscan`; CTA's op `/`, `/ai-bedrijfsscan`, `/contact`; formulierverwerking/CRM en bedankpagina; sitemap; schema. Niet aanwezig in deze NVB-repository.

### 3. Maak één expliciete offer-ladder op de bedrijfsscanpagina

**Waarom:** verkleint het grootste commerciële gat tussen diagnose en omzet uit uitvoering.

**Gewenste wijziging:** positioneer op `/ai-bedrijfsscan` drie duidelijk gekoppelde stappen: gratis Quickscan → bedrijfsscan €495 → gekozen implementatie/training. Voeg onder “Wat ontvangt uw organisatie?” concrete deliverables toe (prioriteitenmatrix, risico/randvoorwaarden, aanbevolen pilot, besluitgesprek) en twee vervolg-CTA's: “Start volledige scan” en “Bespreek implementatie”.

**Geraakte live routes/bestanden:** `/ai-bedrijfsscan`; gedeelde CTA/component; `/contact` met bron/aanbod vooraf geselecteerd; Service/Offer-schema en interne links. Niet aanwezig in deze NVB-repository.

### 4. Voeg aparte pagina's toe voor “AI advies MKB” en “AI implementatie MKB”

**Waarom:** de twee belangrijkste midden- en onderkantzoekintenties hebben nu geen landingspagina. Concurrenten beantwoorden deze intenties met roadmaps, pilots, KPI's, integraties en governance.

**Gewenste wijziging:** 
- `/ai-advies-mkb`: use-caseprioritering, ROI-inschatting, roadmap, AVG/AI Act, managementbesluit, deliverables en CTA naar adviesgesprek/scan.
- `/ai-implementatie-mkb`: pilot → integratie → training → menselijke controle → KPI-meting → borging, met concrete systemen/voorbeelden waar aantoonbaar.

**Geraakte live routes/bestanden:** twee nieuwe routes; homepage/nav/footer; `/ai-bedrijfsscan`; `/ai-training-bedrijven`; sitemap; BreadcrumbList + Service-schema; interne links. Niet aanwezig in deze NVB-repository.

### 5. Vervang mailto-conversies door een meetbaar intakepad

**Waarom:** verbetert direct de voltooiingskans en maakt zichtbaar waar bezoekers uitvallen.

**Gewenste wijziging:** ingebed formulier met maximaal vijf eerste velden, server-side verzending/opslag, duidelijke privacytekst, bevestigingspagina en bronvelden (`quickscan`, `bedrijfsscan`, `advies`, `implementatie`, `training`). Laat daarna een intake plannen of terugbelmoment kiezen. Meet minimaal CTA-click, formulierstart, formulierverzending en geboekte intake.

**Geraakte live routes/bestanden:** `/contact`; `/ai-bedrijfsscan`; `/ai-training-bedrijven`; nieuwe bedank-/planroute; formulierhandler en analytics-events. Niet aanwezig in deze NVB-repository.

## Rendementsvolgorde

1. Canoniek domein en TLS
2. Gratis Quickscan
3. Offer-ladder op de scanpagina
4. Advies- en implementatiepagina's
5. Meetbare formulieren en opvolging

Eerst domein/canonical oplossen; anders bouwen de overige verbeteringen autoriteit op voor het verkeerde domein.
