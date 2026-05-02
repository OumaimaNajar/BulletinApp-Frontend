// src/app/components/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  showErrorPopup = false;
  showSuccessToast = false;
  successMessage = '';
  showSetup = false;
  setupUsername = '';
  setupEmail = '';
  setupPassword = '';
  setupConfirmPassword = '';
  setupMessage = '';

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  ngOnInit() {
    // Vérifier si déjà connecté
    if (this.loginService.isLoggedIn()) {
      console.log('✅ Déjà connecté, redirection vers /app/dashboard');
      this.router.navigate(['/app/dashboard']);
      return;
    }

    this.loginService.checkAdminExists().subscribe({
      next: (res) => {
        const hasAdmin = res.hasAdmin || res.HasAdmin;
        if (!hasAdmin) {
          this.showSetup = true;
        }
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez saisir votre email et mot de passe';
      this.showErrorPopup = true;
      return;
    }

    this.loading = true;
    console.log('🔐 Tentative de connexion:', { email: this.email });

    this.loginService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        console.log('📡 Réponse brute:', response);
        this.loading = false;
        
        const success = response.Success || response.success;
        const message = response.Message || response.message;
        const username = response.Username || response.username;
        const email = response.Email || response.email;
        
        if (success) {
          this.loginService.storeUserInfo(email, username);
          this.successMessage = `Bienvenue ${username}`;
          this.showSuccessToast = true;
          
          // 🔥 FORCER LA REDIRECTION VERS /app/upload
          setTimeout(() => {
            console.log('🚀 Redirection vers /app/dashboard...');
            this.router.navigate(['/app/dashboard']).then(
              (success) => {
                if (success) {
                  console.log('✅ Navigation réussie vers /app/dashboard');
                } else {
                  console.error('❌ Navigation échouée');
                  // Fallback vers /home
                  this.router.navigate(['/home']);
                }
              },
              (error) => {
                console.error('❌ Erreur navigation:', error);
                this.router.navigate(['/home']);
              }
            );
          }, 1500);
        } else {
          this.errorMessage = message || 'Email ou mot de passe incorrect';
          this.showErrorPopup = true;
        }
      },
      error: (err) => {
        console.error('❌ Erreur HTTP:', err);
        this.loading = false;
        this.errorMessage = 'Erreur de connexion au serveur';
        this.showErrorPopup = true;
      }
    });
  }

  onSetup() {
    if (!this.setupUsername || !this.setupEmail || !this.setupPassword) {
      this.setupMessage = 'Veuillez remplir tous les champs';
      return;
    }

    if (this.setupPassword !== this.setupConfirmPassword) {
      this.setupMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.loading = true;

    this.loginService.setupAdmin(this.setupUsername, this.setupEmail, this.setupPassword).subscribe({
      next: (response: any) => {
        this.loading = false;
        const success = response.Success || response.success;
        
        if (success) {
          this.successMessage = response.Message || response.message || 'Admin créé avec succès !';
          this.showSuccessToast = true;
          setTimeout(() => {
            this.showSetup = false;
            this.email = this.setupEmail;
            this.password = this.setupPassword;
            // Auto-connexion après création
            this.onSubmit();
          }, 1500);
        } else {
          this.setupMessage = response.Message || response.message || 'Erreur lors de la création';
        }
      },
      error: () => {
        this.loading = false;
        this.setupMessage = 'Erreur lors de la création';
      }
    });
  }

  cancelSetup() {
    this.showSetup = false;
  }

  closeErrorPopup() {
    this.showErrorPopup = false;
  }
}