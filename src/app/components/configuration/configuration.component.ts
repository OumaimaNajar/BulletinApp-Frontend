// src/app/components/configuration/configuration.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigurationService } from '../../services/configuration.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class ConfigurationComponent implements OnInit {
  // Propriétés pour l'utilisateur
  username: string = '';
  userInitials: string = '';
  userEmail: string = '';
  
  // Propriétés pour l'expéditeur
  expediteurEmail: string = '';
  isLoadingExpediteur: boolean = false;
  isLoadingData: boolean = true;
  
  // Variables pour CC
  ccEmail: string = '';
  savedCcEmail: string = '';
  isLoadingCc: boolean = false;
  
  message = '';
  messageType: 'success' | 'error' = 'success';
  showMessage = false;

  constructor(
    private configurationService: ConfigurationService,
    private loginService: LoginService
  ) {}

  ngOnInit() {
    this.loadUserInfo();
    this.loadAllConfigurations();
  }

  loadUserInfo() {
    this.username = this.loginService.getUsername() || 'Administrateur';
    this.userEmail = this.loginService.getEmail() || '';
    this.calculateInitials();
  }

  calculateInitials() {
    if (this.username.includes('_')) {
      const parts = this.username.split('_');
      this.userInitials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      this.userInitials = this.username.substring(0, 2).toUpperCase();
      if (this.userInitials.length < 2) {
        this.userInitials = this.username.substring(0, 1).toUpperCase() + 'A';
      }
    }
  }

  // Charger toutes les configurations en parallèle
  async loadAllConfigurations() {
    this.isLoadingData = true;
    try {
      await Promise.all([
        this.loadExpediteur(),
        this.loadCc()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des configurations:', error);
    } finally {
      this.isLoadingData = false;
    }
  }

  // Charger l'expéditeur configuré (ou utiliser l'email par défaut)
  loadExpediteur(): Promise<void> {
    return new Promise((resolve) => {
      this.configurationService.getExpediteurEmail().subscribe({
        next: (res) => {
          if (res.email && res.email !== '') {
            // Si config existe en BDD, l'utiliser
            this.expediteurEmail = res.email;
          } else {
            // Sinon, utiliser l'email de l'utilisateur connecté
            this.expediteurEmail = this.userEmail;
          }
          console.log('📧 Email expéditeur chargé:', this.expediteurEmail);
          resolve();
        },
        error: (err) => {
          console.error('Erreur chargement expéditeur:', err);
          // En cas d'erreur, utiliser l'email de l'utilisateur connecté
          this.expediteurEmail = this.userEmail;
          resolve();
        }
      });
    });
  }

  // Charger le CC configuré
  loadCc(): Promise<void> {
    return new Promise((resolve) => {
      this.configurationService.getCcConfiguration().subscribe({
        next: (res) => {
          if (res.cc && res.cc !== '') {
            // Si config existe en BDD, l'utiliser
            this.ccEmail = res.cc;
            this.savedCcEmail = res.cc;
          } else {
            // Sinon, laisser vide
            this.ccEmail = '';
            this.savedCcEmail = '';
          }
          console.log('📧 CC chargé:', this.ccEmail || '(vide)');
          resolve();
        },
        error: (err) => {
          console.error('Erreur chargement CC:', err);
          // En cas d'erreur, laisser vide
          this.ccEmail = '';
          this.savedCcEmail = '';
          resolve();
        }
      });
    });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Sauvegarder l'expéditeur
  saveExpediteur() {
  // 🔍 DEBUG
  console.log('🔍 === SAVE EXPEDITEUR ===');
  console.log('🔍 expediteurEmail avant envoi:', this.expediteurEmail);
  console.log('🔍 Type de expediteurEmail:', typeof this.expediteurEmail);
  
  // 🔥 Force l'email à la bonne valeur si nécessaire
  const emailToSend = this.expediteurEmail || this.userEmail;
  console.log('🔍 emailToSend:', emailToSend);
  
  if (!emailToSend || emailToSend === this.userEmail) {
    // Réinitialisation...
    return;
  }

  if (!this.isValidEmail(emailToSend)) {
    this.showNotification('Veuillez saisir un email valide', 'error');
    return;
  }

  this.isLoadingExpediteur = true;
  this.configurationService.setExpediteurEmail(emailToSend).subscribe({
    next: (res) => {
      this.isLoadingExpediteur = false;
      console.log('✅ Succès:', res);
      this.showNotification(res.message, 'success');
      // Recharger pour mettre à jour l'affichage
      this.loadExpediteur();
    },
    error: (err) => {
      this.isLoadingExpediteur = false;
      console.error('❌ Erreur:', err);
      console.error('Status:', err.status);
      console.error('Message erreur:', err.error);
      this.showNotification('Erreur lors de l\'enregistrement', 'error');
    }
  });
}

  // Sauvegarder le CC
  saveCc() {
    // 🔥 Si l'email CC est vide, on efface la config BDD
    if (!this.ccEmail) {
      this.isLoadingCc = true;
      this.configurationService.deleteCcConfiguration().subscribe({
        next: (res) => {
          this.isLoadingCc = false;
          this.savedCcEmail = '';
          this.showNotification('CC supprimé avec succès', 'success');
        },
        error: (err) => {
          this.isLoadingCc = false;
          console.error('Erreur suppression CC:', err);
          this.showNotification('Erreur lors de la suppression du CC', 'error');
        }
      });
      return;
    }

    // Vérifier le format de l'email
    if (!this.isValidEmail(this.ccEmail)) {
      this.showNotification('Veuillez saisir un email CC valide', 'error');
      return;
    }

    this.isLoadingCc = true;
    this.configurationService.setCcConfiguration(this.ccEmail).subscribe({
      next: (res) => {
        this.isLoadingCc = false;
        this.savedCcEmail = this.ccEmail;
        this.showNotification(res.message, 'success');
      },
      error: (err) => {
        this.isLoadingCc = false;
        console.error('Erreur enregistrement CC:', err);
        this.showNotification('Erreur lors de l\'enregistrement du CC', 'error');
      }
    });
  }

  clearCc() {
    this.ccEmail = '';
    this.saveCc();
  }

  showNotification(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    this.showMessage = true;
    setTimeout(() => {
      this.showMessage = false;
    }, 3000);
  }
}