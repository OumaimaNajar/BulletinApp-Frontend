import { Component, OnInit } from '@angular/core';
import { ModelePdfService } from '../../services/modele-pdf.service';

import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BulletinService } from '../../services/bulletin.service';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { StatsRowComponent } from '../stats-row/stats-row.component';
import { LoginService } from '../../services/login.service';

@Component({
    selector: 'app-modele',
    imports: [FormsModule, RouterLink, RouterLinkActive, RouterModule, SidebarComponent, TopbarComponent, StatsRowComponent],
    templateUrl: './modele.component.html',
    styleUrl: './modele.component.css'
})
export class ModeleComponent implements OnInit {

  username: string = '';
  userInitials: string = '';

  // =========================
  // 📁 FILE + UI
  // =========================
  file: File | null = null;
  fileUrl: SafeResourceUrl | null = null;
  libelle = '';

  testResult: any = null;
  testLoading = false;
  testResultModal = false;
  testResultData: any = null;

  // =========================
  // 📐 ZONE DRAW
  // =========================
  rect = { x: 0, y: 0, w: 0, h: 0 };
  overlayWidth = 0;
  overlayHeight = 0;

  private startX = 0;
  private startY = 0;
  private drawing = false;

  // =========================
  // ⚙️ STATE
  // =========================
  currentStep = 1;
  loading = false;

  savedMessage = '';
  savedType: 'success' | 'error' | '' = '';

  // =========================
  // ✏️ EDIT MODE
  // =========================
  editingMode = false;
  editingId: number | null = null;

  // =========================
  // 📦 LIST
  // =========================
  modeles: any[] = [];

  constructor(
    private modeleService: ModelePdfService,
    private sanitizer: DomSanitizer,
    private bulletinService: BulletinService,
    private router: RouterModule,
    private loginService: LoginService
  ) {}

  ngOnInit() {
    const name = this.loginService.getUsername();
    this.username = name || 'Administrateur';
    this.userInitials = this.username.includes('_')
      ? (this.username.split('_')[0][0] + this.username.split('_')[1][0]).toUpperCase()
      : this.username.substring(0, 2).toUpperCase();
    this.loadModeles();
  }

  get hasZone(): boolean {
    return this.rect.w > 10 && this.rect.h > 10;
  }

  onFile(event: any) {
    const f: File = event.target.files[0];
    if (!f) return;

    this.file = f;
    this.libelle = f.name.replace('.pdf', '');

    this.resetZone();

    const url = URL.createObjectURL(f);
    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url + '#toolbar=0');

