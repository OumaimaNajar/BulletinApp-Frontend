// src/app/components/generer-eml/generer-eml.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { EmailService, ModelePdf, SelectOption, EmlGenerationResult, PreviewResult, EnvoiResultat } from '../../services/email.service';
import { ConfigurationService } from '../../services/configuration.service';

@Component({
  selector: 'app-generer-eml',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generer-eml.component.html',
  styleUrls: ['./generer-eml.component.css']
})
export class GenererEmlComponent implements OnInit {
  emlForm: FormGroup;
  modeles: ModelePdf[] = [];
  departements: SelectOption[] = [];
  services: SelectOption[] = [];
  isLoading = false;
  result: EmlGenerationResult | null = null;
  previewResult: PreviewResult | null = null;
  showResultModal = false;
  showPreviewModal = false;
  
  // Propriétés pour l'envoi des brouillons
  isEnvoiEnCours = false;
  envoiResultat: EnvoiResultat | null = null;
  showEnvoiModal = false;
  emailExpediteurConfigure: string = '';
  logs: { message: string; type: string; timestamp: Date }[] = [];

  constructor(
    private fb: FormBuilder,
    private emailService: EmailService,
    private configService: ConfigurationService  // Injecter le service de configuration
  ) {
    this.emlForm = this.fb.group({
      modeleId: [null],
      emailExpediteur: [''],
      departement: [null],
      service: [null]
    });
  }

  ngOnInit(): void {
    this.loadModeles();
    this.loadDepartements();
    this.loadEmailExpediteurConfigure();  // Charger l'email configuré

    this.emlForm.get('departement')?.valueChanges.subscribe(dept => {
      this.loadServices(dept);
    });
  }

  loadModeles(): void {
    this.emailService.getModeles().subscribe({
      next: (data) => {
        this.modeles = data;
        console.log("📦 Modèles chargés:", this.modeles);
      },
      error: (err) => console.error('❌ Erreur chargement modèles:', err)
    });
  }

  loadDepartements(): void {
    this.emailService.getDepartements().subscribe({
      next: (data) => {
        this.departements = data;
        console.log("📊 Départements chargés:", this.departements);
      },
      error: (err) => console.error('❌ Erreur chargement départements:', err)
    });
  }

  loadServices(departement?: string): void {
    this.emailService.getServices(departement).subscribe({
      next: (data) => {
        this.services = data;
        console.log("📁 Services chargés:", this.services);
      },
      error: (err) => console.error('❌ Erreur chargement services:', err)
    });
  }

  /**
   * Charger l'email expéditeur configuré
   */
  loadEmailExpediteurConfigure(): void {
    this.configService.getExpediteurEmail().subscribe({
      next: (response) => {
        if (response && response.email) {
          this.emailExpediteurConfigure = response.email;
          // Optionnel: Pré-remplir le champ email
          this.emlForm.patchValue({ emailExpediteur: response.email });
          this.ajouterLog(`✅ Email expéditeur configuré: ${this.emailExpediteurConfigure}`, 'success');
        } else {
          this.ajouterLog('⚠️ Aucun email expéditeur configuré', 'warning');
        }
      },
      error: (error) => {
        console.error('Erreur chargement email configuré:', error);
        this.ajouterLog('❌ Impossible de charger l\'email configuré', 'error');
      }
    });
  }

  onSubmit(): void {
    const modeleId = this.emlForm.get('modeleId')?.value;
    const emailExpediteur = this.emlForm.get('emailExpediteur')?.value;
    
    if (!modeleId) {
      alert('❌ Veuillez sélectionner un modèle');
      return;
    }
    
    if (!emailExpediteur) {
      alert('❌ Veuillez saisir votre email expéditeur');
      return;
    }

    this.isLoading = true;
    this.result = null;

    const request = this.emlForm.value;

    this.emailService.genererEmlEtStocker(
      request.modeleId,
      request.emailExpediteur,
      request.departement,
      request.service
    ).subscribe({
      next: (response) => {
        console.log("✅ Réponse:", response);
        this.result = response;
        this.isLoading = false;
        this.showResultModal = true;
        
        if (response.success && response.brouillonsCrees > 0) {
          this.ajouterLog(`✅ ${response.brouillonsCrees} brouillon(s) créé(s) avec succès !`, 'success');
        } else if (response.success && response.brouillonsCrees === 0) {
          this.ajouterLog(`⚠️ Aucun brouillon créé. Vérifiez les filtres.`, 'warning');
        } else {
          this.ajouterLog(`❌ Erreur: ${response.error}`, 'error');
        }
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        this.result = {
          success: false,
          brouillonsCrees: 0,
          output: '',
          error: error.error?.error || error.message || 'Erreur serveur'
        };
        this.isLoading = false;
        this.showResultModal = true;
        this.ajouterLog(`❌ Erreur: ${this.result.error}`, 'error');
      }
    });
  }

