// src/app/services/configuration.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NGROK_HEADERS } from './http-options';

export interface ExpediteurEmailResponse {
  email: string;
}

export interface SetEmailResponse {
  success: boolean;
  message: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  // ⚠️ IMPORTANT : évite de terminer par /api si ton backend ne l’utilise pas partout
  private apiUrl = 'https://401a-197-28-128-214.ngrok-free.app/api/Configuration';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // 🔹 GET email expéditeur
  getExpediteurEmail(): Observable<ExpediteurEmailResponse> {
    return this.http.get<ExpediteurEmailResponse>(
      `${this.apiUrl}/expediteur-email`,
      { headers: NGROK_HEADERS }
    );
  }

  // 🔹 POST email expéditeur
  setExpediteurEmail(email: string): Observable<SetEmailResponse> {
    return this.http.post<SetEmailResponse>(
      `${this.apiUrl}/expediteur-email`,
      { email },
      { headers: NGROK_HEADERS }
    );
  }
}