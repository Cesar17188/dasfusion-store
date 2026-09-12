import { Routes } from '@angular/router';

export const PC_BUILDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/pc-builder/pc-builder.component').then((m) => m.PcBuilderComponent)
  }
];