  /**
   * Envoyer tous les brouillons
   */
  envoyerTousLesBrouillons(): void {
    if (this.isEnvoiEnCours) {
      return;
    }

    // Vérifier si un email est configuré
    if (!this.emailExpediteurConfigure && !this.emlForm.get('emailExpediteur')?.value) {
      alert('❌ Veuillez configurer un email expéditeur dans la page Configuration');
      return;
    }

    const email = this.emailExpediteurConfigure || this.emlForm.get('emailExpediteur')?.value;
    
    // Confirmation avant envoi
    const confirmMessage = `📧 Confirmation d'envoi\n\n` +
                          `Email expéditeur: ${email}\n` +
                          `Cette action enverra TOUS les brouillons stockés dans votre boîte email.\n\n` +
                          `Êtes-vous sûr de vouloir continuer ?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.isEnvoiEnCours = true;
    this.envoiResultat = null;
    this.ajouterLog('🚀 Démarrage de l\'envoi des brouillons...', 'info');
    this.ajouterLog(`📧 Email expéditeur: ${email}`, 'info');

    this.emailService.envoyerTousLesBrouillons().subscribe({
      next: (resultat) => {
        this.envoiResultat = resultat;
        this.isEnvoiEnCours = false;
        this.showEnvoiModal = true;
        this.ajouterLogsEnvoiResultat(resultat);
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi:', error);
        this.isEnvoiEnCours = false;
        const message = error.message || error.error?.message || 'Erreur de communication';
        this.ajouterLog(`❌ Erreur lors de l'envoi: ${message}`, 'error');
        this.envoiResultat = {
          success: false,
          message: message,
          total: 0,
          envoyes: 0,
          echecs: 0,
          erreurs: []
        };
        this.showEnvoiModal = true;
      }
    });
  }

  /**
   * Ajouter un log
   */
  private ajouterLog(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
    this.logs.unshift({
      message,
      type,
      timestamp: new Date()
    });
    
    // Limiter à 100 logs
    if (this.logs.length > 100) {
      this.logs.pop();
    }
  }

  /**
   * Ajouter les logs basés sur le résultat de l'envoi
   */
  private ajouterLogsEnvoiResultat(resultat: EnvoiResultat): void {
    if (resultat.success) {
      this.ajouterLog('✅ Envoi terminé avec succès!', 'success');
      this.ajouterLog(`📊 Résultat: ${resultat.envoyes} envoyé(s) sur ${resultat.total}`, 'info');
      
      if (resultat.echecs > 0) {
        this.ajouterLog(`⚠️ ${resultat.echecs} échec(s) détecté(s)`, 'warning');
        if (resultat.erreurs && resultat.erreurs.length > 0) {
          resultat.erreurs.forEach(err => {
            this.ajouterLog(`❌ ${err.email}: ${err.raison}`, 'error');
          });
        }
      }
    } else {
      this.ajouterLog(`❌ Échec de l'envoi: ${resultat.message}`, 'error');
    }
  }

  onPreview(): void {
    const modeleId = this.emlForm.get('modeleId')?.value;
    const departement = this.emlForm.get('departement')?.value;
    const service = this.emlForm.get('service')?.value;

    if (!modeleId) {
      alert('❌ Veuillez sélectionner un modèle');
      return;
    }

    this.isLoading = true;

    this.emailService.preview(modeleId, departement, service).subscribe({
      next: (response) => {
        this.previewResult = response;
        this.isLoading = false;
        this.showPreviewModal = true;
        console.log('📊 Aperçu détaillé:', response.details);
      },
      error: (error) => {
        console.error('❌ Erreur aperçu:', error);
        this.isLoading = false;
        alert(`❌ Erreur aperçu : ${error.error?.error || error.message}`);
      }
    });
  }

  clearForm(): void {
    this.emlForm.reset({
      modeleId: null,
      emailExpediteur: this.emailExpediteurConfigure || '',
      departement: null,
      service: null
    });
    this.result = null;
    this.previewResult = null;
  }

  closeResultModal(): void {
    this.showResultModal = false;
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
  }

  closeEnvoiModal(): void {
    this.showEnvoiModal = false;
  }

  /**
   * Effacer les logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Obtenir la classe CSS pour le type de log
   */
  getLogClass(type: string): string {
    switch (type) {
      case 'success': return 'text-success';
      case 'error': return 'text-danger';
      case 'warning': return 'text-warning';
      default: return 'text-info';
    }
  }

  /**
   * Formater la date
   */
  formatDate(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}