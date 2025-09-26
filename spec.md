# Componenten Specificatie & Beslisregels

Dit document beschrijft componenten, varianten en beslislogica.
De AI moet eerst plannen (sitemap/secties/pagina’s) en daarna selectief JSON genereren.

---

## Planning & paginarichtlijnen

- **Standaard**: streef naar 2–3 pagina’s, tenzij er duidelijke redenen zijn voor een one-pager.
- **Typische pagina’s**:

  - **Home** (altijd aanwezig, 4–6 blokken)
  - **Over ons** (2–3 blokken, historie, team, visie)
  - **Diensten/Producten** (2–4 blokken, vaak Grids en Kolommen)
  - **Contact** (2–3 blokken, contactgegevens, locatie, CTA)

- **One-pager**: alleen kiezen als de site erg klein is of er weinig content is.

  - AI moet dan **kort uitleggen** waarom dit logisch is (bijv. “Er zijn weinig diensten, dus alle info past overzichtelijk op één pagina”).

- **Footer**: altijd verplicht als laatste blok op de site.

---

## Sectierichtlijnen

- **Herhaal slim**:

  - `Grid` kan meerdere keren (features, prijzen, team, testimonials als cards).
  - `Kolommen` voor afwisseling tekst/beeld, met `Media` varianten voor visuele variatie.
  - `EntryPostSlider` alleen als “nieuws/blog/updates” relevant is (meestal 1×).
  - `LogoSlider` optioneel voor social proof (partners/klanten).
  - `CalltoAction` meestal 1×, als afsluitende of tussentijdse CTA.

- **Buttons/CTAs** alleen waar zinvol (via booleans).

---

## Componenten

### Hero

**Props**

- Has Title (boolean)
- Description (string)
- Hero Title (string)
- Usp 1 (string)
- Usp 2 (string)
- Usp 3 (string)
- Has Description (boolean)
- Has Usps (boolean)
- Has Button Primary (boolean)
- Has Button Secondary (boolean)

**Children**

- Button Primary (alleen als `Has Button Primary` = true)
- Button Secondary (alleen als `Has Button Secondary` = true)

**Gebruik**

- Meestal bovenaan de Home-pagina.
- Teksten kort en gericht op waardepropositie.
- Kan ook terugkomen op andere pagina’s als sectie-intro.

---

### MediaGroot

**Props**

- Title (string, optioneel)

**Gebruik**

- Groot visueel blok, vaak gebruikt voor sfeerbeelden of locatie.
- Kan op Home of Contact worden toegepast.

---

### Kolommen

**Props**

- Property 1 (enum: Default | Variant2)

  - Default = Media links, Content rechts
  - Variant2 = Content links, Media rechts

**Children**

- **Media**

  - Property 1 (Default | Variant2 | Variant3)

    - Default = 1 square image
    - Variant2 = 2 horizontale images
    - Variant3 = 1 horizontaal + 2 squares

- **Content Kolommen Block**

  - Props: Has Accordion (boolean), Has Text (boolean)
  - Children afhankelijk van props:

    - Accordion list (FAQ’s of details)
    - Text Element (uitleg, USP’s, knoppen)

**Gebruik**

- Zeer flexibel, kan op alle pagina’s.
- `Accordion list` bij veelgestelde vragen.
- `Text Element` voor afsluitende CTA’s of uitleg.

---

### MediaSlider

**Props**

- Title (string)

**Gebruik**

- Voor meerdere visuals, app-screens of cases.
- Meestal 1× toegepast op Home of Diensten.

---

### Grid

**Props**

- Property 1 (Default | Variant2)

  - Default = exact 3 kaarten
  - Variant2 = exact 4 kaarten

- Title (string)

**Children**

- Inner Grid Card (3 of 4 items, afhankelijk van variant)

  - Props: Title (string), Description (string)
  - Children: altijd exact 1 Button Primary

**Gebruik**

- Voor USP’s, diensten, prijzen, team, testimonials.
- Kan meerdere keren per site voorkomen.

---

### EntryPostSlider

**Props**

- Title (string)

**Children**

- Entry Post Inner (exact 3 items)

  - Props:

    - Has title (boolean)
    - Has description (boolean)
    - Has Category (boolean)
    - Has Popular (boolean)
    - Category Name (string)
    - Popular (string)
    - Title of this block (string)
    - Description (string)

  - Children: altijd exact 1 Button Primary

**Gebruik**

- Alleen toevoegen als er een blog, nieuws of updates-sectie relevant is.

---

### LogoSlider

**Props**

- Title (string)

**Gebruik**

- Voor partnerlogo’s, klanten of sponsoren.
- Vaak bovenaan of midden in de Home-pagina.
- Optioneel, alleen zinvol als er daadwerkelijk logo’s te tonen zijn.

---

### CalltoAction

**Props**

- Title (string)
- Usp 1 (string)
- Usp 2 (string)
- Usp 3 (string)
- Has Title (boolean)
- Has Usps (boolean)
- Has Button Primary (boolean)
- Has Button Secondary (boolean)

**Children**

- Button Primary (alleen als `Has Button Primary` = true)
- Button Secondary (alleen als `Has Button Secondary` = true)

**Gebruik**

- Sterke afsluitende CTA, meestal onderaan Home.
- Kan ook als extra tussensectie worden ingezet.

---

### Footer

**Props**

- Has Column 1–4 (booleans)
- Header 1–4 (strings)
- Link sets (1A–1G, 2A–2G, 3A–3G, 4A–4G)
- Has Nieuwsbrief (boolean)

**Gebruik**

- Altijd verplicht als laatste blok van de site.
- Bevat navigatie, bedrijfsinfo, supportlinks, legal, en optioneel een nieuwsbrief.

---

### Buttons

#### Button Primary / Button Secondary

**Props**

- Property 1 (Default)
- Text primary button (string) / Text Secondary Button (string)

**Gebruik**

- Alleen opnemen wanneer de corresponderende boolean in het oudercomponent = true.
- Grid-cards en Post Entries bevatten altijd een primaire knop.

---

## Belangrijke regels

- **Altijd alle booleans opnemen** (true/false).
- **Children alleen toevoegen als de booleans dat vereisen.**
- **Index verplicht** bij Grid-cards en Entry Posts, altijd beginnend bij 0.
- **Varianten bewust kiezen** (niet standaard alles Default).
- **Herhaling toegestaan** om voldoende blokken te halen (bijv. meerdere Grids).
- **Footer verplicht** als laatste blok.
- **One-pager alleen toestaan met uitleg** waarom er geen extra pagina’s zijn.
- **Multi-pager voorkeur**: Home + Contact, en vaak ook Over ons of Diensten.
