// src/app/components/sidebar/sidebar.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  username: string = 'Administrateur';
  userInitials: string = 'AD';
  employesCount: number = 0;

  constructor(
    private loginService: LoginService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    try {
      const name = this.loginService.getUsername();
      this.username = name || 'Administrateur';
      
      if (this.username.includes('_')) {
        const parts = this.username.split('_');
        this.userInitials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        this.userInitials = this.username.substring(0, 2).toUpperCase();
        if (this.userInitials.length < 2) {
          this.userInitials = this.username.substring(0, 1).toUpperCase() + 'A';
        }
      }
      
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
      this.username = 'Administrateur';
      this.userInitials = 'AD';
    }
  }
}