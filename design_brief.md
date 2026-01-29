# Design Brief: Werkzeugverwaltung Dashboard

## 1. App Analysis

### What This App Does
This is a tool management system ("Werkzeugverwaltung") for what appears to be an electrical installation and construction company. It tracks tools (Werkzeuge) across different storage locations (Lagerorte), manages tool checkouts to employees (Werkzeugausgabe), and records returns with condition assessments (Werkzeugrückgabe). The system also tracks DGUV V3 inspection requirements for electrical equipment.

### Who Uses This
A workshop manager, warehouse supervisor, or site foreman who needs to:
- Know which tools are currently checked out and to whom
- Track tools that are overdue for return
- Monitor upcoming DGUV V3 inspections (legal requirement in Germany)
- Quickly issue or return tools
- See the overall status of the tool inventory

### The ONE Thing Users Care About Most
**"Where are my tools right now, and which ones need attention?"**

The user opens this dashboard to immediately see:
1. How many tools are currently out (checked out)
2. Which tools are overdue
3. Which tools need inspection soon

### Primary Actions (IMPORTANT!)
Users need to perform these actions most often:

1. **Werkzeug ausgeben** (Issue a tool) → Primary Action Button
   - This is the #1 action - someone comes to the workshop and needs a tool
2. **Werkzeug zurückgeben** (Return a tool) → Secondary action
   - When someone brings a tool back
3. View tool details → Click on a tool in the list

---

## 2. What Makes This Design Distinctive

### Visual Identity
This dashboard uses an **industrial-professional aesthetic** that feels appropriate for a workshop environment. The warm stone-gray tones with a strong amber/orange accent evoke tools, safety equipment, and industrial settings. It's serious and functional, but the amber accent adds energy and helps critical warnings (overdue, inspection needed) stand out naturally. The design feels like it belongs in a Werkstatt, not a generic SaaS product.

### Layout Strategy
The layout is **asymmetric with a clear hero section**:
- **Hero element**: A large status overview showing the 3 most critical numbers (Werkzeuge ausgegeben, Überfällig, Prüfung fällig) takes visual prominence at the top
- The hero uses **bold typography and color-coded indicators** - the count of overdue/inspection-due items uses the amber accent for warning
- **Below the hero**: A two-column layout on desktop with "Aktuelle Ausgaben" (current checkouts) taking 60% width and "Prüfungen fällig" (inspections due) taking 40%
- **Visual interest through size variation**: The hero numbers are dramatically large (48px+), secondary metrics are medium, and table text is compact
- **Mobile reorganizes to vertical flow** with hero at top, then stacked sections

### Unique Element
The **hero status cards use a distinctive "status pill" design** - each KPI has a rounded left edge with a colored indicator bar (green for OK, amber for warning, red for critical). This creates a visual "traffic light" effect that communicates status instantly without reading numbers. The indicator bar is 4px wide and uses rounded caps, creating a refined industrial meter aesthetic.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap`
- **Why this font:** Space Grotesk has a technical, industrial quality that suits a tool management system. Its geometric forms feel modern yet workmanlike. The distinct numerals make data easy to scan quickly.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(30 10% 96%)` | `--background` |
| Main text | `hsl(30 5% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(30 5% 15%)` | `--card-foreground` |
| Borders | `hsl(30 10% 88%)` | `--border` |
| Primary action (amber) | `hsl(32 95% 44%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(32 90% 95%)` | `--accent` |
| Muted background | `hsl(30 10% 94%)` | `--muted` |
| Muted text | `hsl(30 5% 45%)` | `--muted-foreground` |
| Success/positive (available) | `hsl(142 70% 35%)` | (component use) |
| Warning (overdue/inspection) | `hsl(32 95% 44%)` | (matches primary) |
| Error/negative (critical) | `hsl(0 70% 50%)` | `--destructive` |

