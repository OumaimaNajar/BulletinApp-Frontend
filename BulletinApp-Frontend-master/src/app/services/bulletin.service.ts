import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BulletinService {

  // URL de base de l'API pour les bulletins
  private apiUrl = 'http://localhost:5230/api/Bulletins';
  // private apiUrl = 'https://a767-197-28-130-13.ngrok-free.app/api';

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

  // Preview bulletins (sans envoi)
  previewBulletins(modeleId: number, departement?: string, service?: string): Observable<any> {
    const body: any = { modeleId: Number(modeleId) };
    if (departement) body.departement = departement;
    if (service) body.service = service;
    
    console.log("📡 API PREVIEW (SANS ENVOI) =>", body);
    return this.http.post(`${this.apiUrl}/preview`, body);
  }

  // Preview page spécifique
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

  // Télécharger bulletin avec modèle
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

  // ================= NOUVELLES MÉTHODES AJOUTÉES =================

  // Récupérer les départements pour les filtres du modal
  getDepartementsList(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/departements-list`);
  }

  // Récupérer les services pour les filtres du modal
  getServicesList(departement?: string): Observable<string[]> {
    let url = `${this.apiUrl}/services-list`;
    if (departement) {
      url += `?departement=${encodeURIComponent(departement)}`;
    }
    return this.http.get<string[]>(url);
  }

  // Filtrer les employés par département et service
  filterEmployees(departement?: string, service?: string): Observable<any[]> {
    let url = `${this.apiUrl}/filter-employees`;
    const params: any = {};
    if (departement) params.departement = departement;
    if (service) params.service = service;
    return this.http.get<any[]>(url, { params });
  }

  // Obtenir les détails d'un employé par matricule
  getEmployeeDetails(matricule: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/employee/${matricule}`);
  }

  // Vérifier si un bulletin existe pour un matricule
  checkBulletinExists(matricule: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/bulletin-exists/${matricule}`);
  }

  // Obtenir le statut d'envoi pour un matricule
  getSendStatus(matricule: string): Observable<{ sent: boolean; date?: string; error?: string }> {
    return this.http.get<{ sent: boolean; date?: string; error?: string }>(`${this.apiUrl}/send-status/${matricule}`);
  }



  // Détection avec détails (pour le modal)
detectWithDetails(pdfFile: File, modeleId: number): Observable<any> {
  const formData = new FormData();
  formData.append('pdfFile', pdfFile);
  formData.append('modeleId', modeleId.toString());
  
  console.log('📤 Détection avec détails:', { modeleId, fileName: pdfFile.name });
  
  return this.http.post(`${this.apiUrl}/detect-with-details`, formData);
}

// Aperçu d'un bulletin spécifique
previewBulletin(modeleId: number, matricule: string): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/preview-bulletin/${modeleId}/${matricule}`, {
    responseType: 'blob'
  });
}
}