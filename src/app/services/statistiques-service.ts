// src/app/services/statistiques-service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// statistiques-service.ts
export interface Statistiques {
  BrouillonsGeneres: number;      // ← Majuscule
  BrouillonsEnvoyes: number;      // ← Majuscule
  TotalOperations: number;        // ← Majuscule
  DerniereMiseAJour: string;      // ← Majuscule
}

@Injectable({
  providedIn: 'root'
})
export class StatistiquesService {
  private apiUrl = 'http://localhost:5230/api/statistiques';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    let userEmail = localStorage.getItem('userEmail') || '';
    if (userEmail.startsWith('"') && userEmail.endsWith('"')) {
      userEmail = userEmail.slice(1, -1);
    }
    console.log('📧 Header ajouté manuellement:', userEmail);
    return new HttpHeaders({
      'X-User-Email': userEmail
    });
  }

  getStats(): Observable<Statistiques> {
    console.log('📡 Appel API: GET', this.apiUrl);
    return this.http.get<Statistiques>(this.apiUrl, { headers: this.getHeaders() });
  }

  incrementerStockage(quantite: number): Observable<Statistiques> {
    return this.http.post<Statistiques>(
      `${this.apiUrl}/incrementer`,
      { type: 'stockage', quantite: quantite },
      { headers: this.getHeaders() }
    );
  }

  incrementerEnvoi(quantite: number): Observable<Statistiques> {
    return this.http.post<Statistiques>(
      `${this.apiUrl}/incrementer`,
      { type: 'envoi', quantite: quantite },
      { headers: this.getHeaders() }
    );
  }

  resetStats(): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset`, {}, { headers: this.getHeaders() });
  }

  getAllStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/tous`, { headers: this.getHeaders() });
  }
}