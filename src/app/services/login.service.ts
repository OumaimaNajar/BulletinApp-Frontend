import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

// Interfaces pour les requêtes et réponses de login
export interface LoginRequest {
  Username: string;
  Password: string;
}

// Interface pour la réponse de login, avec les propriétés attendues du backend
export interface LoginResponse {
  Success: boolean;
  Message: string;
  Username: string;
  Email: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  // URL de base de l'API pour les opérations de login
  private apiUrl = 'http://localhost:5230/api/Login';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    // Initialiser l'état de connexion
    this.isAuthenticatedSubject.next(this.isLoggedIn());
  }

  // Vérifier si localStorage est disponible
  private isLocalStorageAvailable(): boolean {
    return typeof localStorage !== 'undefined';
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    if (!this.isLocalStorageAvailable()) return false;
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  // Observable pour suivre l'état de connexion
  getAuthStatus(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  // Déconnexion
  logout(): void {
    if (this.isLocalStorageAvailable()) {// Supprimer les informations de connexion du localStorage
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');
    }
    this.isAuthenticatedSubject.next(false);
  }

  // Connexion
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {// Si la connexion est réussie, stocker les informations de l'utilisateur dans le localStorage
        if (response.Success && this.isLocalStorageAvailable()) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('username', response.Username);
          localStorage.setItem('userEmail', response.Email);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  // Vérifier si admin existe
  checkAdminExists(): Observable<any> {
    return this.http.get(`${this.apiUrl}/check`);
  }

  // Créer le premier admin (setup)
  setupAdmin(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/setup`, { Username: username, Password: password });
  }

  // Récupérer le nom de l'utilisateur
  getUsername(): string | null {
    if (!this.isLocalStorageAvailable()) return null;
    return localStorage.getItem('username');
  }

  // Récupérer l'email de l'utilisateur
  getUserEmail(): string | null {
    if (!this.isLocalStorageAvailable()) return null;
    return localStorage.getItem('userEmail');
  }
}