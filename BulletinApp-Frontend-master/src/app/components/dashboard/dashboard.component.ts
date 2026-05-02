// src/app/components/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { StatistiquesService, Statistiques } from '../../services/statistiques-service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  username: string = '';
  userInitials: string = '';
  
  brouillonsGeneres: number = 0;
  brouillonsEnvoyes: number = 0;
  totalOperations: number = 0;
  derniereMAJ: string = '';
  derniereMAJFormatee: string = '';
  tauxReussite: number = 0;
  loading: boolean = true;
  errorMessage: string = '';
  
  private routerSubscription: Subscription = new Subscription();
  private refreshInterval: any;
  private lastRefreshKey: string = '';

  constructor(
    private statistiquesService: StatistiquesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserInfo();
    this.loadStats();
    
    // 🔥 1. Rafraîchir quand on revient sur la page dashboard
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url === '/dashboard' || event.url === '/app/dashboard') {
          console.log('🔄 Retour au dashboard - rechargement des stats');
          this.loadStats();
        }
      });
    
    // 🔥 2. Vérifier les changements via localStorage (backup)
    this.lastRefreshKey = localStorage.getItem('statsNeedRefresh') || '0';
    this.refreshInterval = setInterval(() => {
      const currentRefresh = localStorage.getItem('statsNeedRefresh') || '0';
      if (currentRefresh !== this.lastRefreshKey) {
        console.log('🔄 Détection changement stats via localStorage');
        this.lastRefreshKey = currentRefresh;
        this.loadStats();
      }
    }, 5000); // toutes les 5 secondes
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadUserInfo() {
    this.username = localStorage.getItem('username') || 'Administrateur';
    if (this.username.startsWith('"') && this.username.endsWith('"')) {
      this.username = this.username.slice(1, -1);
    }
    this.userInitials = this.getInitials(this.username);
  }

  getInitials(name: string): string {
    if (!name) return 'AD';
    if (name.includes('_')) {
      const parts = name.split('_');
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // dashboard.component.ts - Modifie la méthode loadStats()

loadStats() {
  this.loading = true;
  this.errorMessage = '';
  
  console.log('📊 Chargement des statistiques...');
  
  this.statistiquesService.getStats().subscribe({
    next: (stats: any) => {
      console.log('📦 Réponse brute de l\'API:', stats);
      
      // ✅ Utiliser les clés avec MAJUSCULES (comme retourné par l'API)
      this.brouillonsGeneres = stats.BrouillonsGeneres ?? 0;
      this.brouillonsEnvoyes = stats.BrouillonsEnvoyes ?? 0;
      this.totalOperations = stats.TotalOperations ?? 0;
      this.derniereMAJ = stats.DerniereMiseAJour ?? '';
      
      if (this.derniereMAJ) {
        const date = new Date(this.derniereMAJ);
        this.derniereMAJFormatee = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      if (this.brouillonsGeneres > 0) {
        this.tauxReussite = Math.round((this.brouillonsEnvoyes / this.brouillonsGeneres) * 100);
      } else {
        this.tauxReussite = 0;
      }
      
      this.loading = false;
      
      console.log('✅ Stats chargées:', {
        generes: this.brouillonsGeneres,
        envoyes: this.brouillonsEnvoyes,
        total: this.totalOperations
      });
    },
    error: (err: any) => {
      console.error('❌ Erreur chargement stats:', err);
      this.loading = false;
      this.errorMessage = 'Impossible de charger les statistiques';
    }
  });
}


  refreshStats() {
    console.log('🔄 Rafraîchissement manuel');
    this.loadStats();
  }
}