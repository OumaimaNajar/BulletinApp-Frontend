// src/app/services/login.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
 // private apiUrl = 'http://localhost:5230/api/Login';
 private apiUrl = 'https://a767-197-28-130-13.ngrok-free.app/api';

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {}

  login(email: string, password: string): Observable<any> {
    // Les noms des champs doivent correspondre exactement à ce que le backend attend
    const body = { email, password };
    console.log('📤 Envoi requête login:', body);
    return this.http.post(`${this.apiUrl}/login`, body);
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password });
  }

  checkAdminExists(): Observable<any> {
    return this.http.get(`${this.apiUrl}/check`);
  }

  setupAdmin(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/setup`, { username, email, password });
  }

  getCurrentUser(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/current-user?email=${email}`);
  }

  storeUserInfo(email: string, username: string): void {
    this.storage.setItem('isLoggedIn', 'true');
    this.storage.setItem('userEmail', email);
    this.storage.setItem('username', username);
    console.log('📧 Email stocké:', email);
    console.log('👤 Username stocké:', username);
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