import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BulletinService } from '../../services/bulletin.service';
import { ModelePdfService } from '../../services/modele-pdf.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { StatsRowComponent } from '../stats-row/stats-row.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';    
import { LoginService } from '../../services/login.service';
import { EmailService, EmlGenerationResult } from '../../services/email.service';
import { ConfigurationService } from '../../services/configuration.service';

@Component({
    selector: 'app-upload',
    imports: [FormsModule, CommonModule],
    templateUrl: './upload.component.html',
    styleUrl: './upload.component.css'
})
export class UploadComponent implements OnInit {

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




  // Ajoutez ces variables dans la classe
  showPreviewModal: boolean = false;
  previewPdfUrl: SafeResourceUrl | null = null;
  previewEmployeNom: string = '';
  previewEmployePrenom: string = '';
  previewEmployeMatricule: string = '';

  // MODELES
  modeles: any[] = [];
  selectedModeleId: number | null = null;

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

   // Email expéditeur — récupéré automatiquement depuis le login
  emailExpediteur: string = '';
  typeClientDetecte: string = '';  // 'gmail' ou 'outlook'

  // Email 
showEmailInput: boolean = false;

emailExpediteurEffectif: string = '';

// EML
  isGeneratingEml      = false;
  emlGenerationResult: EmlGenerationResult | null = null;
  showEmlResult        = false;
  showBrouillonConfirmPopup = false;


  
// Variable pour l'envoi des brouillons
isEnvoiBrouillonsEnCours = false;
envoiBrouillonsResultat: any = null;


