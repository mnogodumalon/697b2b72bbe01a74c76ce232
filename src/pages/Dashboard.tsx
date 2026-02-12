import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Werkzeuge, Werkzeugausgabe, Werkzeugrueckgabe, Lagerorte, Mitarbeiter } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import { format, parseISO, formatDistance, isBefore, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Wrench, ArrowRight, ArrowUpRight, ArrowDownLeft, Plus, Pencil, Trash2,
  AlertCircle, CheckCircle, Clock, MapPin, Users, Package, Search,
  RefreshCw, AlertTriangle, Shield,
} from 'lucide-react';

// ─── Lookup labels ───
const KATEGORIE_LABELS: Record<string, string> = {
  elektrowerkzeug: 'Elektrowerkzeug', handwerkzeug: 'Handwerkzeug',
  messgeraet: 'Messgerät', pruefgeraet: 'Prüfgerät', akkuwerkzeug: 'Akkuwerkzeug',
  leiter: 'Leiter', kabel_leitungen: 'Kabel und Leitungen', sonstiges: 'Sonstiges',
};
const ZUSTAND_LABELS: Record<string, string> = {
  neu: 'Neu', sehr_gut: 'Sehr gut', gut: 'Gut',
  gebrauchsspuren: 'Gebrauchsspuren', reparaturbeduerftig: 'Reparaturbedürftig', defekt: 'Defekt',
};
const RUECKGABE_ZUSTAND_LABELS: Record<string, string> = {
  einwandfrei: 'Einwandfrei', leichte_gebrauchsspuren: 'Leichte Gebrauchsspuren',
  verschmutzt: 'Verschmutzt', beschaedigt: 'Beschädigt', defekt: 'Defekt',
};
const ABTEILUNG_LABELS: Record<string, string> = {
  elektroinstallation: 'Elektroinstallation', wartung_service: 'Wartung und Service',
  bauleitung: 'Bauleitung', planung: 'Planung', lager: 'Lager', verwaltung: 'Verwaltung',
};
const LAGERORT_TYP_LABELS: Record<string, string> = {
  werkstatt: 'Werkstatt', fahrzeug: 'Fahrzeug', baustelle: 'Baustelle',
  aussenlager: 'Außenlager', sonstiges: 'Sonstiges',
};

// ─── Helpers ───
function formatDate(d: string | undefined | null): string {
  if (!d) return '–';
  try { return format(parseISO(d.split('T')[0] || d), 'dd.MM.yyyy', { locale: de }); }
  catch { return d; }
}
function formatDateTime(d: string | undefined | null): string {
  if (!d) return '–';
  try { return format(parseISO(d), 'dd.MM.yyyy HH:mm', { locale: de }); }
  catch { return d; }
}
function relativeTime(d: string | undefined | null): string {
  if (!d) return '';
  try { return formatDistance(parseISO(d), new Date(), { addSuffix: true, locale: de }); }
  catch { return ''; }
}
function nowDateTimeMinute(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}T${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}
function todayDate(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}
function zustandColor(z: string | undefined): string {
  if (!z) return 'secondary';
  if (z === 'neu' || z === 'sehr_gut') return 'bg-emerald-100 text-emerald-800';
  if (z === 'gut') return 'bg-blue-100 text-blue-800';
  if (z === 'gebrauchsspuren') return 'bg-amber-100 text-amber-800';
  if (z === 'reparaturbeduerftig') return 'bg-orange-100 text-orange-800';
  if (z === 'defekt') return 'bg-red-100 text-red-800';
  return '';
}

