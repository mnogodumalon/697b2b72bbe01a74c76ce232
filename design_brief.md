# Design Brief: Werkzeugverwaltung Dashboard

## 1. App Analysis

### What This App Does
This is a tool management system for an electrical installation company. It tracks the complete lifecycle of tools: inventory management, who has which tools checked out, when they're due back, return condition documentation, and DGUV V3 inspection compliance. The system connects storage locations, employees, and tool records to provide full traceability.

### Who Uses This
Workshop managers, site supervisors, and warehouse staff at an electrical contracting company. They need to quickly see which tools are available, which are out on job sites, and ensure compliance with German electrical safety regulations (DGUV V3). They're practical people who want fast answers without digging through menus.

### The ONE Thing Users Care About Most
**"Wie viele Werkzeuge sind gerade im Umlauf?"** (How many tools are currently checked out?) - This is the pulse of their operation. If too many tools are out, they can't supply new jobs. If tools are overdue, someone needs to follow up.

### Primary Actions (IMPORTANT!)
1. **Werkzeug ausgeben** (Check out a tool) → Primary Action Button - This is the #1 daily action
2. View overdue tools and follow up
3. Check upcoming inspections
4. Record tool returns

---

## 2. What Makes This Design Distinctive

### Visual Identity
This design channels the aesthetic of a premium industrial management app - think German engineering precision meets modern software. A cool slate-blue base with amber-orange accents evokes workshop warning colors and high-visibility safety gear. The effect is professional, serious, and purpose-built for the trades - not a generic business dashboard, but something that feels at home next to precision measuring equipment.

### Layout Strategy
The layout uses **asymmetric emphasis** with the hero metric dominating the left/top position:
- **Hero**: The "Werkzeuge im Umlauf" (Tools in Circulation) metric takes center stage with a large, bold number and a compact donut chart showing the breakdown
- **Size variation**: The hero is 2x the visual weight of secondary KPIs, creating immediate hierarchy
- **Grouped secondary metrics**: Three smaller KPIs (Overdue, Due for Inspection, Needing Repair) sit horizontally below the hero, unified by their similar sizing
- **Activity feed**: Recent checkouts/returns provide temporal context without competing with the hero