 constructor(
  private bulletinService: BulletinService,
  private modeleService: ModelePdfService,
  private sanitizer: DomSanitizer,
  private emailService: EmailService,
  private loginService: LoginService,
  private configurationService: ConfigurationService
) {}

// ================= INITIALISATION =================
 ngOnInit() {
  try {
    // Récupérer les informations depuis le service de login
    const name = this.loginService.getUsername();
    const email = this.loginService.getEmail();
    
    console.log('=== DEBUG LOGIN INFO ===');
    console.log('Username depuis service:', name);
    console.log('Email depuis service:', email);
    console.log('localStorage userEmail:', localStorage.getItem('userEmail'));
    console.log('localStorage username:', localStorage.getItem('username'));
    console.log('localStorage isLoggedIn:', localStorage.getItem('isLoggedIn'));
    console.log('========================');
    
    // Définir le nom d'affichage
    this.username = name || 'Administrateur';
    
    // Calculer les initiales pour l'avatar
    this.calculateInitials();
    
    // Récupérer l'email expéditeur
    this.emailExpediteur = email || '';
    
    if (this.emailExpediteur) {
      console.log('✅ Email expéditeur chargé avec succès:', this.emailExpediteur);
      this.detecterTypeClient();
    } else {
      console.warn('⚠️ Aucun email trouvé dans localStorage');
      console.warn('⚠️ Veuillez vous reconnecter pour définir l\'email expéditeur');
      
      // Optionnel: afficher un message à l'utilisateur
      this.message = '⚠️ Veuillez vous reconnecter pour définir l\'email expéditeur';
      this.messageType = 'error';
      setTimeout(() => this.message = '', 5000);
    }
    
    // Charger les modèles
    this.loadModeles(false);
    
  } catch (error) {
    console.error('❌ Erreur dans ngOnInit:', error);
    this.username = 'Administrateur';
    this.userInitials = 'AD';
    this.emailExpediteur = '';
  }


  if (this.emailExpediteur) {
      console.log('✅ Email expéditeur chargé avec succès:', this.emailExpediteur);
      this.detecterTypeClient();
      
      // 🔥 Charger l'email configuré
      this.loadExpediteurEffectif();
    }
}

// Méthode pour calculer les initiales
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

// Méthode pour détecter le type de client
detecterTypeClient() {
  if (!this.emailExpediteur) return;
  
  const domaine = this.emailExpediteur.split('@')[1]?.toLowerCase();
  const typeClient = (domaine === 'gmail.com' || domaine === 'googlemail.com') ? 'gmail' : 'outlook';
  
  this.typeClientDetecte = typeClient;
  
  console.log(`📧 Email chargé: ${this.emailExpediteur}`);
  console.log(`🏷️ Domaine: ${domaine}`);
  console.log(`💻 Type client détecté: ${this.typeClientDetecte}`);
}

loadExpediteurEffectif() {
  // Récupérer l'email configuré depuis le backend
  this.configurationService.getExpediteurEmail().subscribe({
    next: (res) => {
      if (res.email && res.email !== '') {
        // Utiliser l'email configuré
        this.emailExpediteurEffectif = res.email;
        console.log('📧 Email configuré trouvé:', this.emailExpediteurEffectif);
      } else {
        // Utiliser l'email de l'utilisateur connecté
        this.emailExpediteurEffectif = this.emailExpediteur;
        console.log('📧 Aucun email configuré, utilisation email connecté:', this.emailExpediteurEffectif);
      }
      
      // Mettre à jour le type client
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
  console.log(`📧 Email effectif: ${email}, Type: ${this.typeClientDetecte}`);
}



  
   // ← Ouvrir popup confirmation brouillon
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
  
  // 🔥 Charger l'email effectif avant d'ouvrir la popup
  this.loadExpediteurEffectif();
  
  this.showBrouillonConfirmPopup = true;
}

  closeBrouillonConfirmPopup() {
    this.showBrouillonConfirmPopup = false;
  }

  confirmBrouillonSend() {
    this.showBrouillonConfirmPopup = false;
    this.genererEtStocker();
  }

  // ← Action principale : générer EML + stocker dans brouillons
  genererEtStocker() {
  // Utiliser l'email effectif (configuré ou connecté)
  const emailAUtiliser = this.emailExpediteurEffectif || this.emailExpediteur;
  
  if (!emailAUtiliser) {
    this.message = '❌ Email expéditeur non disponible';
    this.messageType = 'error';
    return;
  }

  this.isGeneratingEml = true;
  this.showEmlResult   = false;
  this.message         = `⏳ Génération des bulletins en cours pour ${this.typeClientDetecte.toUpperCase()}...`;
  this.messageType     = 'success';

  this.emailService.genererEmlEtStocker(
    this.selectedModeleId!,
    emailAUtiliser,  // ← Utiliser l'email effectif
    this.selectedDepartement,
    this.selectedService
  ).subscribe({
      next: (res: EmlGenerationResult) => {
        console.log('✅ Résultat génération EML:', res);
        this.isGeneratingEml    = false;
        this.emlGenerationResult = res;
        this.showEmlResult      = true;

        if (res.success && res.brouillonsCrees > 0) {
          const client = res.typeClient === 'gmail' ? 'Gmail' : 'Outlook';
          this.message     = `✅ ${res.brouillonsCrees} brouillon(s) créé(s) dans ${client} !`;
          this.messageType = 'success';
        } else if (res.success && res.brouillonsCrees === 0) {
          this.message     = '⚠️ Aucun brouillon créé. Vérifiez les filtres.';
          this.messageType = 'error';
        } else {
          this.message     = `❌ Erreur: ${res.error || res.message || 'Vérifiez les logs'}`;
          this.messageType = 'error';
        }

        setTimeout(() => this.message = '', 6000);
      },
      error: (err) => {
        console.error('❌ Erreur génération EML:', err);
        this.isGeneratingEml = false;
        this.message     = `❌ Erreur: ${err.error?.error || err.message}`;
        this.messageType = 'error';
        setTimeout(() => this.message = '', 5000);
      }
    });
  }

  closeEmlResult() {
    this.showEmlResult = false;
  }

  // ================= CHARGER MODELES =================
  loadModeles(keepSelection: boolean = false) {
    const previousSelection = keepSelection ? this.selectedModeleId : null;
    // Charger les modèles depuis le backend et essayer de restaurer la sélection précédente si demandé
    this.modeleService.getAll().subscribe({
      next: (data) => {
        console.log("🔥 RAW MODELES =>", data);
        this.modeles = data
          .map(m => {// Nettoyer et uniformiser les données des modèles
            const rawId = m.id ?? m.Id ?? m.ID;
            const cleanId = Number(String(rawId).trim());
            const zoneRaw = m.zone ?? m.Zone;
            return {// S'assurer que l'ID est un nombre valide et que la zone est au format attendu
              id: cleanId,
              libelle: m.libelle ?? m.Libelle ?? m.Libellé,
              zone: zoneRaw
            };
          })// Filtrer les modèles sans ID valide
          .filter(m => !isNaN(m.id));

        console.log("📦 MODELES CLEAN =>", this.modeles);
// Restaurer la sélection précédente si demandé et valide, sinon sélectionner le premier modèle disponible
        if (previousSelection && this.modeles.find(m => m.id === previousSelection)) {
          this.selectedModeleId = previousSelection;
          console.log("🎯 MODELE RESTAURÉ:", this.selectedModeleId);
        } else if (this.modeles.length > 0) {
          this.selectedModeleId = this.modeles[0].id;
          console.log("🎯 DEFAULT MODELE:", this.selectedModeleId);
        }
        // Afficher la zone du modèle sélectionné pour vérification
        const selectedModele = this.modeles.find(m => m.id === this.selectedModeleId);
        console.log("📐 Zone du modèle sélectionné:", selectedModele?.zone);
      },
      error: (err) => {// En cas d'erreur, afficher un message et vider la liste des modèles
        console.error("❌ MODELE ERROR", err);
      }
    });
  }


  // ================= UPLOAD FICHIERS =================
  onExcelSelected(event: any) {//
    this.excelFile = event.target.files[0];
    this.excelName = this.excelFile?.name;
    this.resetFilters();
    this.showFilters = false;
  }

  // ================= TEST MODELE =================
  onPdfSelected(event: any) {
    this.pdfFile = event.target.files[0];
    this.pdfName = this.pdfFile?.name;
  }

  // ================= ENVOI FICHIERS =================
  uploadFiles() {
    if (!this.excelFile || !this.pdfFile) {
      this.message = "❌ Veuillez sélectionner les deux fichiers";
      this.messageType = 'error';
      return;
    }
// Garder le modèle sélectionné avant l'upload pour essayer de le restaurer après si la liste est rafraîchie
    const savedModeleId = this.selectedModeleId;
    // Lancer l'upload et afficher un message de chargement
    this.loading = true;
    this.message = "📤 Upload des fichiers en cours...";
    this.messageType = 'success';
    // Appeler le service d'upload avec les fichiers sélectionnés
    this.bulletinService.uploadFiles(this.excelFile, this.pdfFile).subscribe({
      next: (res: any) => {
        console.log("✅ UPLOAD SUCCESS", res);
        // Après un upload réussi, charger les départements pour les filtres et afficher la section de filtres
        this.loadDepartements();
        this.showFilters = true;
        this.selectedDepartement = '';
        this.selectedService = '';
        this.services = [];
        // Recharger les modèles pour voir si un nouveau modèle a été ajouté ou si les zones ont été mises à jour
        this.modeleService.getAll().subscribe({
          next: (data) => {
            this.modeles = data.map(m => ({
              id: m.id ?? m.Id,
              libelle: m.libelle ?? m.Libelle,
              zone: m.zone ?? m.Zone
            })).filter(m => m.id);
            // Après le rafraîchissement, essayer de restaurer la sélection précédente du modèle si elle existe toujours
            if (savedModeleId) {
              const found = this.modeles.find(m => m.id === savedModeleId);
              if (found) {
                this.selectedModeleId = savedModeleId;
                console.log("✅ MODELE RESTAURÉ:", found.libelle);
              } else {
                this.selectedModeleId = this.modeles[0]?.id || null;
              }
            } else if (this.modeles.length > 0) {
              this.selectedModeleId = this.modeles[0].id;
            }
          },
          error: (err) => console.error("❌ MODELE ERROR", err)
        });
        // Afficher le message de succès et masquer le message après quelques secondes
        this.loading = false;
        this.message = `✔ Upload réussi ! ${res.count} employés chargés`;
        this.messageType = 'success';
        setTimeout(() => this.message = "", 5000);
      },// En cas d'erreur, afficher un message d'erreur et masquer le message après quelques secondes
      error: (err) => {
        console.error("❌ UPLOAD ERROR", err);
        this.loading = false;
        this.message = "❌ Erreur lors de l'upload";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 5000);
      }
    });
  }

  // ================= CHARGER FILTRES =================
  loadDepartements() {// Charger les départements depuis le backend pour remplir le dropdown des filtres
    console.log("🔍 Appel de loadDepartements()");
    this.bulletinService.getDepartements().subscribe({
      next: (data) => {// Afficher les départements reçus dans la console pour vérification
        console.log("📊 Départements reçus:", data);
        this.departements = data;
      },// En cas d'erreur, afficher un message d'erreur dans la console
      error: (err) => console.error("❌ Erreur chargement départements", err)
    });
  }

// Lorsque le département change, charger les services associés pour le dropdown des filtres
// Si aucun département n'est sélectionné, vider la liste des services
  onDepartementChange() {
    console.log("📌 Département changé:", this.selectedDepartement);
    this.selectedService = '';
    if (this.selectedDepartement) {// Charger les services associés au département sélectionné
      this.bulletinService.getServices(this.selectedDepartement).subscribe({
        next: (data) => {
          this.services = data;// Afficher les services reçus dans la console pour vérification
          console.log("📊 Services chargés:", this.services);
        },// En cas d'erreur, afficher un message d'erreur dans la console
        error: (err) => console.error("❌ Erreur chargement services", err)
      });
    } else {
      this.services = [];// Si aucun département n'est sélectionné, vider la liste des services
    }
  }

  // Réinitialiser les filtres et masquer la section des filtres
  resetFilters() {
    console.log("🔄 Réinitialisation des filtres");
    this.selectedDepartement = '';// Vider la sélection de service et la liste des services
    this.selectedService = '';    // Vider la liste des services
    this.services = [];// Masquer la section des filtres
  }

  // ================= TEST DETECTION =================
  testDetection() {// Vérifier que les fichiers et le modèle sont sélectionnés avant de lancer la détection
    if (!this.pdfFile) {
      this.message = "❌ Veuillez d'abord uploader un PDF";
      this.messageType = 'error';
      return;// Vérifier que le modèle sélectionné est valide
    }

    if (!this.selectedModeleId) {// Si aucun modèle n'est sélectionné, afficher un message d'erreur
      this.message = "❌ Veuillez sélectionner un modèle";
      this.messageType = 'error';
      return;// Trouver le modèle sélectionné dans la liste des modèles chargés
    }

    const modele = this.modeles.find(m => m.id === this.selectedModeleId);
    if (!modele || !modele.zone) {// Si le modèle sélectionné n'existe pas ou n'a pas de zone définie, afficher un message d'erreur
      this.message = "❌ Zone du modèle invalide ou manquante";
      this.messageType = 'error';
      return;// Afficher la zone du modèle dans la console pour vérification avant de lancer la détection
    }

    this.loading = true;// Masquer les résultats de détection précédents avant de lancer une nouvelle détection
    this.showDetectionResults = false;// Parser la zone du modèle qui peut être au format JSON string ou déjà un objet, et afficher la zone parsée dans la console pour vérification

    let zone;// Le backend attend la zone au format JSON string, donc si c'est déjà un objet, on le convertit en string avant de l'envoyer
    try {
      zone = typeof modele.zone === 'string' ? JSON.parse(modele.zone) : modele.zone;
      console.log("📐 ZONE PARSÉE:", zone);
    } catch (e) {
      console.error("Erreur parsing zone", e);
      this.message = "❌ Zone du modèle invalide (format JSON incorrect)";
      this.messageType = 'error';
      this.loading = false;
      return;// Si la zone n'est pas au format attendu, afficher un message d'erreur
    }

    this.bulletinService.processZoneAllPages(this.pdfFile, zone).subscribe({
      // En cas de succès, afficher les résultats de la détection dans la console et dans la page, et afficher un message de succès avec le nombre de matricules détectés
      next: (res: any) => {
        console.log("✅ DETECTION RESULT", res);
        this.detectionResults = res;
        this.showDetectionResults = true;
        this.loading = false;
        
        // Calculer le nombre de matricules détectés en vérifiant d'abord s'il y a une propriété 'detected' dans la réponse, sinon compter les matricules trouvés dans la liste des matricules (en filtrant les valeurs falsy pour éviter de compter les entrées vides ou nulles)
        const detectedCount = res.detected || res.matricules?.filter((m: any) => m).length || 0;
        this.message = `✅ Détection terminée: ${detectedCount}/${res.total} matricules trouvés`;
        this.messageType = 'success';
        setTimeout(() => this.message = "", 5000);
      },
      // En cas d'erreur, afficher un message d'erreur et masquer le message après quelques secondes
      error: (err) => {
        console.error("❌ DETECTION ERROR", err);
        this.loading = false;
        this.message = "❌ Erreur lors de la détection";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 5000);
      }
    });
  }


