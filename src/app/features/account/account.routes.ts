import { Routes } from '@angular/router';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/customer-orders/customer-orders.component').then((m) => m.CustomerOrdersComponent)
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/customer-orders/customer-orders.component').then((m) => m.CustomerOrdersComponent)
  }
];