### Unique Element
The **circular progress indicator** around the hero KPI shows the proportion of tools currently checked out vs. total inventory. The ring uses a thick 6px stroke with the amber accent color, with an animated fill on load. A subtle glow effect (2px shadow in accent color at 30% opacity) makes it feel almost like an illuminated gauge from industrial equipment.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap`
- **Why this font:** Space Grotesk has a technical, engineered quality with its geometric forms and slightly condensed proportions. It reads as modern and precise - perfect for a tool tracking system where accuracy matters.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(215 25% 97%)` | `--background` |
| Main text | `hsl(215 25% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(215 25% 15%)` | `--card-foreground` |
| Borders | `hsl(215 20% 88%)` | `--border` |
| Primary action | `hsl(25 95% 53%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(25 95% 53%)` | `--accent` |
| Muted background | `hsl(215 20% 94%)` | `--muted` |
| Muted text | `hsl(215 15% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(152 60% 40%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |
| Warning/attention | `hsl(38 92% 50%)` | (component use) |

### Why These Colors
The cool slate-blue base (`hsl(215 25% 97%)`) creates a calm, professional backdrop that reduces eye strain during long work sessions. The amber-orange primary (`hsl(25 95% 53%)`) is high-visibility - it's the universal color of safety equipment and industrial warnings. This creates instant recognition: orange = action needed. The combination says "serious professional tool" without being cold or sterile.

### Background Treatment
The background uses a subtle blue-gray tint (`hsl(215 25% 97%)`) rather than pure white. This reduces harsh contrast and gives the interface a cohesive, slightly industrial feel - like the brushed metal of quality tools.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, optimized for quick checks on the workshop floor.

### Layout Approach
The hero takes the entire top portion of the screen - a workshop manager glancing at their phone should see THE number immediately. Visual hierarchy is created through dramatic size differences: the hero number is 48px, secondary KPIs are 24px. The circular progress ring provides visual interest without clutter.

### What Users See (Top to Bottom)

**Header:**
- Left: "Werkzeugverwaltung" title in 18px semibold
- Right: Primary action button ("+ Ausgabe") - compact pill style, amber background

**Hero Section (The FIRST thing users see):**
- Takes approximately 40% of viewport height
- Central circular progress ring (140px diameter, 6px stroke)
- Inside the ring: The number of tools currently checked out in 48px bold
- Below the number: "von [total] Werkzeugen im Umlauf" in 14px muted text
- The ring animates from 0 to current percentage on load (0.6s ease-out)
- Why this is the hero: It answers THE question instantly - "how many tools are out right now?"

**Section 2: Alert KPIs (Horizontal scroll)**
- Three compact cards in a horizontal scroll container
- Each card: ~100px width, slight amber/red left border accent based on severity
- **Überfällig** (Overdue): Red accent, shows count of tools past return date
- **Prüfung fällig** (Due for Inspection): Amber accent, DGUV V3 inspections due within 30 days
- **Reparaturbedürftig** (Needing Repair): Gray accent, tools marked as damaged/defective
- Tap any card to see the list of affected tools

**Section 3: Letzte Aktivitäten (Recent Activity)**
- Simple list of last 5 checkouts/returns
- Each row: Tool icon, Tool name, Action (Ausgabe/Rückgabe), Employee name, Time ago
- Alternating subtle background for readability
- Full list accessible via "Alle anzeigen" link

**Bottom Navigation / Action:**
- No bottom nav bar - keep it clean
- The primary action is in the header for easy thumb reach

### Mobile-Specific Adaptations
- Alert KPIs become horizontally scrollable cards instead of side-by-side grid
- Activity list shows abbreviated info (tool name + action + time only)
- Charts are simplified or hidden - mobile users want quick numbers, not analysis

### Touch Targets
- All tappable cards minimum 48px height
- Primary action button: 44px height, generous horizontal padding
- Alert KPI cards: Full card is tappable (not just text)

### Interactive Elements
- Tap hero ring: Shows breakdown popup of tools by location
- Tap any alert KPI: Opens filtered list of those tools
- Tap activity row: Opens full checkout/return detail

---

## 5. Desktop Layout

### Overall Structure
Three-column layout with asymmetric widths: **60% main | 40% sidebar**

The eye flows: Hero (top-left) → Alert KPIs (below hero) → Activity feed (right sidebar)

Visual interest comes from the size contrast between the large hero card and the compact alert KPIs, plus the vertical sidebar creating asymmetry.

### Section Layout

**Top Area (Full Width):**
- Header bar: "Werkzeugverwaltung" title (left), Primary action button (right), Current date/time

**Main Content Area (60%, Left):**
- **Hero Card** (full main-column width, 200px height):
  - Left side: Large circular progress ring (160px diameter)
  - Inside ring: Checkout count in 56px bold
  - Right of ring: Explanatory text "Werkzeuge aktuell im Umlauf" + "von [total] im Bestand"
  - Below: Mini bar chart showing checkouts by category (Akkuwerkzeug, Elektrowerkzeug, etc.)

- **Alert KPIs Row** (below hero, three equal columns):
  - Three cards side by side: Überfällig, Prüfung fällig, Reparaturbedürftig
  - Each shows: Icon, count (large), label (small), colored left border accent
  - Click to see filtered list in a slide-out panel

- **Checkouts by Location Chart** (below alerts):
  - Horizontal bar chart showing tools checked out by storage location type
  - Helps identify if certain sites are hoarding tools

**Sidebar (40%, Right):**
- **Letzte Aktivitäten** (sticky while scrolling main content)
  - Last 10 checkout/return events
  - Each row: Timestamp, Tool name, Action badge (Ausgabe=amber, Rückgabe=green), Employee
  - "Alle Aktivitäten" button at bottom

### What Appears on Hover
- Alert KPI cards: Subtle elevation increase (shadow grows), cursor pointer
- Activity rows: Light background highlight, show "Details →" text
- Chart bars: Tooltip with exact count and percentage

### Clickable/Interactive Areas
- Hero ring: Hover shows tooltip "Zum Bestand", click opens tool inventory view
- Alert KPI cards: Click opens slide-out panel with filtered tool list
- Activity rows: Click opens full checkout/return detail modal
- Chart bars: Click filters to show tools at that location

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Werkzeuge im Umlauf
- **Data source:** Cross-reference Werkzeugausgabe and Werkzeugrückgabe
- **Calculation:** Count of checkouts (Werkzeugausgabe) that don't have a corresponding return (Werkzeugrückgabe where ausgabe reference matches). A tool is "checked out" if it has an ausgabe record with no matching rückgabe.
- **Display:** Large number (56px desktop, 48px mobile) inside a circular progress ring. The ring shows (checked out / total tools) as a percentage fill.
- **Context shown:** "von [total] im Bestand" text below the number, showing total tool count for context
- **Why this is the hero:** Workshop managers need to know at a glance how much of their inventory is currently deployed. This single number tells them if they can fulfill new requests or if they need to recall tools.

### Secondary KPIs

**Überfällig (Overdue)**
- Source: Werkzeugausgabe where geplantes_rueckgabedatum < today AND no matching Werkzeugrückgabe
- Calculation: Count of overdue, unreturned checkouts
- Format: number
- Display: Compact card with red left border, icon (clock with exclamation), count in 24px bold
- Color coding: Red accent when > 0

**Prüfung fällig (Inspections Due)**
- Source: Werkzeuge where pruefpflicht = true AND naechster_prueftermin is within next 30 days
- Calculation: Count of tools due for DGUV V3 inspection soon
- Format: number
- Display: Compact card with amber left border, icon (clipboard check), count in 24px bold
- Color coding: Amber accent when > 0

**Reparaturbedürftig (Needing Repair)**
- Source: Werkzeuge where zustand = "reparaturbeduerftig" OR zustand = "defekt"
- Calculation: Count of tools in poor condition
- Format: number
- Display: Compact card with gray left border, icon (wrench), count in 24px bold
- Color coding: Neutral unless critical threshold

### Chart (Desktop Only)

- **Type:** Horizontal bar chart - chosen because location names are text labels that read naturally left-to-right, and the values are easy to compare when bars extend horizontally
- **Title:** Werkzeuge nach Standort
- **What question it answers:** "Where are our tools distributed?" - helps identify if certain locations have too many tools checked out
- **Data source:** Werkzeuge, grouped by aktueller_lagerort
- **X-axis:** Count of tools
- **Y-axis:** Location name (from Lagerorte.ortsbezeichnung)
- **Mobile simplification:** Hidden on mobile - not critical for quick checks

### Lists/Tables

**Letzte Aktivitäten (Recent Activity)**
- Purpose: Show the pulse of tool movement - what's happening right now
- Source: Werkzeugausgabe and Werkzeugrückgabe, combined and sorted by date
- Fields shown: Timestamp (relative, e.g., "vor 2 Std."), Tool name (from werkzeug lookup), Action type (Ausgabe/Rückgabe), Employee name (from mitarbeiter lookup)
- Mobile style: Simple list with minimal info (tool + action + time)
- Desktop style: Richer list with all fields, subtle row dividers
- Sort: By date, newest first
- Limit: 5 on mobile, 10 on desktop

### Primary Action Button (REQUIRED!)

- **Label:** "Werkzeug ausgeben" (desktop) / "+ Ausgabe" (mobile, shorter)
- **Action:** add_record - opens form to create new Werkzeugausgabe record
- **Target app:** Werkzeugausgabe (app_id: 697b2b41d520e5a668295185)
- **What data:** Form fields for: werkzeug (applookup select), mitarbeiter (applookup select), verwendungszweck (text), geplantes_rueckgabedatum (date), notizen (optional textarea)
- **Mobile position:** header (top right, always visible)
- **Desktop position:** header (top right, prominent button)
- **Why this action:** Checking out tools is the most frequent action - it happens multiple times per day as workers head to job sites. Making this one tap away saves significant time.

---

## 7. Visual Details

### Border Radius
Rounded (8px) - Modern without being too soft. Matches the precision aesthetic while remaining approachable.

### Shadows
Subtle - Cards use `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`. On hover, elevate to `0 4px 6px rgba(0,0,0,0.1)`. The effect is gentle lift, not dramatic depth.

### Spacing
Normal (16px base unit) - Adequate breathing room without wasting screen space. Compact enough to show all critical info above the fold.

### Animations
- **Page load:** Stagger fade-in. Hero appears first (0ms), then alert KPIs (100ms delay), then activity feed (200ms delay). Each element fades from 0 to 1 opacity over 300ms.
- **Progress ring:** Animated draw from 0 to current value over 600ms, ease-out timing
- **Hover effects:** Cards lift slightly (translateY -2px) with shadow increase, 150ms transition
- **Tap feedback:** Scale to 0.98 on active state, spring back

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(215 25% 97%);
  --foreground: hsl(215 25% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(215 25% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(215 25% 15%);
  --primary: hsl(25 95% 53%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(215 20% 94%);
  --secondary-foreground: hsl(215 25% 15%);
  --muted: hsl(215 20% 94%);
  --muted-foreground: hsl(215 15% 50%);
  --accent: hsl(25 95% 53%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(215 20% 88%);
  --input: hsl(215 20% 88%);
  --ring: hsl(25 95% 53%);
  --radius: 0.5rem;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Space Grotesk)
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4 (hero-dominant, horizontal scroll KPIs)
- [ ] Desktop layout matches Section 5 (60/40 split, sidebar activity)
- [ ] Hero element is prominent as described (circular progress ring with large number)
- [ ] Colors create the industrial/precision mood described in Section 2
- [ ] Primary action button is always visible and accessible
- [ ] Alert KPIs show real data with appropriate color coding
- [ ] Activity feed shows combined checkout/return events
- [ ] Progress ring animates on load
- [ ] Hover states work as described
