import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'catalog',
        pathMatch: 'full'
      },
      {
        path: 'catalog',
        loadChildren: () => import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES)
      },
      {
        path: 'pc-builder',
        loadChildren: () => import('./features/pc-builder/pc-builder.routes').then((m) => m.PC_BUILDER_ROUTES)
      },
      {
        path: 'checkout',
        loadChildren: () => import('./features/checkout/checkout.routes').then((m) => m.CHECKOUT_ROUTES)
      },
      {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
