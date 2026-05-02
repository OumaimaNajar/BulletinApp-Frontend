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
import { CommonModule } from '@angular/common';


@Component({
    selector: 'app-modele',
    imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, RouterModule, SidebarComponent, TopbarComponent, StatsRowComponent],
    templateUrl: './modele.component.html',
    styleUrl: './modele.component.css'
})
export class ModeleComponent implements OnInit {
  username: string = '';
  userInitials: string = '';

  file: File | null = null;
  fileUrl: SafeResourceUrl | null = null;
  libelle = '';

  testResult: any = null;
  testLoading = false;
  testResultModal = false;
  testResultData: any = null;

  // Zone drawing
  rect = { x: 0, y: 0, w: 0, h: 0 };
  overlayWidth = 0;
  overlayHeight = 0;

  private startX = 0;
  private startY = 0;
  private drawing = false;

  currentStep = 1;
  loading = false;

  savedMessage = '';
  savedType: 'success' | 'error' | '' = '';

  editingMode = false;
  editingId: number | null = null;

  modeles: any[] = [];

  // Preview modal
  previewModalOpen: boolean = false;
  previewPdfUrl: SafeResourceUrl | null = null;
  previewModeleName: string = '';
  previewWithZone: boolean = false;
  previewZoneData: any = null;
  previewContainerWidth: number = 0;
  previewContainerHeight: number = 0;


   // Preview modal

  
  // AJOUTEZ CES 4 PROPRIÉTÉS :
  previewZoneLeft: number = 0;
  previewZoneTop: number = 0;
  previewZoneWidth: number = 0;
  previewZoneHeight: number = 0;

  constructor(
    private modeleService: ModelePdfService,
    private sanitizer: DomSanitizer,
    private bulletinService: BulletinService,
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

  testDetection() {
    if (!this.file || !this.hasZone) {
      this.showMessage("❌ Veuillez sélectionner une zone", "error");
      return;
    }

    const zone = {
      x: this.rect.x,
      y: this.rect.y,
      width: this.rect.w,
      height: this.rect.h,
      overlayWidth: this.overlayWidth,
      overlayHeight: this.overlayHeight
    };

    this.testLoading = true;
    this.testResult = null;

    this.bulletinService.processZoneAllPages(this.file, zone).subscribe({
      next: (res: any) => {
        this.testResult = res;
        this.testLoading = false;
        this.showMessage(`✅ Test terminé: ${res.detected}/${res.total} matricules détectés`, "success");
      },
      error: (err: any) => {
        this.testLoading = false;
        this.showMessage("❌ Erreur lors du test", "error");
      }
    });
  }

  previewModelePdf(modeleId: number) {
    const modele = this.modeles.find(m => (m.id || m.Id) === modeleId);
    if (!modele) return;
    
    this.previewModeleName = modele.libelle || modele.Libelle;
    this.previewModalOpen = true;
    this.previewWithZone = true;
    this.previewZoneData = null;
    this.previewContainerWidth = 0;
    this.previewContainerHeight = 0;
    
    const pdfUrl = `http://localhost:5230/api/ModelePdf/file/${modeleId}`;
    this.previewPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl + '#toolbar=0');
    
    const zoneUrl = `http://localhost:5230/api/ModelePdf/with-zone/${modeleId}`;
    
    fetch(zoneUrl)
        .then(response => response.json())
        .then(data => {
            const zone = data.zone || data.Zone;
            
            if (zone) {
                // Stocker les ratios ET les dimensions originales
                this.previewZoneData = {
                    x: zone.X ?? zone.x ?? 0,
                    y: zone.Y ?? zone.y ?? 0,
                    width: zone.Width ?? zone.width ?? 0,
                    height: zone.Height ?? zone.height ?? 0,
                    overlayWidth: zone.OverlayWidth ?? zone.overlayWidth ?? 637.6,
                    overlayHeight: zone.OverlayHeight ?? zone.overlayHeight ?? 550
                };
                
                console.log('📐 Zone chargée:', this.previewZoneData);
                
                setTimeout(() => {
                    this.calculatePreviewPositions();
                }, 1000);
            }
        })
        .catch(err => {
            console.error('Erreur:', err);
            this.previewWithZone = false;
        });
}

