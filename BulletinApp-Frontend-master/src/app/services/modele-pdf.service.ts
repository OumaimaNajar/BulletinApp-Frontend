import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModelePdfService {
  // URL de base de l'API pour les modèles PDF
 // private apiUrl = 'https://a767-197-28-130-13.ngrok-free.app/api';
  private apiUrl = 'http://localhost:5230/api/ModelePdf';

  constructor(private http: HttpClient) {}

  // Récupérer tous les modèles
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  // Récupérer un modèle avec sa zone parsée 
getByIdWithZone(id: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/with-zone/${id}`);
}

  // Ajouter un nouveau modèle avec zone
  addModele(file: File, libelle: string, zone: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('libelle', libelle);
    formData.append('zone', JSON.stringify(zone));
    // Changement: ajouter '/add' à l'URL
    return this.http.post(`${this.apiUrl}/add`, formData);
  }


  // Mettre à jour la zone d'un modèle
// Mettre à jour la zone d'un modèle
updateZone(id: number, zone: any): Observable<any> {
    console.log(`📡 Mise à jour zone du modèle ${id}:`, zone);
    // S'assurer que la zone a les bonnes propriétés
    const zoneToSend = {
        X: zone.X ?? zone.x,
        Y: zone.Y ?? zone.y,
        Width: zone.Width ?? zone.width,
        Height: zone.Height ?? zone.height,
        OverlayWidth: zone.OverlayWidth ?? zone.overlayWidth,
        OverlayHeight: zone.OverlayHeight ?? zone.overlayHeight
    };
    return this.http.put(`${this.apiUrl}/update-zone/${id}`, zoneToSend);
}

// Supprimer un modèle
  deleteModele(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Vérifier un modèle avec un fichier test
  verifyModele(id: number, file?: File): Observable<any> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    return this.http.post(`${this.apiUrl}/${id}/verify`, formData);
  }

  // Tester un modèle sur toutes les pages
  testModele(id: number): Observable<any> {
    return this.http.get(`http://localhost:5230/api/Bulletins/test-modele/${id}`);
  }

  // Auto-correct la zone d'un modèle
  autoCorrectZone(id: number): Observable<any> {
    return this.http.post(`http://localhost:5230/api/Bulletins/auto-correct-zone/${id}`, {});
  }



  getPdfFile(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/file/${id}`, { responseType: 'blob' });
  }
}