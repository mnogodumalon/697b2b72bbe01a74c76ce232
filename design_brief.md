# Design Brief: Werkzeugverwaltung

## 1. App Analysis

### What This App Does
This is a **tool management system** (Werkzeugverwaltung) for a company that manages employees, tools, storage locations, and the checkout/return process of tools. It tracks which employee has which tool, when it was checked out, when it's due back, and what condition it was returned in. It also tracks DGUV V3 inspection dates for electrical tools.

### Who Uses This
A workshop manager or site supervisor at a German electrical/construction company. They need to know at a glance: which tools are currently out, which are overdue, which need inspection, and the overall state of their tool inventory. They're practical people, not tech-savvy - they want clarity, not complexity.

### The ONE Thing Users Care About Most
**"Wie viele Werkzeuge sind gerade ausgegeben und welche sind überfällig?"** - How many tools are currently checked out and which ones are overdue? This is the operational heartbeat of tool management - knowing what's out there and what should have come back.

### Primary Actions (IMPORTANT!)
1. **Werkzeug ausgeben** (Check out a tool) - This is the #1 daily action. A worker comes to the tool room, the manager logs the checkout. This is the Primary Action Button.
2. **Werkzeug zurücknehmen** (Return a tool) - Second most common action.
3. **Neues Werkzeug anlegen** (Add new tool to inventory) - Less frequent but important.

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design uses a **cool industrial palette** - a slate-blue base with a bold **amber/orange accent** that evokes safety vests and warning labels found in workshops. The background has a subtle cool gray undertone that feels like a clean workshop wall. The amber accent is used sparingly for the hero KPI and primary actions, creating a clear visual hierarchy that feels purpose-built for an industrial environment rather than a generic business dashboard.

### Layout Strategy
The layout is **asymmetric on desktop** with a dominant left column (65%) for the hero status panel and activity feed, and a narrower right column (35%) for quick-access tools inventory and upcoming inspections. The hero element is a large status panel showing currently checked-out tools count with a prominent number, surrounded by supporting context (overdue count, tools in good condition). On mobile, this becomes a vertical flow with the hero status dominating the first viewport fold.

