import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Wrench,
  AlertTriangle,
  ClipboardCheck,
  Plus,
  ArrowLeft,
  Package,
  CheckCircle,
  Users,
  AlertCircle,
  Calendar,
  User,
  Clock,
  MapPin,
} from 'lucide-react';
import type {
  Werkzeuge,
  Werkzeugausgabe,
  Werkzeugrueckgabe,
  Mitarbeiter,
  Lagerorte,
} from '@/types/app';
import { APP_IDS } from '@/types/app';
import {
  LivingAppsService,
  extractRecordId,
  createRecordUrl,
} from '@/services/livingAppsService';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ============================================================================
// Types
// ============================================================================

interface EnrichedCheckout {
  checkout: Werkzeugausgabe;
  tool: Werkzeuge | null;
  employee: Mitarbeiter | null;
  isOverdue: boolean;
  daysOut: number;
}

interface ToolWithInspection {
  tool: Werkzeuge;
  daysUntilDue: number;
  isOverdue: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusColor(
  count: number,
  thresholds: { warning: number; danger: number }
): 'success' | 'warning' | 'danger' {
  if (count === 0) return 'success';
  if (count <= thresholds.warning) return 'warning';
  return 'danger';
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr.split('T')[0]), 'dd.MM.yyyy', { locale: de });
  } catch {
    return '-';
  }
}

// Lookup data maps
const KATEGORIE_LABELS: Record<string, string> = {
  messgeraet: 'Messgerät',
  pruefgeraet: 'Prüfgerät',
  akkuwerkzeug: 'Akkuwerkzeug',
  elektrowerkzeug: 'Elektrowerkzeug',
  handwerkzeug: 'Handwerkzeug',
  leiter: 'Leiter',
  kabel_leitungen: 'Kabel & Leitungen',
  sonstiges: 'Sonstiges',
};

const ZUSTAND_LABELS: Record<string, string> = {
  neu: 'Neu',
  sehr_gut: 'Sehr gut',
  gut: 'Gut',
  gebrauchsspuren: 'Gebrauchsspuren',
  reparaturbeduerftig: 'Reparaturbedürftig',
  defekt: 'Defekt',
};

const LAGERORT_TYP_LABELS: Record<string, string> = {
  werkstatt: 'Werkstatt',
  fahrzeug: 'Fahrzeug',
  baustelle: 'Baustelle',
  aussenlager: 'Außenlager',
  sonstiges: 'Sonstiges',
};

const RUECKGABE_ZUSTAND_LABELS: Record<string, string> = {
  einwandfrei: 'Einwandfrei',
  leichte_gebrauchsspuren: 'Leichte Gebrauchsspuren',
  verschmutzt: 'Verschmutzt',
  beschaedigt: 'Beschädigt',
  defekt: 'Defekt',
};

// ============================================================================
// Loading State Component
// ============================================================================

function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Hero KPIs skeleton */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 md:h-32 rounded-xl" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[180px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Error State Component
// ============================================================================