  updateContainerDimensions() {
    setTimeout(() => {
      const container = document.querySelector('.preview-pdf-container');
      if (container) {
        this.previewContainerWidth = container.clientWidth;
        this.previewContainerHeight = container.clientHeight;
        console.log(`Container: ${this.previewContainerWidth} x ${this.previewContainerHeight}`);
      }
    }, 500);
  }

  // Méthode simplifiée pour la position X
  getPreviewZoneLeft(): number {
    if (!this.previewZoneData || this.previewContainerWidth === 0) return 0;
    
    let x = this.previewZoneData.x;
    const overlayWidth = this.previewZoneData.overlayWidth;
    
    // Si c'était des pixels, convertir en ratio puis en pixels du nouveau conteneur
    if (this.previewZoneData.isPixels && overlayWidth > 0) {
      const ratio = x / overlayWidth;
      x = ratio * this.previewContainerWidth;
    } 
    // Si c'était déjà un ratio, multiplier directement
    else if (x < 1 && x > 0) {
      x = x * this.previewContainerWidth;
    }
    
    return x;
  }

  // Méthode simplifiée pour la position Y
  getPreviewZoneTop(): number {
    if (!this.previewZoneData || this.previewContainerHeight === 0) return 0;
    
    let y = this.previewZoneData.y;
    const overlayHeight = this.previewZoneData.overlayHeight;
    
    if (this.previewZoneData.isPixels && overlayHeight > 0) {
      const ratio = y / overlayHeight;
      y = ratio * this.previewContainerHeight;
    } 
    else if (y < 1 && y > 0) {
      y = y * this.previewContainerHeight;
    }
    
    return y;
  }

  // Méthode simplifiée pour la largeur
  getPreviewZoneWidth(): number {
    if (!this.previewZoneData || this.previewContainerWidth === 0) return 0;
    
    let width = this.previewZoneData.width;
    const overlayWidth = this.previewZoneData.overlayWidth;
    
    if (this.previewZoneData.isPixels && overlayWidth > 0) {
      const ratio = width / overlayWidth;
      width = ratio * this.previewContainerWidth;
    } 
    else if (width < 1 && width > 0) {
      width = width * this.previewContainerWidth;
    }
    
    return Math.max(width, 20);
  }

  // Méthode simplifiée pour la hauteur
  getPreviewZoneHeight(): number {
    if (!this.previewZoneData || this.previewContainerHeight === 0) return 0;
    
    let height = this.previewZoneData.height;
    const overlayHeight = this.previewZoneData.overlayHeight;
    
    if (this.previewZoneData.isPixels && overlayHeight > 0) {
      const ratio = height / overlayHeight;
      height = ratio * this.previewContainerHeight;
    } 
    else if (height < 1 && height > 0) {
      height = height * this.previewContainerHeight;
    }
    
    return Math.max(height, 20);
  }

  onPreviewIframeLoad() {
    console.log('Iframe chargé');
    setTimeout(() => {
      this.updateContainerDimensions();
    }, 1000);
  }

  closePreviewModal() {
    this.previewModalOpen = false;
    this.previewPdfUrl = null;
    this.previewWithZone = false;
    this.previewZoneData = null;
    this.previewContainerWidth = 0;
    this.previewContainerHeight = 0;
  }

  save() {
    if (!this.hasZone) {
        this.showMessage("❌ Aucune zone sélectionnée", "error");
        return;
    }

    // 🔥 Convertir les pixels en RATIOS (0-1) pour le backend
    const zone = {
        X: this.rect.x / this.overlayWidth,
        Y: this.rect.y / this.overlayHeight,
        Width: this.rect.w / this.overlayWidth,
        Height: this.rect.h / this.overlayHeight,
        OverlayWidth: this.overlayWidth,
        OverlayHeight: this.overlayHeight
    };
    
    console.log("📐 Zone à sauvegarder (ratios):", zone);
    console.log(`Pixels: ${this.rect.x}x${this.rect.y} ${this.rect.w}x${this.rect.h}`);
    console.log(`Overlay: ${this.overlayWidth}x${this.overlayHeight}`);

    if (this.editingMode && this.editingId) {
        this.modeleService.updateZone(this.editingId, zone).subscribe({
            next: () => {
                this.showMessage("✔ Zone mise à jour", "success");
                this.afterSave();
            },
            error: () => this.showMessage("❌ Erreur mise à jour", "error")
        });
        return;
    }

    if (!this.file) {
        this.showMessage("❌ Fichier manquant", "error");
        return;
    }
    
    this.modeleService.addModele(this.file, this.libelle, zone).subscribe({
        next: () => {
            this.showMessage("✔ Modèle créé", "success");
            this.afterSave();
        },
        error: () => this.showMessage("❌ Erreur création", "error")
    });
}

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