    this.currentStep = 2;
    console.log("📁 FILE UPLOADED =>", f.name);
  }

  startDraw(event: MouseEvent) {
    const overlay = event.currentTarget as HTMLElement;
    const b = overlay.getBoundingClientRect();

    this.overlayWidth = b.width;
    this.overlayHeight = b.height;

    this.drawing = true;
    this.startX = event.clientX - b.left;
    this.startY = event.clientY - b.top;
    this.rect = { x: this.startX, y: this.startY, w: 0, h: 0 };
  }

  duringDraw(event: MouseEvent) {
    if (!this.drawing) return;

    const overlay = event.currentTarget as HTMLElement;
    const b = overlay.getBoundingClientRect();

    const cx = event.clientX - b.left;
    const cy = event.clientY - b.top;

    this.rect = {
      x: Math.min(this.startX, cx),
      y: Math.min(this.startY, cy),
      w: Math.abs(cx - this.startX),
      h: Math.abs(cy - this.startY)
    };
  }

  endDraw() {
    this.drawing = false;
    if (this.hasZone) {
      this.currentStep = 3;
      console.log("📐 ZONE SELECTED =>", this.rect);
    }
  }

  resetZone() {
    this.rect = { x: 0, y: 0, w: 0, h: 0 };
    if (this.currentStep >= 3) {
      this.currentStep = 2;
    }
  }

  // =========================
  // 🧪 TESTER LA ZONE
  // =========================
  testDetection() {
    if (!this.file || !this.hasZone) {
      console.log("❌ File ou zone manquante");
      this.showMessage("❌ Veuillez sélectionner une zone", "error");
      return;
    }

    const zone = {
  x: this.rect.x / this.overlayWidth,
  y: this.rect.y / this.overlayHeight,
  width: this.rect.w / this.overlayWidth,
  height: this.rect.h / this.overlayHeight,
  overlayWidth: this.overlayWidth,
  overlayHeight: this.overlayHeight
};

    this.testLoading = true;
    this.testResult = null;

    console.log('🧪 TEST ZONE:', zone);
    
    this.bulletinService.processZoneAllPages(this.file, zone).subscribe({
      next: (res: any) => {
        console.log("✅ TEST RESULT =>", res);
        this.testResult = res;
        this.testLoading = false;
        this.showMessage(`✅ Test terminé: ${res.detected}/${res.total} matricules détectés`, "success");
      },
      error: (err: any) => {
        console.log("❌ TEST ERROR =>", err);
        this.testLoading = false;
        this.showMessage("❌ Erreur lors du test", "error");
      }
    });
  }

  // =========================
  // 🧪 TESTER UN MODÈLE EXISTANT
  // =========================
  testModele(modeleId: number) {
    this.testLoading = true;
    this.bulletinService.testModele(modeleId).subscribe({
      next: (res: any) => {
        console.log("✅ TEST MODELE =>", res);
        this.testResultData = res;
        this.testResultModal = true;
        this.testLoading = false;
        this.showMessage(`✅ Test: ${res.summary.detectedCount}/${res.summary.totalPages} détectés (${res.summary.detectionRate}%)`, "success");
      },
      error: (err: any) => {
        console.error("❌ TEST ERROR", err);
        this.testLoading = false;
        this.showMessage("❌ Erreur lors du test du modèle", "error");
      }
    });
  }

  // =========================
  // 💾 SAVE
  // =========================
  save() {
  if (!this.hasZone) {
    this.showMessage("❌ Aucune zone sélectionnée", "error");
    return;
  }

  // Calculer la zone en ratio
  let zone = {
    x: this.rect.x / this.overlayWidth,
    y: this.rect.y / this.overlayHeight,
    width: this.rect.w / this.overlayWidth,
    height: this.rect.h / this.overlayHeight,
    overlayWidth: this.overlayWidth,
    overlayHeight: this.overlayHeight
  };
  
  // Forcer une taille minimum
  const MIN_WIDTH = 0.35;
  const MIN_HEIGHT = 0.10;
  
  if (zone.width < MIN_WIDTH) {
    const centerX = zone.x + (zone.width / 2);
    zone.x = Math.max(0, centerX - (MIN_WIDTH / 2));
    zone.width = MIN_WIDTH;
  }
  
  if (zone.height < MIN_HEIGHT) {
    const centerY = zone.y + (zone.height / 2);
    zone.y = Math.max(0, centerY - (MIN_HEIGHT / 2));
    zone.height = MIN_HEIGHT;
  }
  
  // Arrondir les valeurs
  zone.x = Math.round(zone.x * 100) / 100;
  zone.y = Math.round(zone.y * 100) / 100;
  zone.width = Math.round(zone.width * 100) / 100;
  zone.height = Math.round(zone.height * 100) / 100;
  
  console.log("📐 Zone à sauvegarder:", zone);

  // Si c'est une édition, mettre à jour la zone
  if (this.editingMode && this.editingId) {
    this.modeleService.updateZone(this.editingId, zone).subscribe({
      next: (res) => {// Après mise à jour, recharger les modèles pour voir les changements
        this.showMessage("✔ Zone mise à jour avec succès", "success");
        this.afterSave();
      },
      error: (err) => {
        console.error("❌ Erreur update:", err);
        this.showMessage("❌ Erreur lors de la mise à jour", "error");
      }
    });
    return;
  }

  // Sinon, créer un nouveau modèle
  if (!this.file) {
    this.showMessage("❌ Fichier manquant", "error");
    return;
  }
  // Créer le modèle avec la zone en ratio pour la sauvegarde (backend attend des valeurs entre 0 et 1)
  this.modeleService.addModele(this.file, this.libelle, zone).subscribe({
    next: (res) => {
      this.showMessage("✔ Modèle créé avec succès", "success");
      this.afterSave();
    },
    error: (err) => {
      console.error("❌ Erreur création:", err);
      this.showMessage("❌ Erreur lors de la création", "error");
    }
  });
}

// Afficher un message temporaire 
  afterSave() {
    this.loadModeles();
    this.editingMode = false;
    this.editingId = null;
    this.file = null;
    this.fileUrl = null;
    this.libelle = '';
    this.resetZone();
    this.currentStep = 1;
    setTimeout(() => this.savedMessage = '', 3000);
  }


  // Afficher un message temporaire en haut de la page 
 loadModeles() {
  this.modeleService.getAll().subscribe({
    next: (data) => {
      console.log("🔥 RAW MODELES =>", data);
      this.modeles = data.map(m => {
        // 🔥 Bien récupérer l'ID et le libellé
        const id = m.id ?? m.Id ?? m.ID;
        const libelle = m.libelle ?? m.Libelle ?? m.Libellé;
        const zone = m.zone ?? m.Zone;
        
        console.log(`📦 Modèle ${id}: ${libelle}`);
        
        return {
          id: id,
          libelle: libelle,
          zone: zone
        };
      }).filter(m => m.id);
      
      console.log("📦 MODELES CLEAN =>", this.modeles);
    },
    error: (err) => console.error("❌ LOAD ERROR", err)
  });
}

// Supprimer un modèle
  deleteModele(id: number) {
    if (!confirm('Supprimer ce modèle ?')) return;
    this.modeleService.deleteModele(id).subscribe({
      next: () => this.loadModeles(),
      error: (err) => console.error("❌ DELETE ERROR", err)
    });
  }

  // Prévisualiser le modèle