  // ================= ENVOI EMAILS =================
  onSendClick() {
    //  Vérifier que les fichiers sont uploadés et qu'un modèle est sélectionné avant de lancer l'envoi
    if (!this.selectedModeleId || isNaN(this.selectedModeleId)) {
      this.message = "❌ Modèle invalide détecté";
      this.messageType = 'error';
      return;
    }
    // Vérifier que les fichiers sont uploadés avant de lancer l'envoi
    if (!this.excelFile) {
      this.message = "❌ Veuillez d'abord uploader le fichier Excel";
      this.messageType = 'error';
      return;
    }
    // Vérifier que les fichiers sont uploadés avant de lancer l'envoi
    if (!this.pdfFile) {
      this.message = "❌ Veuillez d'abord uploader le fichier PDF";
      this.messageType = 'error';
      return;
    }
    // Vérifier que les filtres sont chargés avant de lancer l'envoi
    this.sendAll();
  }

  //  Envoyer les emails en fonction du modèle sélectionné et des filtres appliqués, et afficher les résultats de l'envoi dans la console et dans la page, avec un message de succès ou d'erreur selon le résultat de l'envoi
  sendAll() {
    this.loading = true;

    this.bulletinService.sendAll(
      this.selectedModeleId!,
      this.selectedDepartement,
      this.selectedService
    ).subscribe({// En cas de succès, afficher les résultats de l'envoi dans la console et dans la page, et afficher un message de succès avec le nombre d'emails envoyés
      next: (res: any) => {
        console.log("✅ RESPONSE =>", res);
        this.loading = false;
        // Afficher un message différent si aucun employé ne correspond aux filtres sélectionnés, sinon afficher le nombre de succès et d'échecs de l'envoi
        if (res.total === 0) {
          this.message = `⚠️ Aucun employé ne correspond aux filtres sélectionnés`;
          this.messageType = 'error';
        } else {
          this.message = `✔ Emails envoyés ! (${res.success} succès, ${res.failed} échecs)`;
          this.messageType = 'success';
        }
        // Afficher les résultats de la détection dans la page pour voir quels employés ont été traités et le résultat de l'envoi pour chacun
        this.detectionResults = res;
        this.showDetectionResults = true;
        
        setTimeout(() => this.message = "", 5000);
      },// En cas d'erreur, afficher un message d'erreur et masquer le message après quelques secondes
      error: (err) => {
        console.error("❌ ERROR =>", err);
        this.loading = false;
        this.message = "❌ Erreur lors de l'envoi";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 5000);
      }
    });
  }

  // Envoyer un email à un employé spécifique en fonction de son matricule, et afficher un message de succès ou d'erreur selon le résultat de l'envoi
  send(matricule: string) {
    this.bulletinService.sendByMatricule(matricule).subscribe({
      next: () => {// En cas de succès, afficher un message de succès avec le matricule de l'employé
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

  
  // Prévisualiser le bulletin d'un employé spécifique en fonction de son matricule, et afficher le PDF dans une nouvelle fenêtre ou un nouvel onglet du navigateur
  previewAdmin() {
    const matricule = prompt("Entrer matricule à visualiser");
    if (!matricule) return;

    this.bulletinService.getBulletinAdmin(matricule).subscribe({
      next: (pdf: Blob) => {
        const url = window.URL.createObjectURL(pdf);
        window.open(url);
      },
      error: () => alert("Bulletin introuvable")
    });
  }

  //  Télécharger le bulletin d'un employé spécifique en fonction de son matricule, et déclencher le téléchargement du PDF dans le navigateur
  download(matricule: string) {
    this.bulletinService.downloadBulletin(matricule).subscribe({
      next: (pdf: Blob) => {
        const url = window.URL.createObjectURL(pdf);
        window.open(url);
      },
      error: () => alert("Bulletin introuvable")
    });
  }

  // ================= UTILISATEURS =================
  loadUsers() {
    this.bulletinService.getUsers().subscribe({
      // En cas de succès, afficher la liste des utilisateurs dans la console et dans une popup, et afficher un message de succès avec le nombre d'utilisateurs chargés
      next: (data) => {
        this.users = data;
        this.showUsersPopup = true;
      },
      error: () => alert("Erreur chargement utilisateurs")
    });
  }

  // Prévisualiser tous les bulletins des utilisateurs chargés en fonction du modèle sélectionné et des filtres appliqués, et afficher les résultats de la prévisualisation dans la console et dans la page, avec un message de succès ou d'erreur selon le résultat de la prévisualisation
  previewAll() {
    this.bulletinService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.showTable = true;
      },
      error: () => alert("Erreur chargement utilisateurs")
    });
  }

  // ================= PAGINATION =================
  get paginatedUsers() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.users.length) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  // ================= MODELE SELECTION =================
  onModeleChange(event: any) {
    const value = event.target.value;
    const parsed = Number(value);
    if (isNaN(parsed)) {
      this.selectedModeleId = null;
      return;
    }
    this.selectedModeleId = parsed;
    console.log("📌 MODELE ID =>", this.selectedModeleId);
  }

  // ================= FERMETURE POPUPS =================
  closeUsersPopup() {
    this.showUsersPopup = false;
  }

  closeTable() {
    this.showTable = false;
  }
  
  closeDetectionResults() {
    this.showDetectionResults = false;
  }

  getSelectedModeleLibelle(): string {
    if (!this.selectedModeleId) return '';
    const modele = this.modeles.find(m => m.id === this.selectedModeleId);
    return modele?.libelle || '';
  }

  getSelectedModeleZone(): any {
    if (!this.selectedModeleId) return null;
    const modele = this.modeles.find(m => m.id === this.selectedModeleId);
    if (modele && modele.zone) {
      try {
        return typeof modele.zone === 'string' ? JSON.parse(modele.zone) : modele.zone;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // ================= POPUP CONFIRMATION =================
  openConfirmPopup() {
    console.log("🔔 Ouverture popup confirmation");
    this.showConfirmPopup = true;
  }

  closeConfirmPopup() {
    this.showConfirmPopup = false;
  }

  confirmSend() {
    console.log("✅ Confirmation envoi");
    this.showConfirmPopup = false;
    this.onSendClick();
  }

  cancelSend() {
    console.log("❌ Annulation envoi");
    this.showConfirmPopup = false;
    this.showDetectionResults = true;
    this.previewBulletinsToSend();
  }

  previewBulletinsToSend() {
    this.loading = true;
    this.bulletinService.sendAll(
      this.selectedModeleId!,
      this.selectedDepartement,
      this.selectedService
    ).subscribe({
      next: (res: any) => {
        console.log("📊 APERÇU DES BULLETINS À ENVOYER", res);
        this.loading = false;
        this.detectionResults = {
          ...res,
          isPreview: true,
          message: "📋 Aperçu des bulletins à envoyer (aucun email n'a été envoyé)"
        };
        this.showDetectionResults = true;
      },
      error: (err) => {
        this.loading = false;
        this.message = "❌ Erreur lors de l'aperçu";
        this.messageType = 'error';
      }
    });
  }



// ================= PREVIEW (VISUALISATION SANS ENVOI) =================
preview() {
  if (!this.pdfFile || !this.selectedModeleId) {
    this.message = "❌ Veuillez d'abord uploader les fichiers et sélectionner un modèle";
    this.messageType = 'error';
    return;
  }
// Lancer l'aperçu et afficher un message de chargement
  this.loading = true;
  this.message = "📄 Récupération du bulletin...";
  this.messageType = 'success';

  // Appeler preview pour obtenir la liste des employés détectés
  this.bulletinService.previewBulletins(
    this.selectedModeleId!,
    this.selectedDepartement,
    this.selectedService
  ).subscribe({
    next: (res: any) => {
      console.log("📊 APERÇU RÉSULTATS", res);
      // Si aucun employé n'est détecté, afficher un message d'erreur
      if (!res.details || res.details.length === 0) {
        this.loading = false;
        this.message = "⚠️ Aucun employé détecté pour l'aperçu";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 3000);
        return;
      }

      const employe = res.details[0];
      // Vérifier que le matricule de l'employé est disponible avant d'essayer de prévisualiser le bulletin
      if (!employe.matricule) {
        this.loading = false;
        this.message = "⚠️ Aucun matricule valide trouvé";
        this.messageType = 'error';
        setTimeout(() => this.message = "", 3000);
        return;
      }

      // 🔥 Ouvrir dans un nouvel onglet pour VISUALISER (pas télécharger)
      const url = `http://localhost:5230/api/Bulletins/view/${this.selectedModeleId}/${employe.matricule}`;
      window.open(url, '_blank');
      // Afficher un message de succès avec le nom de l'employé dont le bulletin est prévisualisé
      this.loading = false;
      this.message = `📄 Visualisation: ${employe.prenom} ${employe.nom}`;
      this.messageType = 'success';
      setTimeout(() => this.message = "", 3000);
    },
    error: (err) => {
      console.error("❌ ERROR PREVIEW", err);
      this.loading = false;
      this.message = "❌ Erreur lors de l'aperçu";
      this.messageType = 'error';
      setTimeout(() => this.message = "", 3000);
    }
  });
}


// Afficher une popup pour choisir quel employé prévisualiser parmi la liste des employés détectés, et appeler previewEmploye avec le matricule de l'employé sélectionné pour afficher son bulletin
showEmployesPreviewPopup(employes: any[]) {
  // Créer une liste déroulante personnalisée
  const employesList = employes.map((e, i) => 
    `${i + 1}. ${e.prenom} ${e.nom} (${e.matricule}) - ${e.departement || ''} ${e.service || ''}`
  ).join('\n');
  // Afficher une invite pour choisir un employé à prévisualiser
  const choix = prompt(`Choisissez un employé à visualiser:\n\n${employesList}\n\nEntrez le numéro (1-${employes.length}):`);
  // Vérifier que le choix est valide et appeler previewEmploye avec le matricule de l'employé sélectionné
  if (choix) {
    const index = parseInt(choix) - 1;
    if (index >= 0 && index < employes.length) {
      const emp = employes[index];
      this.previewEmploye(emp.matricule, emp.nom, emp.prenom);
    } else {
      this.message = "❌ Sélection invalide";
      this.messageType = 'error';
      setTimeout(() => this.message = "", 3000);
    }
  }
}

// Afficher le bulletin d'un employé spécifique
previewEmploye(matricule: string, nom: string, prenom: string) {
  if (!matricule) {
    this.message = "❌ Matricule non disponible";
    this.messageType = 'error';
    return;
  }
  // Lancer la prévisualisation et afficher un message de chargement
  this.loading = true;
  this.bulletinService.downloadBulletin(matricule).subscribe({
    next: (pdf: Blob) => {
      const url = window.URL.createObjectURL(pdf);
      window.open(url);
      this.loading = false;
      this.message = `📄 Aperçu du bulletin de ${prenom} ${nom}`;
      this.messageType = 'success';
      setTimeout(() => this.message = "", 3000);
    },
    error: (err) => {
      console.error("❌ Erreur aperçu", err);
      this.loading = false;
      this.message = "❌ Impossible d'afficher l'aperçu";
      this.messageType = 'error';
      setTimeout(() => this.message = "", 3000);
    }
  });
}

// Fermer la modal de prévisualisation et réinitialiser les variables liées à l'aperçu
closePreviewModal() {
  this.showPreviewModal = false;
  this.previewPdfUrl = null;
}

// Envoyer le bulletin de l'employé actuellement prévisualisé, en utilisant son matricule pour identifier le bulletin à envoyer, et afficher un message de succès ou d'erreur selon le résultat de l'envoi
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
        error: () => {
          this.message = "❌ Erreur lors de l'envoi";
          this.messageType = 'error';
        }
      });
    }
  }
}


