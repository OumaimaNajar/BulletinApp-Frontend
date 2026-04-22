import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { UploadComponent } from './components/upload/upload.component';
import { ModeleComponent } from './components/modele/modele.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { AuthGuard } from './guards/auth.guard';

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
      { path: 'upload', component: UploadComponent },
      { path: 'modele', component: ModeleComponent },
    ]
  },

  // Fallback
  { path: '**', redirectTo: '/home' }
];