function ErrorState({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{error.message}</p>
          <Button variant="outline" onClick={onRetry}>
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ============================================================================
// Hero Status Card Component
// ============================================================================

function StatusCard({
  title,
  value,
  icon: Icon,
  status,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  status: 'success' | 'warning' | 'danger';
  onClick?: () => void;
}) {
  const statusColors = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-150 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      {/* Status indicator bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${statusColors[status]} rounded-l-xl`}
      />
      <CardContent className="p-4 md:p-6 pl-4 md:pl-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[32px] md:text-[48px] font-bold leading-none tracking-tight">
              {value}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
              {title}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Quick Stats Card Component
// ============================================================================

function QuickStatCard({
  title,
  value,
  variant = 'default',
}: {
  title: string;
  value: number;
  variant?: 'default' | 'success' | 'danger';
}) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-l-4 border-l-success',
    danger: 'border-l-4 border-l-danger',
  };

  return (
    <div
      className={`bg-card rounded-lg p-3 border ${variantStyles[variant]} shadow-sm`}
    >
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{title}</p>
    </div>
  );
}

// ============================================================================
// Checkout Card (Mobile)
// ============================================================================

function CheckoutCard({
  checkout,
  onClick,
}: {
  checkout: EnrichedCheckout;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="font-medium truncate flex-1">
            {checkout.tool?.fields.bezeichnung || 'Unbekanntes Werkzeug'}
          </div>
          <Badge variant={checkout.isOverdue ? 'destructive' : 'secondary'}>
            {checkout.isOverdue ? 'Überfällig' : 'Aktiv'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span>
              {checkout.employee
                ? `${checkout.employee.fields.vorname || ''} ${checkout.employee.fields.nachname || ''}`.trim() ||
                  'Unbekannt'
                : 'Unbekannt'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(checkout.checkout.fields.ausgabedatum)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span
              className={checkout.isOverdue ? 'text-destructive font-medium' : ''}
            >
              {checkout.daysOut} Tage
              {checkout.isOverdue ? ' überfällig' : ' ausgegeben'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Tool Detail Dialog
// ============================================================================

function ToolDetailDialog({
  checkout,
  open,
  onOpenChange,
}: {
  checkout: EnrichedCheckout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!checkout) return null;

  const tool = checkout.tool;
  const employee = checkout.employee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tool?.fields.bezeichnung || 'Werkzeug-Details'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Tool Info */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">
              Werkzeug
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Hersteller:</div>
              <div>{tool?.fields.hersteller || '-'}</div>
              <div>Kategorie:</div>
              <div>
                {tool?.fields.kategorie
                  ? KATEGORIE_LABELS[tool.fields.kategorie]
                  : '-'}
              </div>
              <div>Seriennummer:</div>
              <div>{tool?.fields.seriennummer || '-'}</div>
              <div>Zustand:</div>
              <div>
                {tool?.fields.zustand
                  ? ZUSTAND_LABELS[tool.fields.zustand]
                  : '-'}
              </div>
            </div>
          </div>

          {/* Checkout Info */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">
              Ausgabe
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Mitarbeiter:</div>
              <div>
                {employee
                  ? `${employee.fields.vorname || ''} ${employee.fields.nachname || ''}`.trim() ||
                    '-'
                  : '-'}
              </div>
              <div>Ausgabedatum:</div>
              <div>{formatDate(checkout.checkout.fields.ausgabedatum)}</div>
              <div>Geplante Rückgabe:</div>
              <div
                className={checkout.isOverdue ? 'text-destructive font-medium' : ''}
              >
                {formatDate(checkout.checkout.fields.geplantes_rueckgabedatum)}
              </div>
              <div>Verwendungszweck:</div>
              <div>{checkout.checkout.fields.verwendungszweck || '-'}</div>
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={checkout.isOverdue ? 'destructive' : 'secondary'}>
              {checkout.isOverdue
                ? `${checkout.daysOut} Tage überfällig`
                : `${checkout.daysOut} Tage ausgegeben`}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Inspection Tool Detail Dialog
// ============================================================================

function InspectionDetailDialog({
  toolInspection,
  open,
  onOpenChange,
}: {
  toolInspection: ToolWithInspection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!toolInspection) return null;

  const { tool, daysUntilDue, isOverdue } = toolInspection;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Prüfung: {tool.fields.bezeichnung}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Hersteller:</div>
            <div>{tool.fields.hersteller || '-'}</div>
            <div>Kategorie:</div>
            <div>
              {tool.fields.kategorie
                ? KATEGORIE_LABELS[tool.fields.kategorie]
                : '-'}
            </div>
            <div>Seriennummer:</div>
            <div>{tool.fields.seriennummer || '-'}</div>
            <div>Nächster Prüftermin:</div>
            <div className={isOverdue ? 'text-destructive font-medium' : ''}>
              {formatDate(tool.fields.naechster_prueftermin)}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={isOverdue ? 'destructive' : 'default'}>
              {isOverdue
                ? `${Math.abs(daysUntilDue)} Tage überfällig`
                : `In ${daysUntilDue} Tagen fällig`}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Issue Tool Form Dialog
// ============================================================================

function IssueToolDialog({
  open,
  onOpenChange,
  tools,
  employees,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tools: Werkzeuge[];
  employees: Mitarbeiter[];
  onSuccess: () => void;
}) {
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTool('');
      setSelectedEmployee('');
      setReturnDate('');
      setPurpose('');
      setError(null);
    }
  }, [open]);

  // Filter to only show available tools
  const availableTools = tools.filter((t) => t.fields.bezeichnung);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedTool || !selectedEmployee) {
      setError('Bitte Werkzeug und Mitarbeiter auswählen');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      // Format: YYYY-MM-DDTHH:MM (no seconds!)
      const ausgabedatum = `${format(now, 'yyyy-MM-dd')}T${format(now, 'HH:mm')}`;

      await LivingAppsService.createWerkzeugausgabeEntry({
        werkzeug: createRecordUrl(APP_IDS.WERKZEUGE, selectedTool),
        mitarbeiter: createRecordUrl(APP_IDS.MITARBEITER, selectedEmployee),
        ausgabedatum,
        geplantes_rueckgabedatum: returnDate || undefined,
        verwendungszweck: purpose || undefined,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Fehler beim Speichern'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Werkzeug ausgeben</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="tool">Werkzeug *</Label>
            <Select value={selectedTool} onValueChange={setSelectedTool}>
              <SelectTrigger>
                <SelectValue placeholder="Werkzeug auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableTools.map((tool) => (
                  <SelectItem key={tool.record_id} value={tool.record_id}>
                    {tool.fields.bezeichnung}
                    {tool.fields.hersteller && ` (${tool.fields.hersteller})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee">Mitarbeiter *</Label>
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger>
                <SelectValue placeholder="Mitarbeiter auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.record_id} value={emp.record_id}>
                    {`${emp.fields.vorname || ''} ${emp.fields.nachname || ''}`.trim() ||
                      'Unbekannt'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="returnDate">Geplantes Rückgabedatum</Label>
            <Input
              id="returnDate"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Verwendungszweck</Label>
            <Input
              id="purpose"
              type="text"
              placeholder="z.B. Baustelle Hauptstraße"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? 'Speichern...' : 'Ausgeben'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Return Tool Form Dialog
// ============================================================================

function ReturnToolDialog({
  open,
  onOpenChange,
  activeCheckouts,
  locations,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCheckouts: EnrichedCheckout[];
  locations: Lagerorte[];
  onSuccess: () => void;
}) {
  const [selectedCheckout, setSelectedCheckout] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [condition, setCondition] = useState<string>('');
  const [damages, setDamages] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCheckout('');
      setSelectedLocation('');
      setCondition('');
      setDamages('');
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedCheckout) {
      setError('Bitte eine Ausgabe auswählen');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      // Format: YYYY-MM-DDTHH:MM (no seconds!)
      const rueckgabedatum = `${format(now, 'yyyy-MM-dd')}T${format(now, 'HH:mm')}`;

      await LivingAppsService.createWerkzeugrueckgabeEntry({
        ausgabe: createRecordUrl(APP_IDS.WERKZEUGAUSGABE, selectedCheckout),
        rueckgabedatum,
        rueckgabe_lagerort: selectedLocation
          ? createRecordUrl(APP_IDS.LAGERORTE, selectedLocation)
          : undefined,
        zustand_bei_rueckgabe: condition as Werkzeugrueckgabe['fields']['zustand_bei_rueckgabe'],
        beschaedigungen: damages || undefined,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Fehler beim Speichern'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Werkzeug zurückgeben</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="checkout">Ausgabe *</Label>
            <Select value={selectedCheckout} onValueChange={setSelectedCheckout}>
              <SelectTrigger>
                <SelectValue placeholder="Ausgabe auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {activeCheckouts.map((checkout) => (
                  <SelectItem
                    key={checkout.checkout.record_id}
                    value={checkout.checkout.record_id}
                  >
                    {checkout.tool?.fields.bezeichnung || 'Unbekannt'} -{' '}
                    {checkout.employee
                      ? `${checkout.employee.fields.vorname || ''} ${checkout.employee.fields.nachname || ''}`.trim()
                      : 'Unbekannt'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Rückgabe-Lagerort</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Lagerort auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.record_id} value={loc.record_id}>
                    {loc.fields.ortsbezeichnung || 'Unbekannt'}
                    {loc.fields.typ && ` (${LAGERORT_TYP_LABELS[loc.fields.typ]})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Zustand bei Rückgabe</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Zustand auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RUECKGABE_ZUSTAND_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="damages">Beschädigungen</Label>
            <Input
              id="damages"
              type="text"
              placeholder="Beschädigungen beschreiben..."
              value={damages}
              onChange={(e) => setDamages(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? 'Speichern...' : 'Zurückgeben'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function Dashboard() {
  // Data state
  const [tools, setTools] = useState<Werkzeuge[]>([]);
  const [checkouts, setCheckouts] = useState<Werkzeugausgabe[]>([]);
  const [returns, setReturns] = useState<Werkzeugrueckgabe[]>([]);
  const [employees, setEmployees] = useState<Mitarbeiter[]>([]);
  const [locations, setLocations] = useState<Lagerorte[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<EnrichedCheckout | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<ToolWithInspection | null>(null);

  // Fetch all data
  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const [toolsData, checkoutsData, returnsData, employeesData, locationsData] =
        await Promise.all([
          LivingAppsService.getWerkzeuge(),
          LivingAppsService.getWerkzeugausgabe(),
          LivingAppsService.getWerkzeugrueckgabe(),
          LivingAppsService.getMitarbeiter(),
          LivingAppsService.getLagerorte(),
        ]);

      setTools(toolsData);
      setCheckouts(checkoutsData);
      setReturns(returnsData);
      setEmployees(employeesData);
      setLocations(locationsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Create lookup maps
  const toolMap = useMemo(() => {
    const map = new Map<string, Werkzeuge>();
    tools.forEach((t) => map.set(t.record_id, t));
    return map;
  }, [tools]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, Mitarbeiter>();
    employees.forEach((e) => map.set(e.record_id, e));
    return map;
  }, [employees]);

  // Set of returned checkout IDs
  const returnedCheckoutIds = useMemo(() => {
    const ids = new Set<string>();
    returns.forEach((r) => {
      const checkoutId = extractRecordId(r.fields.ausgabe);
      if (checkoutId) ids.add(checkoutId);
    });
    return ids;
  }, [returns]);

  // Active checkouts (not returned)
  const activeCheckouts = useMemo<EnrichedCheckout[]>(() => {
    const today = new Date();

    return checkouts
      .filter((c) => !returnedCheckoutIds.has(c.record_id))
      .map((checkout) => {
        const toolId = extractRecordId(checkout.fields.werkzeug);
        const employeeId = extractRecordId(checkout.fields.mitarbeiter);
        const tool = toolId ? toolMap.get(toolId) || null : null;
        const employee = employeeId ? employeeMap.get(employeeId) || null : null;

        // Calculate overdue status
        let isOverdue = false;
        let daysOut = 0;

        if (checkout.fields.ausgabedatum) {
          const checkoutDate = parseISO(checkout.fields.ausgabedatum.split('T')[0]);
          daysOut = differenceInDays(today, checkoutDate);
        }

        if (checkout.fields.geplantes_rueckgabedatum) {
          const plannedReturn = parseISO(checkout.fields.geplantes_rueckgabedatum);
          isOverdue = today > plannedReturn;
          if (isOverdue) {
            daysOut = differenceInDays(today, plannedReturn);
          }
        }

        return { checkout, tool, employee, isOverdue, daysOut };
      })
      .sort((a, b) => {
        // Overdue first, then by days out descending
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        return b.daysOut - a.daysOut;
      });
  }, [checkouts, returnedCheckoutIds, toolMap, employeeMap]);

  // Tools with upcoming inspections (next 60 days)
  const toolsWithInspections = useMemo<ToolWithInspection[]>(() => {
    const today = new Date();
    const sixtyDaysFromNow = addDays(today, 60);

    return tools
      .filter((t) => t.fields.pruefpflicht && t.fields.naechster_prueftermin)
      .map((tool) => {
        const dueDate = parseISO(tool.fields.naechster_prueftermin!);
        const daysUntilDue = differenceInDays(dueDate, today);
        const isOverdue = daysUntilDue < 0;
        return { tool, daysUntilDue, isOverdue };
      })
      .filter(({ tool }) => {
        const dueDate = parseISO(tool.fields.naechster_prueftermin!);
        return dueDate <= sixtyDaysFromNow;
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [tools]);

  // KPI calculations
  const checkedOutCount = activeCheckouts.length;
  const overdueCount = activeCheckouts.filter((c) => c.isOverdue).length;
  const inspectionsDueCount = toolsWithInspections.filter(
    (t) => t.daysUntilDue <= 30
  ).length;

  // Quick stats
  const totalTools = tools.length;
  const availableTools = totalTools - checkedOutCount;
  const needsRepairCount = tools.filter(
    (t) =>
      t.fields.zustand === 'reparaturbeduerftig' || t.fields.zustand === 'defekt'
  ).length;

  // Handle data refresh
  function handleRefresh() {
    fetchData();
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={handleRefresh} />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold">Werkzeugverwaltung</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex"
              onClick={() => setReturnDialogOpen(true)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Rückgabe
            </Button>
            <Button size="sm" onClick={() => setIssueDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Werkzeug </span>ausgeben
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-6 py-4 md:py-6 space-y-6">
        {/* Hero Status Cards */}
        <section>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <StatusCard
              title="Ausgegeben"
              value={checkedOutCount}
              icon={Wrench}
              status={getStatusColor(checkedOutCount, {
                warning: Math.floor(totalTools * 0.3),
                danger: Math.floor(totalTools * 0.5),
              })}
            />
            <StatusCard
              title="Überfällig"
              value={overdueCount}
              icon={AlertTriangle}
              status={getStatusColor(overdueCount, { warning: 3, danger: 3 })}
            />
            <StatusCard
              title="Prüfung fällig"
              value={inspectionsDueCount}
              icon={ClipboardCheck}
              status={getStatusColor(inspectionsDueCount, { warning: 5, danger: 5 })}
            />
          </div>
        </section>

        {/* Main Content */}
        <section className="grid md:grid-cols-5 gap-6">
          {/* Current Checkouts - 60% */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg">
                    Aktuelle Ausgaben
                  </CardTitle>
                  <Badge variant="secondary">{activeCheckouts.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {activeCheckouts.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Keine Werkzeuge ausgegeben</p>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => setIssueDialogOpen(true)}
                    >
                      Erstes Werkzeug ausgeben
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Mobile: Cards */}
                    <div className="md:hidden space-y-3">
                      {activeCheckouts.slice(0, 5).map((checkout) => (
                        <CheckoutCard
                          key={checkout.checkout.record_id}
                          checkout={checkout}
                          onClick={() => setSelectedCheckout(checkout)}
                        />
                      ))}
                      {activeCheckouts.length > 5 && (
                        <p className="text-center text-sm text-muted-foreground pt-2">
                          +{activeCheckouts.length - 5} weitere Ausgaben
                        </p>
                      )}
                    </div>

                    {/* Desktop: Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Werkzeug</TableHead>
                            <TableHead>Mitarbeiter</TableHead>
                            <TableHead>Ausgabe</TableHead>
                            <TableHead>Geplante Rückgabe</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeCheckouts.slice(0, 10).map((checkout) => (
                            <TableRow
                              key={checkout.checkout.record_id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedCheckout(checkout)}
                            >
                              <TableCell className="font-medium">
                                {checkout.tool?.fields.bezeichnung || 'Unbekannt'}
                              </TableCell>
                              <TableCell>
                                {checkout.employee
                                  ? `${checkout.employee.fields.vorname || ''} ${checkout.employee.fields.nachname || ''}`.trim() ||
                                    'Unbekannt'
                                  : 'Unbekannt'}
                              </TableCell>
                              <TableCell>
                                {formatDate(checkout.checkout.fields.ausgabedatum)}
                              </TableCell>
                              <TableCell>
                                {formatDate(
                                  checkout.checkout.fields.geplantes_rueckgabedatum
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant={
                                    checkout.isOverdue ? 'destructive' : 'secondary'
                                  }
                                >
                                  {checkout.isOverdue ? 'Überfällig' : 'Aktiv'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {activeCheckouts.length > 10 && (
                        <p className="text-center text-sm text-muted-foreground pt-4">
                          +{activeCheckouts.length - 10} weitere Ausgaben
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 40% */}
          <div className="md:col-span-2 space-y-6">
            {/* Inspections Due */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg">
                    Prüfungen fällig
                  </CardTitle>
                  <Badge variant="secondary">
                    {toolsWithInspections.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {toolsWithInspections.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 text-success opacity-70" />
                    <p className="text-sm">Keine Prüfungen fällig</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {toolsWithInspections.slice(0, 8).map(({ tool, daysUntilDue, isOverdue }) => (
                      <div
                        key={tool.record_id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          isOverdue
                            ? 'bg-destructive/10 hover:bg-destructive/15'
                            : daysUntilDue <= 7
                            ? 'bg-accent hover:bg-accent/80'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() =>
                          setSelectedInspection({ tool, daysUntilDue, isOverdue })
                        }
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ClipboardCheck
                            className={`h-4 w-4 flex-shrink-0 ${
                              isOverdue
                                ? 'text-destructive'
                                : daysUntilDue <= 7
                                ? 'text-warning'
                                : 'text-muted-foreground'
                            }`}
                          />
                          <span className="text-sm truncate">
                            {tool.fields.bezeichnung}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium flex-shrink-0 ${
                            isOverdue
                              ? 'text-destructive'
                              : daysUntilDue <= 7
                              ? 'text-warning'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {isOverdue
                            ? `${Math.abs(daysUntilDue)}d überfällig`
                            : `${daysUntilDue}d`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">
                  Schnellübersicht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <QuickStatCard title="Werkzeuge gesamt" value={totalTools} />
                  <QuickStatCard
                    title="Verfügbar"
                    value={availableTools}
                    variant="success"
                  />
                  <QuickStatCard
                    title="An Mitarbeiter"
                    value={checkedOutCount}
                  />
                  <QuickStatCard
                    title="Reparaturbedürftig"
                    value={needsRepairCount}
                    variant={needsRepairCount > 0 ? 'danger' : 'default'}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Mobile Fixed Bottom Action */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setReturnDialogOpen(true)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Rückgabe
          </Button>
          <Button className="flex-1" onClick={() => setIssueDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ausgeben
          </Button>
        </div>
      </div>

      {/* Spacer for mobile fixed bottom action */}
      <div className="md:hidden h-20" />

      {/* Dialogs */}
      <IssueToolDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        tools={tools}
        employees={employees}
        onSuccess={handleRefresh}
      />

      <ReturnToolDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        activeCheckouts={activeCheckouts}
        locations={locations}
        onSuccess={handleRefresh}
      />

      <ToolDetailDialog
        checkout={selectedCheckout}
        open={!!selectedCheckout}
        onOpenChange={(open) => !open && setSelectedCheckout(null)}
      />

      <InspectionDetailDialog
        toolInspection={selectedInspection}
        open={!!selectedInspection}
        onOpenChange={(open) => !open && setSelectedInspection(null)}
      />
    </div>
  );
}
