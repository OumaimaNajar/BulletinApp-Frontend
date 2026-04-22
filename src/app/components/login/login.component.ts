import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  loading = false;
  errorMessage = '';
  showErrorPopup = false;
  showSuccessToast = false;
  successMessage = '';
  showSetup = false;
  setupUsername = '';
  setupPassword = '';
  setupConfirmPassword = '';
  setupMessage = '';

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('🔧 LoginComponent initialisé');
    
    this.loginService.checkAdminExists().subscribe({
      next: (res) => {
        if (!res.hasAdmin) {
          this.showSetup = true;
        }
      },
      error: (err) => {
        console.error('❌ Erreur vérification admin:', err);
      }
    });
  }

  private isLocalStorageAvailable(): boolean {
    return typeof localStorage !== 'undefined';
  }

  private storeUserInfo(username: string, email: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
      localStorage.setItem('userEmail', email);
    }
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Veuillez saisir votre nom d\'utilisateur et mot de passe';
      this.showErrorPopup = true;
      return;
    }

    this.loading = true;

    this.loginService.login({ Username: this.username, Password: this.password }).subscribe({
      next: (response: any) => {
        this.loading = false;
        
        const success = response.Success || response.success;
        const message = response.Message || response.message;
        const username = response.Username || response.username;
        const email = response.Email || response.email;
        
        if (success) {
          // Stocker les informations
          this.storeUserInfo(username, email);
          
          // Afficher le toast de succès
          this.successMessage = `Bienvenue ${username}`;
          this.showSuccessToast = true;
          
          // Naviguer vers upload après 1.5 secondes
          setTimeout(() => {
            this.router.navigate(['/app/upload']);
          }, 1500);
        } else {
          this.errorMessage = message || 'Identifiants incorrects';
          this.showErrorPopup = true;
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Erreur de connexion au serveur';
        this.showErrorPopup = true;
      }
    });
  }

  closeErrorPopup() {
    this.showErrorPopup = false;
    this.errorMessage = '';
  }

  onSetup() {
    if (!this.setupUsername || !this.setupPassword) {
      this.setupMessage = 'Veuillez saisir nom d\'utilisateur et mot de passe';
      return;
    }

    if (this.setupPassword !== this.setupConfirmPassword) {
      this.setupMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.setupPassword.length < 6) {
      this.setupMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    this.loading = true;
    this.setupMessage = '';

    this.loginService.setupAdmin(this.setupUsername, this.setupPassword).subscribe({
      next: (response: any) => {
        this.loading = false;
        
        const success = response.Success || response.success;
        const message = response.Message || response.message;
        
        if (success) {
          this.successMessage = 'Admin créé avec succès !';
          this.showSuccessToast = true;
          setTimeout(() => {
            this.showSetup = false;
            this.username = this.setupUsername;
            this.password = this.setupPassword;
            this.setupMessage = '';
          }, 1500);
        } else {
          this.setupMessage = message || 'Erreur lors de la création';
        }
      },
      error: (err) => {
        this.loading = false;
        this.setupMessage = 'Erreur lors de la création de l\'admin';
      }
    });
  }

  cancelSetup() {
    this.showSetup = false;
  }
}