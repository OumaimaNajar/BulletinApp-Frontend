import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BulletinService } from '../../services/bulletin.service';
import { ModelePdfService } from '../../services/modele-pdf.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';    
import { LoginService } from '../../services/login.service';
import { EmailService, EmlGenerationResult } from '../../services/email.service';
import { ConfigurationService } from '../../services/configuration.service';
import { StatistiquesService } from '../../services/statistiques-service';  

@Component({
    selector: 'app-upload',
    imports: [FormsModule, CommonModule],
    templateUrl: './upload.component.html',
    styleUrl: './upload.component.css'
})
export class UploadComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('previewContainer') previewContainer!: ElementRef;

  // FICHIERS 
  excelFile!: File;
  pdfFile!: File;
  excelName = "";
  pdfName = "";
  message = "";
  messageType: 'success' | 'error' | '' = '';
  showUsersPopup = false;
  users: any[] = [];
  showTable = false;
  loading = false;

  // UTILISATEUR
  username: string = '';
  userInitials: string = '';
  savedCcEmail: string = '';

  // PREVIEW MODAL
  showPreviewModal: boolean = false;
  previewPdfUrl: SafeResourceUrl | null = null;
  previewEmployeNom: string = '';
  previewEmployePrenom: string = '';
  previewEmployeMatricule: string = '';

  // MODELES
  modeles: any[] = [];
  selectedModeleId: number | null = null;
  modelePdfUrl: SafeResourceUrl | null = null;

  // RÉSULTATS DÉTECTION
  detectionResults: any = null;
  showDetectionResults = false;

  // FILTRES
  departements: any[] = [];
  services: any[] = [];
  selectedDepartement: string = '';
  selectedService: string = '';
  showFilters: boolean = false;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  
  // Popup confirmation
  showConfirmPopup: boolean = false;

  // Email expéditeur
  emailExpediteur: string = '';
  typeClientDetecte: string = '';
  showEmailInput: boolean = false;
  emailExpediteurEffectif: string = '';

  // EML
  isGeneratingEml = false;
  emlGenerationResult: EmlGenerationResult | null = null;
  showEmlResult = false;
  showBrouillonConfirmPopup = false;

  // Envoi des brouillons
  isEnvoiBrouillonsEnCours = false;
  envoiBrouillonsResultat: any = null;

  // Modal des résultats
  showResultsModal: boolean = false;
  detectedEmployees: any[] = [];
  filteredEmployees: any[] = [];
  departementsList: string[] = [];
  servicesList: string[] = [];
  filterDepartement: string = '';
  filterService: string = '';
  currentEmployeesPage: number = 1;
  employeesPageSize: number = 10;

  // Preview PDF
  showPdfPreview: boolean = false;
  previewEmployee: any = null;
  pdfPreviewUrl: SafeResourceUrl | null = null;

  // Stockage
  showStorageResult: boolean = false;
  storageResult: any = null;

  // Envoi individuel
  showSendConfirm: boolean = false;
  sendEmployee: any = null;

  // Variables pour la modale employés
  showEmployeeModal: boolean = false;
  employeeList: any[] = [];
  filteredEmployeeList: any[] = [];
  currentEmployeePage: number = 1;
  employeePageSize: number = 10;
  employeeTotalPages: number = 0;
  employeeFilterDept: string = '';
  employeeFilterService: string = '';
  employeeDepts: string[] = [];
  employeeServices: string[] = [];

  // =========================================================
  // APERÇU MODÈLE AVEC ZONE — variables
  // =========================================================
  showModelePreviewModal: boolean = false;
  modelePreviewUrl: SafeResourceUrl | null = null;
  modelePreviewName: string = '';
  modelePreviewZone: any = null;
  modelePreviewWithZone: boolean = false;
  modelePreviewContainerWidth: number = 0;
  modelePreviewContainerHeight: number = 0;
  private resizeObserver: ResizeObserver | null = null;

  // Coordonnées calculées de la zone overlay
  previewZoneLeft: number = 0;
  previewZoneTop: number = 0;
  previewZoneWidth: number = 0;
  previewZoneHeight: number = 0;

  // Dimensions réelles du PDF A4 en pixels à 96dpi
  // Le viewer Firefox/Chrome affiche un A4 à ~794px de large dans l'iframe
  private readonly PDF_A4_WIDTH_PX = 794;
  private readonly PDF_A4_HEIGHT_PX = 1123;

  stockageConfirmData: {
    departement: string;
    service: string;
    totalEmployes: number;
    emailExpediteur: string;
  } = {
    departement: '',
    service: '',
    totalEmployes: 0,
    emailExpediteur: ''
  };


  currentSessionId: string | null = null;
  showEnvoiResultModal = false;


  // Pour stocker les offsets manuels
private manualOffsetX = 0;
private manualOffsetY = 0;