editModele(modele: any) {
  console.log("📝 Édition du modèle - OBJET COMPLET:", modele);
  
  // 🔥 Vérifier où se trouve l'ID
  const id = modele.id ?? modele.Id ?? modele.ID;
  console.log("🔑 ID extrait:", id);
  
  if (!id) {// Si on ne trouve pas d'ID, afficher une erreur
    console.error("❌ ID du modèle introuvable dans l'objet:", modele);
    this.showMessage("❌ Impossible de modifier : ID du modèle introuvable", "error");
    return;
  }
  // Passer en mode édition
  this.editingMode = true;
  this.editingId = id;
  this.libelle = modele.libelle ?? modele.Libelle ?? '';

  // 🔥 Récupérer le modèle avec la zone parsée
  const url = `http://localhost:5230/api/ModelePdf/with-zone/${id}`;
  console.log("📡 URL appelée:", url);
  
  fetch(url) // Utiliser fetch pour un contrôle total sur la réponse
    .then(response => {
      console.log("📡 Réponse status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("✅ Modèle récupéré:", data);
      
      let zone = data.zone || data.Zone;
      console.log("📐 Zone récupérée:", zone);
      
      if (zone) {
        // Appliquer la zone pour le dessin
        const isRatio = (zone.x < 2 && zone.y < 2 && zone.width < 2 && zone.height < 2);
        console.log("📐 Type de zone:", isRatio ? "Ratio" : "Pixels");
        // Si c'est une zone en ratio, convertir en pixels pour l'affichage
        if (isRatio) {
          this.overlayWidth = zone.overlayWidth || 800;
          this.overlayHeight = zone.overlayHeight || 1000;
          this.rect = {
            x: zone.x * this.overlayWidth,
            y: zone.y * this.overlayHeight,
            w: zone.width * this.overlayWidth,
            h: zone.height * this.overlayHeight
          };
        } else {// Si c'est déjà en pixels, l'utiliser tel quel
          this.rect = { 
            x: zone.x, 
            y: zone.y, 
            w: zone.width, 
            h: zone.height 
          };
          this.overlayWidth = zone.overlayWidth || 800;
          this.overlayHeight = zone.overlayHeight || 1000;
        }
        // Arrondir les valeurs pour éviter les problèmes d'affichage
        console.log("📐 Rectangle affiché:", this.rect);
      } else {
        console.warn("⚠️ Aucune zone trouvée, utilisation valeurs par défaut");
        this.overlayWidth = 800;
        this.overlayHeight = 1000;
        this.rect = { x: 160, y: 50, w: 400, h: 120 };
      }
    })
    .catch(err => {
      console.error("❌ Erreur récupération modèle:", err);
      this.showMessage("❌ Erreur lors du chargement du modèle", "error");
    });

  // Charger le PDF pour l'affichage et le dessin de la zone 
  const pdfUrl = `http://localhost:5230/api/ModelePdf/file/${id}`;
  console.log("📡 PDF URL:", pdfUrl);
  this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl + '#toolbar=0');
  
  fetch(pdfUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.blob();
    })
    .then(blob => {
      console.log("✅ PDF chargé, taille:", blob.size);
      this.file = new File([blob], `${this.libelle}.pdf`, { type: 'application/pdf' });
    })
    .catch(err => {
      console.error("❌ Erreur chargement PDF:", err);
      this.showMessage("❌ Erreur chargement du PDF", "error");
    });

  this.currentStep = 2;
}

// Méthode pour afficher un message temporaire
  showMessage(msg: string, type: 'success' | 'error') {
    this.savedMessage = msg;
    this.savedType = type;
    setTimeout(() => this.savedMessage = '', 3000);
  }

// Méthode pour rafraîchir la liste des modèles après une modification
  refreshModeles() {
  this.loadModeles();
}


// Méthode utilitaire pour arrondir les valeurs de la zone avant l'affichage ou la sauvegarde
private roundZone(zone: any): any {
  return {
    x: Math.round(zone.x * 100) / 100,
    y: Math.round(zone.y * 100) / 100,
    width: Math.round(zone.width * 100) / 100,
    height: Math.round(zone.height * 100) / 100,
    overlayWidth: Math.round(zone.overlayWidth),
    overlayHeight: Math.round(zone.overlayHeight)
  };
}
    
// Méthode pour formater la zone en string lisible

formatZone(zone: any): string {
  if (!zone) return 'Aucune zone';
  try {
    const zoneObj = typeof zone === 'string' ? JSON.parse(zone) : zone;
    const x = zoneObj.x ?? zoneObj.X ?? 0;
    const y = zoneObj.y ?? zoneObj.Y ?? 0;
    const w = zoneObj.width ?? zoneObj.Width ?? 0;
    const h = zoneObj.height ?? zoneObj.Height ?? 0;
    return `x:${x.toFixed(2)} y:${y.toFixed(2)} w:${w.toFixed(2)} h:${h.toFixed(2)}`;
  } catch (e) {
    return 'Format invalide';
  }
}
}