  loadModeles() {
    this.modeleService.getAll().subscribe({
      next: (data) => {
        this.modeles = data.map(m => ({
          id: m.id ?? m.Id ?? m.ID,
          libelle: m.libelle ?? m.Libelle ?? m.Libellé,
          zone: m.zone ?? m.Zone
        })).filter(m => m.id);
      },
      error: (err) => console.error("❌ LOAD ERROR", err)
    });
  }

  deleteModele(id: number) {
    if (!confirm('Supprimer ce modèle ?')) return;
    this.modeleService.deleteModele(id).subscribe({
      next: () => this.loadModeles(),
      error: (err) => console.error("❌ DELETE ERROR", err)
    });
  }

  editModele(modele: any) {
    const id = modele.id ?? modele.Id ?? modele.ID;
    
    if (!id) {
        this.showMessage("❌ ID introuvable", "error");
        return;
    }
    
    this.editingMode = true;
    this.editingId = id;
    this.libelle = modele.libelle ?? modele.Libelle ?? '';

    const url = `http://localhost:5230/api/ModelePdf/with-zone/${id}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const zone = data.zone || data.Zone;
            if (zone) {
                // Récupérer les ratios
                const ratioX = zone.X ?? zone.x ?? 0;
                const ratioY = zone.Y ?? zone.y ?? 0;
                const ratioW = zone.Width ?? zone.width ?? 0;
                const ratioH = zone.Height ?? zone.height ?? 0;
                const overlayWidth = zone.OverlayWidth ?? zone.overlayWidth ?? 800;
                const overlayHeight = zone.OverlayHeight ?? zone.overlayHeight ?? 1000;
                
                // Convertir les ratios en pixels pour l'affichage dans l'éditeur
                this.overlayWidth = overlayWidth;
                this.overlayHeight = overlayHeight;
                this.rect = {
                    x: ratioX * overlayWidth,
                    y: ratioY * overlayHeight,
                    w: ratioW * overlayWidth,
                    h: ratioH * overlayHeight
                };
                
                console.log('Zone édition - Ratios:', { ratioX, ratioY, ratioW, ratioH });
                console.log('Zone édition - Pixels:', this.rect);
            }
        })
        .catch(err => console.error("Erreur:", err));

    const pdfUrl = `http://localhost:5230/api/ModelePdf/file/${id}`;
    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl + '#toolbar=0');
    
    fetch(pdfUrl)
        .then(response => response.blob())
        .then(blob => {
            this.file = new File([blob], `${this.libelle}.pdf`, { type: 'application/pdf' });
        })
        .catch(err => console.error("Erreur:", err));

    this.currentStep = 2;
}

  showMessage(msg: string, type: 'success' | 'error') {
    this.savedMessage = msg;
    this.savedType = type;
    setTimeout(() => this.savedMessage = '', 3000);
  }

  refreshModeles() {
    this.loadModeles();
  }

  formatZone(zone: any): string {
    if (!zone) return 'Aucune zone';
    try {
      const zoneObj = typeof zone === 'string' ? JSON.parse(zone) : zone;
      const x = zoneObj.X ?? zoneObj.x ?? 0;
      const y = zoneObj.Y ?? zoneObj.y ?? 0;
      const w = zoneObj.Width ?? zoneObj.width ?? 0;
      const h = zoneObj.Height ?? zoneObj.height ?? 0;
      return `${Math.round(x)}x${Math.round(y)} ${Math.round(w)}x${Math.round(h)}px`;
    } catch (e) {
      return 'Format invalide';
    }
  }

