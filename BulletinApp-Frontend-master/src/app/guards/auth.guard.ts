import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LoginService } from '../services/login.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  // Vérifie si l'utilisateur est connecté avant d'autoriser l'accès à la route protégée

  canActivate(): boolean {
    if (this.loginService.isLoggedIn()) {
      console.log('✅ Utilisateur authentifié, accès autorisé');
      return true;
    }
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de login
    console.log('❌ Utilisateur non authentifié, redirection vers login');
    this.router.navigate(['/login']);
    return false;
  }
}