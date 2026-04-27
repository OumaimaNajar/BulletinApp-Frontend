import { Component } from '@angular/core';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BulletinService } from '../../services/bulletin.service';
import { ModelePdfService } from '../../services/modele-pdf.service';
import { FormsModule } from '@angular/forms';

interface ZoneResult {
  message: string;
  total: number;
  detected: number;
  matricules: (string | null)[];
}

@Component({
    selector: 'app-pdf-zone-selector',
    imports: [HttpClientModule, FormsModule],
    templateUrl: './pdf-zone-selector.component.html',
    styleUrls: ['./pdf-zone-selector.component.css']
})
export class PdfZoneSelectorComponent {

  fileUrl!: SafeResourceUrl;
  selectedFile!: File;

  rect = { x: 0, y: 0, w: 0, h: 0 };
  overlayWidth = 0;
  overlayHeight = 0;

  private startX = 0;
  private startY = 0;
  private drawing = false;

  loading = false;
  result: ZoneResult | null = null;
  errorMsg: string | null = null;

  libelle = '';

  // Étapes : 1=upload, 2=draw, 3=validate, 4=results
  currentStep = 1;


  

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private bulletinService: BulletinService,
    private modeleService: ModelePdfService
  ) {}

  getScaleFactor(overlay: HTMLElement) {
  const rect = overlay.getBoundingClientRect();

  return {
    scaleX: rect.width / this.overlayWidth,
    scaleY: rect.height / this.overlayHeight
  };
}

  get hasZone(): boolean {
    return this.rect.w > 10 && this.rect.h > 10;
  }

  get pageResults() {
    if (!this.result) return [];
    return this.result.matricules.map((mat, i) => ({
      page: i + 1,
      matricule: mat
    }));
  }

  // ── Upload ──────────────────────────────────────
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;
    this.result = null;
    this.errorMsg = null;
    this.resetZone();

    const url = URL.createObjectURL(file);
    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url + '#toolbar=0');
    this.currentStep = 2;
  }

  // ── Dessin zone ──────────────────────────────────
  startDraw(event: MouseEvent) {
  const overlay = event.currentTarget as HTMLElement;
  const bounds = overlay.getBoundingClientRect();

  const scaleX = this.overlayWidth / bounds.width;
  const scaleY = this.overlayHeight / bounds.height;

  this.drawing = true;

  this.startX = (event.clientX - bounds.left) * scaleX;
  this.startY = (event.clientY - bounds.top) * scaleY;

  this.rect = { x: this.startX, y: this.startY, w: 0, h: 0 };
}

  duringDraw(event: MouseEvent) {
  if (!this.drawing) return;

  const overlay = event.currentTarget as HTMLElement;
  const bounds = overlay.getBoundingClientRect();

  const scaleX = this.overlayWidth / bounds.width;
  const scaleY = this.overlayHeight / bounds.height;

  const cx = (event.clientX - bounds.left) * scaleX;
  const cy = (event.clientY - bounds.top) * scaleY;

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
    }
  }

  resetZone() {
    this.rect = { x: 0, y: 0, w: 0, h: 0 };
    this.result = null;
    this.errorMsg = null;
    if (this.currentStep > 2) this.currentStep = 2;
  }

  // ── Envoi au backend ─────────────────────────────
  sendZoneWithFile() {

  if (!this.selectedFile || !this.hasZone) {
    console.log("❌ File ou zone manquante");
    return;
  }

  this.loading = true;
  this.errorMsg = null;
  this.result = null;

  const zone = {
    x: this.rect.x,
    y: this.rect.y,
    width: this.rect.w,
    height: this.rect.h,
    overlayWidth: this.overlayWidth,
    overlayHeight: this.overlayHeight
  };

  const formData = new FormData();

  formData.append("file", this.selectedFile);
  formData.append("zone", JSON.stringify(zone));

  this.http.post<any>(
    "https://401a-197-28-128-214.ngrok-free.app/api/Bulletins/process-zone-all-pages",
    formData
  ).subscribe({
    next: (res) => {
      console.log("✅ RESULT =>", res);
      this.result = res;
      this.loading = false;
      this.currentStep = 4;
    },
    error: (err) => {
      console.log("❌ BACK ERROR =>", err.error);
      this.errorMsg = err.error?.message || "Erreur serveur";
      this.loading = false;
    }
  });
}


saveModele() {
  if (!this.selectedFile || !this.hasZone || !this.libelle) {
    alert("Libellé + zone obligatoires");
    return;
  }

  const zone = {
  x: Math.round(this.rect.x),
  y: Math.round(this.rect.y),
  width: Math.round(this.rect.w),
  height: Math.round(this.rect.h),
  overlayWidth: Math.round(this.overlayWidth),
  overlayHeight: Math.round(this.overlayHeight)
};

  console.log("ZONE FRONT =>", zone);


  this.modeleService.addModele(this.selectedFile, this.libelle, zone)
    .subscribe({
      next: () => alert("✔ Modèle sauvegardé"),
      error: (err: any) => {
        console.error(err);
        alert("❌ Erreur");
      }
    });
}


}