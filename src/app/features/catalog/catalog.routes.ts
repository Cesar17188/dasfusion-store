import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    title: 'Catálogo Oficial | DASFUSION Store Ecuador',
    loadComponent: () => import('./pages/catalog-list/catalog-list.component').then((m) => m.CatalogListComponent)
  },
  {
    path: ':slug',
    title: 'Detalle de Producto | DASFUSION Store Ecuador',
    loadComponent: () => import('../product-detail/pages/product-detail/product-detail.component').then((m) => m.ProductDetailComponent)
  }
];