### Why These Colors
The warm stone-gray background (`hsl(30 10% 96%)`) has a subtle warmth that feels industrial without being cold. The amber primary (`hsl(32 95% 44%)`) is reminiscent of safety equipment, warning signs, and the warmth of workshop lighting. It's bold enough to draw attention but professional enough for a business tool. The green success color is used sparingly for "available" or "OK" status.

### Background Treatment
The page background uses a warm off-white/stone color (`hsl(30 10% 96%)`). Cards are pure white to create subtle elevation. No gradients or patterns - the industrial aesthetic benefits from clean, solid surfaces.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Mobile uses a **single-column vertical flow** with the hero status section dominating the first viewport. The 3 key metrics stack horizontally in a compact row, making status visible immediately. Below, content sections stack vertically with clear section headers.

### What Users See (Top to Bottom)

**Header:**
- App title "Werkzeugverwaltung" left-aligned, medium weight
- Primary action button "Ausgeben" (amber, pill-shaped) right-aligned
- Compact height (56px)

**Hero Section (Status Overview):**
- Takes approximately 30% of viewport height
- Three status cards in a horizontal row (equal width, ~33% each)
- Each card shows:
  - Large number (32px, bold)
  - Label below (12px, muted)
  - Left border indicator (4px, color-coded)
- Cards: "Ausgegeben" (checked out), "Überfällig" (overdue), "Prüfung fällig" (inspection due)
- Why hero: Instantly answers "what needs my attention?"

**Section 2: Aktuelle Ausgaben (Current Checkouts)**
- Section header: "Aktuelle Ausgaben" with count badge
- Scrollable list of checkout cards
- Each card shows:
  - Tool name (bold)
  - Employee name
  - Checkout date
  - Days out / status (overdue highlighted in amber)
- Maximum 5 items shown, "Alle anzeigen" link for more
- Cards have subtle shadow and rounded corners

**Section 3: Prüfungen fällig (Inspections Due)**
- Section header: "Prüfungen fällig" with count badge
- Compact list format (not cards)
- Each row: Tool name, inspection date, days until due
- Items due within 7 days highlighted with amber background
- Items overdue highlighted with red text

**Bottom Navigation / Action:**
- Fixed bottom action bar (height 72px, white with top shadow)
- Primary button: "Werkzeug ausgeben" (full width, amber)
- This ensures the #1 action is always one tap away

### Mobile-Specific Adaptations
- Hero cards become compact horizontal pills
- Table views transform to card lists
- Touch targets minimum 44px
- Section content limited to 5 items with "show more"

### Touch Targets
- All interactive elements minimum 44px touch target
- Cards have full-surface tap area
- List rows have generous padding (16px vertical)

### Interactive Elements
- Tapping a checkout card shows tool details modal
- Tapping an inspection item shows tool details modal

---

## 5. Desktop Layout

### Overall Structure
A **two-row layout** with the hero spanning full width at top, then a two-column content area below:
- Top: Hero status cards (full width, ~120px height)
- Bottom left (60%): Current checkouts table
- Bottom right (40%): Inspections due + Quick stats

Eye flow: Hero numbers first → Current checkouts table → Inspections list

### Section Layout

**Top Row - Hero Status:**
- Three large status cards in horizontal row
- Each card: ~280px wide, equal spacing
- Generous padding (24px), large numbers (48px)
- Left border indicator (4px wide)
- Cards centered within the row with max-width constraint

**Main Content - Left Column (60%):**
"Aktuelle Ausgaben" section
- Section header with count badge
- Full data table with columns:
  - Werkzeug (tool name)
  - Mitarbeiter (employee)
  - Ausgabedatum (checkout date)
  - Geplante Rückgabe (planned return)
  - Status (badge: "Aktiv" or "Überfällig")
- Sortable by any column
- Shows up to 10 items, pagination if more
- Row hover shows "Details" action

**Main Content - Right Column (40%):**
"Prüfungen fällig" section
- Compact list of tools needing inspection
- Each row: Tool name, category icon, due date, days until
- Color-coded by urgency (within 7 days = amber, overdue = red)
- Shows up to 8 items

