import { Routes } from '@angular/router';

export const BRANDS_ROUTES: Routes = [
  {
    path: '',
    title: 'Marcas Oficiales | DASFUSION Store Ecuador',
    loadComponent: () =>
      import('./pages/brands-list/brands-list.component').then((m) => m.BrandsListComponent)
  }
];

