// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Mitarbeiter {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    personalnummer?: string;
    abteilung?: 'elektroinstallation' | 'wartung_service' | 'bauleitung' | 'planung' | 'lager' | 'verwaltung';
    telefonnummer?: string;
    email?: string;
    notizen_mitarbeiter?: string;
  };
}

export interface Werkzeugausgabe {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    mitarbeiter?: string; // applookup -> URL zu 'Mitarbeiter' Record
    ausgabedatum?: string; // Format: YYYY-MM-DD oder ISO String
    geplantes_rueckgabedatum?: string; // Format: YYYY-MM-DD oder ISO String
    verwendungszweck?: string;
    notizen?: string;
    werkzeug?: string; // applookup -> URL zu 'Werkzeuge' Record
    bild_1?: string;
    bild_2?: string;
    bild_3?: string;
    dokument_1?: string;
    dokument_2?: string;
  };
}

export interface Werkzeuge {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    bezeichnung?: string;
    hersteller?: string;
    modellnummer?: string;
    seriennummer?: string;
    kategorie?: 'akkuwerkzeug' | 'elektrowerkzeug' | 'handwerkzeug' | 'messgeraet' | 'pruefgeraet' | 'leiter' | 'kabel_leitungen' | 'sonstiges';
    anschaffungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    anschaffungspreis?: number;
    aktueller_lagerort?: string; // applookup -> URL zu 'Lagerorte' Record
    zustand?: 'neu' | 'sehr_gut' | 'gut' | 'gebrauchsspuren' | 'reparaturbeduerftig' | 'defekt';
    pruefpflicht?: boolean;
    naechster_prueftermin?: string; // Format: YYYY-MM-DD oder ISO String
    notizen?: string;
    foto?: string;
  };
}

export interface Lagerorte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    beschreibung?: string;
    ortsbezeichnung?: string;
    typ?: 'fahrzeug' | 'baustelle' | 'aussenlager' | 'sonstiges' | 'werkstatt';
  };
}

export interface Werkzeugrueckgabe {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    ausgabe?: string; // applookup -> URL zu 'Werkzeugausgabe' Record
    rueckgabedatum?: string; // Format: YYYY-MM-DD oder ISO String
    rueckgabe_lagerort?: string; // applookup -> URL zu 'Lagerorte' Record
    zustand_bei_rueckgabe?: 'einwandfrei' | 'leichte_gebrauchsspuren' | 'verschmutzt' | 'beschaedigt' | 'defekt';
    beschaedigungen?: string;
    notizen_rueckgabe?: string;
  };
}

export const APP_IDS = {
  MITARBEITER: '697b2b318bccec961fdb7818',
  WERKZEUGAUSGABE: '697b2b41d520e5a668295185',
  WERKZEUGE: '697b2b4092d14994749ca71b',
  LAGERORTE: '697b2b40f8a1c1f639e5c8be',
  WERKZEUGRUECKGABE: '697b2b42b0235053832268ab',
} as const;

// Helper Types for creating new records
export type CreateMitarbeiter = Mitarbeiter['fields'];
export type CreateWerkzeugausgabe = Werkzeugausgabe['fields'];
export type CreateWerkzeuge = Werkzeuge['fields'];
export type CreateLagerorte = Lagerorte['fields'];
export type CreateWerkzeugrueckgabe = Werkzeugrueckgabe['fields'];