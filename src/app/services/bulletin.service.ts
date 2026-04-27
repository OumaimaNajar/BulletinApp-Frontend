import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NGROK_HEADERS } from './http-options';

@Injectable({
  providedIn: 'root'
})
export class BulletinService {

  // ================= BASE API =================
  private apiUrl = 'https://401a-197-28-128-214.ngrok-free.app/api';

  constructor(private http: HttpClient) {}

  // ================= UPLOAD =================
  uploadFiles(excel: File, pdf: File): Observable<any> {
  const formData = new FormData();
  formData.append('excel', excel);
  formData.append('pdf', pdf);

  return this.http.post(
    `${this.apiUrl}/Bulletins/upload`,
    formData
    // ❌ PAS de headers ici !
  );
}

  // ================= BULLETINS =================
  previewFirstBulletin(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/first-bulletin`, {
      responseType: 'blob',
      headers: NGROK_HEADERS
    });
  }

  getBulletinAdmin(matricule: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/admin/bulletin/${matricule}`, {
      responseType: 'blob',
      headers: NGROK_HEADERS
    });
  }

  downloadBulletin(matricule: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/bulletin/${matricule}`, {
      responseType: 'blob',
      headers: NGROK_HEADERS
    });
  }

  downloadBulletinWithModele(modeleId: number, matricule: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/bulletin/${modeleId}/${matricule}`, {
      responseType: 'blob',
      headers: NGROK_HEADERS
    });
  }

  viewBulletin(modeleId: number, matricule: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/view/${modeleId}/${matricule}`, {
      responseType: 'blob',
      headers: NGROK_HEADERS
    });
  }

  // ================= ENVOI =================
  sendByMatricule(matricule: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send/${matricule}`, {}, { headers: NGROK_HEADERS });
  }

  sendAll(modeleId: number, departement?: string, service?: string): Observable<any> {
    const body: any = {
      modeleId: Number(modeleId)
    };

    if (departement) body.departement = departement;
    if (service) body.service = service;

    return this.http.post(`${this.apiUrl}/send-all`, body, { headers: NGROK_HEADERS });
  }

  // ================= USERS =================
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`, { headers: NGROK_HEADERS });
  }

  // ================= ZONES PDF =================
  processZoneAllPages(file: File, zone: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('zone', JSON.stringify(zone));

    return this.http.post(`${this.apiUrl}/process-zone-all-pages`, formData, { headers: NGROK_HEADERS });
  }

  autoCorrectZone(modeleId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/auto-correct-zone/${modeleId}`, {}, { headers: NGROK_HEADERS });
  }

  testModele(modeleId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/test-modele/${modeleId}`, { headers: NGROK_HEADERS });
  }

  // ================= LISTES =================
  getDepartements() {
  return this.http.get<any[]>(
    `${this.apiUrl}/Bulletins/departements`,
    {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    }
  );
}

  getServices(departement?: string): Observable<any[]> {
  const url = departement
    ? `${this.apiUrl}/Bulletins/services?departement=${encodeURIComponent(departement)}`
    : `${this.apiUrl}/Bulletins/services`;

  return this.http.get<any[]>(url, { headers: NGROK_HEADERS });
}

  // ================= PREVIEW =================
  previewBulletins(modeleId: number, departement?: string, service?: string): Observable<any> {
    const body: any = {
      modeleId: Number(modeleId)
    };

    if (departement) body.departement = departement;
    if (service) body.service = service;

    return this.http.post(`${this.apiUrl}/preview`, body, { headers: NGROK_HEADERS });
  }

  previewPage(modeleId: number, matricule: string, pageNumber: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/preview-page`, {
      params: {
        modeleId: String(modeleId),
        matricule,
        pageNumber: String(pageNumber)
      },
      responseType: 'blob',
      headers: NGROK_HEADERS  
    });
  }
}