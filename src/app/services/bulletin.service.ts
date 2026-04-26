import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BulletinService {

  // URL de base de l'API pour les bulletins
 //private apiUrl = 'http://localhost:5230/api/Bulletins';
 private apiUrl = 'https://a767-197-28-130-13.ngrok-free.app/api';

  constructor(private http: HttpClient) {}

  // ─── Upload fichiers ──────────────────────────
  uploadFiles(excel: File, pdf: File): Observable<any> {
    const formData = new FormData();
    formData.append('excel', excel);
    formData.append('pdf', pdf);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }



  // ─── Preview premier bulletin ─────────────────
  previewFirstBulletin(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/first-bulletin`, { responseType: 'blob' });
  }

  // ─── Admin bulletin par matricule ─────────────
  getBulletinAdmin(matricule: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/admin/bulletin/${matricule}`, { responseType: 'blob' });
  }

  // ─── Télécharger bulletin ─────────────────────
  downloadBulletin(matricule: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/bulletin/${matricule}`, { responseType: 'blob' });
  }

  // ─── Envoyer par matricule ────────────────────
  sendByMatricule(matricule: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send/${matricule}`, {});
  }

  // ─── Liste utilisateurs ───────────────────────
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  // ─── Tester la zone sur toutes les pages ─────
processZoneAllPages(file: File, zone: any): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  // Important: envoyer zone comme string JSON
  formData.append('zone', JSON.stringify(zone));
  
  console.log('📤 Envoi test zone:', {
    fileName: file.name,
    zone: zone
  });
  
  return this.http.post(`${this.apiUrl}/process-zone-all-pages`, formData);
}

  // ─── Tester un modèle spécifique ──────────────
  testModele(modeleId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/test-modele/${modeleId}`);
  }

  // ─── Corriger automatiquement une zone ────────
  autoCorrectZone(modeleId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/auto-correct-zone/${modeleId}`, {});
  }

  // Envoi tous bulletins avec filtres
  sendAll(modeleId: number, departement?: string, service?: string): Observable<any> {
    const body: any = { modeleId: Number(modeleId) };
    if (departement) body.departement = departement;
    if (service) body.service = service;
    
    console.log("📡 API SEND ALL =>", body);
    return this.http.post(`${this.apiUrl}/send-all`, body);
  }


  // Liste des départements
  getDepartements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/departements`);
  }

  // Liste des services (optionnellement par département)
  getServices(departement?: string): Observable<any[]> {
    let url = `${this.apiUrl}/services`;
    if (departement) {
      url += `?departement=${encodeURIComponent(departement)}`;
    }
    return this.http.get<any[]>(url);
  }


  // Ajoutez cette méthode dans la classe BulletinService
previewBulletins(modeleId: number, departement?: string, service?: string): Observable<any> {
  const body: any = { modeleId: Number(modeleId) };
  if (departement) body.departement = departement;
  if (service) body.service = service;
  
  console.log("📡 API PREVIEW (SANS ENVOI) =>", body);
  return this.http.post(`${this.apiUrl}/preview`, body);
}

// Ajoutez cette méthode
previewPage(modeleId: number, matricule: string, pageNumber: number): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/preview-page`, {
    params: {
      modeleId: modeleId.toString(),
      matricule: matricule,
      pageNumber: pageNumber.toString()
    },
    responseType: 'blob'
  });
}



// Ajoutez cette méthode
downloadBulletinWithModele(modeleId: number, matricule: string): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/bulletin/${modeleId}/${matricule}`, {
    responseType: 'blob'
  });
}

// Visualiser le bulletin (sans téléchargement)
viewBulletin(modeleId: number, matricule: string): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/view/${modeleId}/${matricule}`, {
    responseType: 'blob'
  });
}

  
}