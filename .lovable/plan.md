# Nova Vista Progressus — herpositionering naar uitvoeringsplatform

Het bestaande platform (leads, content, social, audits, academy) blijft de basis. We bouwen er de Nova Vista-strategie bovenop: Bedrijfsscan → verbeterproject → uitvoering, met duidelijke modules, campagnebouwer, klantportaal en interne bureau-modus.

## Uitgangspunten

- Alles Nederlands, mobiel-eerst.
- Nachtblauw + cosmic latte + subtiel goud (bestaand donkerblauw thema wordt hierop bijgesteld; cyaan/turkoois maakt plaats voor cosmic latte + goud).
- Slogan: "Vooruitgang door nieuwe visie". Zakelijk, geen AI-hype.
- Alle commerciële links wijzen naar één centrale hoofdsite: https://aidiensten.com.
- Demonstratiegegevens worden altijd zichtbaar gelabeld als demo. Geen knop die belooft te mailen of te publiceren als de koppeling niet echt bestaat.
- Geen verzonnen prijzen, resultaten of klantverhalen.

## Wat er verandert

### 1. Merk en voorkant
- Naam, slogan, kleuren en teksten door de hele voorkant en het portaal.
- Startpagina herschreven rond het doelmodel: scan → uitvoering → keuze uit drie routes.
- Drie zakelijke routes vervangen de oude tariefopzet: "Zelf doen met AI-tools", "Samen met Nova Vista", "Volledig laten uitvoeren", plus losse projecten (website, campagne, automatisering, funnel, branding, video). Bedragen alleen waar we ze echt kennen; anders "Vraag voorstel aan", "Start met Bedrijfsscan", "Plan intake".

### 2. Dashboard
Nieuw klantdashboard met doelen, lopende projecten, campagnes, taken, contentkalender, leads en kern-KPI's — en bovenaan het blok "Aanbevolen vanuit Bedrijfsscan" waarmee een kans met één klik een verbeterproject wordt. Bestaande content- en social-widgets blijven, maar krijgen een plek lager op de pagina.

### 3. Diensten/modules
Overzichtspagina met elf modules: marketingstrategie, SEO & content, social media, e-mailmarketing, leadgeneratie & funnel, websites & landingspagina's, webshops/productcontent, branding, video & creatives, AI-automatisering, rapportage. Elke module heeft een eigen pagina die tot een concrete uitkomst leidt (bijvoorbeeld een strategie-overzicht, contentplan of scriptset) en verwijst naar de bestaande werkende onderdelen waar die al bestaan.

### 4. Campagnebouwer
Stappenflow: doel → doelgroep → aanbod → kanaal → boodschap → assets → planning → KPI's → goedkeuring → uitvoeren. Zes startsjablonen: B2B-leadgeneratie, lokale dienstverlener, webshop/productlancering, high-ticket sales, retentie, reactivatie. Publiceren gebeurt alleen via de al werkende social-koppeling; anders wordt de campagne als taak klaargezet.

### 5. Content-engine
De bestaande Content Studio wordt uitgebreid met merkprofiel/tone of voice, contentpijlers en meer soorten output (blog, nieuwsbrief, advertentiecopy, landingspaginatekst, productbeschrijving, videoscript, CTA-varianten). Eén bron kan naar meerdere kanalen worden hergebruikt. Goedkeuringsstappen: concept → review → akkoord → gepland/gepubliceerd.

### 6. Leads & sales
De bestaande pijplijn krijgt de statussen nieuw → gekwalificeerd → voorstel → onderhandeling → gewonnen/verloren, plus bron, waarde en volgende actie. Opvolgvoorstellen en herinneringen worden als voorstel getoond, niet automatisch verstuurd. Voorstelgenerator als duidelijk gemarkeerde placeholder.

### 7. Bedrijfsscan-integratie
Een aparte laag die scanresultaten inleest, met een voorbeeldscan (leadopvolging, SEO-content, e-mailtriage). Elke kans heeft "Start verbeterproject". README beschrijft hoe dit later echt gekoppeld wordt aan de scan-omgeving.

### 8. Klantportaal
Projecten met status, bestanden/assets (placeholder), goedkeuringen, berichten/notities, maandrapport. Facturen/betalingen als toekomstige placeholder, geen nepbetalingen.

### 9. Automatisering
Koppelingenoverzicht met drie duidelijke statussen: actief, demo, toekomstig — voor Gmail, Drive, Agenda, social scheduling, analytics, Stripe en website/CMS.

### 10. Interne bureau-modus
Eén werkscherm voor het team: klanten, openstaande acties, leads, campagnes in review, content die op akkoord wacht, maandrapportages en upsell-kansen uit de scan.

### 11. Opruimen
Verouderde en dubbele pagina's verdwijnen of worden samengevoegd (o.a. de losse social-subpagina's gaan onder één Social-module; Academy blijft als interne kennisbank). Navigatie wordt gegroepeerd: Werk, Modules, Klanten, Beheer.

## Technische aanpak

- Nieuwe map `src/config/` met `brand.ts` (naam, slogan, MAIN_SITE_URL, kleuren) en `pricing.ts` (drie routes + losse projecten, zonder verzonnen bedragen).
- Nieuwe map `src/domain/` met losse modellen en types voor client, project, campaign, content, lead, report — gescheiden van de UI, zodat later een echte database of API eronder past.
- Nieuwe map `src/services/scan/` met een `ScanProvider`-interface plus een demo-provider met de voorbeeldscan; later te vervangen door een echte API/MCP-koppeling.
- Nieuwe map `src/data/demo/` voor alle demonstratiegegevens, altijd via een `DemoBadge`-component gelabeld.
- Databasewerk: nieuwe tabellen voor `campaigns`, `campaign_steps`, `projects`-uitbreiding, `scan_opportunities`, `brand_profiles`, `content_pillars`, `client_messages`, `client_files`, `monthly_reports` — met toegangsregels per gebruiker/organisatie en de bestaande rolstructuur (admin, eigenaar, teamlid).
- Bestaande edge functions (`content-engine`, `social-publish`, `social-health`, `nvb-ai-run`) blijven; de campagnebouwer en modules hergebruiken ze in plaats van nieuwe AI-routes te maken.
- Kleuren/tokens in `src/index.css` en `tailwind.config.ts` bijgewerkt naar nachtblauw/cosmic latte/goud; geen vaste kleurcodes in componenten.
- README krijgt de productie-roadmap: database/auth, rollen, Stripe, e-mail, social connectors, analytics, goedkeuringen, audit log, AVG/dataretentie, en de scan-koppeling.

## Uitvoering in fasen

1. Merk, kleuren, config, domeinmodellen, navigatie en opruimen.
2. Bedrijfsscan-laag + nieuw dashboard met "Aanbevolen vanuit Bedrijfsscan".
3. Modules-overzicht en modulepagina's.
4. Campagnebouwer met sjablonen (incl. database).
5. Content-engine uitbreiding (merkprofiel, pijlers, hergebruik).
6. Leads & sales aanscherping.
7. Klantportaal, automatiseringsoverzicht, interne bureau-modus.
8. README-roadmap en test van de hoofdflow op desktop en mobiel.

## Aannames

- De Bedrijfsscan heeft nu nog geen API; we bouwen de laag met een demo-provider en een duidelijk koppelpunt.
- Er zijn geen bekende bedragen, dus overal "Vraag voorstel aan" of "Plan intake" in plaats van prijzen.
- Betalingen/facturatie blijven placeholder; de bestaande Mollie-functies blijven ongebruikt in de nieuwe voorkant tot je ze wilt activeren.
