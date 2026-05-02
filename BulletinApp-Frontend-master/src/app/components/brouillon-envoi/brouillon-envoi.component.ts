// src/app/components/brouillon-envoi/brouillon-envoi.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EmailService, EnvoiResultat } from '../../services/email.service';

@Component({
  selector: 'app-brouillon-envoi',
  templateUrl: './brouillon-envoi.component.html',
  styleUrls: ['./brouillon-envoi.component.css']
})
export class BrouillonEnvoiComponent {
  @Input() emailExpediteur: string = '';
  @Output() envoiComplete = new EventEmitter<EnvoiResultat>();
  
  isEnvoiEnCours = false;
  resultat: EnvoiResultat | null = null;
  showDetails = false;
  logs: string[] = [];

  constructor(private emailService: EmailService) {}

  /**
   * Envoyer tous les brouillons
   */
  envoyerBrouillons(): void {
    if (this.isEnvoiEnCours) {
      return;
    }

    // Confirmation avant envoi
    const confirmMessage = `Êtes-vous sûr de vouloir envoyer tous les brouillons ?\n\n` +
                          `Email expéditeur: ${this.emailExpediteur}\n` +
                          `Cette action enverra tous les brouillons stockés.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.isEnvoiEnCours = true;
    this.resultat = null;
    this.logs = [];
    this.ajouterLog('🚀 Démarrage de l\'envoi des brouillons...');
    this.ajouterLog(`📧 Email expéditeur: ${this.emailExpediteur}`);

    this.emailService.envoyerTousLesBrouillons().subscribe({
      next: (resultat) => {
        this.resultat = resultat;
        this.isEnvoiEnCours = false;
        this.ajouterLogsResultat(resultat);
        this.envoiComplete.emit(resultat);
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.isEnvoiEnCours = false;
        this.ajouterLog('❌ Erreur lors de l\'envoi: ' + (error.message || error.error?.message || 'Erreur inconnue'));
        this.envoiComplete.emit({
          success: false,
          message: error.message || 'Erreur de communication',
          total: 0,
          envoyes: 0,
          echecs: 0
        });
      }
    });
  }

  /**
   * Ajouter un log
   */
  private ajouterLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    this.logs.unshift(`[${timestamp}] ${message}`);
    
    // Limiter à 50 logs
    if (this.logs.length > 50) {
      this.logs.pop();
    }
  }

  /**
   * Ajouter les logs basés sur le résultat
   */
  private ajouterLogsResultat(resultat: EnvoiResultat): void {
    if (resultat.success) {
      this.ajouterLog('✅ Envoi terminé avec succès!');
      this.ajouterLog(`📊 Résultat: ${resultat.envoyes} envoyé(s) sur ${resultat.total}`);
      
      if (resultat.echecs > 0) {
        this.ajouterLog(`⚠️ ${resultat.echecs} échec(s) détecté(s)`);
        if (resultat.erreurs && resultat.erreurs.length > 0) {
          resultat.erreurs.forEach(err => {
            this.ajouterLog(`❌ ${err.email}: ${err.raison}`);
          });
        }
      }
    } else {
      this.ajouterLog(`❌ Échec: ${resultat.message}`);
    }
  }

  /**
   * Réinitialiser l'affichage
   */
  reinitialiser(): void {
    this.resultat = null;
    this.logs = [];
    this.showDetails = false;
  }

  /**
   * Obtenir la classe CSS pour le résultat
   */
  getResultClass(): string {
    if (!this.resultat) return '';
    return this.resultat.success ? 'success' : 'danger';
  }

  /**
   * Obtenir l'icône du résultat
   */
  getResultIcon(): string {
    if (!this.resultat) return '';
    return this.resultat.success ? 'fa-check-circle' : 'fa-times-circle';
  }
}