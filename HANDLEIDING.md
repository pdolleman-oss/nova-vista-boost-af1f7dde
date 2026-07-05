# Handleiding – Nova Vista Boost (NVB Platform)

Deze handleiding beschrijft hoe je het NVB-platform gebruikt: van inloggen tot content publiceren, leadfinding en social health monitoring.

---

## 1. Inloggen & Accounts

1. Ga naar de loginpagina (`/auth`).
2. Log in met e-mail + wachtwoord of via Google.
3. Wachtwoord vergeten? Gebruik de reset-link.

**Rollen:**
- **Admin** – volledige toegang, gebruikersbeheer.
- **Client owner** – beheer eigen bedrijf, teamleden uitnodigen.
- **Client member** – gebruik tools binnen toegewezen bedrijf.

---

## 2. Dashboard Home

- **Content widget** – laatste gepubliceerde, ingeplande en mislukte items. Klik door naar Content Studio.
- **Social status widget** – gezondheid per kanaal (Gezond / Beperkt / Fout). Klik door naar de detailpagina.
- **Quick actions** – snelkoppelingen naar de meest gebruikte modules.

---

## 3. AI Tools

10 generatoren voor marketingcontent: Blog, Social Posts, E-mail, Ad Copy, Analyse, Productteksten, SEO, Homepage Review, Strategie, Actieplan.

**Gebruik:**
1. Kies een tool.
2. Vul de prompt in.
3. Klik **Genereer content**.
4. Kopieer of gebruik in Content Studio.

Elke output wordt opgeslagen met status en risicolevel.

---

## 4. Content Studio

Lifecycle: `draft → review → approved → scheduled → published`.

1. Maak item aan (handmatig of via AI).
2. Zet op **review**, laat goedkeuren.
3. Plan in of publiceer direct.

**Publish modes:** direct, ingepland, of concept.
**Duplicate guard:** voorkomt automatisch dubbele publicaties.

---

## 5. Social Publisher

- Kanalen koppelen via **Publish Settings**.
- Ingeplande posts worden door de scheduled-publish cron verstuurd.
- Mislukte posts verschijnen in de dashboard-widget en kunnen opnieuw geprobeerd worden.

---

## 6. Social Health

- **Overzicht:** `/dashboard/social/health`.
- **Detailpagina:** `/dashboard/social/health/:id` — laatste 25 checks met foutmeldingen, token status en publicatietest.
- **Nieuwe check** knop voor handmatige controle.

Statussen: 🟢 Gezond · 🟡 Beperkt · 🔴 Fout (opnieuw koppelen).

---

## 7. Website Audits & Leadfinder

**Website Audits:**
1. Voer URL in → **Scannen**.
2. AI analyseert SSL, meta tags, sitemap, mobiel, blog, analytics, CTA's.
3. Score 0-100 + verbeterpunten.

**Leadfinder:** vindt prospects op basis van scans; beheer in de CRM-pipeline (kanban).

> Bij "Onvoldoende AI-credits": voeg credits toe via Settings → Plans & credits.

---

## 8. Pipeline (CRM)

Sleep leads door fases (nieuw → contact → offerte → deal). Elke lead heeft een activiteitentimeline.

---

## 9. Academy

Interne SOP-modules met lessen en voortgangstracking.

---

## 10. Instellingen

- **Settings** – profiel, notificaties.
- **User Management** (admin) – uitnodigen en rollen toewijzen.
- **Publish Settings** – kanalen koppelen.
- **Plans & credits** – abonnement en AI-credits.

---

## 11. Betalingen

iDEAL checkout via Mollie. Facturen en betaalgeschiedenis in Settings.

---

## 12. FAQ

- **"PAYMENT_REQUIRED" bij AI?** → Credits toevoegen in Settings → Plans & credits.
- **Ingeplande post niet verstuurd?** → Check Social Health; meestal verlopen token.
- **Module niet toegankelijk?** → Vraag admin om rol-upgrade.
- **Dubbele publicatie?** → Duplicate guard voorkomt dit; meld anders via support.

---

## Support

Zie de agency-contactgegevens in de app-footer.
