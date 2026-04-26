import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { LoginService } from '../../services/login.service';

@Component({
    selector: 'app-layout',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  username: string = '';
  userInitials: string = '';

  constructor(private loginService: LoginService) {}

  ngOnInit(): void {
    const name = this.loginService.getUsername();
    this.username = name || 'Administrateur';
    this.userInitials = this.getInitials(this.username);
  }

  private getInitials(name: string): string {
    // "bulletin_U1003" → "BU"  |  "Administrateur" → "AD"  |  "RH" → "RH"
    if (name.includes('_')) {
      const parts = name.split('_');
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}