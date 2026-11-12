import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES)
  },
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
        path: 'brands',
        loadChildren: () => import('./features/brands/brands.routes').then((m) => m.BRANDS_ROUTES)
      },
      {
        path: 'checkout',
        loadChildren: () => import('./features/checkout/checkout.routes').then((m) => m.CHECKOUT_ROUTES)
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/account/account.routes').then((m) => m.ACCOUNT_ROUTES)
      },
      {
        path: 'account',
        loadChildren: () => import('./features/account/account.routes').then((m) => m.ACCOUNT_ROUTES)
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

