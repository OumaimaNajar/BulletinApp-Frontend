import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {
  @Input() pageTitle: string = 'Gestion des bulletins';
  @Input() pageSubtitle: string = 'Import, détection automatique et envoi par email';
  @Input() selectedModeleLibelle: string = '';
  @Input() showModelStatus: boolean = false;
}