// Pour sauvegarder l'offset par modèle (optionnel)
private zoneOffsets: Map<number, {x: number, y: number}> = new Map();

  constructor(
    private bulletinService: BulletinService,
    private modeleService: ModelePdfService,
    private sanitizer: DomSanitizer,
    private emailService: EmailService,
    private loginService: LoginService,
    private configurationService: ConfigurationService,
    private cdr: ChangeDetectorRef,
    private statistiquesService: StatistiquesService
  ) {}

  ngOnInit() {
    try {
      const name = this.loginService.getUsername();
      const email = this.loginService.getEmail();
      
      this.username = name || 'Administrateur';
      this.calculateInitials();
      this.emailExpediteur = email || '';
      
      if (this.emailExpediteur) {
        this.detecterTypeClient();
        this.loadExpediteurEffectif();
        this.loadCcConfiguration();
      } else {
        this.message = '⚠️ Veuillez vous reconnecter pour définir l\'email expéditeur';
        this.messageType = 'error';
        setTimeout(() => this.message = '', 5000);
      }
      
      this.loadModeles(false);
      
    } catch (error) {
      console.error('❌ Erreur dans ngOnInit:', error);
      this.username = 'Administrateur';
      this.userInitials = 'AD';
      this.emailExpediteur = '';
    }
  }

  ngAfterViewInit() {
    // Le ResizeObserver est attaché dynamiquement lors de l'ouverture de la modale
  }

  ngOnDestroy() {
    if (this.modelePdfUrl) {
      URL.revokeObjectURL(this.modelePdfUrl as string);
    }
    this.disconnectResizeObserver();
  }

  private disconnectResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  loadCcConfiguration() {
    this.configurationService.getCcConfiguration().subscribe({
      next: (res) => {
        if (res.cc && res.cc !== '') {
          this.savedCcEmail = res.cc;
        }
      },
      error: (err) => console.error('Erreur chargement CC:', err)
    });
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

  detecterTypeClient() {
    if (!this.emailExpediteur) return;
    const domaine = this.emailExpediteur.split('@')[1]?.toLowerCase();
    this.typeClientDetecte = (domaine === 'gmail.com' || domaine === 'googlemail.com') ? 'gmail' : 'outlook';
  }

  loadExpediteurEffectif() {
    this.configurationService.getExpediteurEmail().subscribe({
      next: (res) => {
        if (res.email && res.email !== '') {
          this.emailExpediteurEffectif = res.email;
        } else {
          this.emailExpediteurEffectif = this.emailExpediteur;
        }
        this.updateTypeClientFromEmail(this.emailExpediteurEffectif);
      },
      error: (err) => {
        console.error('Erreur chargement config email:', err);
        this.emailExpediteurEffectif = this.emailExpediteur;
        this.updateTypeClientFromEmail(this.emailExpediteurEffectif);
      }
    });
  }

  updateTypeClientFromEmail(email: string) {
    if (!email) return;
    const domaine = email.split('@')[1]?.toLowerCase();
    this.typeClientDetecte = (domaine === 'gmail.com' || domaine === 'googlemail.com') ? 'gmail' : 'outlook';
  }

  openBrouillonConfirmPopup() {
    if (!this.selectedModeleId) {
      this.message = '❌ Veuillez sélectionner un modèle';
      this.messageType = 'error';
      return;
    }
    if (!this.excelFile) {
      this.message = '❌ Veuillez uploader le fichier Excel';
      this.messageType = 'error';
      return;
    }
    if (!this.pdfFile) {
      this.message = '❌ Veuillez uploader le fichier PDF';
      this.messageType = 'error';
      return;
    }
    this.loadExpediteurEffectif();
    this.showBrouillonConfirmPopup = true;
  }

  closeBrouillonConfirmPopup() {
    this.showBrouillonConfirmPopup = false;
    this.message = '📦 EML générés mais non envoyés. Vous pourrez les envoyer plus tard.';
    this.messageType = 'success';
    setTimeout(() => this.message = '', 3000);
  }

  confirmBrouillonSend() {
    this.showBrouillonConfirmPopup = false;
    
    if (!this.currentSessionId) {
      this.message = '❌ Aucune session d\'envoi trouvée';
      this.messageType = 'error';
      setTimeout(() => this.message = '', 3000);
      return;
    }

    const emailAUtiliser = this.emailExpediteurEffectif || this.emailExpediteur;
    const ccEmail = this.savedCcEmail || '';

    this.isGeneratingEml = true;
    this.message = `⏳ Envoi des brouillons en cours...`;
    this.messageType = 'success';

    this.emailService.envoyerBrouillons(
      this.currentSessionId,
      emailAUtiliser,
      ccEmail
    ).subscribe({
      next: (res: any) => {
        this.isGeneratingEml = false;
        if (res.success && res.brouillonsCrees > 0) {
          this.addActivity('✉️ Envoi brouillons', `${res.brouillonsCrees} brouillon(s) envoyé(s)`, 'success');
          this.message = `✅ ${res.brouillonsCrees} brouillon(s) envoyé(s) dans votre boîte email !`;
          this.messageType = 'success';
          this.currentSessionId = null;
          this.statistiquesService.getStats().subscribe();
        } else {
          this.message = `❌ Erreur: ${res.error || res.message}`;
          this.messageType = 'error';
        }
        setTimeout(() => this.message = '', 5000);
      },
      error: (err) => {
        this.isGeneratingEml = false;
        this.message = `❌ Erreur: ${err.error?.error || err.message}`;
        this.messageType = 'error';
        setTimeout(() => this.message = '', 5000);
      }
    });
  }

  genererEtStocker() {
    const emailAUtiliser = this.emailExpediteurEffectif || this.emailExpediteur;
    if (!emailAUtiliser) {
      this.message = '❌ Email expéditeur non disponible';
      this.messageType = 'error';
      return;
    }

    this.isGeneratingEml = true;
    this.showEmlResult = false;
    this.message = `⏳ Génération des bulletins en cours...`;
    this.messageType = 'success';

    const ccEmail = this.savedCcEmail || '';

    this.emailService.genererEmlEtStocker(
      this.selectedModeleId!,
      emailAUtiliser,
      this.selectedDepartement,
      this.selectedService,
      ccEmail
    ).subscribe({
      next: (res: any) => {
        this.isGeneratingEml = false;
        this.emlGenerationResult = res;
        this.showEmlResult = true;
        if (res.success && res.brouillonsCrees > 0) {
          this.message = `✅ ${res.brouillonsCrees} brouillon(s) créé(s) avec CC: ${res.cc || 'aucun'}!`;
          this.messageType = 'success';
        } else {
          this.message = `❌ Erreur: ${res.error || res.message}`;
          this.messageType = 'error';
        }
        setTimeout(() => this.message = '', 6000);
      },
      error: (err) => {
        this.isGeneratingEml = false;
        this.message = `❌ Erreur: ${err.error?.error || err.message}`;
        this.messageType = 'error';
        setTimeout(() => this.message = '', 5000);
      }
    });
  }

  closeEmlResult() {
    this.showEmlResult = false;
  }

  loadModeles(keepSelection: boolean = false) {
    const previousSelection = keepSelection ? this.selectedModeleId : null;
    this.modeleService.getAll().subscribe({
      next: (data) => {
        this.modeles = data
          .map(m => {
            const rawId = m.id ?? m.Id ?? m.ID;
            const cleanId = Number(String(rawId).trim());
            const zoneRaw = m.zone ?? m.Zone;
            return {
              id: cleanId,
              libelle: m.libelle ?? m.Libelle ?? m.Libellé,
              zone: zoneRaw
            };
          })
          .filter(m => !isNaN(m.id));

        this.selectedModeleId = null;
        this.modelePdfUrl = null;
        
        if (previousSelection && this.modeles.find(m => m.id === previousSelection)) {
          this.selectedModeleId = previousSelection;
          this.loadModeleMiniature();
        }
      },
      error: (err) => console.error("❌ MODELE ERROR", err)
    });
  }

  onExcelSelected(event: any) {
    this.excelFile = event.target.files[0];
    this.excelName = this.excelFile?.name;
    this.resetFilters();
    this.showFilters = false;
  }

  onPdfSelected(event: any) {
    this.pdfFile = event.target.files[0];
    this.pdfName = this.pdfFile?.name;
  }

  uploadFiles() {
    if (!this.excelFile || !this.pdfFile) {
      this.message = "❌ Veuillez sélectionner les deux fichiers";
      this.messageType = 'error';
      return;
    }

    const savedModeleId = this.selectedModeleId;
    this.loading = true;
    this.message = "📤 Upload des fichiers en cours...";
    this.messageType = 'success';
    
    this.bulletinService.uploadFiles(this.excelFile, this.pdfFile).subscribe({
      next: (res: any) => {
        this.loadDepartements();
        this.showFilters = true;
        this.selectedDepartement = '';
        this.selectedService = '';
        this.services = [];
        
        this.modeleService.getAll().subscribe({
          next: (data) => {
            this.modeles = data.map(m => ({
              id: m.id ?? m.Id,
              libelle: m.libelle ?? m.Libelle,
              zone: m.zone ?? m.Zone
            })).filter(m => m.id);
            if (savedModeleId) {
              const found = this.modeles.find(m => m.id === savedModeleId);
              this.selectedModeleId = found ? savedModeleId : (this.modeles[0]?.id || null);
            } else if (this.modeles.length > 0) {
              this.selectedModeleId = this.modeles[0].id;
            }
          },
          error: (err) => console.error("❌ MODELE ERROR", err)
        });
        
        this.loading = false;
        this.message = `✔ Upload réussi ! ${res.count} employés chargés`;
        this.messageType = 'success';
        setTimeout(() => this.message = "", 5000);
      },
      error: () => {
        this.loading = false;
        this.message = "❌ Erreur lors de l'upload";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 5000);
      }
    });
  }

  loadDepartements() {
    this.bulletinService.getDepartements().subscribe({
      next: (data) => { this.departements = data; },
      error: (err) => console.error("❌ Erreur chargement départements", err)
    });
  }

  onDepartementChange() {
    this.selectedService = '';
    if (this.selectedDepartement) {
      this.bulletinService.getServices(this.selectedDepartement).subscribe({
        next: (data) => { this.services = data; },
        error: (err) => console.error("❌ Erreur chargement services", err)
      });
    } else {
      this.services = [];
    }
  }

  resetFilters() {
    this.selectedDepartement = '';
    this.selectedService = '';
    this.services = [];
  }

  testDetection() {
    if (!this.pdfFile || !this.selectedModeleId) {
      this.message = "❌ Veuillez uploader un PDF et sélectionner un modèle";
      this.messageType = 'error';
      return;
    }

    const modele = this.modeles.find(m => m.id === this.selectedModeleId);
    if (!modele || !modele.zone) {
      this.message = "❌ Zone du modèle invalide ou manquante";
      this.messageType = 'error';
      return;
    }

    this.loading = true;
    this.showDetectionResults = false;

    let zone;
    try {
      zone = typeof modele.zone === 'string' ? JSON.parse(modele.zone) : modele.zone;
    } catch (e) {
      this.message = "❌ Zone du modèle invalide (format JSON incorrect)";
      this.messageType = 'error';
      this.loading = false;
      return;
    }

    this.bulletinService.processZoneAllPages(this.pdfFile, zone).subscribe({
      next: (res: any) => {
        this.detectionResults = res;
        this.showDetectionResults = true;
        this.loading = false;
        const detectedCount = res.detected || res.matricules?.filter((m: any) => m).length || 0;
        this.message = `✅ Détection terminée: ${detectedCount}/${res.total} matricules trouvés`;
        this.messageType = 'success';
        setTimeout(() => this.message = "", 5000);
      },
      error: () => {
        this.loading = false;
        this.message = "❌ Erreur lors de la détection";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 5000);
      }
    });
  }

  onSendClick() {
    if (!this.selectedModeleId || isNaN(this.selectedModeleId)) {
      this.message = "❌ Modèle invalide détecté";
      this.messageType = 'error';
      return;
    }
    if (!this.excelFile || !this.pdfFile) {
      this.message = "❌ Veuillez d'abord uploader les deux fichiers";
      this.messageType = 'error';
      return;
    }
    this.sendAll();
  }

  sendAll() {
    this.loading = true;
    this.bulletinService.sendAll(this.selectedModeleId!, this.selectedDepartement, this.selectedService).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res.total === 0
          ? `⚠️ Aucun employé ne correspond aux filtres sélectionnés`
          : `✔ Emails envoyés ! (${res.success} succès, ${res.failed} échecs)`;
        this.messageType = res.total === 0 ? 'error' : 'success';
        this.detectionResults = res;
        this.showDetectionResults = true;
        setTimeout(() => this.message = "", 5000);
      },
      error: () => {
        this.loading = false;
        this.message = "❌ Erreur lors de l'envoi";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 5000);
      }
    });
  }

  send(matricule: string) {
    this.bulletinService.sendByMatricule(matricule).subscribe({
      next: () => {
        this.message = "✔ Email envoyé avec succès à " + matricule;
        this.messageType = "success";
        setTimeout(() => this.message = "", 3000);
      },
      error: () => {
        this.message = "❌ Erreur envoi email";
        this.messageType = "error";
        setTimeout(() => this.message = "", 3000);
      }
    });
  }

  previewAdmin() {
    const matricule = prompt("Entrer matricule à visualiser");
    if (!matricule) return;
    this.bulletinService.getBulletinAdmin(matricule).subscribe({
      next: (pdf: Blob) => window.open(window.URL.createObjectURL(pdf)),
      error: () => alert("Bulletin introuvable")
    });
  }

  download(matricule: string) {
    this.bulletinService.downloadBulletin(matricule).subscribe({
      next: (pdf: Blob) => window.open(window.URL.createObjectURL(pdf)),
      error: () => alert("Bulletin introuvable")
    });
  }

  loadUsers() {
    this.bulletinService.getUsers().subscribe({
      next: (data) => { this.users = data; this.showUsersPopup = true; },
      error: () => alert("Erreur chargement utilisateurs")
    });
  }

  previewAll() {
    this.bulletinService.getUsers().subscribe({
      next: (data) => { this.users = data; this.showTable = true; },
      error: () => alert("Erreur chargement utilisateurs")
    });
  }

  get paginatedUsers() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }

  nextPage() { if (this.currentPage * this.pageSize < this.users.length) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  closeUsersPopup() { this.showUsersPopup = false; }
  closeTable() { this.showTable = false; }
  closeDetectionResults() { this.showDetectionResults = false; }

  getSelectedModeleLibelle(): string {
    if (!this.selectedModeleId) return '';
    return this.modeles.find(m => m.id === this.selectedModeleId)?.libelle || '';
  }

  getSelectedModeleZone(): any {
    if (!this.selectedModeleId) return null;
    const modele = this.modeles.find(m => m.id === this.selectedModeleId);
    if (modele?.zone) {
      try {
        return typeof modele.zone === 'string' ? JSON.parse(modele.zone) : modele.zone;
      } catch (e) { return null; }
    }
    return null;
  }

  openConfirmPopup() { this.showConfirmPopup = true; }
  closeConfirmPopup() { this.showConfirmPopup = false; }
  confirmSend() { this.showConfirmPopup = false; this.onSendClick(); }

  cancelSend() {
    this.showConfirmPopup = false;
    this.showDetectionResults = true;
    this.previewBulletinsToSend();
  }

  previewBulletinsToSend() {
    this.loading = true;
    this.bulletinService.sendAll(this.selectedModeleId!, this.selectedDepartement, this.selectedService).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.detectionResults = { ...res, isPreview: true };
        this.showDetectionResults = true;
      },
      error: () => {
        this.loading = false;
        this.message = "❌ Erreur lors de l'aperçu";
        this.messageType = 'error';
      }
    });
  }

  preview() {
    if (!this.pdfFile || !this.selectedModeleId) {
      this.message = "❌ Veuillez d'abord uploader les fichiers et sélectionner un modèle";
      this.messageType = 'error';
      return;
    }
    this.loading = true;
    this.bulletinService.previewBulletins(this.selectedModeleId!, this.selectedDepartement, this.selectedService).subscribe({
      next: (res: any) => {
        if (!res.details?.length || !res.details[0].matricule) {
          this.loading = false;
          this.message = "⚠️ Aucun employé détecté pour l'aperçu";
          this.messageType = 'error';
          setTimeout(() => this.message = "", 3000);
          return;
        }
        const employe = res.details[0];
        window.open(`http://localhost:5230/api/Bulletins/view/${this.selectedModeleId}/${employe.matricule}`, '_blank');
        this.loading = false;
        this.message = `📄 Visualisation: ${employe.prenom} ${employe.nom}`;
        this.messageType = 'success';
        setTimeout(() => this.message = "", 3000);
      },
      error: () => {
        this.loading = false;
        this.message = "❌ Erreur lors de l'aperçu";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 3000);
      }
    });
  }

  previewEmploye(matricule: string, nom: string, prenom: string) {
    if (!matricule) { this.message = "❌ Matricule non disponible"; this.messageType = 'error'; return; }
    this.loading = true;
    this.bulletinService.downloadBulletin(matricule).subscribe({
      next: (pdf: Blob) => {
        window.open(window.URL.createObjectURL(pdf));
        this.loading = false;
        this.message = `📄 Aperçu du bulletin de ${prenom} ${nom}`;
        this.messageType = 'success';
        setTimeout(() => this.message = "", 3000);
      },
      error: () => {
        this.loading = false;
        this.message = "❌ Impossible d'afficher l'aperçu";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 3000);
      }
    });
  }

  closePreviewModal() { this.showPreviewModal = false; this.previewPdfUrl = null; }

  sendCurrentBulletin() {
    if (this.previewEmployeMatricule) {
      if (confirm(`Envoyer le bulletin à ${this.previewEmployePrenom} ${this.previewEmployeNom} ?`)) {
        this.bulletinService.sendByMatricule(this.previewEmployeMatricule).subscribe({
          next: () => {
            this.message = `✅ Email envoyé à ${this.previewEmployePrenom} ${this.previewEmployeNom}`;
            this.messageType = 'success';
            setTimeout(() => this.message = "", 3000);
            this.closePreviewModal();
          },
          error: () => { this.message = "❌ Erreur lors de l'envoi"; this.messageType = 'error'; }
        });
      }
    }
  }

  downloadCurrentBulletin() {
    if (this.previewEmployeMatricule) {
      this.bulletinService.downloadBulletin(this.previewEmployeMatricule).subscribe({
        next: (pdf: Blob) => {
          const url = window.URL.createObjectURL(pdf);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bulletin_${this.previewEmployeMatricule}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => { this.message = "❌ Erreur lors du téléchargement"; this.messageType = 'error'; }
      });
    }
  }

  showEmailForm() { this.showEmailInput = !this.showEmailInput; }

  testConfig() {
    this.emailService.testConfiguration().subscribe({
      next: (res) => {
        alert(`Configuration:\n- Python: ${res.pythonInstalle ? '✅' : '❌'}\n- Script: ${res.scriptPythonExiste ? '✅' : '❌'}\n- Credentials: ${res.credentialsExiste ? '✅' : '❌'}`);
      },
      error: (err) => alert(`Erreur: ${err.message}`)
    });
  }

  envoyerTousLesBrouillonsStockes(): void {
    if (this.isEnvoiBrouillonsEnCours) return;
    const emailAUtiliser = this.emailExpediteurEffectif || this.emailExpediteur;
    if (!emailAUtiliser) {
      this.message = '❌ Aucun email expéditeur configuré';
      this.messageType = 'error';
      setTimeout(() => this.message = '', 3000);
      return;
    }
    if (!confirm(`Envoyer TOUS les brouillons stockés ?\nExpéditeur: ${emailAUtiliser}`)) return;

    this.isEnvoiBrouillonsEnCours = true;
    this.message = `🚀 Envoi des brouillons en cours...`;
    this.messageType = 'success';

    this.emailService.envoyerTousLesBrouillons().subscribe({
      next: (resultat) => {
        this.isEnvoiBrouillonsEnCours = false;
        this.envoiBrouillonsResultat = resultat;
        this.message = resultat.success
          ? `✅ ${resultat.message} (${resultat.envoyes} envoyés, ${resultat.echecs} échecs)`
          : `❌ ${resultat.message}`;
        this.messageType = resultat.success ? 'success' : 'error';
        setTimeout(() => this.message = '', 5000);
        this.openEnvoiResultModal();
      },
      error: (error) => {
        this.isEnvoiBrouillonsEnCours = false;
        this.message = `❌ Erreur: ${error.error?.message || error.message}`;
        this.messageType = 'error';
        setTimeout(() => this.message = '', 5000);
      }
    });
  }

  openEnvoiResultModal() { this.showEnvoiResultModal = true; }
  closeEnvoiResultModal() { this.showEnvoiResultModal = false; this.envoiBrouillonsResultat = null; }

  detectWithDetails() {
    this.bulletinService.detectWithDetails(this.pdfFile, this.selectedModeleId!).subscribe({
      next: (res: any) => {
        if (res.employees?.length > 0) {
          this.employeeList = res.employees.map((emp: any) => ({
            matricule: emp.matricule || emp.Matricule,
            nom: emp.nom || emp.Nom,
            prenom: emp.prenom || emp.Prenom,
            email: emp.email || emp.Email,
            departement: emp.departement || emp.Departement || '',
            service: emp.service || emp.Service || '',
            page: emp.page
          }));
          this.filteredEmployeeList = [...this.employeeList];
          this.employeeDepts = [...new Set(this.employeeList.map(e => e.departement).filter(d => d))];
          this.employeeServices = [...new Set(this.employeeList.map(e => e.service).filter(s => s))];
          this.updateEmployeePagination();
          this.loading = false;
          this.showEmployeeModal = true;
        } else {
          this.loading = false;
          this.message = "⚠️ Aucun employé détecté";
          this.messageType = 'error';
          setTimeout(() => this.message = "", 5000);
        }
      },
      error: () => {
        this.loading = false;
        this.message = "❌ Erreur lors de la détection";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 5000);
      }
    });
  }

  previewBulletin(employee: any) {
    this.previewEmployee = employee;
    this.showPdfPreview = true;
    this.bulletinService.previewBulletin(this.selectedModeleId!, employee.matricule).subscribe({
      next: (pdf: Blob) => {
        this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(pdf));
      },
      error: () => {
        this.message = "❌ Impossible de charger le bulletin";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 3000);
        this.showPdfPreview = false;
      }
    });
  }

  sendIndividual(employee: any) { this.sendEmployee = employee; this.showSendConfirm = true; }
  closeSendConfirm() { this.showSendConfirm = false; this.sendEmployee = null; }

  confirmSendIndividual() {
    this.showSendConfirm = false;
    this.loading = true;
    this.bulletinService.sendByMatricule(this.sendEmployee.matricule).subscribe({
      next: () => {
        this.loading = false;
        this.message = `✅ Email envoyé à ${this.sendEmployee.prenom} ${this.sendEmployee.nom}`;
        this.messageType = 'success';
        setTimeout(() => this.message = "", 3000);
      },
      error: () => {
        this.loading = false;
        this.message = `❌ Erreur envoi`;
        this.messageType = 'error';
        setTimeout(() => this.message = "", 3000);
      }
    });
  }

  stockageBrouillons() { this.closeResultsModal(); this.openBrouillonConfirmPopup(); }

  closeResultsModal() {
    this.showResultsModal = false;
    this.filterDepartement = '';
    this.filterService = '';
    this.currentEmployeesPage = 1;
  }

  applyFilters() {
    this.filteredEmployees = this.detectedEmployees.filter((emp: any) =>
      (!this.filterDepartement || emp.departement === this.filterDepartement) &&
      (!this.filterService || emp.service === this.filterService)
    );
    this.currentEmployeesPage = 1;
  }

  clearFilters() { this.filterDepartement = ''; this.filterService = ''; this.applyFilters(); }

  get paginatedEmployees() {
    const start = (this.currentEmployeesPage - 1) * this.employeesPageSize;
    return this.filteredEmployees.slice(start, start + this.employeesPageSize);
  }

  get totalEmployeesPages(): number {
    return Math.ceil(this.filteredEmployees.length / this.employeesPageSize);
  }

  prevEmployeesPage() { if (this.currentEmployeesPage > 1) this.currentEmployeesPage--; }
  nextEmployeesPage() { if (this.currentEmployeesPage < this.totalEmployeesPages) this.currentEmployeesPage++; }

  closePdfPreview() {
    this.showPdfPreview = false;
    if (this.pdfPreviewUrl) URL.revokeObjectURL(this.pdfPreviewUrl as string);
    this.pdfPreviewUrl = null;
    this.previewEmployee = null;
  }

  uploadAndOpenModal() {
    if (!this.excelFile || !this.pdfFile) {
      this.message = "❌ Veuillez sélectionner les deux fichiers";
      this.messageType = 'error';
      return;
    }
    if (!this.selectedModeleId) {
      this.message = "❌ Veuillez sélectionner un modèle";
      this.messageType = 'error';
      return;
    }

    this.loading = true;
    this.message = "📤 Upload et détection en cours...";
    this.messageType = 'success';

    this.bulletinService.uploadFiles(this.excelFile, this.pdfFile).subscribe({
      next: (res: any) => {
        if (res.users?.length > 0) {
          this.employeeList = res.users.map((user: any) => ({
            matricule: user.Matricule || user.matricule,
            nom: user.Nom || user.nom,
            prenom: user.Prenom || user.prenom,
            email: user.Email || user.email,
            departement: user.Departement || user.departement || '',
            service: user.Service || user.service || '',
            password: user.Password || user.password || ''
          }));
          this.filteredEmployeeList = [...this.employeeList];
          this.employeeDepts = [...new Set(this.employeeList.map(e => e.departement).filter(d => d))];
          this.employeeServices = [...new Set(this.employeeList.map(e => e.service).filter(s => s))];
          this.updateEmployeePagination();
          this.loading = false;
          this.showEmployeeModal = true;
        } else {
          this.loading = false;
          this.message = "⚠️ Aucun employé trouvé dans le fichier Excel";
          this.messageType = 'error';
          setTimeout(() => this.message = "", 5000);
        }
      },
      error: () => {
        this.loading = false;
        this.message = "❌ Erreur lors de l'upload";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 5000);
      }
    });
  }

  updateEmployeePagination() {
    this.employeeTotalPages = Math.ceil(this.filteredEmployeeList.length / this.employeePageSize);
  }

  get paginatedEmployeeList() {
    const start = (this.currentEmployeePage - 1) * this.employeePageSize;
    return this.filteredEmployeeList.slice(start, start + this.employeePageSize);
  }

  applyEmployeeFilters() {
    let filtered = [...this.employeeList];
    if (this.employeeFilterDept) filtered = filtered.filter(e => e.departement === this.employeeFilterDept);
    if (this.employeeFilterService) filtered = filtered.filter(e => e.service === this.employeeFilterService);
    this.filteredEmployeeList = filtered;
    this.currentEmployeePage = 1;
    this.updateEmployeePagination();
  }

  clearEmployeeFilters() { this.employeeFilterDept = ''; this.employeeFilterService = ''; this.applyEmployeeFilters(); }
  prevEmployeePage() { if (this.currentEmployeePage > 1) this.currentEmployeePage--; }
  nextEmployeePage() { if (this.currentEmployeePage < this.employeeTotalPages) this.currentEmployeePage++; }

  closeEmployeeModal() { this.showEmployeeModal = false; if (this.showEmlResult) this.showEmlResult = false; }

  previewEmployeeBulletin(employee: any) {
    if (!employee.matricule || !this.selectedModeleId) {
      this.message = "❌ Données manquantes pour l'aperçu";
      this.messageType = 'error';
      return;
    }
    this.loading = true;
    this.bulletinService.previewBulletin(this.selectedModeleId, employee.matricule).subscribe({
      next: (pdf: Blob) => {
        window.open(window.URL.createObjectURL(pdf), '_blank');
        this.loading = false;
        this.message = `📄 Aperçu du bulletin de ${employee.prenom} ${employee.nom}`;
        this.messageType = 'success';
        setTimeout(() => this.message = "", 3000);
      },
      error: () => {
        this.loading = false;
        this.message = `❌ Impossible d'afficher l'aperçu`;
        this.messageType = 'error';
        setTimeout(() => this.message = "", 3000);
      }
    });
  }

  stockageBrouillonsAvecFiltres() {
    const departement = this.employeeFilterDept || '';
    const service = this.employeeFilterService || '';
    const totalEmployes = this.filteredEmployeeList.length;
    
    if (totalEmployes === 0) {
      this.message = '❌ Aucun employé ne correspond aux filtres sélectionnés';
      this.messageType = 'error';
      setTimeout(() => this.message = '', 3000);
      return;
    }

    const emailAUtiliser = this.emailExpediteurEffectif || this.emailExpediteur;
    if (!emailAUtiliser) {
      this.message = '❌ Email expéditeur non disponible';
      this.messageType = 'error';
      return;
    }

    const ccEmail = this.savedCcEmail || '';
    this.isGeneratingEml = true;
    this.message = `⏳ Génération des EML pour ${totalEmployes} employé(s)...`;
    this.messageType = 'success';

    this.emailService.genererEml(this.selectedModeleId!, emailAUtiliser, departement, service, ccEmail).subscribe({
      next: (res: any) => {
        this.isGeneratingEml = false;
        if (res.success && res.emlGeneres > 0) {
          this.currentSessionId = res.sessionId;
          this.stockageConfirmData = { departement: departement || 'Tous', service: service || 'Tous', totalEmployes, emailExpediteur: emailAUtiliser };
          this.addActivity('📦 Stockage brouillons', `${res.emlGeneres} EML généré(s)`, 'success');
          this.showBrouillonConfirmPopup = true;
          this.message = `✅ ${res.emlGeneres} EML générés avec succès !`;
          this.messageType = 'success';
          this.statistiquesService.getStats().subscribe();
        } else {
          this.message = `❌ Erreur: ${res.error || res.message}`;
          this.messageType = 'error';
        }
        setTimeout(() => this.message = '', 5000);
      },
      error: (err) => {
        this.isGeneratingEml = false;
        this.message = `❌ Erreur: ${err.error?.error || err.message}`;
        this.messageType = 'error';
        setTimeout(() => this.message = '', 5000);
      }
    });
  }

  addActivity(title: string, description: string, type: 'success' | 'info' | 'warning') {
    let activities = [];
    const stored = localStorage.getItem('recentActivities');
    if (stored) {
      try { activities = JSON.parse(stored); } catch(e) {}
    }
    activities.unshift({ title, description, date: new Date().toISOString(), type });
    if (activities.length > 20) activities = activities.slice(0, 20);
    localStorage.setItem('recentActivities', JSON.stringify(activities));
  }

  onModeleChange(event: any) {
    const parsed = Number(event.target.value);
    if (isNaN(parsed) || parsed === 0) {
      this.selectedModeleId = null;
      this.modelePdfUrl = null;
      return;
    }
    this.selectedModeleId = parsed;
    this.modelePdfUrl = null;
    this.loadModeleMiniature();
  }

  loadModeleMiniature() {
    if (!this.selectedModeleId) { this.modelePdfUrl = null; return; }
    this.modeleService.getPdfFile(this.selectedModeleId).subscribe({
      next: (pdfBlob: Blob) => {
        const url = URL.createObjectURL(pdfBlob);
        this.modelePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      },
      error: () => { this.modelePdfUrl = null; }
    });
  }

  // =========================================================
  // APERÇU MODÈLE AVEC ZONE — LOGIQUE CORRIGÉE
  // =========================================================

  /**
   * Ouvre la modale d'aperçu et charge la zone depuis l'API.
   * La zone est stockée en pixels relatifs à overlayWidth/overlayHeight
   * (dimensions de l'image canvas utilisée lors de la définition de la zone).
   * On recalcule ensuite les coordonnées en fonction du conteneur iframe réel.
   */
  openModelePreviewModal() {
  if (!this.modelePdfUrl || !this.selectedModeleId) return;

  // Réinitialise l’affichage
  this.modelePreviewUrl = this.modelePdfUrl;
  this.modelePreviewName = this.getSelectedModeleLibelle();
  this.modelePreviewWithZone = false;
  this.modelePreviewZone = null;
  this.showModelePreviewModal = true;
  this.resetZoneCoords();

  // Charge l’offset déjà sauvegardé pour ce modèle (s’il existe)
  const saved = localStorage.getItem(`zoneOffset_${this.selectedModeleId}`);
  if (saved) {
    try {
      const off = JSON.parse(saved);
      this.zoneOffsets.set(this.selectedModeleId, off);
      console.log(`Offset chargé pour le modèle ${this.selectedModeleId} :`, off);
    } catch (e) {}
  }

  // Récupère la zone depuis l’API
  fetch(`http://localhost:5230/api/ModelePdf/with-zone/${this.selectedModeleId}`)
    .then(r => r.json())
    .then(data => {
      const zone = data.zone ?? data.Zone ?? data;
      if (!zone) { console.warn('Aucune zone trouvée'); return; }

      const x               = zone.X  ?? zone.x  ?? 0;
      const y               = zone.Y  ?? zone.y  ?? 0;
      const width           = zone.Width  ?? zone.width  ?? 0;
      const height          = zone.Height ?? zone.height ?? 0;
      const overlayWidth    = zone.OverlayWidth  ?? zone.overlayWidth  ?? this.PDF_A4_WIDTH_PX;
      const overlayHeight   = zone.OverlayHeight ?? zone.overlayHeight ?? this.PDF_A4_HEIGHT_PX;
      const isRatio = x <= 1 && y <= 1 && width <= 1 && height <= 1;

      this.modelePreviewZone = {
        x:             isRatio ? x * overlayWidth  : x,
        y:             isRatio ? y * overlayHeight : y,
        width:         isRatio ? width * overlayWidth  : width,
        height:        isRatio ? height * overlayHeight : height,
        overlayWidth,
        overlayHeight
      };

      this.modelePreviewWithZone = true;
      console.log('Zone chargée:', this.modelePreviewZone);

      // Lance l’observateur de redimensionnement
      setTimeout(() => this.attachResizeObserverAndCalculate(), 600);
    })
    .catch(err => {
      console.error('Erreur chargement zone:', err);
      this.modelePreviewWithZone = false;
    });
}


  /**
 * Décale la zone overlay en temps réel (appelable depuis la console).
 * @param dx décalage horizontal en pixels
 * @param dy décalage vertical en pixels
 */
