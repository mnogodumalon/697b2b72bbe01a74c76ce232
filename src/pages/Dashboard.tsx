import { useState, useEffect, useMemo } from 'react';
import type { Werkzeuge, Werkzeugausgabe, Werkzeugrueckgabe, Lagerorte, Mitarbeiter } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { formatDistance, parseISO, format, isBefore, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Plus,
  Clock,
  AlertCircle,
  Wrench,
  ClipboardCheck,
  ArrowRightLeft,
  RefreshCw,
} from 'lucide-react';

// Types for enriched data
interface EnrichedCheckout extends Werkzeugausgabe {
  werkzeugData?: Werkzeuge;
  mitarbeiterData?: Mitarbeiter;
  isReturned: boolean;
}

interface ActivityItem {
  id: string;
  type: 'checkout' | 'return';
  date: string;
  werkzeugName: string;
  mitarbeiterName: string;
}

// Lookup label mappings
const LOCATION_TYPE_LABELS: Record<string, string> = {
  werkstatt: 'Werkstatt',
  fahrzeug: 'Fahrzeug',
  baustelle: 'Baustelle',
  aussenlager: 'Außenlager',
  sonstiges: 'Sonstiges',
};

const KATEGORIE_LABELS: Record<string, string> = {
  akkuwerkzeug: 'Akkuwerkzeug',
  elektrowerkzeug: 'Elektrowerkzeug',
  handwerkzeug: 'Handwerkzeug',
  messgeraet: 'Messgerät',
  pruefgeraet: 'Prüfgerät',
  leiter: 'Leiter',
  kabel_leitungen: 'Kabel/Leitungen',
  sonstiges: 'Sonstiges',
};

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Hero skeleton */}
        <Skeleton className="h-48 w-full rounded-lg" />

        {/* KPIs skeleton */}
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>

        {/* Activity skeleton */}
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

// Error component
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription className="mt-2">
          {error.message}
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Empty state component
function EmptyState({ onAddFirst }: { onAddFirst: () => void }) {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Wrench className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Noch keine Werkzeuge</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Beginnen Sie mit der Verwaltung Ihrer Werkzeuge, indem Sie ein Werkzeug ausgeben.
          </p>
          <Button onClick={onAddFirst}>
            <Plus className="h-4 w-4 mr-2" />
            Erste Ausgabe erstellen
          </Button>
        </div>
      </div>
    </div>
  );
}

// Progress Ring Component
function ProgressRing({
  value,
  max,
  size = 160,
  strokeWidth = 6
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{
            filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.3))',
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tracking-tight">{value}</span>
        <span className="text-sm text-muted-foreground">im Umlauf</span>
      </div>
    </div>
  );
}

