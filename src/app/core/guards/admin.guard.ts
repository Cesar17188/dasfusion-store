import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Await initialization so page refresh doesn't bounce user before session is checked
  await authService.waitForInit();

  // If user is authenticated, refresh live from DB in case role was updated in Supabase
  if (authService.isAuthenticated()) {
    await authService.refreshProfile();
  }

  // If user is authenticated and has admin role
  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // If authenticated but not admin, redirect to catalog with queryParams
  if (authService.isAuthenticated()) {
    console.warn('Usuario autenticado pero sin rol admin en DB:', authService.currentUser()?.email, authService.currentUser()?.role);
    return router.createUrlTree(['/catalog'], {
      queryParams: { accessDenied: 'admin_required' }
    });
  }

  // Not logged in, redirect to login with returnUrl
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};