// Permettre à l'utilisateur de basculer en mode plein écran pour mieux visualiser le bulletin PDF, en utilisant l'API Fullscreen du navigateur
toggleFullscreen() {
  const modal = document.querySelector('.modal--pdf');
  if (modal) {
    if (!document.fullscreenElement) {
      modal.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
}


// Télécharger le bulletin de l'employé actuellement prévisualisé, en utilisant son matricule pour identifier le bulletin à télécharger, et déclencher le téléchargement du PDF dans le navigateur
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
        this.message = `📥 Téléchargement du bulletin de ${this.previewEmployePrenom} ${this.previewEmployeNom}`;
        this.messageType = 'success';
        setTimeout(() => this.message = "", 3000);
      },
      error: () => {
        this.message = "❌ Erreur lors du téléchargement";
        this.messageType = 'error';
      }
    });
  }
}








showEmailForm() {
  this.showEmailInput = !this.showEmailInput;
}

testConfig() {
  this.emailService.testConfiguration().subscribe({
    next: (res) => {
      console.log("✅ CONFIGURATION:", res);
      let msg = `Configuration:\n`;
      msg += `- Python installé: ${res.pythonInstalle ? '✅' : '❌'}\n`;
      msg += `- Script Python: ${res.scriptPythonExiste ? '✅' : '❌'}\n`;
      msg += `- Credentials.json: ${res.credentialsExiste ? '✅' : '❌'}\n`;
      alert(msg);
    },
    error: (err) => {
      alert(`Erreur test configuration: ${err.message}`);
    }
  });
}

