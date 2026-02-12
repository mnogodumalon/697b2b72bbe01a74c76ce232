# Design Brief: Werkzeugverwaltung

## 1. App Analysis

### What This App Does
This is a **tool management system** (Werkzeugverwaltung) for a trades/construction company. It tracks physical tools (drills, meters, ladders, cables), where they're stored, who has checked them out, when they're due back, and their condition upon return. It's the digital backbone for keeping expensive equipment accounted for.

### Who Uses This
A **workshop manager or site foreman** - someone who manages a pool of tools shared across teams (Elektroinstallation, Wartung, Bauleitung, etc.). They need to know at a glance: which tools are out, who has them, and whether anything is overdue or damaged. They're practical, not tech-savvy, and typically check this on a tablet at the workshop or a phone on-site.

### The ONE Thing Users Care About Most
**"Welche Werkzeuge sind gerade draußen und wann kommen sie zurück?"** (Which tools are currently checked out and when are they coming back?) The core anxiety is losing track of expensive equipment. The hero must show the current checkout status - how many tools are out vs. available.

### Primary Actions (IMPORTANT!)
1. **Werkzeug ausgeben** (Check out a tool) → Primary Action Button - this happens multiple times daily
2. **Werkzeug zurücknehmen** (Return a tool) → Secondary action
3. **Neues Werkzeug anlegen** (Add a new tool to inventory) → Less frequent

---

## 2. What Makes This Design Distinctive

### Visual Identity
An **industrial-professional aesthetic** inspired by tool catalogs and workshop organization boards. The warm slate-blue background with amber/safety-orange accents creates an environment that feels like a well-organized Werkstatt - functional, sturdy, and trustworthy. The design avoids the sterile look of generic dashboards by using the amber accent strategically on action items and alerts, mimicking the way safety colors are used in real workshops.

### Layout Strategy
The layout is **asymmetric on desktop** with a dominant left column (2/3 width) showing the hero status panel and activity timeline, and a narrower right column (1/3 width) for quick-reference stats and upcoming deadlines. This mirrors how a workshop board works: the main area shows what's happening now, the side panel shows what's coming up.

On mobile, the hero takes the full first viewport with a bold number showing tools currently out, followed by a vertical scroll of actionable items (overdue returns, pending checkouts).

