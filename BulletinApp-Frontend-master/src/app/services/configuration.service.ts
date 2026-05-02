// src/app/services/configuration.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private apiUrl = 'http://localhost:5230/api/Configuration';

  constructor(private http: HttpClient) { }

  // Récupérer l'email expéditeur
  getExpediteurEmail(): Observable<any> {
    return this.http.get(`${this.apiUrl}/expediteur-email`);
  }

  // Enregistrer l'email expéditeur
  setExpediteurEmail(email: string): Observable<any> {
    // 🔥 Important : body doit être exactement { "email": "valeur" }
    const body = { email: email };
    console.log('📤 Envoi vers API:', `${this.apiUrl}/expediteur-email`);
    console.log('📦 Body:', JSON.stringify(body));
    
    return this.http.post(`${this.apiUrl}/expediteur-email`, body);
  }

  // Récupérer la configuration CC
  getCcConfiguration(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cc-configuration`);
  }

  // Enregistrer la configuration CC
  setCcConfiguration(cc: string): Observable<any> {
    const body = { cc: cc };
    console.log('📤 Envoi CC vers API:', `${this.apiUrl}/cc-configuration`);
    console.log('📦 Body CC:', JSON.stringify(body));
    return this.http.post(`${this.apiUrl}/cc-configuration`, body);
  }

  // Supprimer la configuration CC
  deleteCcConfiguration(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cc-configuration`);
  }
}