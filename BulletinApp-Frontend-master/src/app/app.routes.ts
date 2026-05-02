import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { UploadComponent } from './components/upload/upload.component';
import { ModeleComponent } from './components/modele/modele.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { GenererEmlComponent } from './components/generer-eml/generer-eml.component';
import { ConfigurationComponent } from './components/configuration/configuration.component';    
import { DashboardComponent } from './components/dashboard/dashboard.component';


export const routes: Routes = [
  // Redirection racine → home
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Pages publiques
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  

  // Pages protégées avec sidebar
  {
    path: 'app',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'upload', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent   },
      { path: 'upload', component: UploadComponent },
      { path: 'modele', component: ModeleComponent },
       { path: 'generer-eml', component: GenererEmlComponent },
       { path: 'configuration', component: ConfigurationComponent },
        { path: 'envoi-brouillons', component: GenererEmlComponent },
   
    ]
  },

  // Fallback
  { path: '**', redirectTo: '/home' }
];