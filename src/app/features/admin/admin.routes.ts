import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'crm',
        pathMatch: 'full'
      },
      {
        path: 'crm',
        loadComponent: () =>
          import('./pages/crm-dashboard/crm-dashboard.component').then((m) => m.CrmDashboardComponent)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders/orders-management.component').then((m) => m.OrdersManagementComponent)
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/inventory/inventory-management.component').then((m) => m.InventoryManagementComponent)
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./pages/pos-invoicing/pos-invoicing.component').then((m) => m.PosInvoicingComponent)
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./pages/customers/customers-management.component').then((m) => m.CustomersManagementComponent)
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component').then((m) => m.ReportsComponent)
      }
    ]
  }
];
