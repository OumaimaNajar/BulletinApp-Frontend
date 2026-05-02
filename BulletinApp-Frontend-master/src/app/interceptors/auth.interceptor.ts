// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  // ✅ Vérifier qu'on est dans le navigateur (pas sur le serveur)
  if (isPlatformBrowser(platformId)) {
    let userEmail = localStorage.getItem('userEmail') || localStorage.getItem('username') || '';
    
    if (userEmail.startsWith('"') && userEmail.endsWith('"')) {
      userEmail = userEmail.slice(1, -1);
    }
    
    console.log('🚀 INTERCEPTEUR APPELE !!!', req.url);
    console.log('📧 Email récupéré:', userEmail);
    
    if (userEmail && userEmail.includes('@')) {
      const clonedRequest = req.clone({
        setHeaders: {
          'X-User-Email': userEmail
        }
      });
      console.log(`🔑 Header ajouté: X-User-Email: ${userEmail}`);
      return next(clonedRequest);
    }
  } else {
    console.log('⚠️ Intercepteur: Exécution côté serveur, localStorage ignoré');
  }
  
  console.warn('⚠️ Aucun email trouvé ou exécution serveur');
  return next(req);
};