Below that:
"Schnellübersicht" (Quick Stats) mini-section
- Small stat cards in 2x2 grid:
  - Werkzeuge gesamt (total tools)
  - Verfügbar (available)
  - An Mitarbeiter (checked out)
  - Reparaturbedürftig (needs repair)

### What Appears on Hover
- Table rows: Subtle background highlight + "Details" text link appears
- Status cards: Subtle scale transform (1.02)
- Inspection items: Background highlight

### Clickable/Interactive Areas
- Hero cards: Click opens filtered view (e.g., click "Überfällig" shows only overdue)
- Table rows: Click opens tool detail modal
- Inspection items: Click opens tool detail modal

---

## 6. Components

### Hero KPI 1: Werkzeuge ausgegeben (Tools Checked Out)
The MOST important metric - how many tools are currently in circulation.

- **Title:** Ausgegeben
- **Data source:** werkzeugausgabe (checkouts) minus werkzeugrueckgabe (returns) - count checkouts that don't have a matching return
- **Calculation:** Count of werkzeugausgabe records where no corresponding werkzeugrueckgabe.ausgabe exists
- **Display:** Large number (48px desktop, 32px mobile) with subtle tool icon
- **Context shown:** None needed - the number itself is the answer
- **Indicator color:** Green if < 30% of total tools, Amber if 30-50%, Red if > 50%
- **Why this is the hero:** Core operational question: "How much of my inventory is out?"

### Hero KPI 2: Überfällig (Overdue)
- **Title:** Überfällig
- **Data source:** werkzeugausgabe
- **Calculation:** Count where geplantes_rueckgabedatum < today AND no return exists
- **Display:** Large number with warning indicator
- **Indicator color:** Green if 0, Amber if 1-3, Red if > 3
- **Format:** Number

### Hero KPI 3: Prüfung fällig (Inspection Due)
- **Title:** Prüfung fällig
- **Data source:** werkzeuge
- **Calculation:** Count where pruefpflicht = true AND naechster_prueftermin <= today + 30 days
- **Display:** Large number with calendar/check icon
- **Indicator color:** Green if 0, Amber if 1-5, Red if > 5
- **Format:** Number

### Secondary KPIs (Quick Stats on Desktop)

**Werkzeuge gesamt**
- Source: werkzeuge
- Calculation: Total count
- Format: number
- Display: Small stat card

**Verfügbar**
- Source: werkzeuge count - currently checked out count
- Calculation: Total tools minus tools with active checkout
- Format: number
- Display: Small stat card with green accent

**An Mitarbeiter**
- Source: werkzeugausgabe (active)
- Calculation: Same as Hero KPI 1
- Format: number
- Display: Small stat card

**Reparaturbedürftig**
- Source: werkzeuge
- Calculation: Count where zustand = "reparaturbeduerftig" OR zustand = "defekt"
- Format: number
- Display: Small stat card with red accent if > 0

### Chart
No chart in this design. The data is better represented as lists and counts. Tool management is about current state, not trends over time.

### Lists/Tables

**Aktuelle Ausgaben (Current Checkouts)**
- Purpose: See all currently checked-out tools at a glance, identify overdue items
- Source: werkzeugausgabe joined with werkzeuge and mitarbeiter, filtered to active (no return)
- Fields shown:
  - werkzeug.bezeichnung (tool name)
  - mitarbeiter.vorname + nachname (employee)
  - ausgabedatum (checkout date)
  - geplantes_rueckgabedatum (planned return)
  - Status badge (calculated: "Aktiv" or "Überfällig")
- Mobile style: Cards with key info
- Desktop style: Data table with sortable columns
- Sort: By geplantes_rueckgabedatum ascending (overdue first)
- Limit: 10 on desktop, 5 on mobile

**Prüfungen fällig (Inspections Due)**
- Purpose: Compliance tracking - never miss a DGUV V3 inspection
- Source: werkzeuge where pruefpflicht = true
- Fields shown:
  - bezeichnung (tool name)
  - kategorie (category)
  - naechster_prueftermin (next inspection date)
  - Days until (calculated)
