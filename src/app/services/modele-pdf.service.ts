import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NGROK_HEADERS } from './http-options';

@Injectable({
  providedIn: 'root'
})
export class ModelePdfService {

  private apiUrl = 'https://401a-197-28-128-214.ngrok-free.app/api/ModelePdf';

  private headers = new HttpHeaders({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
});

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
  return this.http.get<any[]>(this.apiUrl, {
    headers: NGROK_HEADERS
  });
}

  getByIdWithZone(id: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/with-zone/${id}`, {
    headers: NGROK_HEADERS
  });
}

  addModele(file: File, libelle: string, zone: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('libelle', libelle);
    formData.append('zone', JSON.stringify(zone));

    return this.http.post(`${this.apiUrl}/add`, formData, {
      headers: NGROK_HEADERS
    });
  }

  updateZone(id: number, zone: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-zone/${id}`, zone, {
      headers: NGROK_HEADERS
    });
  }

  deleteModele(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: NGROK_HEADERS
    });
  }

  verifyModele(id: number, file?: File): Observable<any> {
    const formData = new FormData();
    if (file) formData.append('file', file);

    return this.http.post(`${this.apiUrl}/${id}/verify`, formData, {
      headers: NGROK_HEADERS
    });
  }

  testModele(id: number): Observable<any> {
    return this.http.get(`https://401a-197-28-128-214.ngrok-free.app/api/Bulletins/test-modele/${id}`, {
      headers: NGROK_HEADERS
    });
  }

  autoCorrectZone(id: number): Observable<any> {
    return this.http.post(
      `https://401a-197-28-128-214.ngrok-free.app/api/Bulletins/auto-correct-zone/${id}`,
      {},
      { headers: NGROK_HEADERS }
    );
  }
}