### Unique Element
The **tool status indicator** - a horizontal stacked bar at the top of the hero section showing the ratio of available (green) vs. checked-out (amber) vs. damaged/repair-needed (red) tools. It gives an instant visual summary like a progress bar, but for the entire tool fleet. Think of it as a "fleet health bar" - inspired by inventory dashboards used in logistics.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap`
- **Why this font:** Space Grotesk has a technical, engineered feel with geometric shapes that suit a tool management context. Its slightly condensed proportions work well for data-dense displays, and the range of weights (300-700) provides strong hierarchy.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(215 20% 97%)` | `--background` |
| Main text | `hsl(215 25% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(215 25% 15%)` | `--card-foreground` |
| Borders | `hsl(215 15% 88%)` | `--border` |
| Primary action | `hsl(25 95% 50%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(215 60% 50%)` | `--accent` |
| Muted background | `hsl(215 15% 93%)` | `--muted` |
| Muted text | `hsl(215 10% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(152 60% 40%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The cool slate-blue base (`hsl(215...)`) creates a calm, professional backdrop that doesn't distract from data. The amber/orange primary (`hsl(25 95% 50%)`) is deliberately chosen to echo safety/warning colors found in workshops - it feels natural in a tool management context and provides excellent contrast for call-to-action buttons. The blue accent is used sparingly for informational elements like links and status indicators.

### Background Treatment
A subtle cool gray (`hsl(215 20% 97%)`) rather than pure white. This reduces eye strain during extended use and gives cards (which are pure white) a gentle lift off the background. No gradients or patterns - the industrial feel comes from the structured layout and typography, not decorative elements.

---

## 4. Mobile Layout (Phone)

### Layout Approach
The mobile layout is a single-column vertical scroll designed for quick status checks at the job site. The hero dominates the first viewport with a large checkout count, followed by the fleet health bar. Below the fold: actionable items first (overdue returns, tools needing attention), then browseable sections (all tools, employees). The primary action button is fixed at the bottom for constant accessibility.

### What Users See (Top to Bottom)

**Header:**
- Left: App title "Werkzeugverwaltung" in 18px/600 weight
- Right: Compact tab buttons for switching between "Dashboard" and data management views (Werkzeuge, Mitarbeiter, Lagerorte, Ausgaben, Rückgaben) using a horizontally scrollable chip/pill bar

**Hero Section (The FIRST thing users see):**
- Full-width card with 16px padding
- Fleet health bar at top: horizontal stacked bar (8px height, rounded) showing Available (green) | Ausgegeben (amber) | Reparaturbedürftig/Defekt (red) with percentage labels below
- Below the bar: large number "12" (48px, font-weight 700) with label "Werkzeuge ausgegeben" (14px, muted)
- Next to it (or below on very small screens): "34 verfügbar" in green accent (24px, 600 weight)
- Below: a row of 3 mini-stats in a horizontal scroll: "3 überfällig" (red badge), "5 Prüfungen fällig" (amber badge), "2 defekt" (red badge)
- Why hero: Answers the #1 question immediately - what's the fleet status right now?

**Section 2: Überfällige Rückgaben (Overdue Returns)**
- Only shown if there are overdue items (geplantes_rueckgabedatum < today AND no matching Rückgabe)
- Red-tinted card border on the left (4px border-left)
- Each item: Tool name, employee name, days overdue in red badge
- Tap item → opens detail view with option to record return

**Section 3: Aktuelle Ausgaben (Current Checkouts)**
- List of currently checked-out tools (Ausgaben without matching Rückgaben)
- Each item: Tool name (bold), Employee, checkout date, planned return date
- Sorted by planned return date (soonest first)
- Compact card style, 12px padding
- Tap item → detail dialog

**Section 4: Letzte Aktivitäten (Recent Activity)**
- Combined timeline of recent checkouts and returns, sorted by date
- Each item shows: action type (Ausgabe/Rückgabe icon), tool name, employee, timestamp
- Last 10 items
- Condensed list style (no cards, just rows with separators)

**Section 5: Data Management Tabs (when tab selected)**
- Full CRUD views for each app (Werkzeuge, Mitarbeiter, Lagerorte, Ausgaben, Rückgaben)
- Accessible via the tab bar in the header

**Bottom Navigation / Action:**
- Fixed bottom bar with primary action button: "Werkzeug ausgeben" (full-width amber button with Wrench + ArrowRight icon, 48px height)
- When on data management tabs, the button changes contextually (e.g., "+ Neues Werkzeug" when on Werkzeuge tab)

### Mobile-Specific Adaptations
- Hero stats reorganize to 2-column grid on very small screens
- Fleet health bar labels move below the bar instead of inline
- Lists use swipe-left to reveal edit/delete actions
- Activity timeline shows abbreviated dates ("vor 2h" instead of full timestamp)

### Touch Targets
- All tappable items minimum 44px height
- Action buttons 48px height
- Swipe actions require 60px drag to reveal

### Interactive Elements
- Overdue items tappable → opens detail dialog with return action
- Current checkout items tappable → shows full checkout details
- Activity items tappable → shows relevant record detail

---

## 5. Desktop Layout

### Overall Structure
A **max-width 1400px centered layout** with the following structure:

**Top bar (sticky):**
- Left: "Werkzeugverwaltung" title (24px, 700 weight)
- Center: Tab navigation pills (Dashboard | Werkzeuge | Mitarbeiter | Lagerorte | Ausgaben | Rückgaben)
- Right: Primary action button "Werkzeug ausgeben" (amber, with icon)

**Dashboard Tab - Two-column layout below the top bar:**

**Left column (65% width):**
1. **Hero Card** - Fleet status with health bar, key numbers (ausgegeben/verfügbar), and mini-stat badges
2. **Aktuelle Ausgaben** - Table view of currently checked-out tools with columns: Werkzeug, Mitarbeiter, Ausgabedatum, Geplante Rückgabe, Status (overdue badge if applicable)
3. **Werkzeuge nach Kategorie** - Bar chart showing tool count by category (Elektrowerkzeug, Handwerkzeug, etc.)

**Right column (35% width):**
1. **Überfällige Rückgaben** - Alert-style card with red accent, listing overdue items
2. **Anstehende Prüfungen** - List of tools with upcoming DGUV V3 inspection dates (naechster_prueftermin within 30 days)
3. **Letzte Aktivitäten** - Compact timeline of recent 8 checkouts/returns

**Other Tabs - Full-width data management views:**
- Each tab shows a full CRUD table/list for that app with search, create, edit, delete

### Section Layout
- Top area: Sticky header bar with navigation and primary action
- Main content: Two-column grid with `gap-6`
- Left column gets the data-heavy content (hero + table + chart)
- Right column gets the alert/notification content (overdue + inspections + activity)

### What Appears on Hover
- Table rows: subtle background highlight (`bg-muted/50`) + edit/delete action icons appear on the right
- Cards: slight shadow increase (`shadow-sm` → `shadow-md`)
- Activity timeline items: full timestamp appears (replacing relative time)
- Chart bars: tooltip with exact count and percentage

### Clickable/Interactive Areas
- Checkout table rows → opens detail dialog with full info + return action
- Overdue items → opens detail dialog with return action
- Tool names anywhere → opens tool detail dialog
- Employee names → opens employee detail dialog
- Activity items → opens relevant record detail

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Werkzeugstatus
- **Data source:** Werkzeuge (total count), Werkzeugausgabe (currently out), Werkzeugrueckgabe (returned)
- **Calculation:**
  - Total tools = count of all Werkzeuge records
  - Currently out = Werkzeugausgabe records that have NO matching Werkzeugrueckgabe (match by: Rückgabe.ausgabe applookup points to Ausgabe record_id)
  - Available = Total - Currently out - Defekt/Reparaturbedürftig
  - Overdue = Currently out WHERE geplantes_rueckgabedatum < today
  - Needing inspection = Werkzeuge WHERE pruefpflicht=true AND naechster_prueftermin within 30 days
  - Damaged = Werkzeuge WHERE zustand = 'reparaturbeduerftig' OR 'defekt'
- **Display:** Fleet health bar (stacked horizontal bar) + large numbers + mini-stat badges
- **Context shown:** Available vs checked-out ratio, overdue count, inspection count, damaged count
- **Why this is the hero:** Instantly answers "Is everything accounted for?" - the workshop manager's primary concern

### Secondary KPIs

**Überfällige Rückgaben (Overdue Returns)**
- Source: Cross-reference Werkzeugausgabe and Werkzeugrueckgabe
- Calculation: Ausgaben WHERE geplantes_rueckgabedatum < today AND no matching Rückgabe
- Format: Count with list of items
- Display: Alert card with red left border accent

**Anstehende Prüfungen (Upcoming Inspections)**
- Source: Werkzeuge
- Calculation: WHERE pruefpflicht = true AND naechster_prueftermin is within next 30 days
- Format: Count + list
- Display: Card with amber accent, showing tool name + date

**Werkzeuge nach Zustand (Tools by Condition)**
- Source: Werkzeuge
- Calculation: Group by zustand field
- Format: Counts per condition
- Display: Used in fleet health bar color segments

### Chart
- **Type:** Bar chart - best for comparing categorical data (tool categories)
- **Title:** Werkzeuge nach Kategorie
- **What question it answers:** "What types of tools do we have the most/least of?" - helps with procurement planning
- **Data source:** Werkzeuge app
- **X-axis:** kategorie field (using lookup_data labels: Elektrowerkzeug, Handwerkzeug, Messgerät, etc.)
- **Y-axis:** Count of tools per category
- **Colors:** Primary blue for bars, muted grid lines
- **Mobile simplification:** Horizontal bar chart instead of vertical, with labels on the left

### Lists/Tables

**Aktuelle Ausgaben (Current Checkouts)**
- Purpose: Shows all tools currently checked out - the operational view
- Source: Werkzeugausgabe (cross-referenced with Werkzeugrueckgabe for return status, Werkzeuge for tool name, Mitarbeiter for employee name)
- Fields shown: Werkzeug (name from lookup), Mitarbeiter (name from lookup), Ausgabedatum, Geplantes Rückgabedatum, Status (overdue badge)
- Mobile style: Compact cards with tool name bold, employee below, date right-aligned
- Desktop style: Full table with sortable columns
- Sort: By geplantes_rueckgabedatum ascending (soonest due first)
- Limit: Show all on desktop, first 10 on mobile with "Alle anzeigen" button

**Letzte Aktivitäten (Recent Activity)**
- Purpose: Activity log showing recent tool movements
- Source: Werkzeugausgabe + Werkzeugrueckgabe, merged and sorted by date
- Fields shown: Action type icon (ArrowUpRight for Ausgabe, ArrowDownLeft for Rückgabe), Tool name, Employee name, Timestamp
- Mobile style: Simple list with icon, text, relative time
- Desktop style: Compact timeline with icon, text, relative time
- Sort: By date descending (newest first)
- Limit: 10 items

### Primary Action Button (REQUIRED!)

- **Label:** "Werkzeug ausgeben" (with Wrench icon)
- **Action:** add_record
- **Target app:** Werkzeugausgabe
- **What data:** Form dialog with fields:
  - Werkzeug (Select - applookup to Werkzeuge, show bezeichnung)
  - Mitarbeiter (Select - applookup to Mitarbeiter, show vorname + nachname)
  - Ausgabedatum (date/datetimeminute - default to now, format YYYY-MM-DDTHH:MM)
  - Geplantes Rückgabedatum (date/date - required)
  - Verwendungszweck (text input)
  - Notizen (textarea, optional)
- **Mobile position:** bottom_fixed (full-width amber button)
- **Desktop position:** header (right side of top bar)
- **Why this action:** Checking out tools is the most frequent operation - happens multiple times daily when workers arrive and grab tools for jobs

### CRUD Operations Per App (REQUIRED!)

**Werkzeuge CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in Werkzeuge tab header, or "Neues Werkzeug" button
  - Form fields: Bezeichnung (text, required), Hersteller (text), Modellnummer (text), Seriennummer (text), Kategorie (select from lookup_data), Anschaffungsdatum (date), Anschaffungspreis (number, EUR), Aktueller Lagerort (select from Lagerorte records), Zustand (select from lookup_data), Prüfpflichtig (checkbox), Nächster Prüftermin (date, shown if prüfpflichtig), Notizen (textarea)
  - Form style: Dialog/Modal
  - Required fields: Bezeichnung
  - Default values: Zustand = "neu", Anschaffungsdatum = today

- **Read (Anzeigen):**
  - List view: Table on desktop (columns: Bezeichnung, Hersteller, Seriennummer, Kategorie, Zustand-Badge, Lagerort), Cards on mobile
  - Detail view: Click on record → Dialog showing all fields including photo
  - Sort: Alphabetically by Bezeichnung
  - Filter: Search by Bezeichnung, filter by Kategorie and Zustand

- **Update (Bearbeiten):**
  - Trigger: Pencil icon on hover (desktop) / swipe action (concept, implement as icon button on mobile)
  - Edit style: Same dialog as Create but pre-filled with current values

- **Delete (Löschen):**
  - Trigger: Trash icon on hover (desktop) / alongside edit button
  - Confirmation: AlertDialog "Möchtest du das Werkzeug '{bezeichnung}' wirklich löschen?"

**Mitarbeiter CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in Mitarbeiter tab header
  - Form fields: Vorname (text, required), Nachname (text, required), Personalnummer (text), Abteilung (select from lookup_data), Telefonnummer (tel), E-Mail (email), Notizen (textarea)
  - Form style: Dialog/Modal
  - Required fields: Vorname, Nachname

- **Read (Anzeigen):**
  - List view: Table with columns: Name (Vorname + Nachname), Personalnummer, Abteilung-Badge, Telefonnummer
  - Detail view: Dialog with all fields
  - Sort: Alphabetically by Nachname
  - Filter: Search by name, filter by Abteilung

- **Update (Bearbeiten):**
  - Trigger: Pencil icon
  - Edit style: Same dialog as Create, pre-filled

- **Delete (Löschen):**
  - Trigger: Trash icon
  - Confirmation: "Möchtest du den Mitarbeiter '{vorname} {nachname}' wirklich löschen?"

**Lagerorte CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "+" button in Lagerorte tab header
  - Form fields: Ortsbezeichnung (text, required), Typ (select from lookup_data: Werkstatt/Fahrzeug/Baustelle/Außenlager/Sonstiges), Beschreibung (textarea)
  - Form style: Dialog/Modal
  - Required fields: Ortsbezeichnung

- **Read (Anzeigen):**
  - List view: Cards showing Ortsbezeichnung, Typ-Badge, tool count at this location
  - Detail view: Dialog with all fields + list of tools currently stored here
  - Sort: Alphabetically by Ortsbezeichnung

- **Update (Bearbeiten):**
  - Trigger: Pencil icon
  - Edit style: Same dialog as Create, pre-filled

- **Delete (Löschen):**
  - Trigger: Trash icon
  - Confirmation: "Möchtest du den Lagerort '{ortsbezeichnung}' wirklich löschen?"

**Werkzeugausgabe CRUD Operations**

- **Create (Erstellen):**
  - Trigger: Primary action button "Werkzeug ausgeben" OR "+" in Ausgaben tab
  - Form fields: Werkzeug (applookup select to Werkzeuge), Mitarbeiter (applookup select to Mitarbeiter), Ausgabedatum (datetimeminute, default now), Geplantes Rückgabedatum (date, required), Verwendungszweck (text), Notizen (textarea)
  - Form style: Dialog/Modal
  - Required fields: Werkzeug, Mitarbeiter, Geplantes Rückgabedatum
  - Default values: Ausgabedatum = current date/time

- **Read (Anzeigen):**
  - List view: Table with Werkzeug name, Mitarbeiter name, Ausgabedatum, Geplantes Rückgabedatum, Status (returned/overdue/active badge)
  - Detail view: Dialog with all fields + linked Rückgabe info if exists
  - Sort: By Ausgabedatum descending
  - Filter: By status (active/returned/overdue), by Mitarbeiter

- **Update (Bearbeiten):**
  - Trigger: Pencil icon
  - Edit style: Same dialog as Create, pre-filled (cannot change Werkzeug/Mitarbeiter after creation — show as read-only)

- **Delete (Löschen):**
  - Trigger: Trash icon
  - Confirmation: "Möchtest du diese Werkzeugausgabe wirklich löschen?"

**Werkzeugrückgabe CRUD Operations**

- **Create (Erstellen):**
  - Trigger: "Rückgabe erfassen" button on an active Ausgabe detail, or "+" in Rückgaben tab
  - Form fields: Ausgabe (applookup select to Werkzeugausgabe — if triggered from Ausgabe detail, pre-filled and read-only), Rückgabedatum (datetimeminute, default now), Rückgabe-Lagerort (applookup select to Lagerorte), Zustand bei Rückgabe (select from lookup_data), Beschädigungen (textarea, shown if Zustand is beschädigt/defekt), Notizen (textarea)
  - Form style: Dialog/Modal
  - Required fields: Ausgabe, Rückgabedatum, Zustand bei Rückgabe
  - Default values: Rückgabedatum = current date/time, Zustand = "einwandfrei"

- **Read (Anzeigen):**
  - List view: Table with linked Ausgabe info (tool + employee), Rückgabedatum, Zustand-Badge, Lagerort
  - Detail view: Dialog with all fields
  - Sort: By Rückgabedatum descending

- **Update (Bearbeiten):**
  - Trigger: Pencil icon
  - Edit style: Same dialog as Create, pre-filled

- **Delete (Löschen):**
  - Trigger: Trash icon
  - Confirmation: "Möchtest du diese Rückgabe wirklich löschen?"

---

## 7. Visual Details

### Border Radius
Rounded (8px) — `--radius: 0.5rem` — professional without being childish. Cards and buttons use this consistently.

### Shadows
Subtle — Cards use `shadow-sm` by default, `shadow-md` on hover. The hero card uses `shadow-sm` with no extra elevation to keep it grounded. Alert/overdue cards use a colored left border instead of shadow for emphasis.

### Spacing
Normal — `gap-6` (24px) between major sections, `gap-4` (16px) within sections, `gap-3` (12px) between list items. The layout breathes without wasting space.

### Animations
- **Page load:** Subtle fade-in for cards (opacity 0→1, 200ms, staggered 50ms per card)
- **Hover effects:** Cards get shadow-md transition (150ms), table rows get muted background (100ms)
- **Tap feedback:** Buttons scale down slightly (scale 0.98, 100ms) on active state
- **Data updates:** Toast notifications slide in from top-right (300ms)

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --radius: 0.5rem;
  --background: hsl(215 20% 97%);
  --foreground: hsl(215 25% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(215 25% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(215 25% 15%);
  --primary: hsl(25 95% 50%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(215 15% 93%);
  --secondary-foreground: hsl(215 25% 25%);
  --muted: hsl(215 15% 93%);
  --muted-foreground: hsl(215 10% 45%);
  --accent: hsl(215 60% 50%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(215 15% 88%);
  --input: hsl(215 15% 88%);
  --ring: hsl(25 95% 50%);
  --chart-1: hsl(25 95% 50%);
  --chart-2: hsl(152 60% 40%);
  --chart-3: hsl(215 60% 50%);
  --chart-4: hsl(45 90% 55%);
  --chart-5: hsl(340 65% 50%);
  --sidebar: hsl(215 20% 97%);
  --sidebar-foreground: hsl(215 25% 15%);
  --sidebar-primary: hsl(25 95% 50%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(215 15% 93%);
  --sidebar-accent-foreground: hsl(215 25% 25%);
  --sidebar-border: hsl(215 15% 88%);
  --sidebar-ring: hsl(25 95% 50%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Space Grotesk)
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero element is prominent as described
- [ ] Colors create the industrial-professional mood described in Section 2
- [ ] Fleet health bar renders correctly with real data proportions
- [ ] CRUD patterns are consistent across all apps
- [ ] Delete confirmations are in place
- [ ] Tab navigation works for all 6 views (Dashboard + 5 apps)
- [ ] Primary action button is contextual (changes label per active tab)
- [ ] Overdue calculations are correct (compare dates properly)
- [ ] applookup cross-references resolve correctly (tool names, employee names)
- [ ] All dates formatted in German locale (dd.MM.yyyy)
