// src/app/services/email.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ModelePdf {
  id: number;
  libelle: string;
  chemin: string;
  zone: string;
}

export interface SelectOption {
  nom: string;
  count: number;
}

export interface GenererEmlRequest {
  modeleId: number;
  emailExpediteur: string;
  departement?: string;
  service?: string;
}

export interface EmlGenerationResult {
  success: boolean;
  brouillonsCrees: number;
  brouillonsEchecs?: number;
  output: string;
  error?: string;
  dossierEml?: string;
  typeClient?: string;
  message?: string;
  erreurs?: any[];
}

export interface TestConfigurationResult {
  dossierBrouillon: string;
  scriptPythonExiste: boolean;
  credentialsExiste: boolean;
  pythonInstalle: boolean;
}

export interface PreviewResult {
  total: number;
  detectedCount: number;
  details: any[];
}

export interface EnvoiResultat {
  success: boolean;
  message: string;
  total: number;
  envoyes: number;
  echecs: number;
  erreurs?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  //private apiUrl        = 'http://localhost:5230/api';
  private apiUrl = 'https://a767-197-28-130-13.ngrok-free.app/api';
  private bulletinsUrl  = 'http://localhost:5230/api/Bulletins';
  private modeleUrl     = 'http://localhost:5230/api/ModelePdf';
  

  

  constructor(private http: HttpClient) {}

  getModeles(): Observable<ModelePdf[]> {
    return this.http.get<ModelePdf[]>(this.modeleUrl);
  }

  getDepartements(): Observable<SelectOption[]> {
    return this.http.get<SelectOption[]>(`${this.bulletinsUrl}/departements`);
  }

  getServices(departement?: string): Observable<SelectOption[]> {
    let params = new HttpParams();
    if (departement) params = params.set('departement', departement);
    return this.http.get<SelectOption[]>(`${this.bulletinsUrl}/services`, { params });
  }

  preview(modeleId: number, departement?: string, service?: string): Observable<PreviewResult> {
    const body: any = { modeleId: Number(modeleId) };
    if (departement) body.departement = departement;
    if (service)     body.service     = service;
    return this.http.post<PreviewResult>(`${this.bulletinsUrl}/preview`, body);
  }

  // ✅ CORRECTION: Endpoint correct pour la génération EML
  genererEmlEtStocker(
    modeleId: number,
    emailExpediteur: string,
    departement?: string,
    service?: string
  ): Observable<EmlGenerationResult> {
    const body: GenererEmlRequest = {
      modeleId: Number(modeleId),
      emailExpediteur: emailExpediteur
    };
    if (departement) body.departement = departement;
    if (service)     body.service     = service;

    console.log('📡 genererEmlEtStocker =>', body);
    
    // 🔥 CORRECTION : Utiliser le bon endpoint
    return this.http.post<EmlGenerationResult>(
      `${this.apiUrl}/Eml/generer-eml-et-stocker`,  // ← Changé de Brouillon à Eml
      body
    );
  }

  testConfiguration(): Observable<TestConfigurationResult> {
    return this.http.get<TestConfigurationResult>(
      `${this.apiUrl}/Brouillon/test-configuration`
    );
  }

  detecterTypeClient(email: string): Observable<{ typeClient: string; message: string }> {
    return this.http.get<any>(
      `${this.apiUrl}/Eml/detecter-client?email=${encodeURIComponent(email)}`
    );
  }


 /**
   * Envoyer tous les brouillons stockés
   */
  envoyerTousLesBrouillons(): Observable<EnvoiResultat> {
    console.log('🚀 Envoi de tous les brouillons...');
    return this.http.post<EnvoiResultat>(
      `${this.apiUrl}/Envoi/envoyer-tous`,
      {}
    );
  }

  /**
   * Vérifier le statut de l'envoi
   */
  verifierStatutEnvoi(operationId?: string): Observable<any> {
    const url = operationId 
      ? `${this.apiUrl}/Envoi/statut/${operationId}`
      : `${this.apiUrl}/Envoi/statut`;
    return this.http.get<any>(url);
  }


}