// Alert KPI Card Component
function AlertKPICard({
  title,
  count,
  icon: Icon,
  variant,
  onClick,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
  variant: 'danger' | 'warning' | 'neutral';
  onClick?: () => void;
}) {
  const borderColor = {
    danger: 'border-l-[hsl(0,72%,51%)]',
    warning: 'border-l-[hsl(38,92%,50%)]',
    neutral: 'border-l-[hsl(215,20%,70%)]',
  }[variant];

  return (
    <Card
      className={`border-l-4 ${borderColor} cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 min-w-[120px] shrink-0`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Activity Item Component
function ActivityRow({ item }: { item: ActivityItem }) {
  const isCheckout = item.type === 'checkout';
  const timeAgo = formatDistance(parseISO(item.date), new Date(), {
    addSuffix: true,
    locale: de,
  });

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className={`p-2 rounded-full ${isCheckout ? 'bg-primary/10' : 'bg-[hsl(152,60%,40%)]/10'}`}>
        <ArrowRightLeft className={`h-4 w-4 ${isCheckout ? 'text-primary' : 'text-[hsl(152,60%,40%)]'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.werkzeugName}</p>
        <p className="text-sm text-muted-foreground truncate">{item.mitarbeiterName}</p>
      </div>
      <div className="text-right shrink-0">
        <Badge variant={isCheckout ? 'default' : 'secondary'} className={isCheckout ? '' : 'bg-[hsl(152,60%,40%)] text-white'}>
          {isCheckout ? 'Ausgabe' : 'Rückgabe'}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

// Checkout Form Dialog
function CheckoutDialog({
  open,
  onOpenChange,
  werkzeuge,
  mitarbeiter,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  werkzeuge: Werkzeuge[];
  mitarbeiter: Mitarbeiter[];
  onSubmit: (data: { werkzeugId: string; mitarbeiterId: string; verwendungszweck: string; rueckgabedatum: string; notizen: string }) => void;
  submitting: boolean;
}) {
  const [werkzeugId, setWerkzeugId] = useState('');
  const [mitarbeiterId, setMitarbeiterId] = useState('');
  const [verwendungszweck, setVerwendungszweck] = useState('');
  const [rueckgabedatum, setRueckgabedatum] = useState('');
  const [notizen, setNotizen] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!werkzeugId || !mitarbeiterId) return;
    onSubmit({ werkzeugId, mitarbeiterId, verwendungszweck, rueckgabedatum, notizen });
  };

  const resetForm = () => {
    setWerkzeugId('');
    setMitarbeiterId('');
    setVerwendungszweck('');
    setRueckgabedatum('');
    setNotizen('');
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Werkzeug ausgeben</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="werkzeug">Werkzeug *</Label>
            <Select value={werkzeugId} onValueChange={setWerkzeugId}>
              <SelectTrigger>
                <SelectValue placeholder="Werkzeug auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {werkzeuge.map((w) => (
                  <SelectItem key={w.record_id} value={w.record_id}>
                    {w.fields.bezeichnung || 'Unbenannt'} {w.fields.hersteller ? `(${w.fields.hersteller})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mitarbeiter">Mitarbeiter *</Label>
            <Select value={mitarbeiterId} onValueChange={setMitarbeiterId}>
              <SelectTrigger>
                <SelectValue placeholder="Mitarbeiter auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {mitarbeiter.map((m) => (
                  <SelectItem key={m.record_id} value={m.record_id}>
                    {m.fields.vorname} {m.fields.nachname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verwendungszweck">Verwendungszweck</Label>
            <Input
              id="verwendungszweck"
              value={verwendungszweck}
              onChange={(e) => setVerwendungszweck(e.target.value)}
              placeholder="z.B. Baustelle Musterstraße"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rueckgabedatum">Geplantes Rückgabedatum</Label>
            <Input
              id="rueckgabedatum"
              type="date"
              value={rueckgabedatum}
              onChange={(e) => setRueckgabedatum(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notizen">Notizen</Label>
            <Textarea
              id="notizen"
              value={notizen}
              onChange={(e) => setNotizen(e.target.value)}
              placeholder="Optionale Bemerkungen..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!werkzeugId || !mitarbeiterId || submitting}>
              {submitting ? 'Wird gespeichert...' : 'Ausgeben'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Detail Dialog for filtered lists
function DetailListDialog({
  open,
  onOpenChange,
  title,
  items,
  renderItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: Array<{ id: string; primary: string; secondary?: string }>;
  renderItem?: (item: { id: string; primary: string; secondary?: string }) => React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Keine Einträge</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                renderItem ? renderItem(item) : (
                  <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{item.primary}</p>
                    {item.secondary && (
                      <p className="text-sm text-muted-foreground">{item.secondary}</p>
                    )}
                  </div>
                )
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  // Data state
  const [werkzeuge, setWerkzeuge] = useState<Werkzeuge[]>([]);
  const [checkouts, setCheckouts] = useState<Werkzeugausgabe[]>([]);
  const [returns, setReturns] = useState<Werkzeugrueckgabe[]>([]);
  const [locations, setLocations] = useState<Lagerorte[]>([]);
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detail dialogs
  const [overdueDialogOpen, setOverdueDialogOpen] = useState(false);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, c, r, l, m] = await Promise.all([
        LivingAppsService.getWerkzeuge(),
        LivingAppsService.getWerkzeugausgabe(),
        LivingAppsService.getWerkzeugrueckgabe(),
        LivingAppsService.getLagerorte(),
        LivingAppsService.getMitarbeiter(),
      ]);
      setWerkzeuge(w);
      setCheckouts(c);
      setReturns(r);
      setLocations(l);
      setMitarbeiter(m);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create lookup maps
  const werkzeugMap = useMemo(() => {
    const map = new Map<string, Werkzeuge>();
    werkzeuge.forEach((w) => map.set(w.record_id, w));
    return map;
  }, [werkzeuge]);

  const mitarbeiterMap = useMemo(() => {
    const map = new Map<string, Mitarbeiter>();
    mitarbeiter.forEach((m) => map.set(m.record_id, m));
    return map;
  }, [mitarbeiter]);

  const locationMap = useMemo(() => {
    const map = new Map<string, Lagerorte>();
    locations.forEach((l) => map.set(l.record_id, l));
    return map;
  }, [locations]);

  // Create set of returned checkout IDs
  const returnedCheckoutIds = useMemo(() => {
    const set = new Set<string>();
    returns.forEach((r) => {
      const checkoutId = extractRecordId(r.fields.ausgabe);
      if (checkoutId) set.add(checkoutId);
    });
    return set;
  }, [returns]);

  // Calculate active checkouts (not returned)
  const activeCheckouts = useMemo<EnrichedCheckout[]>(() => {
    return checkouts
      .filter((c) => !returnedCheckoutIds.has(c.record_id))
      .map((c) => {
        const werkzeugId = extractRecordId(c.fields.werkzeug);
        const mitarbeiterId = extractRecordId(c.fields.mitarbeiter);
        return {
          ...c,
          werkzeugData: werkzeugId ? werkzeugMap.get(werkzeugId) : undefined,
          mitarbeiterData: mitarbeiterId ? mitarbeiterMap.get(mitarbeiterId) : undefined,
          isReturned: false,
        };
      });
  }, [checkouts, returnedCheckoutIds, werkzeugMap, mitarbeiterMap]);

  // Calculate KPIs
  const checkedOutCount = activeCheckouts.length;
  const totalTools = werkzeuge.length;

  // Overdue tools
  const overdueCheckouts = useMemo(() => {
    const today = new Date();
    return activeCheckouts.filter((c) => {
      if (!c.fields.geplantes_rueckgabedatum) return false;
      const dueDate = parseISO(c.fields.geplantes_rueckgabedatum);
      return isBefore(dueDate, today);
    });
  }, [activeCheckouts]);

  // Tools due for inspection (within 30 days)
  const inspectionDue = useMemo(() => {
    const thirtyDaysFromNow = addDays(new Date(), 30);
    const today = new Date();
    return werkzeuge.filter((w) => {
      if (!w.fields.pruefpflicht || !w.fields.naechster_prueftermin) return false;
      const inspectionDate = parseISO(w.fields.naechster_prueftermin);
      return isBefore(inspectionDate, thirtyDaysFromNow) && !isBefore(inspectionDate, today);
    });
  }, [werkzeuge]);

  // Overdue inspections
  const inspectionOverdue = useMemo(() => {
    const today = new Date();
    return werkzeuge.filter((w) => {
      if (!w.fields.pruefpflicht || !w.fields.naechster_prueftermin) return false;
      const inspectionDate = parseISO(w.fields.naechster_prueftermin);
      return isBefore(inspectionDate, today);
    });
  }, [werkzeuge]);

  const allInspectionIssues = [...inspectionOverdue, ...inspectionDue];

  // Tools needing repair
  const needsRepair = useMemo(() => {
    return werkzeuge.filter((w) =>
      w.fields.zustand === 'reparaturbeduerftig' || w.fields.zustand === 'defekt'
    );
  }, [werkzeuge]);

  // Recent activity (combined checkouts and returns)
  const recentActivity = useMemo<ActivityItem[]>(() => {
    const activities: ActivityItem[] = [];

    // Add checkouts
    checkouts.forEach((c) => {
      const werkzeugId = extractRecordId(c.fields.werkzeug);
      const mitarbeiterId = extractRecordId(c.fields.mitarbeiter);
      const werkzeug = werkzeugId ? werkzeugMap.get(werkzeugId) : undefined;
      const ma = mitarbeiterId ? mitarbeiterMap.get(mitarbeiterId) : undefined;

      activities.push({
        id: `checkout-${c.record_id}`,
        type: 'checkout',
        date: c.fields.ausgabedatum || c.createdat,
        werkzeugName: werkzeug?.fields.bezeichnung || 'Unbekanntes Werkzeug',
        mitarbeiterName: ma ? `${ma.fields.vorname} ${ma.fields.nachname}` : 'Unbekannt',
      });
    });

    // Add returns
    returns.forEach((r) => {
      const checkoutId = extractRecordId(r.fields.ausgabe);
      const checkout = checkoutId ? checkouts.find((c) => c.record_id === checkoutId) : undefined;
      if (!checkout) return;

      const werkzeugId = extractRecordId(checkout.fields.werkzeug);
      const mitarbeiterId = extractRecordId(checkout.fields.mitarbeiter);
      const werkzeug = werkzeugId ? werkzeugMap.get(werkzeugId) : undefined;
      const ma = mitarbeiterId ? mitarbeiterMap.get(mitarbeiterId) : undefined;

      activities.push({
        id: `return-${r.record_id}`,
        type: 'return',
        date: r.fields.rueckgabedatum || r.createdat,
        werkzeugName: werkzeug?.fields.bezeichnung || 'Unbekanntes Werkzeug',
        mitarbeiterName: ma ? `${ma.fields.vorname} ${ma.fields.nachname}` : 'Unbekannt',
      });
    });

    // Sort by date, newest first
    return activities.sort((a, b) => b.date.localeCompare(a.date));
  }, [checkouts, returns, werkzeugMap, mitarbeiterMap]);

  // Tools by location for chart
  const toolsByLocation = useMemo(() => {
    const counts = new Map<string, number>();

    werkzeuge.forEach((w) => {
      const locationId = extractRecordId(w.fields.aktueller_lagerort);
      const location = locationId ? locationMap.get(locationId) : null;
      const locationName = location?.fields.ortsbezeichnung || 'Ohne Standort';
      counts.set(locationName, (counts.get(locationName) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [werkzeuge, locationMap]);

  // Handle checkout submission
  const handleCheckoutSubmit = async (data: {
    werkzeugId: string;
    mitarbeiterId: string;
    verwendungszweck: string;
    rueckgabedatum: string;
    notizen: string;
  }) => {
    setSubmitting(true);
    try {
      const now = new Date();
      const ausgabedatum = format(now, "yyyy-MM-dd'T'HH:mm");

      await LivingAppsService.createWerkzeugausgabeEntry({
        werkzeug: createRecordUrl(APP_IDS.WERKZEUGE, data.werkzeugId),
        mitarbeiter: createRecordUrl(APP_IDS.MITARBEITER, data.mitarbeiterId),
        ausgabedatum,
        geplantes_rueckgabedatum: data.rueckgabedatum || undefined,
        verwendungszweck: data.verwendungszweck || undefined,
        notizen: data.notizen || undefined,
      });

      setCheckoutDialogOpen(false);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Failed to create checkout:', err);
      alert('Fehler beim Erstellen der Ausgabe. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render states
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;
  if (werkzeuge.length === 0) return <EmptyState onAddFirst={() => setCheckoutDialogOpen(true)} />;

  // Pie chart data for hero
  const pieData = [
    { name: 'Im Umlauf', value: checkedOutCount, color: 'hsl(var(--primary))' },
    { name: 'Verfügbar', value: totalTools - checkedOutCount, color: 'hsl(var(--muted))' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold">Werkzeugverwaltung</h1>
          <Button onClick={() => setCheckoutDialogOpen(true)} className="shadow-sm">
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Werkzeug ausgeben</span>
            <span className="sm:hidden">Ausgabe</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column (main content) - 3 cols on desktop */}
          <div className="lg:col-span-3 space-y-6">
            {/* Hero Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Progress Ring */}
                  <div className="shrink-0">
                    <ProgressRing
                      value={checkedOutCount}
                      max={totalTools}
                      size={160}
                      strokeWidth={6}
                    />
                  </div>

                  {/* Hero text */}
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-semibold mb-1">Werkzeuge im Umlauf</h2>
                    <p className="text-muted-foreground mb-4">
                      von {totalTools} Werkzeugen im Bestand
                    </p>

                    {/* Mini breakdown - hide on mobile */}
                    <div className="hidden md:grid grid-cols-2 gap-4 mt-4">
                      {Object.entries(
                        activeCheckouts.reduce((acc, c) => {
                          const kategorie = c.werkzeugData?.fields.kategorie || 'sonstiges';
                          acc[kategorie] = (acc[kategorie] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([kategorie, count]) => (
                          <div key={kategorie} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{KATEGORIE_LABELS[kategorie] || kategorie}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alert KPIs - Horizontal scroll on mobile */}
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3">
              <AlertKPICard
                title="Überfällig"
                count={overdueCheckouts.length}
                icon={Clock}
                variant={overdueCheckouts.length > 0 ? 'danger' : 'neutral'}
                onClick={() => setOverdueDialogOpen(true)}
              />
              <AlertKPICard
                title="Prüfung fällig"
                count={allInspectionIssues.length}
                icon={ClipboardCheck}
                variant={allInspectionIssues.length > 0 ? 'warning' : 'neutral'}
                onClick={() => setInspectionDialogOpen(true)}
              />
              <AlertKPICard
                title="Reparaturbedürftig"
                count={needsRepair.length}
                icon={Wrench}
                variant={needsRepair.length > 0 ? 'neutral' : 'neutral'}
                onClick={() => setRepairDialogOpen(true)}
              />
            </div>

            {/* Location Chart - Desktop only */}
            <Card className="hidden lg:block">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Werkzeuge nach Standort</CardTitle>
              </CardHeader>
              <CardContent>
                {toolsByLocation.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={toolsByLocation} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                          width={120}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`${value} Werkzeuge`, 'Anzahl']}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--primary))"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Keine Standortdaten verfügbar</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column (sidebar) - 2 cols on desktop */}
          <div className="lg:col-span-2">
            <Card className="lg:sticky lg:top-20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Letzte Aktivitäten</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] lg:h-[500px]">
                  <div className="px-4 pb-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.slice(0, 10).map((item) => (
                        <ActivityRow key={item.id} item={item} />
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Noch keine Aktivitäten
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutDialogOpen}
        onOpenChange={setCheckoutDialogOpen}
        werkzeuge={werkzeuge}
        mitarbeiter={mitarbeiter}
        onSubmit={handleCheckoutSubmit}
        submitting={submitting}
      />

      {/* Overdue Tools Dialog */}
      <DetailListDialog
        open={overdueDialogOpen}
        onOpenChange={setOverdueDialogOpen}
        title="Überfällige Werkzeuge"
        items={overdueCheckouts.map((c) => ({
          id: c.record_id,
          primary: c.werkzeugData?.fields.bezeichnung || 'Unbekannt',
          secondary: `Fällig: ${c.fields.geplantes_rueckgabedatum ? format(parseISO(c.fields.geplantes_rueckgabedatum), 'dd.MM.yyyy') : 'N/A'} • ${c.mitarbeiterData ? `${c.mitarbeiterData.fields.vorname} ${c.mitarbeiterData.fields.nachname}` : 'Unbekannt'}`,
        }))}
      />

      {/* Inspection Due Dialog */}
      <DetailListDialog
        open={inspectionDialogOpen}
        onOpenChange={setInspectionDialogOpen}
        title="Prüfungen fällig"
        items={allInspectionIssues.map((w) => ({
          id: w.record_id,
          primary: w.fields.bezeichnung || 'Unbekannt',
          secondary: `Prüftermin: ${w.fields.naechster_prueftermin ? format(parseISO(w.fields.naechster_prueftermin), 'dd.MM.yyyy') : 'N/A'}`,
        }))}
      />

      {/* Repair Needed Dialog */}
      <DetailListDialog
        open={repairDialogOpen}
        onOpenChange={setRepairDialogOpen}
        title="Reparaturbedürftige Werkzeuge"
        items={needsRepair.map((w) => ({
          id: w.record_id,
          primary: w.fields.bezeichnung || 'Unbekannt',
          secondary: `Zustand: ${w.fields.zustand === 'defekt' ? 'Defekt' : 'Reparaturbedürftig'}`,
        }))}
      />
    </div>
  );
}
