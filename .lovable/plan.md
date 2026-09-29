# Technische indexeerbaarheidsaudit — Nova Vista Progressus

**Status:** read-only gecontroleerd op 29 september 2026. Niets gewijzigd of gepubliceerd.

## Afbakening

- `https://novavistaprogressus.nl` is bewust de canonieke productie-site.
- `aidiensten.com`, `www.aidiensten.com` en HTTP verwijzen permanent (301) naar `https://novavistaprogressus.nl`.
- De productie-site staat niet in deze NVB-repository. Dit project draait apart op `nova-vista-boost.lovable.app` als klantportaal/demo.
- Er is geen Search Console-koppeling beschikbaar in dit project. Werkelijke Google-indexstatus, vertoningen en crawldatum zijn daarom **onbekend**; broncode en live HTTP-resultaten bewijzen alleen technische indexeerbaarheid.

## Publieke productieroutes

Deze tien routes staan in de XML-sitemap en geven server-side HTTP 200:

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

Een onbekende route (`/niet-bestaand`) geeft correct HTTP 404 en geen indexeerbare HTML.

## Wat al goed staat

### Robots en noindex

- `https://novavistaprogressus.nl/robots.txt` geeft HTTP 200.
- Regels: `User-Agent: *`, `Allow: /` en een verwijzing naar `https://novavistaprogressus.nl/sitemap.xml`.
- Alle tien geteste publieke pagina's bevatten `meta robots="index, follow"`.
- Er is geen globale `noindex` aangetroffen.

### Sitemap

- `/sitemap.xml` geeft HTTP 200 als XML en bevat alle tien bekende publieke routes.
- URL's gebruiken consequent het canonieke HTTPS-hoofddomein.

### Canonical

- Iedere geteste publieke pagina heeft precies één self-referencing canonical op `https://novavistaprogressus.nl/...`.
- De homepage canonical eindigt correct op `/`.
- AIdiensten.com verwijst met 301 naar het hoofddomein; dat is coherent met de gekozen domeinstrategie.

### Metadata, taal en koppen

- Iedere geteste pagina heeft een eigen title, description en één H1.
- De HTML-taal is overal `nl-NL`.
- Voorbeelden:
  - Homepage: `AI-diensten voor bedrijven | Nova Vista Progressus`
  - Bedrijfsscan: `AI-bedrijfsscan voor Customer Service, Sales en Marketing | Nova Vista Progressus`
  - Training: `AI-training voor bedrijven en personeel | Nova Vista Progressus`
- Open Graph- en Twittermetadata zijn aanwezig op de homepage.

### Routing en crawlbaarheid

- De productie-site retourneert volledige, inhoudelijke HTML vanaf de server; dit is geen lege client-only SPA-shell.
- Elke echte route geeft HTTP 200; niet-bestaande routes geven HTTP 404.
- Navigatielinks zijn gewone `<a href>`-links en daardoor zonder JavaScript crawlbaar.
- Dit is technisch gunstiger dan de statische React-SPA in de huidige NVB-repository.

### Structured data

- Organization JSON-LD staat op alle geteste productiepagina's.
- `/ai-bedrijfsscan` heeft aanvullend Service + Offer-schema met €495 en Nederland als verzorgingsgebied.
- `/ai-training-bedrijven` heeft Service-schema.
- Boek- en auteurspagina's hebben aanvullende schema-items.

### AI-/LLM-crawlbaarheid

- `/llms.txt` geeft HTTP 200 en benoemt de organisatie, Pascal Dolleman, bedrijfsscan, €495, training, implementatie en menselijke controle.
- De site bevat duidelijke entity-signalen voor Nova Vista Progressus, AI-bedrijfsscan, Customer Service, Sales, Marketing, AI-training, privacy en menselijke eindverantwoordelijkheid.

### Oude verwijzingen op productie

In de HTML van alle tien productiepagina's zijn geen verwijzingen gevonden naar:

- `nova-vista-boost.lovable.app`
- “Nova Vista Boost”
- “Lovable”
- `aidiensten.com`

Dat laatste is bij deze strategie niet fout: AIdiensten.com is alleen een doorverwijzend domein.

## Wat ontbreekt of aandacht verdient

### 1. Google-status kan niet worden bevestigd

Technisch staat indexatie open, maar er is in dit project geen Search Console-property gekoppeld voor `novavistaprogressus.nl`. Daardoor kan deze audit niet vaststellen:

- of Google de sitemap al heeft verwerkt;
- welke URL's “Discovered”, “Crawled” of “Indexed” zijn;
- welke canonical Google daadwerkelijk heeft gekozen;
- of er crawl-, soft-404- of duplicatieproblemen zijn.

Dit is geen technisch gebrek van de site, maar een meetlacune in deze audit.

### 2. Nieuwe site heeft tijd en signalen nodig

Een technisch correcte nieuwe site wordt niet onmiddellijk volledig geïndexeerd. Google moet de URL's eerst ontdekken, crawlen, verwerken en beoordelen. Een sitemap en interne links versnellen ontdekking, maar garanderen geen indexatie of positie. Relevante content, externe vermeldingen en tijd blijven nodig.

### 3. Sitemap is functioneel maar minimaal

De sitemap bevat URL, `changefreq` en `priority`, maar geen `lastmod`. `lastmod` kan Google helpen gewijzigde pagina's efficiënter opnieuw te crawlen, mits de datum werkelijk de inhoudswijziging weergeeft.

### 4. Geen zichtbare BreadcrumbList-schema's

Dienst- en boekroutes hebben geen BreadcrumbList JSON-LD in de gecontroleerde HTML. Dit blokkeert indexatie niet, maar kan paginahiërarchie explicieter maken.