/**
 * Envoyer tous les brouillons stockés
 */
envoyerTousLesBrouillonsStockes(): void {
  if (this.isEnvoiBrouillonsEnCours) {
    return;
  }

  // Vérifier si un email est configuré
  const emailAUtiliser = this.emailExpediteurEffectif || this.emailExpediteur;
  if (!emailAUtiliser) {
    this.message = '❌ Aucun email expéditeur configuré';
    this.messageType = 'error';
    setTimeout(() => this.message = '', 3000);
    return;
  }

  // Confirmation avant envoi
  const confirmMessage = `📧 Confirmation d'envoi des brouillons\n\n` +
    `Email expéditeur: ${emailAUtiliser}\n` +
    `Type: ${this.typeClientDetecte.toUpperCase()}\n\n` +
    `⚠️ Cette action va envoyer TOUS les brouillons stockés dans votre boîte email.\n\n` +
    `Êtes-vous sûr de vouloir continuer ?`;

  if (!confirm(confirmMessage)) {
    return;
  }

  this.isEnvoiBrouillonsEnCours = true;
  this.message = `🚀 Envoi des brouillons en cours pour ${this.typeClientDetecte.toUpperCase()}...`;
  this.messageType = 'success';

  this.emailService.envoyerTousLesBrouillons().subscribe({
    next: (resultat) => {
      console.log('✅ Résultat envoi brouillons:', resultat);
      this.isEnvoiBrouillonsEnCours = false;
      this.envoiBrouillonsResultat = resultat;

      if (resultat.success) {
        this.message = `✅ ${resultat.message} (${resultat.envoyes} envoyés, ${resultat.echecs} échecs)`;
        this.messageType = 'success';
      } else {
        this.message = `❌ ${resultat.message}`;
        this.messageType = 'error';
      }

      // Afficher le modal de résultat
      setTimeout(() => this.message = '', 5000);
      
      // Optionnel: ouvrir un modal avec les détails
      this.openEnvoiResultModal();
    },
    error: (error) => {
      console.error('❌ Erreur envoi brouillons:', error);
      this.isEnvoiBrouillonsEnCours = false;
      this.message = `❌ Erreur: ${error.error?.message || error.message}`;
      this.messageType = 'error';
      setTimeout(() => this.message = '', 5000);
    }
  });
}

// Variable pour le modal des résultats
showEnvoiResultModal = false;

openEnvoiResultModal() {
  this.showEnvoiResultModal = true;
}

closeEnvoiResultModal() {
  this.showEnvoiResultModal = false;
  this.envoiBrouillonsResultat = null;
}


}