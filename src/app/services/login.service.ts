// src/app/services/login.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'http://localhost:5230/api/Login';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  login(email: string, password: string): Observable<any> {
    const body = { email, password };
    console.log('📤 Envoi requête login à:', `${this.apiUrl}/login`);
    return this.http.post(`${this.apiUrl}/login`, body);
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password });
  }

  checkAdminExists(): Observable<any> {
    console.log('🔍 Vérification admin sur:', `${this.apiUrl}/check`);
    return this.http.get(`${this.apiUrl}/check`);
  }

  setupAdmin(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/setup`, { username, email, password });
  }

  getCurrentUser(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/current-user?email=${email}`);
  }

  storeUserInfo(email: string, username: string): void {
    if (this.isBrowser) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('username', username);
      console.log('📧 Email stocké:', email);
      console.log('👤 Username stocké:', username);
    }
  }

  getEmail(): string {
    if (this.isBrowser) {
      return localStorage.getItem('userEmail') || '';
    }
    return '';
  }

  getUsername(): string {
    if (this.isBrowser) {
      return localStorage.getItem('username') || '';
    }
    return '';
  }

  isLoggedIn(): boolean {
    if (this.isBrowser) {
      return localStorage.getItem('isLoggedIn') === 'true';
    }
    return false;
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('username');
    }
  }
}