// ─── Main Dashboard Component ───
export default function Dashboard() {
  const [werkzeuge, setWerkzeuge] = useState<Werkzeuge[]>([]);
  const [ausgaben, setAusgaben] = useState<Werkzeugausgabe[]>([]);
  const [rueckgaben, setRueckgaben] = useState<Werkzeugrueckgabe[]>([]);
  const [lagerorte, setLagerorte] = useState<Lagerorte[]>([]);
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [w, a, r, l, m] = await Promise.all([
        LivingAppsService.getWerkzeuge(),
        LivingAppsService.getWerkzeugausgabe(),
        LivingAppsService.getWerkzeugrueckgabe(),
        LivingAppsService.getLagerorte(),
        LivingAppsService.getMitarbeiter(),
      ]);
      setWerkzeuge(w); setAusgaben(a); setRueckgaben(r); setLagerorte(l); setMitarbeiter(m);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Lookup maps ───
  const werkzeugMap = useMemo(() => {
    const m = new Map<string, Werkzeuge>();
    werkzeuge.forEach(w => m.set(w.record_id, w));
    return m;
  }, [werkzeuge]);

  const mitarbeiterMap = useMemo(() => {
    const m = new Map<string, Mitarbeiter>();
    mitarbeiter.forEach(ma => m.set(ma.record_id, ma));
    return m;
  }, [mitarbeiter]);

  const lagerortMap = useMemo(() => {
    const m = new Map<string, Lagerorte>();
    lagerorte.forEach(l => m.set(l.record_id, l));
    return m;
  }, [lagerorte]);

  // ─── Computed: active checkouts (no matching return) ───
  const returnedAusgabeIds = useMemo(() => {
    const s = new Set<string>();
    rueckgaben.forEach(r => {
      const id = extractRecordId(r.fields.ausgabe);
      if (id) s.add(id);
    });
    return s;
  }, [rueckgaben]);

  const activeCheckouts = useMemo(() =>
    ausgaben.filter(a => !returnedAusgabeIds.has(a.record_id)),
  [ausgaben, returnedAusgabeIds]);

  const overdueCheckouts = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return activeCheckouts.filter(a => {
      if (!a.fields.geplantes_rueckgabedatum) return false;
      const planned = parseISO(a.fields.geplantes_rueckgabedatum);
      return isBefore(planned, today);
    });
  }, [activeCheckouts]);

  // ─── Computed: tools needing inspection within 30 days ───
  const upcomingInspections = useMemo(() => {
    const today = new Date();
    const in30 = addDays(today, 30);
    return werkzeuge.filter(w =>
      w.fields.pruefpflicht &&
      w.fields.naechster_prueftermin &&
      isBefore(parseISO(w.fields.naechster_prueftermin), in30)
    );
  }, [werkzeuge]);

  // ─── Computed: damaged tools ───
  const damagedTools = useMemo(() =>
    werkzeuge.filter(w => w.fields.zustand === 'reparaturbeduerftig' || w.fields.zustand === 'defekt'),
  [werkzeuge]);

  const availableCount = werkzeuge.length - activeCheckouts.length - damagedTools.length;

  // ─── Computed: category chart data ───
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    werkzeuge.forEach(w => {
      const k = w.fields.kategorie || 'sonstiges';
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).map(([key, count]) => ({
      name: KATEGORIE_LABELS[key] || key,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [werkzeuge]);

  // ─── Computed: recent activity ───
  const recentActivity = useMemo(() => {
    const items: Array<{
      type: 'ausgabe' | 'rueckgabe';
      date: string;
      werkzeugId: string | null;
      mitarbeiterId: string | null;
      record: Werkzeugausgabe | Werkzeugrueckgabe;
    }> = [];
    ausgaben.forEach(a => {
      items.push({
        type: 'ausgabe',
        date: a.fields.ausgabedatum || a.createdat,
        werkzeugId: extractRecordId(a.fields.werkzeug),
        mitarbeiterId: extractRecordId(a.fields.mitarbeiter),
        record: a,
      });
    });
    rueckgaben.forEach(r => {
      const ausgabeId = extractRecordId(r.fields.ausgabe);
      const ausgabe = ausgabeId ? ausgaben.find(a => a.record_id === ausgabeId) : null;
      items.push({
        type: 'rueckgabe',
        date: r.fields.rueckgabedatum || r.createdat,
        werkzeugId: ausgabe ? extractRecordId(ausgabe.fields.werkzeug) : null,
        mitarbeiterId: ausgabe ? extractRecordId(ausgabe.fields.mitarbeiter) : null,
        record: r,
      });
    });
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [ausgaben, rueckgaben]);

  // ─── Helper: get tool name by record_id ───
  function getToolName(id: string | null | undefined): string {
    if (!id) return 'Unbekannt';
    return werkzeugMap.get(id)?.fields.bezeichnung || 'Unbekannt';
  }
  function getEmployeeName(id: string | null | undefined): string {
    if (!id) return 'Unbekannt';
    const m = mitarbeiterMap.get(id);
    return m ? `${m.fields.vorname || ''} ${m.fields.nachname || ''}`.trim() : 'Unbekannt';
  }
  function getLagerortName(id: string | null | undefined): string {
    if (!id) return '–';
    return lagerortMap.get(id)?.fields.ortsbezeichnung || '–';
  }

  // ─── CRUD Dialog States ───
  const [showAusgabeDialog, setShowAusgabeDialog] = useState(false);
  const [showRueckgabeDialog, setShowRueckgabeDialog] = useState(false);
  const [editWerkzeug, setEditWerkzeug] = useState<Werkzeuge | null>(null);
  const [showWerkzeugDialog, setShowWerkzeugDialog] = useState(false);
  const [editMitarbeiter, setEditMitarbeiter] = useState<Mitarbeiter | null>(null);
  const [showMitarbeiterDialog, setShowMitarbeiterDialog] = useState(false);
  const [editLagerort, setEditLagerort] = useState<Lagerorte | null>(null);
  const [showLagerortDialog, setShowLagerortDialog] = useState(false);
  const [editAusgabe, setEditAusgabe] = useState<Werkzeugausgabe | null>(null);
  const [editRueckgabe, setEditRueckgabe] = useState<Werkzeugrueckgabe | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  const [prefilledAusgabeForReturn, setPrefilledAusgabeForReturn] = useState<string | null>(null);

  // Primary action label per tab
  const primaryActionLabel = useMemo(() => {
    switch (activeTab) {
      case 'werkzeuge': return 'Neues Werkzeug';
      case 'mitarbeiter': return 'Neuer Mitarbeiter';
      case 'lagerorte': return 'Neuer Lagerort';
      case 'ausgaben': return 'Werkzeug ausgeben';
      case 'rueckgaben': return 'Rückgabe erfassen';
      default: return 'Werkzeug ausgeben';
    }
  }, [activeTab]);

  function handlePrimaryAction() {
    switch (activeTab) {
      case 'werkzeuge': setEditWerkzeug(null); setShowWerkzeugDialog(true); break;
      case 'mitarbeiter': setEditMitarbeiter(null); setShowMitarbeiterDialog(true); break;
      case 'lagerorte': setEditLagerort(null); setShowLagerortDialog(true); break;
      case 'ausgaben': setEditAusgabe(null); setShowAusgabeDialog(true); break;
      case 'rueckgaben': setPrefilledAusgabeForReturn(null); setEditRueckgabe(null); setShowRueckgabeDialog(true); break;
      default: setEditAusgabe(null); setShowAusgabeDialog(true); break;
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      switch (deleteTarget.type) {
        case 'werkzeuge': await LivingAppsService.deleteWerkzeugeEntry(deleteTarget.id); break;
        case 'mitarbeiter': await LivingAppsService.deleteMitarbeiterEntry(deleteTarget.id); break;
        case 'lagerorte': await LivingAppsService.deleteLagerorteEntry(deleteTarget.id); break;
        case 'ausgaben': await LivingAppsService.deleteWerkzeugausgabeEntry(deleteTarget.id); break;
        case 'rueckgaben': await LivingAppsService.deleteWerkzeugrueckgabeEntry(deleteTarget.id); break;
      }
      toast.success('Gelöscht', { description: `"${deleteTarget.name}" wurde gelöscht.` });
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error('Fehler', { description: 'Eintrag konnte nicht gelöscht werden.' });
    }
  }

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold">Fehler beim Laden</h2>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" /> Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <h1 className="text-lg md:text-xl font-bold tracking-tight shrink-0">Werkzeugverwaltung</h1>

          <div className="hidden md:block flex-1 max-w-xl">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="werkzeuge">Werkzeuge</TabsTrigger>
                <TabsTrigger value="mitarbeiter">Mitarbeiter</TabsTrigger>
                <TabsTrigger value="lagerorte">Lagerorte</TabsTrigger>
                <TabsTrigger value="ausgaben">Ausgaben</TabsTrigger>
                <TabsTrigger value="rueckgaben">Rückgaben</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Button onClick={handlePrimaryAction} className="shrink-0 hidden md:flex">
            {activeTab === 'dashboard' ? <Wrench className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {primaryActionLabel}
          </Button>
        </div>

        {/* Mobile tab bar */}
        <div className="md:hidden overflow-x-auto border-t">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-max px-4">
              <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
              <TabsTrigger value="werkzeuge" className="text-xs">Werkzeuge</TabsTrigger>
              <TabsTrigger value="mitarbeiter" className="text-xs">Mitarbeiter</TabsTrigger>
              <TabsTrigger value="lagerorte" className="text-xs">Lagerorte</TabsTrigger>
              <TabsTrigger value="ausgaben" className="text-xs">Ausgaben</TabsTrigger>
              <TabsTrigger value="rueckgaben" className="text-xs">Rückgaben</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            werkzeuge={werkzeuge} activeCheckouts={activeCheckouts} overdueCheckouts={overdueCheckouts}
            upcomingInspections={upcomingInspections} damagedTools={damagedTools}
            availableCount={availableCount} categoryData={categoryData} recentActivity={recentActivity}
            getToolName={getToolName} getEmployeeName={getEmployeeName} getLagerortName={getLagerortName}
            werkzeugMap={werkzeugMap} mitarbeiterMap={mitarbeiterMap} ausgaben={ausgaben}
            onRecordReturn={(ausgabeId) => {
              setPrefilledAusgabeForReturn(ausgabeId);
              setEditRueckgabe(null);
              setShowRueckgabeDialog(true);
            }}
          />
        )}
        {activeTab === 'werkzeuge' && (
          <WerkzeugeView
            werkzeuge={werkzeuge} lagerortMap={lagerortMap}
            onEdit={(w) => { setEditWerkzeug(w); setShowWerkzeugDialog(true); }}
            onDelete={(w) => setDeleteTarget({ type: 'werkzeuge', id: w.record_id, name: w.fields.bezeichnung || 'Werkzeug' })}
            onCreate={() => { setEditWerkzeug(null); setShowWerkzeugDialog(true); }}
          />
        )}
        {activeTab === 'mitarbeiter' && (
          <MitarbeiterView
            mitarbeiter={mitarbeiter}
            onEdit={(m) => { setEditMitarbeiter(m); setShowMitarbeiterDialog(true); }}
            onDelete={(m) => setDeleteTarget({ type: 'mitarbeiter', id: m.record_id, name: `${m.fields.vorname || ''} ${m.fields.nachname || ''}`.trim() })}
            onCreate={() => { setEditMitarbeiter(null); setShowMitarbeiterDialog(true); }}
          />
        )}
        {activeTab === 'lagerorte' && (
          <LagerorteView
            lagerorte={lagerorte} werkzeuge={werkzeuge}
            onEdit={(l) => { setEditLagerort(l); setShowLagerortDialog(true); }}
            onDelete={(l) => setDeleteTarget({ type: 'lagerorte', id: l.record_id, name: l.fields.ortsbezeichnung || 'Lagerort' })}
            onCreate={() => { setEditLagerort(null); setShowLagerortDialog(true); }}
          />
        )}
        {activeTab === 'ausgaben' && (
          <AusgabenView
            ausgaben={ausgaben} returnedAusgabeIds={returnedAusgabeIds}
            getToolName={(a) => getToolName(extractRecordId(a.fields.werkzeug))}
            getEmployeeName={(a) => getEmployeeName(extractRecordId(a.fields.mitarbeiter))}
            onEdit={(a) => { setEditAusgabe(a); setShowAusgabeDialog(true); }}
            onDelete={(a) => setDeleteTarget({ type: 'ausgaben', id: a.record_id, name: `Ausgabe ${getToolName(extractRecordId(a.fields.werkzeug))}` })}
            onCreate={() => { setEditAusgabe(null); setShowAusgabeDialog(true); }}
            onRecordReturn={(ausgabeId) => {
              setPrefilledAusgabeForReturn(ausgabeId);
              setEditRueckgabe(null);
              setShowRueckgabeDialog(true);
            }}
          />
        )}
        {activeTab === 'rueckgaben' && (
          <RueckgabenView
            rueckgaben={rueckgaben}
            getToolName={(r) => {
              const aId = extractRecordId(r.fields.ausgabe);
              const a = aId ? ausgaben.find(x => x.record_id === aId) : null;
              return a ? getToolName(extractRecordId(a.fields.werkzeug)) : 'Unbekannt';
            }}
            getEmployeeName={(r) => {
              const aId = extractRecordId(r.fields.ausgabe);
              const a = aId ? ausgaben.find(x => x.record_id === aId) : null;
              return a ? getEmployeeName(extractRecordId(a.fields.mitarbeiter)) : 'Unbekannt';
            }}
            getLagerortName={(r) => getLagerortName(extractRecordId(r.fields.rueckgabe_lagerort))}
            onEdit={(r) => { setEditRueckgabe(r); setShowRueckgabeDialog(true); }}
            onDelete={(r) => setDeleteTarget({ type: 'rueckgaben', id: r.record_id, name: 'Rückgabe' })}
            onCreate={() => { setPrefilledAusgabeForReturn(null); setEditRueckgabe(null); setShowRueckgabeDialog(true); }}
          />
        )}
      </main>

      {/* ─── Mobile Fixed Bottom Action ─── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t z-40">
        <Button onClick={handlePrimaryAction} className="w-full h-12 text-base font-semibold">
          {activeTab === 'dashboard' ? <Wrench className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
          {primaryActionLabel}
          {activeTab === 'dashboard' && <ArrowRight className="h-5 w-5 ml-2" />}
        </Button>
      </div>

      {/* ─── CRUD Dialogs ─── */}
      <WerkzeugDialog
        open={showWerkzeugDialog}
        onOpenChange={setShowWerkzeugDialog}
        record={editWerkzeug}
        lagerorte={lagerorte}
        onSuccess={loadData}
      />
      <MitarbeiterDialog
        open={showMitarbeiterDialog}
        onOpenChange={setShowMitarbeiterDialog}
        record={editMitarbeiter}
        onSuccess={loadData}
      />
      <LagerortDialog
        open={showLagerortDialog}
        onOpenChange={setShowLagerortDialog}
        record={editLagerort}
        onSuccess={loadData}
      />
      <AusgabeDialog
        open={showAusgabeDialog}
        onOpenChange={setShowAusgabeDialog}
        record={editAusgabe}
        werkzeuge={werkzeuge}
        mitarbeiter={mitarbeiter}
        onSuccess={loadData}
      />
      <RueckgabeDialog
        open={showRueckgabeDialog}
        onOpenChange={setShowRueckgabeDialog}
        record={editRueckgabe}
        ausgaben={ausgaben}
        lagerorte={lagerorte}
        prefilledAusgabeId={prefilledAusgabeForReturn}
        getToolName={(a) => getToolName(extractRecordId(a.fields.werkzeug))}
        getEmployeeName={(a) => getEmployeeName(extractRecordId(a.fields.mitarbeiter))}
        onSuccess={loadData}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        name={deleteTarget?.name || ''}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ══════════════════════════════════════════
// ─── Dashboard View ───
// ══════════════════════════════════════════
interface DashboardViewProps {
  werkzeuge: Werkzeuge[];
  activeCheckouts: Werkzeugausgabe[];
  overdueCheckouts: Werkzeugausgabe[];
  upcomingInspections: Werkzeuge[];
  damagedTools: Werkzeuge[];
  availableCount: number;
  categoryData: Array<{ name: string; count: number }>;
  recentActivity: Array<{ type: string; date: string; werkzeugId: string | null; mitarbeiterId: string | null; record: any }>;
  getToolName: (id: string | null | undefined) => string;
  getEmployeeName: (id: string | null | undefined) => string;
  getLagerortName: (id: string | null | undefined) => string;
  werkzeugMap: Map<string, Werkzeuge>;
  mitarbeiterMap: Map<string, Mitarbeiter>;
  ausgaben: Werkzeugausgabe[];
  onRecordReturn: (ausgabeId: string) => void;
}

function DashboardView({
  werkzeuge, activeCheckouts, overdueCheckouts, upcomingInspections, damagedTools,
  availableCount, categoryData, recentActivity, getToolName, getEmployeeName,
  onRecordReturn,
}: DashboardViewProps) {
  const total = werkzeuge.length;
  const outPct = total ? Math.round((activeCheckouts.length / total) * 100) : 0;
  const availPct = total ? Math.round((Math.max(0, availableCount) / total) * 100) : 0;
  const damagedPct = total ? Math.round((damagedTools.length / total) * 100) : 0;

  const barColors = ['hsl(25 95% 50%)', 'hsl(152 60% 40%)', 'hsl(215 60% 50%)', 'hsl(45 90% 55%)', 'hsl(340 65% 50%)', 'hsl(215 10% 45%)', 'hsl(152 40% 55%)', 'hsl(25 70% 60%)'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
      {/* ─── Left Column ─── */}
      <div className="space-y-6">
        {/* Hero Card */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            {/* Fleet Health Bar */}
            <div className="mb-4">
              <div className="flex rounded-full h-2 overflow-hidden bg-muted">
                {availPct > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${availPct}%` }} />}
                {outPct > 0 && <div className="bg-amber-500 transition-all" style={{ width: `${outPct}%` }} />}
                {damagedPct > 0 && <div className="bg-red-500 transition-all" style={{ width: `${damagedPct}%` }} />}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Verfügbar {availPct}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Ausgegeben {outPct}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Reparatur/Defekt {damagedPct}%</span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Key Numbers */}
            <div className="flex flex-wrap items-end gap-6 md:gap-10">
              <div>
                <div className="text-5xl font-bold tracking-tight">{activeCheckouts.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Werkzeuge ausgegeben</div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-emerald-600">{Math.max(0, availableCount)}</div>
                <div className="text-sm text-muted-foreground mt-1">verfügbar</div>
              </div>
              <div>
                <div className="text-xl font-medium text-muted-foreground">{total}</div>
                <div className="text-sm text-muted-foreground mt-1">Gesamtbestand</div>
              </div>
            </div>

            {/* Mini-stat badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {overdueCheckouts.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {overdueCheckouts.length} überfällig
                </Badge>
              )}
              {upcomingInspections.length > 0 && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  {upcomingInspections.length} Prüfungen fällig
                </Badge>
              )}
              {damagedTools.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {damagedTools.length} defekt/reparaturbedürftig
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overdue Returns - only on mobile (desktop shows in right column) */}
        {overdueCheckouts.length > 0 && (
          <div className="lg:hidden">
            <OverdueCard overdueCheckouts={overdueCheckouts} getToolName={getToolName} getEmployeeName={getEmployeeName} onRecordReturn={onRecordReturn} />
          </div>
        )}

        {/* Active Checkouts Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Aktuelle Ausgaben
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeCheckouts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Keine Werkzeuge ausgegeben.</p>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Werkzeug</TableHead>
                      <TableHead>Mitarbeiter</TableHead>
                      <TableHead className="hidden md:table-cell">Ausgabe</TableHead>
                      <TableHead>Rückgabe geplant</TableHead>
                      <TableHead className="text-right">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeCheckouts
                      .sort((a, b) => (a.fields.geplantes_rueckgabedatum || '').localeCompare(b.fields.geplantes_rueckgabedatum || ''))
                      .map(a => {
                        const isOverdue = overdueCheckouts.some(o => o.record_id === a.record_id);
                        return (
                          <TableRow key={a.record_id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{getToolName(extractRecordId(a.fields.werkzeug))}</TableCell>
                            <TableCell>{getEmployeeName(extractRecordId(a.fields.mitarbeiter))}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(a.fields.ausgabedatum)}</TableCell>
                            <TableCell>
                              <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                                {formatDate(a.fields.geplantes_rueckgabedatum)}
                              </span>
                              {isOverdue && <Badge variant="destructive" className="ml-2 text-[10px]">Überfällig</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => onRecordReturn(a.record_id)}>
                                <ArrowDownLeft className="h-3 w-3 mr-1" /> Rückgabe
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Chart */}
        {categoryData.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Werkzeuge nach Kategorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="horizontal" margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0 0% 100%)',
                        border: '1px solid hsl(215 15% 88%)',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [`${value} Werkzeuge`, 'Anzahl']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={barColors[i % barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Right Column (desktop) ─── */}
      <div className="space-y-6">
        {/* Overdue Returns */}
        {overdueCheckouts.length > 0 && (
          <div className="hidden lg:block">
            <OverdueCard overdueCheckouts={overdueCheckouts} getToolName={getToolName} getEmployeeName={getEmployeeName} onRecordReturn={onRecordReturn} />
          </div>
        )}

        {/* Upcoming Inspections */}
        {upcomingInspections.length > 0 && (
          <Card className="shadow-sm border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-600" />
                Anstehende Prüfungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingInspections.slice(0, 5).map(w => (
                <div key={w.record_id} className="flex items-center justify-between text-sm py-1.5">
                  <span className="font-medium truncate mr-2">{w.fields.bezeichnung}</span>
                  <span className="text-muted-foreground shrink-0">{formatDate(w.fields.naechster_prueftermin)}</span>
                </div>
              ))}
              {upcomingInspections.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">+ {upcomingInspections.length - 5} weitere</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Letzte Aktivitäten
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Keine Aktivitäten.</p>
            ) : (
              <div className="space-y-1">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 text-sm">
                    <div className={`mt-0.5 rounded-full p-1 ${item.type === 'ausgabe' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {item.type === 'ausgabe' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{getToolName(item.werkzeugId)}</span>
                      <span className="text-muted-foreground"> — {getEmployeeName(item.mitarbeiterId)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{relativeTime(item.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Overdue Card Component ───
function OverdueCard({ overdueCheckouts, getToolName, getEmployeeName, onRecordReturn }: {
  overdueCheckouts: Werkzeugausgabe[];
  getToolName: (id: string | null | undefined) => string;
  getEmployeeName: (id: string | null | undefined) => string;
  onRecordReturn: (id: string) => void;
}) {
  return (
    <Card className="shadow-sm border-l-4 border-l-destructive">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Überfällige Rückgaben ({overdueCheckouts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {overdueCheckouts.map(a => {
          const daysDiff = a.fields.geplantes_rueckgabedatum
            ? Math.ceil((new Date().getTime() - parseISO(a.fields.geplantes_rueckgabedatum).getTime()) / (1000*60*60*24))
            : 0;
          return (
            <div key={a.record_id} className="flex items-center justify-between text-sm py-1.5 cursor-pointer hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors" onClick={() => onRecordReturn(a.record_id)}>
              <div className="min-w-0">
                <div className="font-medium truncate">{getToolName(extractRecordId(a.fields.werkzeug))}</div>
                <div className="text-xs text-muted-foreground">{getEmployeeName(extractRecordId(a.fields.mitarbeiter))}</div>
              </div>
              <Badge variant="destructive" className="text-[10px] shrink-0 ml-2">{daysDiff} Tage</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════
// ─── CRUD Views ───
// ══════════════════════════════════════════

// ─── Werkzeuge View ───
function WerkzeugeView({ werkzeuge, lagerortMap, onEdit, onDelete, onCreate }: {
  werkzeuge: Werkzeuge[];
  lagerortMap: Map<string, Lagerorte>;
  onEdit: (w: Werkzeuge) => void;
  onDelete: (w: Werkzeuge) => void;
  onCreate: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filterKategorie, setFilterKategorie] = useState('all');
  const [filterZustand, setFilterZustand] = useState('all');

  const filtered = useMemo(() => {
    return werkzeuge.filter(w => {
      const matchesSearch = !search || (w.fields.bezeichnung || '').toLowerCase().includes(search.toLowerCase())
        || (w.fields.hersteller || '').toLowerCase().includes(search.toLowerCase())
        || (w.fields.seriennummer || '').toLowerCase().includes(search.toLowerCase());
      const matchesKat = filterKategorie === 'all' || w.fields.kategorie === filterKategorie;
      const matchesZust = filterZustand === 'all' || w.fields.zustand === filterZustand;
      return matchesSearch && matchesKat && matchesZust;
    }).sort((a, b) => (a.fields.bezeichnung || '').localeCompare(b.fields.bezeichnung || ''));
  }, [werkzeuge, search, filterKategorie, filterZustand]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Werkzeug suchen..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterKategorie} onValueChange={setFilterKategorie}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Kategorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {Object.entries(KATEGORIE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterZustand} onValueChange={setFilterZustand}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Zustand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Zustände</SelectItem>
            {Object.entries(ZUSTAND_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={onCreate} className="sm:hidden"><Plus className="h-4 w-4 mr-1" /> Neu</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>Keine Werkzeuge gefunden.</p>
          <Button variant="outline" className="mt-3" onClick={onCreate}><Plus className="h-4 w-4 mr-1" /> Werkzeug hinzufügen</Button>
        </CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bezeichnung</TableHead>
                <TableHead>Hersteller</TableHead>
                <TableHead className="hidden md:table-cell">Seriennummer</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Zustand</TableHead>
                <TableHead className="hidden md:table-cell">Lagerort</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(w => (
                <TableRow key={w.record_id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{w.fields.bezeichnung || '–'}</TableCell>
                  <TableCell>{w.fields.hersteller || '–'}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{w.fields.seriennummer || '–'}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{KATEGORIE_LABELS[w.fields.kategorie || ''] || '–'}</Badge></TableCell>
                  <TableCell><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${zustandColor(w.fields.zustand)}`}>{ZUSTAND_LABELS[w.fields.zustand || ''] || '–'}</span></TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{getLagerortNameFromMap(w.fields.aktueller_lagerort, lagerortMap)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(w)} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(w)} className="text-destructive hover:text-destructive" aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function getLagerortNameFromMap(url: string | undefined, map: Map<string, Lagerorte>): string {
  if (!url) return '–';
  const id = extractRecordId(url);
  if (!id) return '–';
  return map.get(id)?.fields.ortsbezeichnung || '–';
}

// ─── Mitarbeiter View ───
function MitarbeiterView({ mitarbeiter, onEdit, onDelete, onCreate }: {
  mitarbeiter: Mitarbeiter[];
  onEdit: (m: Mitarbeiter) => void;
  onDelete: (m: Mitarbeiter) => void;
  onCreate: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filterAbt, setFilterAbt] = useState('all');

  const filtered = useMemo(() => {
    return mitarbeiter.filter(m => {
      const name = `${m.fields.vorname || ''} ${m.fields.nachname || ''}`.toLowerCase();
      const matchesSearch = !search || name.includes(search.toLowerCase()) || (m.fields.personalnummer || '').toLowerCase().includes(search.toLowerCase());
      const matchesAbt = filterAbt === 'all' || m.fields.abteilung === filterAbt;
      return matchesSearch && matchesAbt;
    }).sort((a, b) => (a.fields.nachname || '').localeCompare(b.fields.nachname || ''));
  }, [mitarbeiter, search, filterAbt]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Mitarbeiter suchen..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterAbt} onValueChange={setFilterAbt}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Abteilung" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Abteilungen</SelectItem>
            {Object.entries(ABTEILUNG_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={onCreate} className="sm:hidden"><Plus className="h-4 w-4 mr-1" /> Neu</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>Keine Mitarbeiter gefunden.</p>
          <Button variant="outline" className="mt-3" onClick={onCreate}><Plus className="h-4 w-4 mr-1" /> Mitarbeiter hinzufügen</Button>
        </CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Personalnr.</TableHead>
                <TableHead>Abteilung</TableHead>
                <TableHead className="hidden md:table-cell">Telefon</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => (
                <TableRow key={m.record_id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{m.fields.vorname} {m.fields.nachname}</TableCell>
                  <TableCell className="text-muted-foreground">{m.fields.personalnummer || '–'}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{ABTEILUNG_LABELS[m.fields.abteilung || ''] || '–'}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{m.fields.telefonnummer || '–'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(m)} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(m)} className="text-destructive hover:text-destructive" aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Lagerorte View ───
function LagerorteView({ lagerorte, werkzeuge, onEdit, onDelete, onCreate }: {
  lagerorte: Lagerorte[];
  werkzeuge: Werkzeuge[];
  onEdit: (l: Lagerorte) => void;
  onDelete: (l: Lagerorte) => void;
  onCreate: () => void;
}) {
  const toolCounts = useMemo(() => {
    const counts = new Map<string, number>();
    werkzeuge.forEach(w => {
      const id = extractRecordId(w.fields.aktueller_lagerort);
      if (id) counts.set(id, (counts.get(id) || 0) + 1);
    });
    return counts;
  }, [werkzeuge]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end sm:hidden">
        <Button onClick={onCreate}><Plus className="h-4 w-4 mr-1" /> Neu</Button>
      </div>
      {lagerorte.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>Keine Lagerorte angelegt.</p>
          <Button variant="outline" className="mt-3" onClick={onCreate}><Plus className="h-4 w-4 mr-1" /> Lagerort hinzufügen</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lagerorte.sort((a, b) => (a.fields.ortsbezeichnung || '').localeCompare(b.fields.ortsbezeichnung || '')).map(l => (
            <Card key={l.record_id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{l.fields.ortsbezeichnung || '–'}</h3>
                    <Badge variant="secondary" className="text-xs mt-1">{LAGERORT_TYP_LABELS[l.fields.typ || ''] || '–'}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(l)} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(l)} className="text-destructive hover:text-destructive" aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {l.fields.beschreibung && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{l.fields.beschreibung}</p>}
                <div className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Package className="h-3 w-3" /> {toolCounts.get(l.record_id) || 0} Werkzeuge
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Ausgaben View ───
function AusgabenView({ ausgaben, returnedAusgabeIds, getToolName, getEmployeeName, onEdit, onDelete, onCreate, onRecordReturn }: {
  ausgaben: Werkzeugausgabe[];
  returnedAusgabeIds: Set<string>;
  getToolName: (a: Werkzeugausgabe) => string;
  getEmployeeName: (a: Werkzeugausgabe) => string;
  onEdit: (a: Werkzeugausgabe) => void;
  onDelete: (a: Werkzeugausgabe) => void;
  onCreate: () => void;
  onRecordReturn: (id: string) => void;
}) {
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = useMemo(() => {
    return ausgaben.filter(a => {
      const isReturned = returnedAusgabeIds.has(a.record_id);
      const isOverdue = !isReturned && a.fields.geplantes_rueckgabedatum && isBefore(parseISO(a.fields.geplantes_rueckgabedatum), new Date());
      if (filterStatus === 'active') return !isReturned && !isOverdue;
      if (filterStatus === 'overdue') return isOverdue;
      if (filterStatus === 'returned') return isReturned;
      return true;
    }).sort((a, b) => (b.fields.ausgabedatum || b.createdat).localeCompare(a.fields.ausgabedatum || a.createdat));
  }, [ausgaben, returnedAusgabeIds, filterStatus]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="overdue">Überfällig</SelectItem>
            <SelectItem value="returned">Zurückgegeben</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onCreate} className="sm:hidden"><Plus className="h-4 w-4 mr-1" /> Neu</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>Keine Ausgaben gefunden.</p>
        </CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Werkzeug</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead className="hidden md:table-cell">Ausgabedatum</TableHead>
                <TableHead>Geplante Rückgabe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(a => {
                const isReturned = returnedAusgabeIds.has(a.record_id);
                const isOverdue = !isReturned && a.fields.geplantes_rueckgabedatum && isBefore(parseISO(a.fields.geplantes_rueckgabedatum), new Date());
                return (
                  <TableRow key={a.record_id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{getToolName(a)}</TableCell>
                    <TableCell>{getEmployeeName(a)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{formatDateTime(a.fields.ausgabedatum)}</TableCell>
                    <TableCell>{formatDate(a.fields.geplantes_rueckgabedatum)}</TableCell>
                    <TableCell>
                      {isReturned ? <Badge className="bg-emerald-100 text-emerald-800 text-xs">Zurück</Badge>
                        : isOverdue ? <Badge variant="destructive" className="text-xs">Überfällig</Badge>
                        : <Badge className="bg-amber-100 text-amber-800 text-xs">Aktiv</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!isReturned && (
                          <Button size="sm" variant="outline" onClick={() => onRecordReturn(a.record_id)}>
                            <ArrowDownLeft className="h-3 w-3 mr-1" /> Rückgabe
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onEdit(a)} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(a)} className="text-destructive hover:text-destructive" aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Rückgaben View ───
function RueckgabenView({ rueckgaben, getToolName, getEmployeeName, getLagerortName, onEdit, onDelete, onCreate }: {
  rueckgaben: Werkzeugrueckgabe[];
  getToolName: (r: Werkzeugrueckgabe) => string;
  getEmployeeName: (r: Werkzeugrueckgabe) => string;
  getLagerortName: (r: Werkzeugrueckgabe) => string;
  onEdit: (r: Werkzeugrueckgabe) => void;
  onDelete: (r: Werkzeugrueckgabe) => void;
  onCreate: () => void;
}) {
  const sorted = useMemo(() =>
    [...rueckgaben].sort((a, b) => (b.fields.rueckgabedatum || b.createdat).localeCompare(a.fields.rueckgabedatum || a.createdat)),
  [rueckgaben]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end sm:hidden">
        <Button onClick={onCreate}><Plus className="h-4 w-4 mr-1" /> Neu</Button>
      </div>
      {sorted.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>Keine Rückgaben erfasst.</p>
        </CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Werkzeug</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Rückgabedatum</TableHead>
                <TableHead>Zustand</TableHead>
                <TableHead className="hidden md:table-cell">Lagerort</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(r => (
                <TableRow key={r.record_id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{getToolName(r)}</TableCell>
                  <TableCell>{getEmployeeName(r)}</TableCell>
                  <TableCell>{formatDateTime(r.fields.rueckgabedatum)}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{RUECKGABE_ZUSTAND_LABELS[r.fields.zustand_bei_rueckgabe || ''] || '–'}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{getLagerortName(r)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(r)} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(r)} className="text-destructive hover:text-destructive" aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ─── CRUD Dialogs ───
// ══════════════════════════════════════════

// ─── Werkzeug Dialog ───
function WerkzeugDialog({ open, onOpenChange, record, lagerorte, onSuccess }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: Werkzeuge | null;
  lagerorte: Lagerorte[];
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    bezeichnung: '', hersteller: '', modellnummer: '', seriennummer: '',
    kategorie: '', anschaffungsdatum: '', anschaffungspreis: '',
    aktueller_lagerort: '', zustand: 'neu', pruefpflicht: false,
    naechster_prueftermin: '', notizen: '',
  });

  useEffect(() => {
    if (open) {
      if (record) {
        setForm({
          bezeichnung: record.fields.bezeichnung || '',
          hersteller: record.fields.hersteller || '',
          modellnummer: record.fields.modellnummer || '',
          seriennummer: record.fields.seriennummer || '',
          kategorie: record.fields.kategorie || '',
          anschaffungsdatum: record.fields.anschaffungsdatum?.split('T')[0] || '',
          anschaffungspreis: record.fields.anschaffungspreis?.toString() || '',
          aktueller_lagerort: extractRecordId(record.fields.aktueller_lagerort) || '',
          zustand: record.fields.zustand || 'neu',
          pruefpflicht: record.fields.pruefpflicht || false,
          naechster_prueftermin: record.fields.naechster_prueftermin?.split('T')[0] || '',
          notizen: record.fields.notizen || '',
        });
      } else {
        setForm({
          bezeichnung: '', hersteller: '', modellnummer: '', seriennummer: '',
          kategorie: '', anschaffungsdatum: todayDate(), anschaffungspreis: '',
          aktueller_lagerort: '', zustand: 'neu', pruefpflicht: false,
          naechster_prueftermin: '', notizen: '',
        });
      }
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Werkzeuge['fields'] = {
        bezeichnung: form.bezeichnung,
        hersteller: form.hersteller || undefined,
        modellnummer: form.modellnummer || undefined,
        seriennummer: form.seriennummer || undefined,
        kategorie: (form.kategorie || undefined) as Werkzeuge['fields']['kategorie'],
        anschaffungsdatum: form.anschaffungsdatum || undefined,
        anschaffungspreis: form.anschaffungspreis ? parseFloat(form.anschaffungspreis) : undefined,
        aktueller_lagerort: form.aktueller_lagerort ? createRecordUrl(APP_IDS.LAGERORTE, form.aktueller_lagerort) : undefined,
        zustand: (form.zustand || undefined) as Werkzeuge['fields']['zustand'],
        pruefpflicht: form.pruefpflicht,
        naechster_prueftermin: form.naechster_prueftermin || undefined,
        notizen: form.notizen || undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateWerkzeugeEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Werkzeug wurde aktualisiert.' });
      } else {
        await LivingAppsService.createWerkzeugeEntry(fields);
        toast.success('Erstellt', { description: 'Neues Werkzeug wurde angelegt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `Fehler beim ${isEditing ? 'Speichern' : 'Erstellen'}: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Werkzeug bearbeiten' : 'Neues Werkzeug'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wz-bezeichnung">Werkzeugbezeichnung *</Label>
            <Input id="wz-bezeichnung" value={form.bezeichnung} onChange={e => setForm(f => ({ ...f, bezeichnung: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wz-hersteller">Hersteller</Label>
              <Input id="wz-hersteller" value={form.hersteller} onChange={e => setForm(f => ({ ...f, hersteller: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wz-modell">Modellnummer</Label>
              <Input id="wz-modell" value={form.modellnummer} onChange={e => setForm(f => ({ ...f, modellnummer: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wz-serien">Seriennummer</Label>
            <Input id="wz-serien" value={form.seriennummer} onChange={e => setForm(f => ({ ...f, seriennummer: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={form.kategorie || 'none'} onValueChange={v => setForm(f => ({ ...f, kategorie: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Auswahl</SelectItem>
                  {Object.entries(KATEGORIE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Zustand</Label>
              <Select value={form.zustand || 'none'} onValueChange={v => setForm(f => ({ ...f, zustand: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Auswahl</SelectItem>
                  {Object.entries(ZUSTAND_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wz-anschaffung">Anschaffungsdatum</Label>
              <Input id="wz-anschaffung" type="date" value={form.anschaffungsdatum} onChange={e => setForm(f => ({ ...f, anschaffungsdatum: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wz-preis">Anschaffungspreis (EUR)</Label>
              <Input id="wz-preis" type="number" step="0.01" value={form.anschaffungspreis} onChange={e => setForm(f => ({ ...f, anschaffungspreis: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Aktueller Lagerort</Label>
            <Select value={form.aktueller_lagerort || 'none'} onValueChange={v => setForm(f => ({ ...f, aktueller_lagerort: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Lagerort auswählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Lagerort</SelectItem>
                {lagerorte.map(l => <SelectItem key={l.record_id} value={l.record_id}>{l.fields.ortsbezeichnung}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="wz-pruef" checked={form.pruefpflicht} onCheckedChange={c => setForm(f => ({ ...f, pruefpflicht: !!c }))} />
            <Label htmlFor="wz-pruef">Prüfpflichtig (DGUV V3)</Label>
          </div>
          {form.pruefpflicht && (
            <div className="space-y-2">
              <Label htmlFor="wz-prueftermin">Nächster Prüftermin</Label>
              <Input id="wz-prueftermin" type="date" value={form.naechster_prueftermin} onChange={e => setForm(f => ({ ...f, naechster_prueftermin: e.target.value }))} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="wz-notizen">Notizen</Label>
            <Textarea id="wz-notizen" value={form.notizen} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : (isEditing ? 'Speichern' : 'Erstellen')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Mitarbeiter Dialog ───
function MitarbeiterDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: Mitarbeiter | null;
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    vorname: '', nachname: '', personalnummer: '', abteilung: '',
    telefonnummer: '', email: '', notizen_mitarbeiter: '',
  });

  useEffect(() => {
    if (open) {
      if (record) {
        setForm({
          vorname: record.fields.vorname || '',
          nachname: record.fields.nachname || '',
          personalnummer: record.fields.personalnummer || '',
          abteilung: record.fields.abteilung || '',
          telefonnummer: record.fields.telefonnummer || '',
          email: record.fields.email || '',
          notizen_mitarbeiter: record.fields.notizen_mitarbeiter || '',
        });
      } else {
        setForm({ vorname: '', nachname: '', personalnummer: '', abteilung: '', telefonnummer: '', email: '', notizen_mitarbeiter: '' });
      }
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Mitarbeiter['fields'] = {
        vorname: form.vorname,
        nachname: form.nachname,
        personalnummer: form.personalnummer || undefined,
        abteilung: (form.abteilung || undefined) as Mitarbeiter['fields']['abteilung'],
        telefonnummer: form.telefonnummer || undefined,
        email: form.email || undefined,
        notizen_mitarbeiter: form.notizen_mitarbeiter || undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateMitarbeiterEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Mitarbeiter wurde aktualisiert.' });
      } else {
        await LivingAppsService.createMitarbeiterEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Mitarbeiter wurde angelegt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ma-vorname">Vorname *</Label>
              <Input id="ma-vorname" value={form.vorname} onChange={e => setForm(f => ({ ...f, vorname: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ma-nachname">Nachname *</Label>
              <Input id="ma-nachname" value={form.nachname} onChange={e => setForm(f => ({ ...f, nachname: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ma-pnr">Personalnummer</Label>
              <Input id="ma-pnr" value={form.personalnummer} onChange={e => setForm(f => ({ ...f, personalnummer: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Abteilung</Label>
              <Select value={form.abteilung || 'none'} onValueChange={v => setForm(f => ({ ...f, abteilung: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Auswahl</SelectItem>
                  {Object.entries(ABTEILUNG_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ma-tel">Telefonnummer</Label>
              <Input id="ma-tel" type="tel" value={form.telefonnummer} onChange={e => setForm(f => ({ ...f, telefonnummer: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ma-email">E-Mail</Label>
              <Input id="ma-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ma-notizen">Notizen</Label>
            <Textarea id="ma-notizen" value={form.notizen_mitarbeiter} onChange={e => setForm(f => ({ ...f, notizen_mitarbeiter: e.target.value }))} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : (isEditing ? 'Speichern' : 'Erstellen')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lagerort Dialog ───
function LagerortDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: Lagerorte | null;
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ ortsbezeichnung: '', typ: '', beschreibung: '' });

  useEffect(() => {
    if (open) {
      if (record) {
        setForm({
          ortsbezeichnung: record.fields.ortsbezeichnung || '',
          typ: record.fields.typ || '',
          beschreibung: record.fields.beschreibung || '',
        });
      } else {
        setForm({ ortsbezeichnung: '', typ: '', beschreibung: '' });
      }
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Lagerorte['fields'] = {
        ortsbezeichnung: form.ortsbezeichnung,
        typ: (form.typ || undefined) as Lagerorte['fields']['typ'],
        beschreibung: form.beschreibung || undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateLagerorteEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Lagerort wurde aktualisiert.' });
      } else {
        await LivingAppsService.createLagerorteEntry(fields);
        toast.success('Erstellt', { description: 'Neuer Lagerort wurde angelegt.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Lagerort bearbeiten' : 'Neuer Lagerort'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lo-name">Ortsbezeichnung *</Label>
            <Input id="lo-name" value={form.ortsbezeichnung} onChange={e => setForm(f => ({ ...f, ortsbezeichnung: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Typ</Label>
            <Select value={form.typ || 'none'} onValueChange={v => setForm(f => ({ ...f, typ: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Auswahl</SelectItem>
                {Object.entries(LAGERORT_TYP_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lo-beschreibung">Beschreibung</Label>
            <Textarea id="lo-beschreibung" value={form.beschreibung} onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : (isEditing ? 'Speichern' : 'Erstellen')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Ausgabe Dialog ───
function AusgabeDialog({ open, onOpenChange, record, werkzeuge, mitarbeiter, onSuccess }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: Werkzeugausgabe | null;
  werkzeuge: Werkzeuge[];
  mitarbeiter: Mitarbeiter[];
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    werkzeug: '', mitarbeiter: '', ausgabedatum: '', geplantes_rueckgabedatum: '',
    verwendungszweck: '', notizen: '',
  });

  useEffect(() => {
    if (open) {
      if (record) {
        setForm({
          werkzeug: extractRecordId(record.fields.werkzeug) || '',
          mitarbeiter: extractRecordId(record.fields.mitarbeiter) || '',
          ausgabedatum: record.fields.ausgabedatum || '',
          geplantes_rueckgabedatum: record.fields.geplantes_rueckgabedatum?.split('T')[0] || '',
          verwendungszweck: record.fields.verwendungszweck || '',
          notizen: record.fields.notizen || '',
        });
      } else {
        setForm({
          werkzeug: '', mitarbeiter: '', ausgabedatum: nowDateTimeMinute(),
          geplantes_rueckgabedatum: '', verwendungszweck: '', notizen: '',
        });
      }
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Werkzeugausgabe['fields'] = {
        werkzeug: form.werkzeug ? createRecordUrl(APP_IDS.WERKZEUGE, form.werkzeug) : undefined,
        mitarbeiter: form.mitarbeiter ? createRecordUrl(APP_IDS.MITARBEITER, form.mitarbeiter) : undefined,
        ausgabedatum: form.ausgabedatum || undefined,
        geplantes_rueckgabedatum: form.geplantes_rueckgabedatum || undefined,
        verwendungszweck: form.verwendungszweck || undefined,
        notizen: form.notizen || undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateWerkzeugausgabeEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Ausgabe wurde aktualisiert.' });
      } else {
        await LivingAppsService.createWerkzeugausgabeEntry(fields);
        toast.success('Ausgegeben', { description: 'Werkzeug wurde ausgegeben.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Ausgabe bearbeiten' : 'Werkzeug ausgeben'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Werkzeug *</Label>
            <Select value={form.werkzeug || 'none'} onValueChange={v => setForm(f => ({ ...f, werkzeug: v === 'none' ? '' : v }))} disabled={isEditing}>
              <SelectTrigger><SelectValue placeholder="Werkzeug auswählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bitte auswählen</SelectItem>
                {werkzeuge.sort((a, b) => (a.fields.bezeichnung || '').localeCompare(b.fields.bezeichnung || '')).map(w => (
                  <SelectItem key={w.record_id} value={w.record_id}>{w.fields.bezeichnung}{w.fields.hersteller ? ` (${w.fields.hersteller})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mitarbeiter *</Label>
            <Select value={form.mitarbeiter || 'none'} onValueChange={v => setForm(f => ({ ...f, mitarbeiter: v === 'none' ? '' : v }))} disabled={isEditing}>
              <SelectTrigger><SelectValue placeholder="Mitarbeiter auswählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bitte auswählen</SelectItem>
                {mitarbeiter.sort((a, b) => (a.fields.nachname || '').localeCompare(b.fields.nachname || '')).map(m => (
                  <SelectItem key={m.record_id} value={m.record_id}>{m.fields.vorname} {m.fields.nachname}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ag-datum">Ausgabedatum *</Label>
              <Input id="ag-datum" type="datetime-local" value={form.ausgabedatum} onChange={e => setForm(f => ({ ...f, ausgabedatum: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ag-rueckgabe">Geplante Rückgabe *</Label>
              <Input id="ag-rueckgabe" type="date" value={form.geplantes_rueckgabedatum} onChange={e => setForm(f => ({ ...f, geplantes_rueckgabedatum: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ag-zweck">Verwendungszweck</Label>
            <Input id="ag-zweck" value={form.verwendungszweck} onChange={e => setForm(f => ({ ...f, verwendungszweck: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ag-notizen">Notizen</Label>
            <Textarea id="ag-notizen" value={form.notizen} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : (isEditing ? 'Speichern' : 'Ausgeben')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Rückgabe Dialog ───
function RueckgabeDialog({ open, onOpenChange, record, ausgaben, lagerorte, prefilledAusgabeId, getToolName, getEmployeeName, onSuccess }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: Werkzeugrueckgabe | null;
  ausgaben: Werkzeugausgabe[];
  lagerorte: Lagerorte[];
  prefilledAusgabeId: string | null;
  getToolName: (a: Werkzeugausgabe) => string;
  getEmployeeName: (a: Werkzeugausgabe) => string;
  onSuccess: () => void;
}) {
  const isEditing = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    ausgabe: '', rueckgabedatum: '', rueckgabe_lagerort: '',
    zustand_bei_rueckgabe: 'einwandfrei', beschaedigungen: '', notizen_rueckgabe: '',
  });

  useEffect(() => {
    if (open) {
      if (record) {
        setForm({
          ausgabe: extractRecordId(record.fields.ausgabe) || '',
          rueckgabedatum: record.fields.rueckgabedatum || '',
          rueckgabe_lagerort: extractRecordId(record.fields.rueckgabe_lagerort) || '',
          zustand_bei_rueckgabe: record.fields.zustand_bei_rueckgabe || 'einwandfrei',
          beschaedigungen: record.fields.beschaedigungen || '',
          notizen_rueckgabe: record.fields.notizen_rueckgabe || '',
        });
      } else {
        setForm({
          ausgabe: prefilledAusgabeId || '',
          rueckgabedatum: nowDateTimeMinute(),
          rueckgabe_lagerort: '',
          zustand_bei_rueckgabe: 'einwandfrei',
          beschaedigungen: '', notizen_rueckgabe: '',
        });
      }
    }
  }, [open, record, prefilledAusgabeId]);

  const showDamageField = form.zustand_bei_rueckgabe === 'beschaedigt' || form.zustand_bei_rueckgabe === 'defekt';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Werkzeugrueckgabe['fields'] = {
        ausgabe: form.ausgabe ? createRecordUrl(APP_IDS.WERKZEUGAUSGABE, form.ausgabe) : undefined,
        rueckgabedatum: form.rueckgabedatum || undefined,
        rueckgabe_lagerort: form.rueckgabe_lagerort ? createRecordUrl(APP_IDS.LAGERORTE, form.rueckgabe_lagerort) : undefined,
        zustand_bei_rueckgabe: (form.zustand_bei_rueckgabe || undefined) as Werkzeugrueckgabe['fields']['zustand_bei_rueckgabe'],
        beschaedigungen: form.beschaedigungen || undefined,
        notizen_rueckgabe: form.notizen_rueckgabe || undefined,
      };
      if (isEditing) {
        await LivingAppsService.updateWerkzeugrueckgabeEntry(record!.record_id, fields);
        toast.success('Gespeichert', { description: 'Rückgabe wurde aktualisiert.' });
      } else {
        await LivingAppsService.createWerkzeugrueckgabeEntry(fields);
        toast.success('Rückgabe erfasst', { description: 'Werkzeug wurde zurückgegeben.' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error('Fehler', { description: `${err instanceof Error ? err.message : 'Unbekannter Fehler'}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Rückgabe bearbeiten' : 'Rückgabe erfassen'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Ausgabe *</Label>
            <Select value={form.ausgabe || 'none'} onValueChange={v => setForm(f => ({ ...f, ausgabe: v === 'none' ? '' : v }))} disabled={!!prefilledAusgabeId || isEditing}>
              <SelectTrigger><SelectValue placeholder="Ausgabe auswählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bitte auswählen</SelectItem>
                {ausgaben.map(a => (
                  <SelectItem key={a.record_id} value={a.record_id}>
                    {getToolName(a)} — {getEmployeeName(a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rg-datum">Rückgabedatum *</Label>
            <Input id="rg-datum" type="datetime-local" value={form.rueckgabedatum} onChange={e => setForm(f => ({ ...f, rueckgabedatum: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Rückgabe-Lagerort</Label>
            <Select value={form.rueckgabe_lagerort || 'none'} onValueChange={v => setForm(f => ({ ...f, rueckgabe_lagerort: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Lagerort auswählen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Lagerort</SelectItem>
                {lagerorte.map(l => <SelectItem key={l.record_id} value={l.record_id}>{l.fields.ortsbezeichnung}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Zustand bei Rückgabe *</Label>
            <Select value={form.zustand_bei_rueckgabe || 'none'} onValueChange={v => setForm(f => ({ ...f, zustand_bei_rueckgabe: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bitte auswählen</SelectItem>
                {Object.entries(RUECKGABE_ZUSTAND_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {showDamageField && (
            <div className="space-y-2">
              <Label htmlFor="rg-schaden">Beschädigungen</Label>
              <Textarea id="rg-schaden" value={form.beschaedigungen} onChange={e => setForm(f => ({ ...f, beschaedigungen: e.target.value }))} rows={2} placeholder="Beschreibe die Schäden..." />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="rg-notizen">Notizen</Label>
            <Textarea id="rg-notizen" value={form.notizen_rueckgabe} onChange={e => setForm(f => ({ ...f, notizen_rueckgabe: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : (isEditing ? 'Speichern' : 'Rückgabe erfassen')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation Dialog ───
function DeleteConfirmDialog({ open, onOpenChange, name, onConfirm }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  name: string;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du &quot;{name}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? 'Löscht...' : 'Löschen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
