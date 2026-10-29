import { Routes } from '@angular/router';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'cart',
    pathMatch: 'full'
  },
  {
    path: 'cart',
    title: 'Carrito de Compras & Proformas | DASFUSION Store',
    loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent)
  },
  {
    path: 'process',
    title: 'Finalizar Compra | DASFUSION Store',
    loadComponent: () => import('./pages/checkout-process/checkout-process.component').then((m) => m.CheckoutProcessComponent)
  },
  {
    path: 'confirmation',
    title: 'Confirmación de Pedido | DASFUSION Store',
    loadComponent: () => import('./pages/order-confirmation/order-confirmation.component').then((m) => m.OrderConfirmationComponent)
  }
];