shiftZone(dx: number, dy: number) {
  if (this.selectedModeleId) {
    let offset = this.zoneOffsets.get(this.selectedModeleId) || { x: 0, y: 0 };
    offset.x += dx;
    offset.y += dy;
    this.zoneOffsets.set(this.selectedModeleId, offset);
    // Sauvegarde dans localStorage
    localStorage.setItem(`zoneOffset_${this.selectedModeleId}`, JSON.stringify(offset));
    console.log(`Offset sauvegardé pour le modèle ${this.selectedModeleId} :`, offset);
  } else {
    this.manualOffsetX += dx;
    this.manualOffsetY += dy;
  }
  this.updateModelePreviewContainerDimensions(); // recalcule l’affichage
}




  closeModelePreviewModal() {
    this.showModelePreviewModal = false;
    this.modelePreviewUrl = null;
    this.modelePreviewZone = null;
    this.modelePreviewWithZone = false;
    this.modelePreviewContainerWidth = 0;
    this.modelePreviewContainerHeight = 0;
    this.resetZoneCoords();
    this.disconnectResizeObserver();
  }

  private resetZoneCoords() {
    this.previewZoneLeft = 0;
    this.previewZoneTop = 0;
    this.previewZoneWidth = 0;
    this.previewZoneHeight = 0;
  }

  /**
   * Attache un ResizeObserver sur le conteneur iframe et déclenche le calcul.
   * Cette méthode est appelée après l'ouverture de la modale une fois que
   * le DOM est disponible.
   */
  private attachResizeObserverAndCalculate() {
    this.disconnectResizeObserver();

    // Trouver le conteneur via ViewChild (peut ne pas être disponible si la modale
    // vient d'être ouverte) ou via querySelector en fallback
    const el = this.previewContainer?.nativeElement
      ?? document.querySelector('.preview-pdf-container');

    if (!el) {
      setTimeout(() => this.attachResizeObserverAndCalculate(), 200);
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.calculateZoneOverlay(el);
    });
    this.resizeObserver.observe(el);
    this.calculateZoneOverlay(el);
  }

 
  private calculateZoneOverlay(containerEl: HTMLElement) {
  if (!this.modelePreviewZone || !this.modelePreviewWithZone) return;

  const containerW = containerEl.clientWidth;
  const containerH = containerEl.clientHeight;
  if (containerW === 0 || containerH === 0) {
    setTimeout(() => this.calculateZoneOverlay(containerEl), 200);
    return;
  }

  this.modelePreviewContainerWidth  = containerW;
  this.modelePreviewContainerHeight = containerH;

  const zone = this.modelePreviewZone;
  const overlayW = zone.overlayWidth;
  // Largeur réelle du PDF affiché (mesurée ou défaut A4)
  let pdfDisplayW = this.getActualPdfWidth();
  if (!pdfDisplayW) pdfDisplayW = Math.min(containerW, this.PDF_A4_WIDTH_PX);

  const marginLeft = (containerW - pdfDisplayW) / 2;
  const scale = pdfDisplayW / overlayW;   // échelle uniforme (largeur)

  const offset = this.getCurrentZoneOffset();

  const FIX_CORRECTION_X = 80;   // pixels vers la droite (testez 5, 10, 15)

this.previewZoneLeft   = marginLeft + offset.x + zone.x * scale + FIX_CORRECTION_X;
  this.previewZoneTop    = offset.y + zone.y * scale;
  this.previewZoneWidth  = Math.max(zone.width  * scale, 20);
  this.previewZoneHeight = Math.max(zone.height * scale, 20);

  this.cdr.detectChanges();
}



