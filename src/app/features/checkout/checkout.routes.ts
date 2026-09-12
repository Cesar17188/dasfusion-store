import { Routes } from '@angular/router';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'cart',
    pathMatch: 'full'
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent)
  },
  {
    path: 'process',
    loadComponent: () => import('./pages/checkout-process/checkout-process.component').then((m) => m.CheckoutProcessComponent)
  },
  {
    path: 'confirmation',
    loadComponent: () => import('./pages/order-confirmation/order-confirmation.component').then((m) => m.OrderConfirmationComponent)
  }
];
