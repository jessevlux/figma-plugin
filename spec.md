# Componenten Specificatie & Beslisregels

Dit document beschrijft componenten, varianten en **beslislogica**.  
De AI moet **eerst plannen** (sitemap/secties) en daarna **selectief** JSON genereren.

---

## Planning & sectierichtlijnen

- **Rijke one-pager**: streef naar **8–12 componenten** door hergebruik van de 6 bloktypes.
- **Herhaal slim**:
  - `Grid` kan meerdere keren (features, prijzen, team, testimonials als cards).
  - `Kolommen` voor afwisseling tekst/beeld, met `Media` varianten voor visuele variatie.
  - `EntryPostSlider` alleen als “nieuws/blog/updates” relevant is (meestal 1×).
- **Buttons/CTAs** alleen waar zinvol (via booleans).
- **Fintech/digitale bank (zoals “Rebank”) – aanbevolen sectie-opzet (voorbeeld)**
  1. `Hero` (USP + primaire CTA)
  2. `Kolommen` (voordelen + app-visual, `Media` Variant2/3)
  3. `Grid` (kernfeatures, 3–4 kaarten)
  4. `MediaSlider` (app-screens of cases)
  5. `Kolommen` (veiligheid/compliance + FAQs met `Accordion list`)
  6. `Grid` (pricing of pakketten)
  7. `Kolommen` (social proof/testimonial + CTA)
  8. `EntryPostSlider` (nieuws/updates) – alleen als relevant
  9. `Grid` (FAQ in cards of extra features)
  10. `Kolommen` (closing/CTA)

> **Belangrijk:** Alle **boolean props altijd aanwezig**. Als een child/feature niet gebruikt wordt, zet de bijbehorende boolean op `false`.

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

- Meestal 1× bovenaan; kan soms worden overgeslagen.
- Teksten kort en gericht op waardepropositie.

---

### MediaGroot

**Props**

- Title (string, optional)

**Gebruik**

- Groot visueel blok, optioneel; kan ook worden vervangen door `Kolommen` + `Media`.

---

### Kolommen

**Props**

- Property 1 (enum: Default | Variant2)
  - **Default**: links = Media, rechts = Content Kolommen Block
  - **Variant2**: rechts = Media, links = Content Kolommen Block

**Children**

- Media
  - Props:
    - Property 1 (enum: Default | Variant2 | Variant3)
      - **Default**: 1 square image
      - **Variant2**: 2 horizontale images
      - **Variant3**: 1 horizontaal + 2 squares
- Content Kolommen Block
  - Props:
    - Has Accordion (boolean)
    - Has Text (boolean)
  - Children (afhankelijk van booleans):
    - Accordion list (bij `Has Accordion` = true)
      - Props: Has Title (boolean), Title (string),
        Text, Text 2, Text 3, Text 4, Text open item (strings)
    - Text Element (bij `Has Text` = true)
      - Props:
        - Has Primary Button (boolean)
        - Has Second Button (boolean)
        - Has List (boolean)
        - Has description (boolean)
        - Title of text Block (string)
        - Description (string)
        - Usp Text 1, Usp text 2, Usp Text 3 (strings)
      - Children:
        - Button Primary (bij `Has Primary Button` = true)
        - Button Secondary (bij `Has Second Button` = true)

**Gebruik**

- Content + media mix, erg flexibel.
- Gebruik `Accordion list` voor FAQ’s of details.

---

### MediaSlider

**Props**

- Title (string)

**Gebruik**

- Voor meerdere visuals/cases/app-screens.

---

### Grid

**Props**

- Property 1 (enum: Default | Variant2)
  - **Default**: exact 3 cards
  - **Variant2**: exact 4 cards
- Title (string)

**Children**

- Inner Grid Card (3 of 4 items o.b.v. variant)
  - Props: Title (string), Description (string)
  - Children: (optioneel) Button Primary

**Gebruik**

- Herbruikbaar voor features, pakketten, team, etc.

---

### EntryPostSlider

**Props**

- Title (string)

**Children**

- Entry Post Inner (meestal 3 items)
  - Props:
    - Has title (boolean)
    - Has description (boolean)
    - Has Category (boolean)
    - Has Popular (boolean)
    - Category Name (string)
    - Popular (string)
    - Title of this block (string)
    - Description (string)
  - Children: (optioneel) Button Primary

**Gebruik**

- Alleen als blog/nieuws/updates relevant is.

---

## Buttons

### Button Primary / Button Secondary

**Props**

- Property 1 (enum: Default)
- Text primary button (string) / Text Secondary Button (string)

**Gebruik**

- Alleen opnemen wanneer de corresponderende boolean op `true` staat in het oudercomponent (Hero of Text Element).

---

## Belangrijke regels

- **Booleans altijd opnemen** en correct op `true/false` zetten.
- **Children afstemmen op booleans** (gating).
- **Varianten bewust kiezen** i.p.v. defaulten.
- **Herhalen mag** om voldoende secties te bereiken.
