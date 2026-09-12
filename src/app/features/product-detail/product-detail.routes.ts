import { Routes } from '@angular/router';

export const PRODUCT_DETAIL_ROUTES: Routes = [
  {
    path: ':slug',
    loadComponent: () => import('./pages/product-detail/product-detail.component').then((m) => m.ProductDetailComponent)
  }
];