### 5. Metadata kan scherper op MKB-intentie

Technisch is metadata correct. Inhoudelijk ontbreken aparte pagina's/titles voor:

- “AI advies MKB”
- “AI implementatie MKB”

De bestaande training- en scanpagina's dekken delen hiervan, maar niet als zelfstandige zoekintentie. Dit is een contentdekkingstekort, geen indexeerbaarheidsfout.

### 6. H1 bedrijfsscan is creatief maar minder expliciet

De bedrijfsscan-title bevat het hoofdzoekwoord exact; de H1 luidt “Waar kan AI binnen uw organisatie werkelijk renderen?”. Een explicietere H1 met “AI-bedrijfsscan” zou de onderwerpduidelijkheid voor bezoeker en crawler vergroten. Dit is optimalisatie, geen blocker.

### 7. AIdiensten.com TLS apart controleren

De read-only commandlinecontrole kreeg bij een directe HTTPS-aanvraag aan AIdiensten.com een certificaatnaam-mismatch, waarna een onveilige vervolgtest wel de 301 aantoonde. Browser/CDN-gedrag kan verschillen. Controleer het certificaat voor apex en www onafhankelijk; een geldige 301 is pas betrouwbaar als HTTPS vóór de redirect zonder certificaatwaarschuwing werkt.

## Oude Lovable/Nova Vista Boost-verwijzingen in deze repository

Deze staan **niet op de canonieke productie-site**, maar wel in het afzonderlijke NVB-portaal:

- `index.html:2`: `lang="en"` bij Nederlandse inhoud.
- `index.html:8-27`: Nova Vista Boost-titles/descriptions, canonical en OG URL naar `nova-vista-boost.lovable.app`, plus oude Lovable-previewafbeelding en `@Lovable`.
- `src/pages/Index.tsx`: positionering als “AI Marketing Platform” met abonnementen €49/€149/€399.
- `src/App.tsx`: slechts één openbare marketingroute; overige routes zijn auth/dashboard.
- `public/`: geen robots.txt of sitemap.

Omdat dit een apart klantportaal/demo is, schaadt dit de technische indexeerbaarheid van `novavistaprogressus.nl` niet. Wel is het verstandig het portaal `noindex` te maken als het niet zelfstandig in Google moet verschijnen, om merk- en contentverwarring te voorkomen.

## Minimale wijzigingen met meeste SEO-effect

### 1. Search Console valideren en sitemap indienen

**Effect:** grootste diagnostische waarde; bevestigt of Google de site ziet en waar indexatie stokt.

- Verifieer de domain property `novavistaprogressus.nl`.
- Dien `/sitemap.xml` in.
- Inspecteer eerst `/`, `/ai-bedrijfsscan` en `/ai-training-bedrijven`.
- Vraag indexatie slechts één keer aan na een inhoudelijke wijziging; herhaald aanvragen versnelt Google niet structureel.

**Geraakt:** externe Search Console-configuratie; geen sitecode nodig.

### 2. Controleer/herstel TLS voor AIdiensten.com en www

**Effect:** voorkomt dat bezoekers en crawlers de bedoelde 301 niet veilig kunnen volgen.

**Geraakt:** DNS/CDN/hostingcertificaat van `aidiensten.com` en `www.aidiensten.com`; redirect naar `https://novavistaprogressus.nl/` behouden.

### 3. Voeg echte `lastmod`-datums toe aan de sitemap

**Effect:** helpt hercrawlprioritering bij een nieuwe en veranderende site; klein werk, laag risico.

**Geraakt:** productie-sitemapgenerator of `sitemap.xml`. Gebruik alleen de werkelijke laatste inhoudswijziging per URL.

### 4. Maak de twee ontbrekende intentiepagina's

**Effect:** grootste inhoudelijke groeikans nadat indexeerbaarheid bevestigd is.

- `/ai-advies-mkb`
- `/ai-implementatie-mkb`

Beide met unieke title, description, H1, self-canonical, Service-schema, interne links en opname in sitemap. Geen bijna-duplicaten van training/scan; ieder moet een eigen vraag en uitkomst beantwoorden.

**Geraakt:** nieuwe productieroutes, hoofdnavigatie/footer of contextlinks, sitemap en schema. Deze bronbestanden bevinden zich niet in deze repository.

### 5. Maak de bedrijfsscan-H1 expliciet en voeg breadcrumbs toe

**Effect:** verhoogt onderwerpduidelijkheid en hiërarchie zonder herbouw.

- H1 bijvoorbeeld: “AI-bedrijfsscan: waar kan AI binnen uw organisatie renderen?”
- Voeg BreadcrumbList toe op dienst- en boekdetailpagina's.

**Geraakt:** `/ai-bedrijfsscan`; gedeelde paginalayout/schemafunctie voor detailroutes.

## Prioriteit

1. Search Console + sitemapstatus meten.
2. TLS van AIdiensten.com controleren.
3. Daarna pas inhoud uitbreiden en `lastmod` toevoegen.
4. Geef Google vervolgens tijd: bij een nieuwe site kan ontdekking en indexatie dagen tot weken duren; rankings duren doorgaans langer en hangen ook af van kwaliteit, concurrentie en externe signalen.

**Eindoordeel:** `novavistaprogressus.nl` is technisch goed crawlbaar en heeft geen aangetroffen noindex-, canonical-, routing- of oude-domeinblokkade. De grootste onzekerheid is niet de code, maar de nog onbevestigde Google-indexstatus. De grootste concrete technische aandachtspunten zijn het AIdiensten.com-certificaat, sitemap-`lastmod` en het bewust wel/niet indexeren van het aparte NVB-portaal.
