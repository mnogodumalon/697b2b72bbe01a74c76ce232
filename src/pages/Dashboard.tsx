import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Mitarbeiter, Werkzeugausgabe, Werkzeuge, Lagerorte, Werkzeugrueckgabe } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { format, parseISO, formatDistance, differenceInDays, isBefore, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  ArrowUpRight, ArrowDownLeft, Wrench, AlertCircle, Users, MapPin,
  Plus, Pencil, Trash2, Package, Clock, ShieldCheck, CalendarDays,
  ClipboardList, RefreshCw, Search, CheckCircle
} from 'lucide-react';

// ─── LOOKUP LABELS ────────────────────────────────────────
const ABTEILUNG_LABELS: Record<string, string> = {
  elektroinstallation: 'Elektroinstallation',
  wartung_service: 'Wartung und Service',
  bauleitung: 'Bauleitung',
  planung: 'Planung',
  lager: 'Lager',
  verwaltung: 'Verwaltung',
};

const KATEGORIE_LABELS: Record<string, string> = {
  akkuwerkzeug: 'Akkuwerkzeug',
  elektrowerkzeug: 'Elektrowerkzeug',
  handwerkzeug: 'Handwerkzeug',
  messgeraet: 'Messgerät',
  pruefgeraet: 'Prüfgerät',
  leiter: 'Leiter',
  kabel_leitungen: 'Kabel und Leitungen',
  sonstiges: 'Sonstiges',
};

const ZUSTAND_LABELS: Record<string, string> = {
  neu: 'Neu', sehr_gut: 'Sehr gut', gut: 'Gut',
  gebrauchsspuren: 'Gebrauchsspuren', reparaturbeduerftig: 'Reparaturbedürftig', defekt: 'Defekt',
};

const ZUSTAND_RUECKGABE_LABELS: Record<string, string> = {
  einwandfrei: 'Einwandfrei', leichte_gebrauchsspuren: 'Leichte Gebrauchsspuren',
  verschmutzt: 'Verschmutzt', beschaedigt: 'Beschädigt', defekt: 'Defekt',
};

const LAGERORT_TYP_LABELS: Record<string, string> = {
  fahrzeug: 'Fahrzeug', baustelle: 'Baustelle',
  aussenlager: 'Außenlager', sonstiges: 'Sonstiges', werkstatt: 'Werkstatt',
};

