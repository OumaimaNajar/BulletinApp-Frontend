import { Component, Input } from '@angular/core';


@Component({
    selector: 'app-stats-row',
    imports: [],
    templateUrl: './stats-row.component.html',
    styleUrls: ['./stats-row.component.css']
})
export class StatsRowComponent {
  @Input() totalEmployes: number = 0;
  @Input() envoyesCeMois: number = 0;
  @Input() enAttente: number = 0;
}