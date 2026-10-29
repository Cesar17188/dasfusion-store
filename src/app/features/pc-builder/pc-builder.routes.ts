import { Routes } from '@angular/router';

export const PC_BUILDER_ROUTES: Routes = [
  {
    path: '',
    title: 'PC Builder Pro | Configurador de PC en Ecuador | DASFUSION Store',
    loadComponent: () => import('./pages/pc-builder/pc-builder.component').then((m) => m.PcBuilderComponent)
  }
];