calculatePreviewPositions() {
    if (!this.previewZoneData) return;
    
    const container = document.querySelector('.preview-pdf-container');
    if (!container) {
        setTimeout(() => this.calculatePreviewPositions(), 500);
        return;
    }
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const originalOverlayWidth = this.previewZoneData.overlayWidth || 639.2;
    const originalOverlayHeight = this.previewZoneData.overlayHeight || 550;
    
    const ratioX = this.previewZoneData.x;
    const ratioY = this.previewZoneData.y;
    const ratioW = this.previewZoneData.width;
    const ratioH = this.previewZoneData.height;
    
    const originalPixelsX = ratioX * originalOverlayWidth;
    const originalPixelsY = ratioY * originalOverlayHeight;
    const originalPixelsW = ratioW * originalOverlayWidth;
    const originalPixelsH = ratioH * originalOverlayHeight;
    
    const scaleX = containerWidth / originalOverlayWidth;
    const scaleY = containerHeight / originalOverlayHeight;
    
    // 🔥 CORRECTION POUR DÉCALAGE EN HAUT À DROITE
    // Décalage en haut à droite = besoin de décaler vers la gauche et vers le bas
    const FINE_TUNE_X = 20;   // Négatif = décaler à gauche
    const FINE_TUNE_Y = 12;    // Positif = décaler vers le bas
    
    this.previewZoneLeft = (originalPixelsX * scaleX) + FINE_TUNE_X;
    this.previewZoneTop = (originalPixelsY * scaleY) + FINE_TUNE_Y;
    this.previewZoneWidth = Math.max(originalPixelsW * scaleX, 20);
    this.previewZoneHeight = Math.max(originalPixelsH * scaleY, 20);
    
    console.log('🎯 ZONE CORRIGÉE:', {
        avant: `${Math.round(originalPixelsX * scaleX)}x${Math.round(originalPixelsY * scaleY)}`,
        correction: `X${FINE_TUNE_X}, Y${FINE_TUNE_Y}`,
        final: `${Math.round(this.previewZoneLeft)}x${Math.round(this.previewZoneTop)}`,
        taille: `${Math.round(this.previewZoneWidth)}x${Math.round(this.previewZoneHeight)}`
    });
    
    setTimeout(() => {
        this.previewZoneLeft = this.previewZoneLeft;
        this.previewZoneTop = this.previewZoneTop;
        this.previewZoneWidth = this.previewZoneWidth;
        this.previewZoneHeight = this.previewZoneHeight;
    }, 50);
}

compareZone() {
    console.log('===== COMPARAISON ZONE =====');
    
    // Zone sélectionnée (lors du dessin)
    console.log('📝 Zone sélectionnée (pixels dans overlay original):', {
        x: this.rect.x,
        y: this.rect.y,
        w: this.rect.w,
        h: this.rect.h,
        overlaySize: `${this.overlayWidth}x${this.overlayHeight}`
    });
    
    // Ratios sauvegardés
    if (this.previewZoneData) {
        console.log('📐 Ratios sauvegardés:', {
            X: this.previewZoneData.x,
            Y: this.previewZoneData.y,
            Width: this.previewZoneData.width,
            Height: this.previewZoneData.height
        });
    }
    
    // Zone affichée dans l'aperçu
    console.log('🖼️ Zone affichée dans aperçu:', {
        left: this.previewZoneLeft,
        top: this.previewZoneTop,
        width: this.previewZoneWidth,
        height: this.previewZoneHeight
    });
    
    // Conteneur actuel
    const container = document.querySelector('.preview-pdf-container');
    if (container) {
        const rect = container.getBoundingClientRect();
        console.log('📦 Conteneur aperçu:', {
            width: rect.width,
            height: rect.height
        });
    }
    
    console.log('===============================');
}


