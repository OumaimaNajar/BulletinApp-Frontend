import { Component, OnInit } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../services/login.service';

@Component({
    selector: 'app-home',
    imports: [RouterLink],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;
  username = '';
  userInitials = '';

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  ngOnInit() {
    // Vérifier l'état de connexion
    this.isLoggedIn = this.loginService.isLoggedIn();
    if (this.isLoggedIn) {
      this.username = this.loginService.getUsername() || 'Admin';
    }
  }

  logout() {
    this.loginService.logout();
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}