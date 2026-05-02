// src/app/services/login.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { NGROK_HEADERS } from './http-options';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  // ✅ BASE URL CORRECTE (backend: /api/auth)
  private apiUrl = 'https://401a-197-28-128-214.ngrok-free.app/api/auth';

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {}

  // ================= LOGIN =================
  login(email: string, password: string): Observable<any> {
    const body = { email, password };
    console.log('📤 Envoi requête login:', body);

    return this.http.post(`${this.apiUrl}/login`, body, { headers: NGROK_HEADERS });
  }

  // ================= REGISTER =================
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, {
      username,
      email,
      password
    }, { headers: NGROK_HEADERS });
  }

  // ================= CHECK ADMIN =================
  checkAdminExists(): Observable<any> {
    return this.http.get(`${this.apiUrl}/check`, { headers: NGROK_HEADERS });
  }

  // ================= SETUP ADMIN =================
  setupAdmin(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/setup`, {
      username,
      email,
      password
    }, { headers: NGROK_HEADERS });
  }

  // ================= CURRENT USER =================
  getCurrentUser(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/current-user?email=${email}`, { headers: NGROK_HEADERS });
  }

  // ================= STORAGE =================
  storeUserInfo(email: string, username: string): void {
    this.storage.setItem('isLoggedIn', 'true');
    this.storage.setItem('userEmail', email);
    this.storage.setItem('username', username);
  }

  getEmail(): string {
    return this.storage.getItem('userEmail') || '';
  }

  getUsername(): string {
    return this.storage.getItem('username') || '';
  }

  isLoggedIn(): boolean {
    return this.storage.getItem('isLoggedIn') === 'true';
  }

  logout(): void {
    this.storage.removeItem('isLoggedIn');
    this.storage.removeItem('userEmail');
    this.storage.removeItem('username');
  }
}