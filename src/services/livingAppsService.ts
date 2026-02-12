// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Lagerorte, Werkzeugrueckgabe, Werkzeugausgabe, Werkzeuge, Mitarbeiter } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

export class LivingAppsService {
  // --- LAGERORTE ---
  static async getLagerorte(): Promise<Lagerorte[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.LAGERORTE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getLagerorteEntry(id: string): Promise<Lagerorte | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.LAGERORTE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createLagerorteEntry(fields: Lagerorte['fields']) {
    return callApi('POST', `/apps/${APP_IDS.LAGERORTE}/records`, { fields });
  }
  static async updateLagerorteEntry(id: string, fields: Partial<Lagerorte['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.LAGERORTE}/records/${id}`, { fields });
  }
  static async deleteLagerorteEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.LAGERORTE}/records/${id}`);
  }

  // --- WERKZEUGRUECKGABE ---
  static async getWerkzeugrueckgabe(): Promise<Werkzeugrueckgabe[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.WERKZEUGRUECKGABE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getWerkzeugrueckgabeEntry(id: string): Promise<Werkzeugrueckgabe | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.WERKZEUGRUECKGABE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createWerkzeugrueckgabeEntry(fields: Werkzeugrueckgabe['fields']) {
    return callApi('POST', `/apps/${APP_IDS.WERKZEUGRUECKGABE}/records`, { fields });
  }
  static async updateWerkzeugrueckgabeEntry(id: string, fields: Partial<Werkzeugrueckgabe['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.WERKZEUGRUECKGABE}/records/${id}`, { fields });
  }
  static async deleteWerkzeugrueckgabeEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.WERKZEUGRUECKGABE}/records/${id}`);
  }

  // --- WERKZEUGAUSGABE ---
  static async getWerkzeugausgabe(): Promise<Werkzeugausgabe[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.WERKZEUGAUSGABE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getWerkzeugausgabeEntry(id: string): Promise<Werkzeugausgabe | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.WERKZEUGAUSGABE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createWerkzeugausgabeEntry(fields: Werkzeugausgabe['fields']) {
    return callApi('POST', `/apps/${APP_IDS.WERKZEUGAUSGABE}/records`, { fields });
  }
  static async updateWerkzeugausgabeEntry(id: string, fields: Partial<Werkzeugausgabe['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.WERKZEUGAUSGABE}/records/${id}`, { fields });
  }
  static async deleteWerkzeugausgabeEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.WERKZEUGAUSGABE}/records/${id}`);
  }

  // --- WERKZEUGE ---
  static async getWerkzeuge(): Promise<Werkzeuge[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.WERKZEUGE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getWerkzeugeEntry(id: string): Promise<Werkzeuge | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.WERKZEUGE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createWerkzeugeEntry(fields: Werkzeuge['fields']) {
    return callApi('POST', `/apps/${APP_IDS.WERKZEUGE}/records`, { fields });
  }
  static async updateWerkzeugeEntry(id: string, fields: Partial<Werkzeuge['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.WERKZEUGE}/records/${id}`, { fields });
  }
  static async deleteWerkzeugeEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.WERKZEUGE}/records/${id}`);
  }

  // --- MITARBEITER ---
  static async getMitarbeiter(): Promise<Mitarbeiter[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.MITARBEITER}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getMitarbeiterEntry(id: string): Promise<Mitarbeiter | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.MITARBEITER}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createMitarbeiterEntry(fields: Mitarbeiter['fields']) {
    return callApi('POST', `/apps/${APP_IDS.MITARBEITER}/records`, { fields });
  }
  static async updateMitarbeiterEntry(id: string, fields: Partial<Mitarbeiter['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.MITARBEITER}/records/${id}`, { fields });
  }
  static async deleteMitarbeiterEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.MITARBEITER}/records/${id}`);
  }

}