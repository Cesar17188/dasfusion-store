import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/catalog-list/catalog-list.component').then((m) => m.CatalogListComponent)
  },
  {
    path: ':slug',
    loadComponent: () => import('../product-detail/pages/product-detail/product-detail.component').then((m) => m.ProductDetailComponent)
  }
];