debugConversion() {
    console.log('===== DEBUG CONVERSION =====');
    
    const container = document.querySelector('.preview-pdf-container');
    if (!container || !this.previewZoneData) {
        console.log('Données manquantes');
        return;
    }
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const ratioX = this.previewZoneData.x;
    const ratioY = this.previewZoneData.y;
    const ratioW = this.previewZoneData.width;
    const ratioH = this.previewZoneData.height;
    
    // Devrait donner la position calculée
    const calculatedLeft = ratioX * containerWidth;
    const calculatedTop = ratioY * containerHeight;
    
    console.log('Conversion ratios → pixels:', {
        container: `${containerWidth}x${containerHeight}`,
        ratios: `${ratioX}x${ratioY} ${ratioW}x${ratioH}`,
        calcule: `${calculatedLeft}x${calculatedTop}`,
        actuel: `${this.previewZoneLeft}x${this.previewZoneTop}`,
        difference: `${calculatedLeft - this.previewZoneLeft}x${calculatedTop - this.previewZoneTop}`
    });
    
    // Vérifier si le problème vient des ratios ou des offsets
    console.log('Offsets appliqués:', {
        offsetX: this.previewZoneLeft - calculatedLeft,
        offsetY: this.previewZoneTop - calculatedTop
    });
    
    console.log('===========================');
}



// Méthode pour ajuster la zone en temps réel
tuneZone(x: number, y: number) {
    this.previewZoneLeft += x;
    this.previewZoneTop += y;
    console.log(`🔧 Nouvelle position: X=${Math.round(this.previewZoneLeft)}, Y=${Math.round(this.previewZoneTop)}`);
}



// Méthode pour ajuster la position depuis la console ou l'interface
adjustZone(offsetX: number, offsetY: number) {
    (window as any).zoneAdjustX = offsetX;
    (window as any).zoneAdjustY = offsetY;
    this.calculatePreviewPositions();
    console.log(`✅ Zone ajustée: X${offsetX}, Y${offsetY}`);
}


// Variables pour ajustement dynamique
private dynamicCorrectionX: number = 15;
private dynamicCorrectionY: number = -5;

// Méthode pour ajuster en temps réel
fineTune(x: number, y: number) {
    this.dynamicCorrectionX = x;
    this.dynamicCorrectionY = y;
    this.calculatePreviewPositions();
    console.log(`🎯 Ajustement: X=${x}, Y=${y}`);
}

// Ajoutez ces variables
private autoCorrectionX: number = -25;
private autoCorrectionY: number = -15;

// Méthode pour ajuster pas à pas
shiftLeft() {
    this.autoCorrectionX -= 5;
    this.calculatePreviewPositions();
    console.log(`⬅️ Décalé à gauche: correction X=${this.autoCorrectionX}`);
}

shiftRight() {
    this.autoCorrectionX += 5;
    this.calculatePreviewPositions();
    console.log(`➡️ Décalé à droite: correction X=${this.autoCorrectionX}`);
}

shiftUp() {
    this.autoCorrectionY -= 5;
    this.calculatePreviewPositions();
    console.log(`⬆️ Décalé vers le haut: correction Y=${this.autoCorrectionY}`);
}

shiftDown() {
    this.autoCorrectionY += 5;
    this.calculatePreviewPositions();
    console.log(`⬇️ Décalé vers le bas: correction Y=${this.autoCorrectionY}`);
}


// Ajustement rapide depuis la console
setXCorrection(value: number) {
    this.previewZoneLeft = this.previewZoneLeft + value;
    console.log(`✅ Nouvelle position X: ${this.previewZoneLeft}`);
}

// Ou version plus complète
adjustOffset(x: number, y: number) {
    this.previewZoneLeft += x;
    this.previewZoneTop += y;
    console.log(`✅ Position: X=${this.previewZoneLeft}, Y=${this.previewZoneTop}`);
}

// Variables pour ajustement dynamique
private offsetX: number = -35;
private offsetY: number = -15;

// Méthodes d'ajustement
adjustHorizontal(value: number) {
    this.offsetX = value;
    this.calculatePreviewPositions();
    console.log(`📏 Ajustement horizontal: ${value}`);
}

adjustVertical(value: number) {
    this.offsetY = value;
    this.calculatePreviewPositions();
    console.log(`📏 Ajustement vertical: ${value}`);
}

}