// ─── HELPERS ──────────────────────────────────────────────
function formatDate(d: string | undefined | null): string {
  if (!d) return '–';
  try { return format(parseISO(d.split('T')[0]), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

function formatDatetime(d: string | undefined | null): string {
  if (!d) return '–';
  try { return format(parseISO(d), 'dd.MM.yyyy HH:mm', { locale: de }); } catch { return d; }
}

function relativeTime(d: string | undefined | null): string {
  if (!d) return '';
  try { return formatDistance(parseISO(d), new Date(), { addSuffix: true, locale: de }); } catch { return ''; }
}

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function nowDatetime(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm");
}

function zustandColor(z: string | undefined): string {
  switch (z) {
    case 'neu': case 'sehr_gut': return 'bg-green-100 text-green-800';
    case 'gut': return 'bg-blue-100 text-blue-800';
    case 'gebrauchsspuren': return 'bg-yellow-100 text-yellow-800';
    case 'reparaturbeduerftig': return 'bg-orange-100 text-orange-800';
    case 'defekt': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// ─── DELETE CONFIRM DIALOG ────────────────────────────────
function DeleteConfirmDialog({ open, onOpenChange, name, onConfirm }: {
  open: boolean; onOpenChange: (o: boolean) => void; name: string; onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  async function handleDelete() {
    setDeleting(true);
    try { await onConfirm(); toast.success(`"${name}" wurde gelöscht.`); onOpenChange(false); }
    catch { toast.error('Löschen fehlgeschlagen.'); }
    finally { setDeleting(false); }
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
          <AlertDialogAction onClick={handleDelete} disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90">
            {deleting ? 'Löscht...' : 'Löschen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── MITARBEITER DIALOG ───────────────────────────────────
function MitarbeiterDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record?: Mitarbeiter | null; onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ vorname: '', nachname: '', personalnummer: '', abteilung: '', telefonnummer: '', email: '', notizen_mitarbeiter: '' });
  useEffect(() => {
    if (open) setForm({
      vorname: record?.fields.vorname ?? '', nachname: record?.fields.nachname ?? '',
      personalnummer: record?.fields.personalnummer ?? '', abteilung: record?.fields.abteilung ?? '',
      telefonnummer: record?.fields.telefonnummer ?? '', email: record?.fields.email ?? '',
      notizen_mitarbeiter: record?.fields.notizen_mitarbeiter ?? '',
    });
  }, [open, record]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    const fields: Mitarbeiter['fields'] = {
      vorname: form.vorname || undefined, nachname: form.nachname || undefined,
      personalnummer: form.personalnummer || undefined,
      abteilung: (form.abteilung || undefined) as Mitarbeiter['fields']['abteilung'],
      telefonnummer: form.telefonnummer || undefined, email: form.email || undefined,
      notizen_mitarbeiter: form.notizen_mitarbeiter || undefined,
    };
    try {
      if (isEdit) { await LivingAppsService.updateMitarbeiterEntry(record!.record_id, fields); toast.success('Mitarbeiter aktualisiert.'); }
      else { await LivingAppsService.createMitarbeiterEntry(fields); toast.success('Mitarbeiter erstellt.'); }
      onOpenChange(false); onSuccess();
    } catch { toast.error(`Fehler beim ${isEdit ? 'Speichern' : 'Erstellen'}.`); }
    finally { setSubmitting(false); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Vorname *</Label><Input value={form.vorname} onChange={e => setForm(p => ({ ...p, vorname: e.target.value }))} required /></div>
            <div className="space-y-1"><Label>Nachname *</Label><Input value={form.nachname} onChange={e => setForm(p => ({ ...p, nachname: e.target.value }))} required /></div>
          </div>
          <div className="space-y-1"><Label>Personalnummer</Label><Input value={form.personalnummer} onChange={e => setForm(p => ({ ...p, personalnummer: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Abteilung</Label>
            <Select value={form.abteilung || 'none'} onValueChange={v => setForm(p => ({ ...p, abteilung: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{[<SelectItem key="none" value="none">– Keine –</SelectItem>, ...Object.entries(ABTEILUNG_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)]}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Telefonnummer</Label><Input type="tel" value={form.telefonnummer} onChange={e => setForm(p => ({ ...p, telefonnummer: e.target.value }))} /></div>
          <div className="space-y-1"><Label>E-Mail</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Notizen</Label><Textarea value={form.notizen_mitarbeiter} onChange={e => setForm(p => ({ ...p, notizen_mitarbeiter: e.target.value }))} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── WERKZEUGE DIALOG ─────────────────────────────────────
function WerkzeugeDialog({ open, onOpenChange, record, lagerorte, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record?: Werkzeuge | null; lagerorte: Lagerorte[]; onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    bezeichnung: '', hersteller: '', modellnummer: '', seriennummer: '', kategorie: '',
    anschaffungsdatum: '', anschaffungspreis: '', aktueller_lagerort: '', zustand: 'neu',
    pruefpflicht: false, naechster_prueftermin: '', notizen: '',
  });
  useEffect(() => {
    if (open) {
      const lagerId = record ? extractRecordId(record.fields.aktueller_lagerort) : null;
      setForm({
        bezeichnung: record?.fields.bezeichnung ?? '', hersteller: record?.fields.hersteller ?? '',
        modellnummer: record?.fields.modellnummer ?? '', seriennummer: record?.fields.seriennummer ?? '',
        kategorie: record?.fields.kategorie ?? '', anschaffungsdatum: record?.fields.anschaffungsdatum ?? todayStr(),
        anschaffungspreis: record?.fields.anschaffungspreis?.toString() ?? '', aktueller_lagerort: lagerId ?? '',
        zustand: record?.fields.zustand ?? 'neu', pruefpflicht: record?.fields.pruefpflicht ?? false,
        naechster_prueftermin: record?.fields.naechster_prueftermin ?? '', notizen: record?.fields.notizen ?? '',
      });
    }
  }, [open, record]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    const fields: Werkzeuge['fields'] = {
      bezeichnung: form.bezeichnung || undefined, hersteller: form.hersteller || undefined,
      modellnummer: form.modellnummer || undefined, seriennummer: form.seriennummer || undefined,
      kategorie: (form.kategorie || undefined) as Werkzeuge['fields']['kategorie'],
      anschaffungsdatum: form.anschaffungsdatum || undefined,
      anschaffungspreis: form.anschaffungspreis ? parseFloat(form.anschaffungspreis) : undefined,
      aktueller_lagerort: form.aktueller_lagerort ? createRecordUrl(APP_IDS.LAGERORTE, form.aktueller_lagerort) : undefined,
      zustand: (form.zustand || undefined) as Werkzeuge['fields']['zustand'],
      pruefpflicht: form.pruefpflicht, naechster_prueftermin: form.naechster_prueftermin || undefined,
      notizen: form.notizen || undefined,
    };
    try {
      if (isEdit) { await LivingAppsService.updateWerkzeugeEntry(record!.record_id, fields); toast.success('Werkzeug aktualisiert.'); }
      else { await LivingAppsService.createWerkzeugeEntry(fields); toast.success('Werkzeug erstellt.'); }
      onOpenChange(false); onSuccess();
    } catch { toast.error(`Fehler beim ${isEdit ? 'Speichern' : 'Erstellen'}.`); }
    finally { setSubmitting(false); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? 'Werkzeug bearbeiten' : 'Neues Werkzeug'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1"><Label>Bezeichnung *</Label><Input value={form.bezeichnung} onChange={e => setForm(p => ({ ...p, bezeichnung: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Hersteller</Label><Input value={form.hersteller} onChange={e => setForm(p => ({ ...p, hersteller: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Modellnummer</Label><Input value={form.modellnummer} onChange={e => setForm(p => ({ ...p, modellnummer: e.target.value }))} /></div>
          </div>
          <div className="space-y-1"><Label>Seriennummer</Label><Input value={form.seriennummer} onChange={e => setForm(p => ({ ...p, seriennummer: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Kategorie</Label>
              <Select value={form.kategorie || 'none'} onValueChange={v => setForm(p => ({ ...p, kategorie: v === 'none' ? '' : v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{[<SelectItem key="none" value="none">– Keine –</SelectItem>, ...Object.entries(KATEGORIE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)]}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Zustand</Label>
              <Select value={form.zustand || 'none'} onValueChange={v => setForm(p => ({ ...p, zustand: v === 'none' ? '' : v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(ZUSTAND_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Anschaffungsdatum</Label><Input type="date" value={form.anschaffungsdatum} onChange={e => setForm(p => ({ ...p, anschaffungsdatum: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Preis (EUR)</Label><Input type="number" step="0.01" value={form.anschaffungspreis} onChange={e => setForm(p => ({ ...p, anschaffungspreis: e.target.value }))} /></div>
          </div>
          <div className="space-y-1"><Label>Lagerort</Label>
            <Select value={form.aktueller_lagerort || 'none'} onValueChange={v => setForm(p => ({ ...p, aktueller_lagerort: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{[<SelectItem key="none" value="none">– Kein Lagerort –</SelectItem>, ...lagerorte.map(l => <SelectItem key={l.record_id} value={l.record_id}>{l.fields.ortsbezeichnung ?? 'Unbenannt'}</SelectItem>)]}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pruefpflicht" checked={form.pruefpflicht} onChange={e => setForm(p => ({ ...p, pruefpflicht: e.target.checked }))} className="h-4 w-4 rounded border-input" />
            <Label htmlFor="pruefpflicht">Prüfpflichtig (DGUV V3)</Label>
          </div>
          {form.pruefpflicht && (
            <div className="space-y-1"><Label>Nächster Prüftermin</Label><Input type="date" value={form.naechster_prueftermin} onChange={e => setForm(p => ({ ...p, naechster_prueftermin: e.target.value }))} /></div>
          )}
          <div className="space-y-1"><Label>Notizen</Label><Textarea value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── LAGERORTE DIALOG ─────────────────────────────────────
function LagerorteDialog({ open, onOpenChange, record, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record?: Lagerorte | null; onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ ortsbezeichnung: '', typ: '', beschreibung: '' });
  useEffect(() => { if (open) setForm({ ortsbezeichnung: record?.fields.ortsbezeichnung ?? '', typ: record?.fields.typ ?? '', beschreibung: record?.fields.beschreibung ?? '' }); }, [open, record]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    const fields: Lagerorte['fields'] = {
      ortsbezeichnung: form.ortsbezeichnung || undefined,
      typ: (form.typ || undefined) as Lagerorte['fields']['typ'],
      beschreibung: form.beschreibung || undefined,
    };
    try {
      if (isEdit) { await LivingAppsService.updateLagerorteEntry(record!.record_id, fields); toast.success('Lagerort aktualisiert.'); }
      else { await LivingAppsService.createLagerorteEntry(fields); toast.success('Lagerort erstellt.'); }
      onOpenChange(false); onSuccess();
    } catch { toast.error(`Fehler beim ${isEdit ? 'Speichern' : 'Erstellen'}.`); }
    finally { setSubmitting(false); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'Lagerort bearbeiten' : 'Neuer Lagerort'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1"><Label>Ortsbezeichnung *</Label><Input value={form.ortsbezeichnung} onChange={e => setForm(p => ({ ...p, ortsbezeichnung: e.target.value }))} required /></div>
          <div className="space-y-1"><Label>Typ</Label>
            <Select value={form.typ || 'none'} onValueChange={v => setForm(p => ({ ...p, typ: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{[<SelectItem key="none" value="none">– Kein Typ –</SelectItem>, ...Object.entries(LAGERORT_TYP_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)]}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Beschreibung</Label><Textarea value={form.beschreibung} onChange={e => setForm(p => ({ ...p, beschreibung: e.target.value }))} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── WERKZEUGAUSGABE DIALOG ───────────────────────────────
function AusgabeDialog({ open, onOpenChange, record, mitarbeiter, werkzeuge, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record?: Werkzeugausgabe | null;
  mitarbeiter: Mitarbeiter[]; werkzeuge: Werkzeuge[]; onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ mitarbeiter: '', werkzeug: '', ausgabedatum: '', geplantes_rueckgabedatum: '', verwendungszweck: '', notizen: '' });
  useEffect(() => {
    if (open) {
      const maId = record ? extractRecordId(record.fields.mitarbeiter) : null;
      const wzId = record ? extractRecordId(record.fields.werkzeug) : null;
      setForm({
        mitarbeiter: maId ?? '', werkzeug: wzId ?? '',
        ausgabedatum: record?.fields.ausgabedatum ?? nowDatetime(),
        geplantes_rueckgabedatum: record?.fields.geplantes_rueckgabedatum ?? '',
        verwendungszweck: record?.fields.verwendungszweck ?? '', notizen: record?.fields.notizen ?? '',
      });
    }
  }, [open, record]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    const fields: Werkzeugausgabe['fields'] = {
      mitarbeiter: form.mitarbeiter ? createRecordUrl(APP_IDS.MITARBEITER, form.mitarbeiter) : undefined,
      werkzeug: form.werkzeug ? createRecordUrl(APP_IDS.WERKZEUGE, form.werkzeug) : undefined,
      ausgabedatum: form.ausgabedatum || undefined,
      geplantes_rueckgabedatum: form.geplantes_rueckgabedatum || undefined,
      verwendungszweck: form.verwendungszweck || undefined, notizen: form.notizen || undefined,
    };
    try {
      if (isEdit) { await LivingAppsService.updateWerkzeugausgabeEntry(record!.record_id, fields); toast.success('Ausgabe aktualisiert.'); }
      else { await LivingAppsService.createWerkzeugausgabeEntry(fields); toast.success('Werkzeug ausgegeben.'); }
      onOpenChange(false); onSuccess();
    } catch { toast.error(`Fehler beim ${isEdit ? 'Speichern' : 'Erstellen'}.`); }
    finally { setSubmitting(false); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? 'Ausgabe bearbeiten' : 'Werkzeug ausgeben'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Bearbeite die Werkzeugausgabe.' : 'Erfasse eine neue Werkzeugausgabe.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1"><Label>Mitarbeiter *</Label>
            <Select value={form.mitarbeiter || 'none'} onValueChange={v => setForm(p => ({ ...p, mitarbeiter: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Mitarbeiter wählen..." /></SelectTrigger>
              <SelectContent>{mitarbeiter.map(m => <SelectItem key={m.record_id} value={m.record_id}>{m.fields.vorname} {m.fields.nachname}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Werkzeug *</Label>
            <Select value={form.werkzeug || 'none'} onValueChange={v => setForm(p => ({ ...p, werkzeug: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Werkzeug wählen..." /></SelectTrigger>
              <SelectContent>{werkzeuge.map(w => <SelectItem key={w.record_id} value={w.record_id}>{w.fields.bezeichnung ?? 'Unbenannt'}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Ausgabedatum *</Label><Input type="datetime-local" value={form.ausgabedatum} onChange={e => setForm(p => ({ ...p, ausgabedatum: e.target.value }))} required /></div>
          <div className="space-y-1"><Label>Geplantes Rückgabedatum</Label><Input type="date" value={form.geplantes_rueckgabedatum} onChange={e => setForm(p => ({ ...p, geplantes_rueckgabedatum: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Verwendungszweck</Label><Input value={form.verwendungszweck} onChange={e => setForm(p => ({ ...p, verwendungszweck: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Notizen</Label><Textarea value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEdit ? 'Speichern' : 'Ausgeben'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── WERKZEUGRUECKGABE DIALOG ─────────────────────────────
function RueckgabeDialog({ open, onOpenChange, record, activeAusgaben, werkzeugeMap, mitarbeiterMap, lagerorte, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; record?: Werkzeugrueckgabe | null;
  activeAusgaben: Werkzeugausgabe[]; werkzeugeMap: Map<string, Werkzeuge>; mitarbeiterMap: Map<string, Mitarbeiter>;
  lagerorte: Lagerorte[]; onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ ausgabe: '', rueckgabedatum: '', rueckgabe_lagerort: '', zustand_bei_rueckgabe: '', beschaedigungen: '', notizen_rueckgabe: '' });
  useEffect(() => {
    if (open) {
      const ausgId = record ? extractRecordId(record.fields.ausgabe) : null;
      const lagId = record ? extractRecordId(record.fields.rueckgabe_lagerort) : null;
      setForm({
        ausgabe: ausgId ?? '', rueckgabedatum: record?.fields.rueckgabedatum ?? nowDatetime(),
        rueckgabe_lagerort: lagId ?? '', zustand_bei_rueckgabe: record?.fields.zustand_bei_rueckgabe ?? '',
        beschaedigungen: record?.fields.beschaedigungen ?? '', notizen_rueckgabe: record?.fields.notizen_rueckgabe ?? '',
      });
    }
  }, [open, record]);
  function ausgabeLabel(a: Werkzeugausgabe): string {
    const wzId = extractRecordId(a.fields.werkzeug);
    const maId = extractRecordId(a.fields.mitarbeiter);
    const wz = wzId ? werkzeugeMap.get(wzId) : null;
    const ma = maId ? mitarbeiterMap.get(maId) : null;
    return `${wz?.fields.bezeichnung ?? 'Werkzeug'} – ${ma?.fields.vorname ?? ''} ${ma?.fields.nachname ?? ''}`;
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    const fields: Werkzeugrueckgabe['fields'] = {
      ausgabe: form.ausgabe ? createRecordUrl(APP_IDS.WERKZEUGAUSGABE, form.ausgabe) : undefined,
      rueckgabedatum: form.rueckgabedatum || undefined,
      rueckgabe_lagerort: form.rueckgabe_lagerort ? createRecordUrl(APP_IDS.LAGERORTE, form.rueckgabe_lagerort) : undefined,
      zustand_bei_rueckgabe: (form.zustand_bei_rueckgabe || undefined) as Werkzeugrueckgabe['fields']['zustand_bei_rueckgabe'],
      beschaedigungen: form.beschaedigungen || undefined, notizen_rueckgabe: form.notizen_rueckgabe || undefined,
    };
    try {
      if (isEdit) { await LivingAppsService.updateWerkzeugrueckgabeEntry(record!.record_id, fields); toast.success('Rückgabe aktualisiert.'); }
      else { await LivingAppsService.createWerkzeugrueckgabeEntry(fields); toast.success('Rückgabe erfasst.'); }
      onOpenChange(false); onSuccess();
    } catch { toast.error(`Fehler beim ${isEdit ? 'Speichern' : 'Erstellen'}.`); }
    finally { setSubmitting(false); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? 'Rückgabe bearbeiten' : 'Werkzeug zurückgeben'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Bearbeite die Rückgabe.' : 'Erfasse eine Werkzeugrückgabe.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1"><Label>Ausgabe *</Label>
            <Select value={form.ausgabe || 'none'} onValueChange={v => setForm(p => ({ ...p, ausgabe: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Ausgabe wählen..." /></SelectTrigger>
              <SelectContent>{activeAusgaben.map(a => <SelectItem key={a.record_id} value={a.record_id}>{ausgabeLabel(a)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Rückgabedatum *</Label><Input type="datetime-local" value={form.rueckgabedatum} onChange={e => setForm(p => ({ ...p, rueckgabedatum: e.target.value }))} required /></div>
          <div className="space-y-1"><Label>Rückgabe-Lagerort</Label>
            <Select value={form.rueckgabe_lagerort || 'none'} onValueChange={v => setForm(p => ({ ...p, rueckgabe_lagerort: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Lagerort wählen..." /></SelectTrigger>
              <SelectContent>{[<SelectItem key="none" value="none">– Kein Lagerort –</SelectItem>, ...lagerorte.map(l => <SelectItem key={l.record_id} value={l.record_id}>{l.fields.ortsbezeichnung ?? 'Unbenannt'}</SelectItem>)]}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Zustand bei Rückgabe *</Label>
            <Select value={form.zustand_bei_rueckgabe || 'none'} onValueChange={v => setForm(p => ({ ...p, zustand_bei_rueckgabe: v === 'none' ? '' : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Zustand wählen..." /></SelectTrigger>
              <SelectContent>{Object.entries(ZUSTAND_RUECKGABE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {(form.zustand_bei_rueckgabe === 'beschaedigt' || form.zustand_bei_rueckgabe === 'defekt') && (
            <div className="space-y-1"><Label>Beschädigungen</Label><Textarea value={form.beschaedigungen} onChange={e => setForm(p => ({ ...p, beschaedigungen: e.target.value }))} /></div>
          )}
          <div className="space-y-1"><Label>Notizen</Label><Textarea value={form.notizen_rueckgabe} onChange={e => setForm(p => ({ ...p, notizen_rueckgabe: e.target.value }))} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert...' : isEdit ? 'Speichern' : 'Rückgabe erfassen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── DETAIL DIALOG ────────────────────────────────────────
function DetailDialog({ open, onOpenChange, title, children }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────
export default function Dashboard() {
  // Data states
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);
  const [werkzeuge, setWerkzeuge] = useState<Werkzeuge[]>([]);
  const [lagerorte, setLagerorte] = useState<Lagerorte[]>([]);
  const [ausgaben, setAusgaben] = useState<Werkzeugausgabe[]>([]);
  const [rueckgaben, setRueckgaben] = useState<Werkzeugrueckgabe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Dialog states
  const [showAusgabeDialog, setShowAusgabeDialog] = useState(false);
  const [editAusgabe, setEditAusgabe] = useState<Werkzeugausgabe | null>(null);
  const [showRueckgabeDialog, setShowRueckgabeDialog] = useState(false);
  const [editRueckgabe, setEditRueckgabe] = useState<Werkzeugrueckgabe | null>(null);
  const [showWerkzeugDialog, setShowWerkzeugDialog] = useState(false);
  const [editWerkzeug, setEditWerkzeug] = useState<Werkzeuge | null>(null);
  const [showMitarbeiterDialog, setShowMitarbeiterDialog] = useState(false);
  const [editMitarbeiter, setEditMitarbeiter] = useState<Mitarbeiter | null>(null);
  const [showLagerortDialog, setShowLagerortDialog] = useState(false);
  const [editLagerort, setEditLagerort] = useState<Lagerorte | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ name: string; onConfirm: () => Promise<void> } | null>(null);

  // Detail views
  const [detailAusgabe, setDetailAusgabe] = useState<Werkzeugausgabe | null>(null);
  const [detailWerkzeug, setDetailWerkzeug] = useState<Werkzeuge | null>(null);

  // Tab search
  const [searchMa, setSearchMa] = useState('');
  const [searchWz, setSearchWz] = useState('');

  // ─── DATA FETCHING ────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [ma, wz, lo, aus, rg] = await Promise.all([
        LivingAppsService.getMitarbeiter(),
        LivingAppsService.getWerkzeuge(),
        LivingAppsService.getLagerorte(),
        LivingAppsService.getWerkzeugausgabe(),
        LivingAppsService.getWerkzeugrueckgabe(),
      ]);
      setMitarbeiter(ma); setWerkzeuge(wz); setLagerorte(lo); setAusgaben(aus); setRueckgaben(rg);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── COMPUTED DATA ────────────────────────────────────
  const werkzeugeMap = useMemo(() => { const m = new Map<string, Werkzeuge>(); werkzeuge.forEach(w => m.set(w.record_id, w)); return m; }, [werkzeuge]);
  const mitarbeiterMap = useMemo(() => { const m = new Map<string, Mitarbeiter>(); mitarbeiter.forEach(ma => m.set(ma.record_id, ma)); return m; }, [mitarbeiter]);
  const lagerorteMap = useMemo(() => { const m = new Map<string, Lagerorte>(); lagerorte.forEach(l => m.set(l.record_id, l)); return m; }, [lagerorte]);

  // Set of ausgabe IDs that have been returned
  const returnedAusgabeIds = useMemo(() => {
    const set = new Set<string>();
    rueckgaben.forEach(r => { const id = extractRecordId(r.fields.ausgabe); if (id) set.add(id); });
    return set;
  }, [rueckgaben]);

  // Active checkouts (no return)
  const activeAusgaben = useMemo(() => ausgaben.filter(a => !returnedAusgabeIds.has(a.record_id)), [ausgaben, returnedAusgabeIds]);

  // Overdue
  const today = todayStr();
  const overdueAusgaben = useMemo(() =>
    activeAusgaben.filter(a => a.fields.geplantes_rueckgabedatum && isBefore(parseISO(a.fields.geplantes_rueckgabedatum), new Date()))
      .sort((a, b) => (a.fields.geplantes_rueckgabedatum ?? '').localeCompare(b.fields.geplantes_rueckgabedatum ?? '')),
    [activeAusgaben]
  );

  const onTimeCount = activeAusgaben.length - overdueAusgaben.length;

  // Recent activity (combined ausgaben + rueckgaben, sorted by date)
  const recentActivity = useMemo(() => {
    const items: Array<{ type: 'ausgabe' | 'rueckgabe'; date: string; record: Werkzeugausgabe | Werkzeugrueckgabe }> = [];
    ausgaben.forEach(a => items.push({ type: 'ausgabe', date: a.fields.ausgabedatum ?? a.createdat, record: a }));
    rueckgaben.forEach(r => items.push({ type: 'rueckgabe', date: r.fields.rueckgabedatum ?? r.createdat, record: r }));
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [ausgaben, rueckgaben]);

  // Checkouts by department
  const checkoutsByDept = useMemo(() => {
    const counts: Record<string, number> = {};
    activeAusgaben.forEach(a => {
      const maId = extractRecordId(a.fields.mitarbeiter);
      if (!maId) return;
      const ma = mitarbeiterMap.get(maId);
      const dept = ma?.fields.abteilung ?? 'unbekannt';
      counts[dept] = (counts[dept] ?? 0) + 1;
    });
    return Object.entries(counts).map(([key, count]) => ({ name: ABTEILUNG_LABELS[key] ?? key, count })).sort((a, b) => b.count - a.count);
  }, [activeAusgaben, mitarbeiterMap]);

  // Category distribution
  const categoryDist = useMemo(() => {
    const counts: Record<string, number> = {};
    werkzeuge.forEach(w => { const k = w.fields.kategorie ?? 'sonstiges'; counts[k] = (counts[k] ?? 0) + 1; });
    return Object.entries(counts).map(([key, count]) => ({ name: KATEGORIE_LABELS[key] ?? key, value: count }));
  }, [werkzeuge]);

  // Condition distribution
  const conditionDist = useMemo(() => {
    const counts: Record<string, number> = {};
    werkzeuge.forEach(w => { const z = w.fields.zustand ?? 'unbekannt'; counts[z] = (counts[z] ?? 0) + 1; });
    return Object.entries(counts).map(([key, count]) => ({ name: ZUSTAND_LABELS[key] ?? key, key, count }));
  }, [werkzeuge]);

  // Upcoming inspections
  const upcomingInspections = useMemo(() => {
    const limit = format(addDays(new Date(), 90), 'yyyy-MM-dd');
    return werkzeuge.filter(w => w.fields.pruefpflicht && w.fields.naechster_prueftermin && w.fields.naechster_prueftermin >= today && w.fields.naechster_prueftermin <= limit)
      .sort((a, b) => (a.fields.naechster_prueftermin ?? '').localeCompare(b.fields.naechster_prueftermin ?? ''))
      .slice(0, 10);
  }, [werkzeuge, today]);

  // Repair needed count
  const repairCount = useMemo(() => werkzeuge.filter(w => w.fields.zustand === 'reparaturbeduerftig' || w.fields.zustand === 'defekt').length, [werkzeuge]);

  // Pie chart colors
  const PIE_COLORS = ['hsl(32,95%,44%)', 'hsl(210,60%,45%)', 'hsl(152,60%,36%)', 'hsl(45,90%,50%)', 'hsl(0,72%,51%)', 'hsl(280,60%,50%)', 'hsl(180,50%,40%)', 'hsl(330,60%,50%)'];

  // Helper: get werkzeug name from ausgabe
  function getWzNameFromAusgabe(a: Werkzeugausgabe): string {
    const id = extractRecordId(a.fields.werkzeug);
    return id ? werkzeugeMap.get(id)?.fields.bezeichnung ?? 'Unbekannt' : 'Unbekannt';
  }
  function getMaNameFromAusgabe(a: Werkzeugausgabe): string {
    const id = extractRecordId(a.fields.mitarbeiter);
    if (!id) return 'Unbekannt';
    const ma = mitarbeiterMap.get(id);
    return ma ? `${ma.fields.vorname ?? ''} ${ma.fields.nachname ?? ''}`.trim() : 'Unbekannt';
  }

  // ─── DELETE HANDLERS ──────────────────────────────────
  function handleDeleteMitarbeiter(m: Mitarbeiter) {
    setDeleteTarget({ name: `${m.fields.vorname} ${m.fields.nachname}`, onConfirm: async () => { await LivingAppsService.deleteMitarbeiterEntry(m.record_id); fetchAll(); } });
  }
  function handleDeleteWerkzeug(w: Werkzeuge) {
    setDeleteTarget({ name: w.fields.bezeichnung ?? 'Werkzeug', onConfirm: async () => { await LivingAppsService.deleteWerkzeugeEntry(w.record_id); fetchAll(); } });
  }
  function handleDeleteLagerort(l: Lagerorte) {
    setDeleteTarget({ name: l.fields.ortsbezeichnung ?? 'Lagerort', onConfirm: async () => { await LivingAppsService.deleteLagerorteEntry(l.record_id); fetchAll(); } });
  }
  function handleDeleteAusgabe(a: Werkzeugausgabe) {
    setDeleteTarget({ name: `Ausgabe: ${getWzNameFromAusgabe(a)}`, onConfirm: async () => { await LivingAppsService.deleteWerkzeugausgabeEntry(a.record_id); fetchAll(); } });
  }
  function handleDeleteRueckgabe(r: Werkzeugrueckgabe) {
    setDeleteTarget({ name: 'Rückgabe', onConfirm: async () => { await LivingAppsService.deleteWerkzeugrueckgabeEntry(r.record_id); fetchAll(); } });
  }

  // ─── LOADING STATE ────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-background p-4 md:p-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Toaster position="top-right" />
      <div className="max-w-[1400px] mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
        <Skeleton className="h-60 w-full" />
      </div>
    </div>
  );

  // ─── ERROR STATE ──────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Toaster position="top-right" />
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">Fehler beim Laden</h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={fetchAll} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Erneut versuchen</Button>
        </CardContent>
      </Card>
    </div>
  );

  // Filtered lists for tabs
  const filteredMa = mitarbeiter.filter(m => {
    if (!searchMa) return true;
    const s = searchMa.toLowerCase();
    return `${m.fields.vorname} ${m.fields.nachname}`.toLowerCase().includes(s) || (m.fields.personalnummer ?? '').toLowerCase().includes(s);
  });
  const filteredWz = werkzeuge.filter(w => {
    if (!searchWz) return true;
    const s = searchWz.toLowerCase();
    return (w.fields.bezeichnung ?? '').toLowerCase().includes(s) || (w.fields.hersteller ?? '').toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Toaster position="top-right" />

      {/* ─── HEADER ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-6 w-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Werkzeugverwaltung</h1>
          </div>
          <Button onClick={() => setShowAusgabeDialog(true)} className="hidden md:flex">
            <ArrowUpRight className="h-4 w-4 mr-2" />Werkzeug ausgeben
          </Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6 w-full md:w-auto">
            <TabsTrigger value="dashboard"><ClipboardList className="h-4 w-4 mr-1.5 hidden sm:inline" />Dashboard</TabsTrigger>
            <TabsTrigger value="werkzeuge"><Package className="h-4 w-4 mr-1.5 hidden sm:inline" />Werkzeuge</TabsTrigger>
            <TabsTrigger value="mitarbeiter"><Users className="h-4 w-4 mr-1.5 hidden sm:inline" />Mitarbeiter</TabsTrigger>
            <TabsTrigger value="lagerorte"><MapPin className="h-4 w-4 mr-1.5 hidden sm:inline" />Lagerorte</TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════
              TAB: DASHBOARD
              ═══════════════════════════════════════════════════ */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

              {/* ─── LEFT COLUMN ─────────────────────────────── */}
              <div className="space-y-6">

                {/* Hero Status Panel */}
                <Card className="border-l-4 border-l-primary shadow-sm">
                  <CardContent className="pt-6 pb-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Aktuell ausgegeben</p>
                    <div className="flex items-end gap-4 mb-3">
                      <span className="text-5xl md:text-6xl font-bold tracking-tight">{activeAusgaben.length}</span>
                      <span className="text-muted-foreground text-sm mb-2">Werkzeuge</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {overdueAusgaben.length > 0 && (
                        <Badge variant="destructive" className="text-xs">{overdueAusgaben.length} überfällig</Badge>
                      )}
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">{onTimeCount} pünktlich</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions (mobile) */}
                <div className="grid grid-cols-2 gap-3 lg:hidden">
                  <Button onClick={() => setShowAusgabeDialog(true)} className="h-14 text-sm font-medium">
                    <ArrowUpRight className="h-5 w-5 mr-2" />Ausgabe
                  </Button>
                  <Button variant="outline" onClick={() => setShowRueckgabeDialog(true)} className="h-14 text-sm font-medium">
                    <ArrowDownLeft className="h-5 w-5 mr-2" />Rückgabe
                  </Button>
                </div>

                {/* Overdue Tools */}
                {overdueAusgaben.length > 0 && (
                  <Card className="border-destructive/30 bg-red-50/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        Überfällige Werkzeuge
                        <Badge variant="destructive" className="ml-auto">{overdueAusgaben.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {overdueAusgaben.map(a => {
                        const days = a.fields.geplantes_rueckgabedatum ? differenceInDays(new Date(), parseISO(a.fields.geplantes_rueckgabedatum)) : 0;
                        return (
                          <div key={a.record_id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 cursor-pointer hover:shadow-sm transition-shadow"
                            onClick={() => setDetailAusgabe(a)}>
                            <div>
                              <div className="font-medium text-sm">{getWzNameFromAusgabe(a)}</div>
                              <div className="text-xs text-muted-foreground">{getMaNameFromAusgabe(a)}</div>
                            </div>
                            <Badge variant="destructive" className="text-xs">{days} Tage</Badge>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Checkouts by Department Chart */}
                {checkoutsByDept.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Ausgaben nach Abteilung</CardTitle></CardHeader>
                    <CardContent>
                      {/* Desktop chart */}
                      <div className="hidden md:block h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={checkoutsByDept} layout="vertical" margin={{ left: 20 }}>
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(0 0% 100%)', border: '1px solid hsl(210 15% 88%)' }} />
                            <Bar dataKey="count" fill="hsl(32 95% 44%)" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Mobile list */}
                      <div className="md:hidden space-y-2">
                        {checkoutsByDept.map(d => (
                          <div key={d.name} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{d.name}</span>
                            <span className="font-semibold">{d.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Activity */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />Letzte Aktivitäten
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Noch keine Aktivitäten vorhanden.</p>
                    ) : (
                      <div className="space-y-1">
                        {recentActivity.map((item, i) => {
                          const isAusgabe = item.type === 'ausgabe';
                          const rec = item.record as any;
                          let wzName = 'Werkzeug';
                          let maName = '';
                          if (isAusgabe) {
                            const a = rec as Werkzeugausgabe;
                            wzName = getWzNameFromAusgabe(a);
                            maName = getMaNameFromAusgabe(a);
                          } else {
                            const r = rec as Werkzeugrueckgabe;
                            const ausgabeId = extractRecordId(r.fields.ausgabe);
                            const ausgabe = ausgabeId ? ausgaben.find(a => a.record_id === ausgabeId) : null;
                            if (ausgabe) {
                              wzName = getWzNameFromAusgabe(ausgabe);
                              maName = getMaNameFromAusgabe(ausgabe);
                            }
                          }
                          return (
                            <div key={`${item.type}-${i}`} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm transition-colors cursor-pointer hover:bg-muted ${i % 2 === 1 ? 'bg-muted/40' : ''}`}
                              onClick={() => { if (isAusgabe) setDetailAusgabe(rec); }}>
                              <div className={`p-1.5 rounded-full ${isAusgabe ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                {isAusgabe ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium truncate block">{wzName}</span>
                                <span className="text-xs text-muted-foreground">{maName}</span>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{relativeTime(item.date)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ─── RIGHT COLUMN ────────────────────────────── */}
              <div className="space-y-6">

                {/* Quick Actions (desktop) */}
                <div className="hidden lg:flex flex-col gap-3">
                  <Button onClick={() => setShowAusgabeDialog(true)} className="h-12 w-full justify-start text-sm font-medium">
                    <ArrowUpRight className="h-5 w-5 mr-2" />Ausgabe erfassen
                  </Button>
                  <Button variant="outline" onClick={() => setShowRueckgabeDialog(true)} className="h-12 w-full justify-start text-sm font-medium">
                    <ArrowDownLeft className="h-5 w-5 mr-2" />Rückgabe erfassen
                  </Button>
                </div>

                {/* Tool Inventory */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Werkzeugbestand</CardTitle>
                      <span className="text-2xl font-bold">{werkzeuge.length}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {categoryDist.length > 0 && (
                      <div className="h-[160px] mb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={categoryDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35} paddingAngle={2} strokeWidth={0}>
                              {categoryDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(0 0% 100%)', border: '1px solid hsl(210 15% 88%)', fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      {categoryDist.map((c, i) => (
                        <div key={c.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-muted-foreground">{c.name}</span>
                          </div>
                          <span className="font-medium">{c.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Condition Overview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      Zustandsübersicht
                      {repairCount > 0 && <Badge variant="destructive" className="text-xs">{repairCount} reparaturbedürftig</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Stacked bar */}
                    {werkzeuge.length > 0 && (
                      <div className="flex h-4 rounded-full overflow-hidden mb-3">
                        {conditionDist.map(c => (
                          <div key={c.key} className={`${zustandColor(c.key).split(' ')[0]} transition-all`}
                            style={{ width: `${(c.count / werkzeuge.length) * 100}%` }}
                            title={`${c.name}: ${c.count}`} />
                        ))}
                      </div>
                    )}
                    <div className="space-y-1">
                      {conditionDist.map(c => (
                        <div key={c.key} className="flex items-center justify-between text-sm">
                          <Badge className={`${zustandColor(c.key)} text-xs border-0`}>{c.name}</Badge>
                          <span className="font-medium">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Inspections */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      Anstehende Prüfungen
                      {upcomingInspections.length > 0 && <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">{upcomingInspections.length}</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingInspections.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-3">Keine anstehenden Prüfungen.</p>
                    ) : (
                      <div className="space-y-2">
                        {upcomingInspections.map(w => {
                          const days = w.fields.naechster_prueftermin ? differenceInDays(parseISO(w.fields.naechster_prueftermin), new Date()) : 0;
                          const urgent = days <= 7;
                          return (
                            <div key={w.record_id} className="flex items-center justify-between p-2.5 rounded-lg border text-sm cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => setDetailWerkzeug(w)}>
                              <div>
                                <div className="font-medium">{w.fields.bezeichnung}</div>
                                <div className="text-xs text-muted-foreground">{formatDate(w.fields.naechster_prueftermin)}</div>
                              </div>
                              <Badge className={urgent ? 'bg-amber-100 text-amber-800 border-amber-200 text-xs' : 'bg-blue-50 text-blue-700 border-blue-200 text-xs'}>
                                {urgent && <AlertCircle className="h-3 w-3 mr-1" />}
                                {days} Tage
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              TAB: WERKZEUGE
              ═══════════════════════════════════════════════════ */}
          <TabsContent value="werkzeuge">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Werkzeug suchen..." value={searchWz} onChange={e => setSearchWz(e.target.value)} className="pl-9" />
                </div>
                <Button onClick={() => { setEditWerkzeug(null); setShowWerkzeugDialog(true); }}>
                  <Plus className="h-4 w-4 mr-1" />Neues Werkzeug
                </Button>
              </div>
              {filteredWz.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{searchWz ? 'Keine Werkzeuge gefunden.' : 'Noch keine Werkzeuge vorhanden.'}</p>
                  {!searchWz && <Button className="mt-3" size="sm" onClick={() => { setEditWerkzeug(null); setShowWerkzeugDialog(true); }}><Plus className="h-4 w-4 mr-1" />Erstes Werkzeug anlegen</Button>}
                </CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {/* Desktop table header */}
                  <div className="hidden md:grid grid-cols-[1fr_1fr_120px_120px_80px] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Bezeichnung</span><span>Hersteller</span><span>Kategorie</span><span>Zustand</span><span></span>
                  </div>
                  {filteredWz.map(w => (
                    <div key={w.record_id} className="flex md:grid md:grid-cols-[1fr_1fr_120px_120px_80px] gap-3 items-center p-3 md:px-4 bg-card rounded-lg border hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => setDetailWerkzeug(w)}>
                      <div>
                        <div className="font-medium text-sm">{w.fields.bezeichnung ?? '–'}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{w.fields.hersteller ?? '–'} {w.fields.kategorie ? `· ${KATEGORIE_LABELS[w.fields.kategorie] ?? w.fields.kategorie}` : ''}</div>
                      </div>
                      <span className="hidden md:block text-sm text-muted-foreground">{w.fields.hersteller ?? '–'}</span>
                      <span className="hidden md:block text-xs">{w.fields.kategorie ? KATEGORIE_LABELS[w.fields.kategorie] : '–'}</span>
                      <div className="hidden md:block"><Badge className={`${zustandColor(w.fields.zustand)} text-xs border-0`}>{ZUSTAND_LABELS[w.fields.zustand ?? ''] ?? '–'}</Badge></div>
                      <div className="flex gap-1 ml-auto md:ml-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setEditWerkzeug(w); setShowWerkzeugDialog(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); handleDeleteWerkzeug(w); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              TAB: MITARBEITER
              ═══════════════════════════════════════════════════ */}
          <TabsContent value="mitarbeiter">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Mitarbeiter suchen..." value={searchMa} onChange={e => setSearchMa(e.target.value)} className="pl-9" />
                </div>
                <Button onClick={() => { setEditMitarbeiter(null); setShowMitarbeiterDialog(true); }}>
                  <Plus className="h-4 w-4 mr-1" />Neuer Mitarbeiter
                </Button>
              </div>
              {filteredMa.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{searchMa ? 'Keine Mitarbeiter gefunden.' : 'Noch keine Mitarbeiter vorhanden.'}</p>
                  {!searchMa && <Button className="mt-3" size="sm" onClick={() => { setEditMitarbeiter(null); setShowMitarbeiterDialog(true); }}><Plus className="h-4 w-4 mr-1" />Ersten Mitarbeiter anlegen</Button>}
                </CardContent></Card>
              ) : (
                <div className="space-y-2">
                  <div className="hidden md:grid grid-cols-[1fr_120px_140px_80px] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Name</span><span>Personalnr.</span><span>Abteilung</span><span></span>
                  </div>
                  {filteredMa.map(m => (
                    <div key={m.record_id} className="flex md:grid md:grid-cols-[1fr_120px_140px_80px] gap-3 items-center p-3 md:px-4 bg-card rounded-lg border hover:shadow-sm transition-shadow">
                      <div>
                        <div className="font-medium text-sm">{m.fields.vorname} {m.fields.nachname}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{m.fields.personalnummer ?? '–'} {m.fields.abteilung ? `· ${ABTEILUNG_LABELS[m.fields.abteilung]}` : ''}</div>
                      </div>
                      <span className="hidden md:block text-sm text-muted-foreground">{m.fields.personalnummer ?? '–'}</span>
                      <span className="hidden md:block text-xs">{m.fields.abteilung ? ABTEILUNG_LABELS[m.fields.abteilung] : '–'}</span>
                      <div className="flex gap-1 ml-auto md:ml-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditMitarbeiter(m); setShowMitarbeiterDialog(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteMitarbeiter(m)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              TAB: LAGERORTE
              ═══════════════════════════════════════════════════ */}
          <TabsContent value="lagerorte">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Lagerorte</h2>
                <Button onClick={() => { setEditLagerort(null); setShowLagerortDialog(true); }}>
                  <Plus className="h-4 w-4 mr-1" />Neuer Lagerort
                </Button>
              </div>
              {lagerorte.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Noch keine Lagerorte vorhanden.</p>
                  <Button className="mt-3" size="sm" onClick={() => { setEditLagerort(null); setShowLagerortDialog(true); }}><Plus className="h-4 w-4 mr-1" />Ersten Lagerort anlegen</Button>
                </CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lagerorte.map(l => {
                    const toolCount = werkzeuge.filter(w => { const lid = extractRecordId(w.fields.aktueller_lagerort); return lid === l.record_id; }).length;
                    return (
                      <Card key={l.record_id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-sm">{l.fields.ortsbezeichnung ?? '–'}</div>
                              {l.fields.typ && <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs mt-1">{LAGERORT_TYP_LABELS[l.fields.typ] ?? l.fields.typ}</Badge>}
                              <div className="text-xs text-muted-foreground mt-2">{toolCount} Werkzeuge</div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditLagerort(l); setShowLagerortDialog(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteLagerort(l)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                          {l.fields.beschreibung && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{l.fields.beschreibung}</p>}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ─── FIXED MOBILE BOTTOM ACTION ──────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border lg:hidden z-30">
        <Button onClick={() => setShowAusgabeDialog(true)} className="w-full h-[52px] text-sm font-semibold">
          <ArrowUpRight className="h-5 w-5 mr-2" />Werkzeug ausgeben
        </Button>
      </div>
      {/* Spacer for fixed bottom bar on mobile */}
      <div className="h-20 lg:hidden" />

      {/* ═══════════════════════════════════════════════════
          ALL DIALOGS
          ═══════════════════════════════════════════════════ */}

      {/* Ausgabe Create/Edit */}
      <AusgabeDialog open={showAusgabeDialog || !!editAusgabe}
        onOpenChange={o => { if (!o) { setShowAusgabeDialog(false); setEditAusgabe(null); } }}
        record={editAusgabe} mitarbeiter={mitarbeiter} werkzeuge={werkzeuge} onSuccess={fetchAll} />

      {/* Rückgabe Create/Edit */}
      <RueckgabeDialog open={showRueckgabeDialog || !!editRueckgabe}
        onOpenChange={o => { if (!o) { setShowRueckgabeDialog(false); setEditRueckgabe(null); } }}
        record={editRueckgabe} activeAusgaben={activeAusgaben} werkzeugeMap={werkzeugeMap}
        mitarbeiterMap={mitarbeiterMap} lagerorte={lagerorte} onSuccess={fetchAll} />

      {/* Werkzeug Create/Edit */}
      <WerkzeugeDialog open={showWerkzeugDialog || !!editWerkzeug}
        onOpenChange={o => { if (!o) { setShowWerkzeugDialog(false); setEditWerkzeug(null); } }}
        record={editWerkzeug} lagerorte={lagerorte} onSuccess={fetchAll} />

      {/* Mitarbeiter Create/Edit */}
      <MitarbeiterDialog open={showMitarbeiterDialog || !!editMitarbeiter}
        onOpenChange={o => { if (!o) { setShowMitarbeiterDialog(false); setEditMitarbeiter(null); } }}
        record={editMitarbeiter} onSuccess={fetchAll} />

      {/* Lagerorte Create/Edit */}
      <LagerorteDialog open={showLagerortDialog || !!editLagerort}
        onOpenChange={o => { if (!o) { setShowLagerortDialog(false); setEditLagerort(null); } }}
        record={editLagerort} onSuccess={fetchAll} />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog open={!!deleteTarget}
        onOpenChange={o => { if (!o) setDeleteTarget(null); }}
        name={deleteTarget?.name ?? ''} onConfirm={deleteTarget?.onConfirm ?? (async () => {})} />

      {/* Ausgabe Detail */}
      <DetailDialog open={!!detailAusgabe} onOpenChange={o => { if (!o) setDetailAusgabe(null); }} title="Werkzeugausgabe Details">
        {detailAusgabe && (() => {
          const wzId = extractRecordId(detailAusgabe.fields.werkzeug);
          const maId = extractRecordId(detailAusgabe.fields.mitarbeiter);
          const wz = wzId ? werkzeugeMap.get(wzId) : null;
          const ma = maId ? mitarbeiterMap.get(maId) : null;
          const isReturned = returnedAusgabeIds.has(detailAusgabe.record_id);
          return (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground block text-xs">Werkzeug</span><span className="font-medium">{wz?.fields.bezeichnung ?? '–'}</span></div>
                <div><span className="text-muted-foreground block text-xs">Mitarbeiter</span><span className="font-medium">{ma ? `${ma.fields.vorname} ${ma.fields.nachname}` : '–'}</span></div>
                <div><span className="text-muted-foreground block text-xs">Ausgabedatum</span><span>{formatDatetime(detailAusgabe.fields.ausgabedatum)}</span></div>
                <div><span className="text-muted-foreground block text-xs">Geplante Rückgabe</span><span>{formatDate(detailAusgabe.fields.geplantes_rueckgabedatum)}</span></div>
              </div>
              {detailAusgabe.fields.verwendungszweck && <div className="text-sm"><span className="text-muted-foreground block text-xs">Verwendungszweck</span>{detailAusgabe.fields.verwendungszweck}</div>}
              {detailAusgabe.fields.notizen && <div className="text-sm"><span className="text-muted-foreground block text-xs">Notizen</span>{detailAusgabe.fields.notizen}</div>}
              <div className="flex items-center gap-2 pt-2">
                <Badge className={isReturned ? 'bg-green-100 text-green-800 border-green-200 text-xs' : 'bg-amber-100 text-amber-800 border-amber-200 text-xs'}>
                  {isReturned ? <><CheckCircle className="h-3 w-3 mr-1" />Zurückgegeben</> : <><Clock className="h-3 w-3 mr-1" />Aktiv</>}
                </Badge>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => { setDetailAusgabe(null); setEditAusgabe(detailAusgabe); }}><Pencil className="h-3.5 w-3.5 mr-1" />Bearbeiten</Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setDetailAusgabe(null); handleDeleteAusgabe(detailAusgabe); }}><Trash2 className="h-3.5 w-3.5 mr-1" />Löschen</Button>
                {!isReturned && <Button size="sm" onClick={() => { setDetailAusgabe(null); setShowRueckgabeDialog(true); }}><ArrowDownLeft className="h-3.5 w-3.5 mr-1" />Rückgabe</Button>}
              </DialogFooter>
            </div>
          );
        })()}
      </DetailDialog>

      {/* Werkzeug Detail */}
      <DetailDialog open={!!detailWerkzeug} onOpenChange={o => { if (!o) setDetailWerkzeug(null); }} title="Werkzeug Details">
        {detailWerkzeug && (() => {
          const lagerId = extractRecordId(detailWerkzeug.fields.aktueller_lagerort);
          const lagerort = lagerId ? lagerorteMap.get(lagerId) : null;
          return (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground block text-xs">Bezeichnung</span><span className="font-medium">{detailWerkzeug.fields.bezeichnung ?? '–'}</span></div>
                <div><span className="text-muted-foreground block text-xs">Hersteller</span><span>{detailWerkzeug.fields.hersteller ?? '–'}</span></div>
                <div><span className="text-muted-foreground block text-xs">Modellnummer</span><span>{detailWerkzeug.fields.modellnummer ?? '–'}</span></div>
                <div><span className="text-muted-foreground block text-xs">Seriennummer</span><span>{detailWerkzeug.fields.seriennummer ?? '–'}</span></div>
                <div><span className="text-muted-foreground block text-xs">Kategorie</span><span>{detailWerkzeug.fields.kategorie ? KATEGORIE_LABELS[detailWerkzeug.fields.kategorie] : '–'}</span></div>
                <div><span className="text-muted-foreground block text-xs">Zustand</span><Badge className={`${zustandColor(detailWerkzeug.fields.zustand)} text-xs border-0`}>{ZUSTAND_LABELS[detailWerkzeug.fields.zustand ?? ''] ?? '–'}</Badge></div>
                <div><span className="text-muted-foreground block text-xs">Anschaffungsdatum</span><span>{formatDate(detailWerkzeug.fields.anschaffungsdatum)}</span></div>
                <div><span className="text-muted-foreground block text-xs">Preis</span><span>{detailWerkzeug.fields.anschaffungspreis != null ? `${detailWerkzeug.fields.anschaffungspreis.toLocaleString('de-DE')} EUR` : '–'}</span></div>
                <div><span className="text-muted-foreground block text-xs">Lagerort</span><span>{lagerort?.fields.ortsbezeichnung ?? '–'}</span></div>
                <div><span className="text-muted-foreground block text-xs">Prüfpflichtig</span><span>{detailWerkzeug.fields.pruefpflicht ? 'Ja' : 'Nein'}</span></div>
              </div>
              {detailWerkzeug.fields.pruefpflicht && detailWerkzeug.fields.naechster_prueftermin && (
                <div className="text-sm flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Nächster Prüftermin:</span>
                  <span className="font-medium">{formatDate(detailWerkzeug.fields.naechster_prueftermin)}</span>
                </div>
              )}
              {detailWerkzeug.fields.notizen && <div className="text-sm"><span className="text-muted-foreground block text-xs">Notizen</span>{detailWerkzeug.fields.notizen}</div>}
              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => { setDetailWerkzeug(null); setEditWerkzeug(detailWerkzeug); setShowWerkzeugDialog(true); }}><Pencil className="h-3.5 w-3.5 mr-1" />Bearbeiten</Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setDetailWerkzeug(null); handleDeleteWerkzeug(detailWerkzeug); }}><Trash2 className="h-3.5 w-3.5 mr-1" />Löschen</Button>
              </DialogFooter>
            </div>
          );
        })()}
      </DetailDialog>
    </div>
  );
}
