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
  userEmail: string = '';
  expediteurEmail: string = '';
  useCustomExpediteur: boolean = false;
  customExpediteurEmail: string = '';
  isLoading = false;
  isLoadingConfig = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  showMessage = false;

  constructor(
    private configurationService: ConfigurationService,
    private loginService: LoginService
  ) {}

  ngOnInit() {
    this.userEmail = this.loginService.getEmail();
    this.loadConfiguration();
  }

  loadConfiguration() {
    this.isLoadingConfig = true;
    this.configurationService.getExpediteurEmail().subscribe({
      next: (res) => {
        if (res.email && res.email !== '') {
          this.useCustomExpediteur = true;
          this.customExpediteurEmail = res.email;
        }
        this.isLoadingConfig = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoadingConfig = false;
      }
    });
  }

  onUseCustomChange() {
    if (!this.useCustomExpediteur) {
      this.customExpediteurEmail = '';
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  saveConfiguration() {
    if (this.useCustomExpediteur && !this.isValidEmail(this.customExpediteurEmail)) {
      this.showNotification('Veuillez saisir un email valide', 'error');
      return;
    }

    this.isLoading = true;

    if (this.useCustomExpediteur) {
      this.configurationService.setExpediteurEmail(this.customExpediteurEmail).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.showNotification(res.message, 'success');
        },
        error: (err) => {
          this.isLoading = false;
          this.showNotification('Erreur lors de l\'enregistrement', 'error');
        }
      });
    } else {
      this.configurationService.setExpediteurEmail('').subscribe({
        next: (res) => {
          this.isLoading = false;
          this.showNotification('Email réinitialisé avec succès', 'success');
        },
        error: (err) => {
          this.isLoading = false;
          this.showNotification('Erreur lors de la réinitialisation', 'error');
        }
      });
    }
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