### Unique Element
The **hero status panel** uses a split-tone design: the main count sits on a subtle amber-tinted background card with a thick left border in amber, making it feel like a physical status board you'd see mounted on a workshop wall. Below the number, small status pills show overdue (red) and on-time (green) counts inline, giving immediate operational context without additional clicks.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap`
- **Why this font:** Space Grotesk has a technical, engineered quality that suits an industrial tool management system. Its geometric shapes feel precise and mechanical, while remaining highly readable at all sizes. It avoids feeling corporate or generic.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(210 20% 97%)` | `--background` |
| Main text | `hsl(215 25% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(215 25% 15%)` | `--card-foreground` |
| Borders | `hsl(210 15% 88%)` | `--border` |
| Primary action (amber) | `hsl(32 95% 44%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(210 60% 45%)` | `--accent` |
| Muted background | `hsl(210 15% 94%)` | `--muted` |
| Muted text | `hsl(215 15% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(152 60% 36%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The cool slate background creates a calm, professional base that reduces eye strain during long shifts. The amber primary color is instantly recognizable in an industrial context - it's the color of safety, caution, and action. The blue accent provides a secondary visual layer for informational elements. Together, they create a palette that feels like it belongs on a workshop management screen.

### Background Treatment
The page background uses `hsl(210 20% 97%)` - a very light blue-gray that's warmer than pure white but cooler than cream. Cards sit on pure white, creating subtle depth through contrast rather than heavy shadows. This gives the impression of clean, organized worksheets laid on a metal desk.

---

## 4. Mobile Layout (Phone)

### Layout Approach
The hero status panel dominates the first viewport - a large, amber-bordered card showing the count of currently checked-out tools. Below it, compact status pills show overdue and on-time counts. The rest scrolls below in a clean single-column flow. Size variation is created by making the hero number very large (48px) while secondary stats use 20px, and list items use 14px body text.

### What Users See (Top to Bottom)

**Header:**
- App title "Werkzeugverwaltung" in 20px semibold, left-aligned
- A small gear icon on the right (for future settings)

**Hero Section (The FIRST thing users see):**
- A full-width card with a 4px left border in amber (`hsl(32 95% 44%)`)
- Inside: "Aktuell ausgegeben" as a small muted label (12px, uppercase, letter-spacing 0.5px)
- The count number in 48px bold Space Grotesk
- Below the number: two inline badges - one red showing "X überfällig" and one green showing "X pünktlich"
- Takes approximately 30% of the first viewport
- Why hero: This answers the #1 question - how many tools are out there right now?

**Section 2: Schnellaktionen (Quick Actions)**
- Two side-by-side buttons filling the width:
  - "Ausgabe" (amber/primary, with ArrowUpRight icon) - creates a new Werkzeugausgabe
  - "Rückgabe" (outline/secondary, with ArrowDownLeft icon) - creates a new Werkzeugrueckgabe
- These are large touch targets (56px height) for easy use with gloves

**Section 3: Überfällige Werkzeuge (Overdue Tools)**
- Only shows if there are overdue items
- Red-tinted subtle background card
- List of overdue checkouts showing: Tool name, Employee name, days overdue
- Each item is tappable to view details
- Sorted by most overdue first

**Section 4: Letzte Aktivitäten (Recent Activity)**
- A clean list of the last 10 checkout/return events
- Each item shows: icon (arrow up for checkout, arrow down for return), tool name, employee name, relative time ("vor 2 Stunden")
- Alternating subtle background for readability

**Section 5: Werkzeugbestand (Tool Inventory Summary)**
- Horizontal scroll of small cards showing category counts
- Each card: category icon, category name, count
- Categories from lookup_data: Akkuwerkzeug, Elektrowerkzeug, Handwerkzeug, etc.

**Section 6: Anstehende Prüfungen (Upcoming Inspections)**
- List of tools with upcoming DGUV V3 inspection dates (next 30 days)
- Shows: Tool name, inspection date, days until due
- Yellow warning icon for items due within 7 days

**Bottom Navigation / Action:**
- Fixed bottom bar with the primary action button "Werkzeug ausgeben" (amber, full width minus padding, 52px height)
- This duplicates the quick action above but is always accessible while scrolling

### Mobile-Specific Adaptations
- Hero card takes full width with 16px horizontal padding
- Quick action buttons stack as two equal columns
- Category summary scrolls horizontally instead of wrapping
- Lists use compact 12px/14px font sizes
- Charts (if any) are simplified to key numbers on mobile

### Touch Targets
- All buttons minimum 48px height
- List items have 48px minimum tap height with 12px vertical padding
- Quick action buttons are 56px for glove-friendly operation

### Interactive Elements
- Overdue tools list: tap to open detail dialog showing full checkout info
- Recent activity items: tap to view full record details
- Upcoming inspections: tap to view tool details

---

## 5. Desktop Layout

### Overall Structure
Two-column asymmetric layout: **65% left / 35% right**, max-width 1400px, centered.

The eye flows: Hero panel (top-left, largest) → Overdue alerts (below hero) → Quick actions (top-right) → Tool inventory (right column) → Recent activity (bottom-left) → Inspections (bottom-right).

Visual interest comes from the large hero panel contrasting with the denser right column, and the overdue section using a subtle red-tinted background to draw attention.

### Section Layout

**Top area spanning full width:**
- Page header: "Werkzeugverwaltung" in 28px bold, with primary action button "Werkzeug ausgeben" on the far right

**Left column (65%):**
1. **Hero Status Panel** - Large card with amber left border, showing currently checked-out count prominently (56px number), with inline overdue/on-time badges. Below the number: a horizontal bar chart showing checkouts per department (Abteilung).
2. **Überfällige Werkzeuge** - Red-tinted card listing overdue checkouts in a compact table (Tool, Employee, Due Date, Days Overdue). Only visible if overdue items exist.
3. **Letzte Aktivitäten** - Timeline-style list of recent checkout/return activity with relative timestamps.

**Right column (35%):**
1. **Schnellaktionen** - Two stacked buttons: "Ausgabe erfassen" and "Rückgabe erfassen"
2. **Werkzeugbestand** - Card showing total tool count with a small donut/pie chart by category, and below it a compact list of categories with counts
3. **Zustandsübersicht** - Small horizontal bar showing tool conditions (Neu, Sehr gut, Gut, Gebrauchsspuren, Reparaturbedürftig, Defekt) as colored segments
4. **Anstehende Prüfungen** - List of upcoming DGUV V3 inspections, sorted by date, with warning indicators for urgent ones

### What Appears on Hover
- List items: subtle background highlight and cursor pointer
- Cards: very subtle shadow increase (shadow-sm → shadow-md)
- Overdue items: slight left-shift animation to indicate clickability
- Action buttons: darken by 10%

### Clickable/Interactive Areas
- Each overdue tool item → opens detail dialog with full checkout info and option to record return
- Each activity item → opens detail dialog
- Each tool in inventory → opens tool detail/edit dialog
- Each inspection item → opens tool detail with inspection info

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Aktuell ausgegeben
- **Data source:** Werkzeugausgabe (all checkouts) cross-referenced with Werkzeugrueckgabe (returns). A checkout is "active" if no corresponding return record exists for that ausgabe.
- **Calculation:** Count of Werkzeugausgabe records that have NO matching Werkzeugrueckgabe record (where werkzeugrueckgabe.ausgabe links to the werkzeugausgabe record). To determine this: get all Werkzeugrueckgabe records, extract the ausgabe IDs they reference, then count Werkzeugausgabe records whose record_id is NOT in that set.
- **Display:** Large number (48px mobile, 56px desktop) in bold Space Grotesk, inside a card with 4px amber left border. Below the number, two inline Badge components: one red "X überfällig" and one green "X pünktlich".
- **Context shown:** Overdue count (where geplantes_rueckgabedatum < today and no return exists) and on-time count (the rest of active checkouts).
- **Why this is the hero:** The manager's #1 concern is operational awareness - knowing how many tools are out and if any are overdue directly impacts daily planning.

### Secondary KPIs

**Gesamtbestand (Total Inventory)**
- Source: Werkzeuge
- Calculation: Total count of all Werkzeuge records
- Format: number
- Display: Compact stat inside the right column Werkzeugbestand card, 28px bold

**Reparaturbedürftig / Defekt (Needs Repair)**
- Source: Werkzeuge where zustand = 'reparaturbeduerftig' OR 'defekt'
- Calculation: Count
- Format: number with red color
- Display: Small badge/stat inside the Zustandsübersicht section

**Anstehende Prüfungen (Upcoming Inspections Count)**
- Source: Werkzeuge where pruefpflicht = true AND naechster_prueftermin is within next 30 days
- Calculation: Count
- Format: number with yellow/amber warning color
- Display: Section header badge in the inspections card

### Chart
- **Type:** Horizontal bar chart - because it clearly shows department-level comparison without rotation of labels
- **Title:** Ausgaben nach Abteilung (Checkouts by Department)
- **What question it answers:** Which departments are using the most tools? Helps identify heavy users and plan tool procurement.
- **Data source:** Active Werkzeugausgabe records, joined with Mitarbeiter to get abteilung
- **X-axis:** Count of active checkouts
- **Y-axis:** Department name (from Mitarbeiter.abteilung lookup_data: Elektroinstallation, Wartung und Service, Bauleitung, Planung, Lager, Verwaltung)
- **Mobile simplification:** Show as a simple numbered list instead of a chart (Department: count), sorted by count descending

### Lists/Tables

**Überfällige Werkzeuge (Overdue Tools)**
- Purpose: Alert the manager to tools that should have been returned
- Source: Active Werkzeugausgabe (no matching Werkzeugrueckgabe) where geplantes_rueckgabedatum < today
- Fields shown: Werkzeug name (from Werkzeuge via werkzeug applookup), Mitarbeiter name (from Mitarbeiter via mitarbeiter applookup), geplantes_rueckgabedatum, days overdue (calculated)
- Mobile style: compact cards with red left border
- Desktop style: compact table rows with red text for days overdue
- Sort: Most overdue first
- Limit: Show all (usually a small number)

**Letzte Aktivitäten (Recent Activity)**
- Purpose: See what's been happening recently - checkouts and returns
- Source: Union of Werkzeugausgabe (with type "ausgabe") and Werkzeugrueckgabe (with type "rueckgabe"), sorted by date
- Fields shown: Activity type icon, Werkzeug name, Mitarbeiter name, relative time
- Mobile style: simple list items
- Desktop style: timeline-style list with icons
- Sort: Most recent first (by ausgabedatum or rueckgabedatum)
- Limit: 10 items

**Anstehende Prüfungen (Upcoming Inspections)**
- Purpose: Never miss a DGUV V3 inspection deadline
- Source: Werkzeuge where pruefpflicht = true AND naechster_prueftermin is in the future (next 90 days)
- Fields shown: bezeichnung, naechster_prueftermin, days until due
- Mobile style: compact list cards
- Desktop style: compact list with date and countdown
- Sort: Soonest first
- Limit: 10 items

### Primary Action Button (REQUIRED!)

- **Label:** Werkzeug ausgeben
- **Action:** add_record
- **Target app:** Werkzeugausgabe
- **What data:** mitarbeiter (select from Mitarbeiter records), werkzeug (select from Werkzeuge records), ausgabedatum (date/datetime, default now), geplantes_rueckgabedatum (date), verwendungszweck (text), notizen (textarea)
- **Mobile position:** bottom_fixed (52px amber button, full-width with padding)
- **Desktop position:** header (right-aligned button next to title)
- **Why this action:** Checking out a tool is the most frequent operation - every time a worker needs a tool, this action is performed. It must be instant and frictionless.

### CRUD Operations Per App (REQUIRED!)

**Mitarbeiter CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in Mitarbeiter management section (accessible from a "Stammdaten" tab/section)
  - Form fields: vorname (text, required), nachname (text, required), personalnummer (text), abteilung (select from lookup_data), telefonnummer (tel), email (email), notizen_mitarbeiter (textarea)
  - Form style: Dialog/Modal
  - Required fields: vorname, nachname
  - Default values: none

- **Read (Anzeigen):**
  - List view: Table on desktop, card list on mobile. Shows vorname + nachname combined, personalnummer, abteilung
  - Detail view: Click row → Dialog showing all fields
  - Fields shown in list: Name (combined), Personalnummer, Abteilung
  - Fields shown in detail: All fields
  - Sort: By nachname alphabetically
  - Filter/Search: Text search by name

- **Update (Bearbeiten):**
  - Trigger: Pencil icon in detail dialog or in list row
  - Edit style: Same dialog as Create, pre-filled with current values
  - Editable fields: All fields

- **Delete (Löschen):**
  - Trigger: Trash icon in detail dialog
  - Confirmation: Always require confirmation
  - Confirmation text: "Möchtest du den Mitarbeiter '{vorname} {nachname}' wirklich löschen?"

**Werkzeuge CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "Neues Werkzeug" button in Werkzeugbestand section
  - Form fields: bezeichnung (text, required), hersteller (text), modellnummer (text), seriennummer (text), kategorie (select from lookup_data), anschaffungsdatum (date), anschaffungspreis (number), aktueller_lagerort (select from Lagerorte records), zustand (select from lookup_data), pruefpflicht (checkbox), naechster_prueftermin (date, shown if pruefpflicht), notizen (textarea)
  - Form style: Dialog/Modal
  - Required fields: bezeichnung
  - Default values: zustand = "neu", anschaffungsdatum = today

- **Read (Anzeigen):**
  - List view: Cards on mobile, table on desktop. Shows bezeichnung, hersteller, kategorie, zustand badge
  - Detail view: Click → Dialog showing all fields including lagerort name
  - Fields shown in list: Bezeichnung, Hersteller, Kategorie, Zustand
  - Fields shown in detail: All fields
  - Sort: By bezeichnung alphabetically
  - Filter/Search: By kategorie (select filter) and text search by bezeichnung

- **Update (Bearbeiten):**
  - Trigger: Pencil icon in detail dialog or list row
  - Edit style: Same dialog as Create, pre-filled
  - Editable fields: All fields

- **Delete (Löschen):**
  - Trigger: Trash icon in detail dialog
  - Confirmation: Always
  - Confirmation text: "Möchtest du das Werkzeug '{bezeichnung}' wirklich löschen?"

**Lagerorte CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in a Lagerorte management section
  - Form fields: ortsbezeichnung (text, required), typ (select from lookup_data), beschreibung (textarea)
  - Form style: Dialog/Modal
  - Required fields: ortsbezeichnung
  - Default values: none

- **Read (Anzeigen):**
  - List view: Simple list showing ortsbezeichnung and typ badge
  - Detail view: Click → Dialog showing all fields + count of tools at this location
  - Fields shown in list: Ortsbezeichnung, Typ
  - Fields shown in detail: All fields + tool count
  - Sort: By ortsbezeichnung alphabetically
  - Filter/Search: By typ

- **Update (Bearbeiten):**
  - Trigger: Pencil icon
  - Edit style: Same dialog as Create, pre-filled
  - Editable fields: All fields

- **Delete (Löschen):**
  - Trigger: Trash icon
  - Confirmation: Always
  - Confirmation text: "Möchtest du den Lagerort '{ortsbezeichnung}' wirklich löschen?"

**Werkzeugausgabe CRUD Operations**

- **Create (Erstellen):**
  - Trigger: Primary action button "Werkzeug ausgeben"
  - Form fields: mitarbeiter (select from Mitarbeiter, required), werkzeug (select from Werkzeuge, required), ausgabedatum (datetime, default now), geplantes_rueckgabedatum (date), verwendungszweck (text), notizen (textarea)
  - Form style: Dialog/Modal
  - Required fields: mitarbeiter, werkzeug, ausgabedatum
  - Default values: ausgabedatum = current date/time

- **Read (Anzeigen):**
  - List view: Shown in Recent Activity and Overdue sections. Shows werkzeug name, mitarbeiter name, ausgabedatum, status (active/returned)
  - Detail view: Click → Dialog showing all fields including resolved names
  - Fields shown in list: Werkzeug, Mitarbeiter, Datum, Status
  - Fields shown in detail: All fields
  - Sort: By ausgabedatum newest first
  - Filter/Search: By status (active/returned)

- **Update (Bearbeiten):**
  - Trigger: Pencil icon in detail view
  - Edit style: Same dialog as Create, pre-filled
  - Editable fields: All except ausgabedatum

- **Delete (Löschen):**
  - Trigger: Trash icon in detail view
  - Confirmation: Always
  - Confirmation text: "Möchtest du diese Werkzeugausgabe wirklich löschen?"

**Werkzeugrueckgabe CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "Rückgabe erfassen" button
  - Form fields: ausgabe (select from active Werkzeugausgabe records, required - show as "Werkzeug - Mitarbeiter"), rueckgabedatum (datetime, default now), rueckgabe_lagerort (select from Lagerorte), zustand_bei_rueckgabe (select from lookup_data, required), beschaedigungen (textarea, shown if zustand is beschaedigt or defekt), notizen_rueckgabe (textarea)
  - Form style: Dialog/Modal
  - Required fields: ausgabe, rueckgabedatum, zustand_bei_rueckgabe
  - Default values: rueckgabedatum = current date/time

- **Read (Anzeigen):**
  - List view: Shown in Recent Activity. Shows werkzeug name (via ausgabe → werkzeugausgabe → werkzeug), rueckgabedatum, zustand_bei_rueckgabe badge
  - Detail view: Click → Dialog showing all fields
  - Fields shown in list: Werkzeug, Rückgabedatum, Zustand
  - Fields shown in detail: All fields
  - Sort: By rueckgabedatum newest first

- **Update (Bearbeiten):**
  - Trigger: Pencil icon in detail view
  - Edit style: Same dialog as Create, pre-filled
  - Editable fields: All fields

- **Delete (Löschen):**
  - Trigger: Trash icon in detail view
  - Confirmation: Always
  - Confirmation text: "Möchtest du diese Rückgabe wirklich löschen?"

---

## 7. Visual Details

### Border Radius
Rounded (8px) - `--radius: 0.5rem` - gives a modern but not overly soft look. Cards and buttons feel substantial, not playful.

### Shadows
Subtle - Cards use `shadow-sm` by default, `shadow-md` on hover. The hero card uses `shadow-sm` with the amber left border providing visual weight instead of shadow. No heavy drop shadows anywhere.

### Spacing
Normal to spacious - 24px gap between major sections, 16px between cards within sections, 12px internal padding in list items. The hero card has 24px internal padding. Header has 32px bottom margin.

### Animations
- **Page load:** Subtle stagger fade-in for cards (opacity 0→1, translateY 8px→0, 200ms each, 50ms stagger)
- **Hover effects:** Cards: shadow-sm → shadow-md transition (150ms). List items: background color transition to muted (150ms). Buttons: darken 10% (100ms).
- **Tap feedback:** Scale down to 0.98 on press (100ms), return on release.

---

## 8. CSS Variables (Copy Exactly!)

```css
:root {
  --radius: 0.5rem;
  --background: hsl(210 20% 97%);
  --foreground: hsl(215 25% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(215 25% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(215 25% 15%);
  --primary: hsl(32 95% 44%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(210 15% 94%);
  --secondary-foreground: hsl(215 25% 15%);
  --muted: hsl(210 15% 94%);
  --muted-foreground: hsl(215 15% 50%);
  --accent: hsl(210 60% 45%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(210 15% 88%);
  --input: hsl(210 15% 88%);
  --ring: hsl(32 95% 44%);
  --chart-1: hsl(32 95% 44%);
  --chart-2: hsl(152 60% 36%);
  --chart-3: hsl(210 60% 45%);
  --chart-4: hsl(45 90% 50%);
  --chart-5: hsl(0 72% 51%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Space Grotesk)
- [ ] All CSS variables copied exactly from Section 8
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero element is prominent as described (amber left border, large number)
- [ ] Colors create the industrial workshop mood described in Section 2
- [ ] CRUD patterns are consistent across all apps (Dialog style, button placement)
- [ ] Delete confirmations are in place for every app
- [ ] Primary action "Werkzeug ausgeben" is always accessible
- [ ] Overdue tools are highlighted with red indicators
- [ ] Upcoming inspections show warning indicators
- [ ] All 5 apps have full CRUD: Mitarbeiter, Werkzeuge, Lagerorte, Werkzeugausgabe, Werkzeugrueckgabe