private getCurrentZoneOffset(): { x: number; y: number } {
  if (this.selectedModeleId && this.zoneOffsets.has(this.selectedModeleId)) {
    return this.zoneOffsets.get(this.selectedModeleId)!;
  }
  // Fallback sur les offsets globaux (peuvent être nuls)
  return { x: this.manualOffsetX, y: this.manualOffsetY };
}

private getActualPdfWidth(): number | null {
  const iframe = document.querySelector('.preview-modele-iframe') as HTMLIFrameElement;
  if (!iframe || !iframe.contentDocument) return null;
  const doc = iframe.contentDocument;
  // Essayer différents sélecteurs connus (PDF.js, viewer natif)
  let pageEl = doc.querySelector('.page') as HTMLElement;
  if (!pageEl) pageEl = doc.querySelector('[data-page-number]') as HTMLElement;
  if (!pageEl) pageEl = doc.querySelector('.textLayer')?.parentElement as HTMLElement;
  if (!pageEl) pageEl = doc.body.firstElementChild as HTMLElement;
  if (pageEl) {
    // On prend la largeur réelle de l’élément (qui est la largeur de la page)
    return pageEl.clientWidth;
  }
  return null;
}


  /** Appelé par (load) sur l'iframe de la modale — recalcule après rendu */
  onModelePreviewIframeLoad() {
    const el = this.previewContainer?.nativeElement
      ?? document.querySelector('.preview-pdf-container');
    if (el) {
      setTimeout(() => this.calculateZoneOverlay(el), 400);
      setTimeout(() => this.calculateZoneOverlay(el), 900);
    }
  }

  // Méthode conservée pour compatibilité (appelée depuis le template si besoin)
  updateModelePreviewContainerDimensions() {
    const el = this.previewContainer?.nativeElement;
    if (el) this.calculateZoneOverlay(el);
  }
}