- Mobile style: Compact list rows
- Desktop style: Compact list with color-coded urgency
- Sort: By naechster_prueftermin ascending (most urgent first)
- Limit: 8 items, filtered to next 60 days

### Primary Action Button (REQUIRED!)

- **Label:** "Werkzeug ausgeben" (mobile: "Ausgeben")
- **Action:** navigate to form / open modal
- **Target app:** werkzeugausgabe
- **What data:** Form with fields:
  - werkzeug (applookup select)
  - mitarbeiter (applookup select)
  - ausgabedatum (datetime, default: now)
  - geplantes_rueckgabedatum (date)
  - verwendungszweck (text, optional)
- **Mobile position:** bottom_fixed (full-width button in sticky footer)
- **Desktop position:** header (right-aligned button in page header)
- **Why this action:** This is literally the core workflow - someone comes to get a tool, you log it immediately

### Secondary Action

- **Label:** "Rückgabe erfassen"
- **Action:** navigate to form / open modal
- **Target app:** werkzeugrueckgabe
- **Position:** Next to primary on desktop, in action sheet on mobile (swipe up)

---

## 7. Visual Details

### Border Radius
- Cards: 12px (rounded, but not too playful)
- Buttons: 8px (or pill for primary CTA)
- Inputs: 8px
- Status badges: 4px
- Hero indicator bars: 4px (rounded caps)

### Shadows
- Cards: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` - subtle, functional
- Hover: `0 4px 12px rgba(0,0,0,0.1)` - slight lift
- Fixed bottom bar: `0 -2px 10px rgba(0,0,0,0.08)` - top shadow

### Spacing
- Page padding: 16px mobile, 24px desktop
- Card padding: 16px mobile, 20px desktop
- Section gap: 24px mobile, 32px desktop
- Element gap within sections: 12px
- Overall feel: Normal to spacious - breathing room for clarity

### Animations
- **Page load:** Subtle fade-in (200ms), hero numbers count up from 0
- **Hover effects:** Cards scale to 1.02 with 150ms ease, background color shift
- **Tap feedback:** Quick scale down to 0.98, then back
- **Number changes:** Animate with counting effect when data updates

---

## 8. CSS Variables (Copy Exactly!)

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

:root {
  --background: hsl(30 10% 96%);
  --foreground: hsl(30 5% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(30 5% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(30 5% 15%);
  --primary: hsl(32 95% 44%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(30 10% 94%);
  --secondary-foreground: hsl(30 5% 25%);
  --muted: hsl(30 10% 94%);
  --muted-foreground: hsl(30 5% 45%);
  --accent: hsl(32 90% 95%);
  --accent-foreground: hsl(32 95% 30%);
  --destructive: hsl(0 70% 50%);
  --border: hsl(30 10% 88%);
  --input: hsl(30 10% 88%);
  --ring: hsl(32 95% 44%);
  --radius: 0.75rem;

  /* Additional semantic colors */
  --success: hsl(142 70% 35%);
  --warning: hsl(32 95% 44%);
  --danger: hsl(0 70% 50%);
}

body {
  font-family: 'Space Grotesk', sans-serif;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from Google Fonts URL above
- [ ] All CSS variables copied exactly to src/index.css
- [ ] Mobile layout matches Section 4 (hero at top, fixed bottom action)
- [ ] Desktop layout matches Section 5 (hero full width, two columns below)
- [ ] Hero status cards have left border indicators with color coding
- [ ] Numbers use Space Grotesk with dramatic size (48px desktop, 32px mobile)
- [ ] Amber color used consistently for warnings and primary actions
- [ ] Current checkouts table sorted by due date (overdue first)
- [ ] Inspections list filtered to next 60 days, sorted by urgency
- [ ] Primary action button is prominent and always accessible
- [ ] Touch targets are minimum 44px on mobile
- [ ] Cards have subtle shadows as specified
- [ ] Status badges use correct color coding (green/amber/red)
