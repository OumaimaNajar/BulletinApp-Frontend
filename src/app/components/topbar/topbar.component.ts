import { Component, Input } from '@angular/core';


@Component({
    selector: 'app-topbar',
    imports: [],
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {
  @Input() pageTitle: string = 'Gestion des bulletins';
  @Input() pageSubtitle: string = 'Import, détection automatique et envoi par email';
  @Input() selectedModeleLibelle: string = '';
  @Input() showModelStatus: boolean = false;
}