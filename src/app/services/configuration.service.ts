// src/app/services/configuration.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'https://a767-197-28-130-13.ngrok-free.app/api/Configuration';

  constructor(private http: HttpClient) {}

  // Récupérer l'email expéditeur configuré
  getExpediteurEmail(): Observable<ExpediteurEmailResponse> {
    return this.http.get<ExpediteurEmailResponse>(`${this.apiUrl}/expediteur-email`);
  }

  // Définir l'email expéditeur
  setExpediteurEmail(email: string): Observable<SetEmailResponse> {
    return this.http.post<SetEmailResponse>(`${this.apiUrl}/expediteur-email`, { email });
  }
}