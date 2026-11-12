import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminPaginationComponent } from '../../../../shared/components/admin-pagination/admin-pagination.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminPaginationComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-on-surface tracking-tight">Informes & Reportes Financieros</h1>
          <p class="text-xs sm:text-sm text-outline">Análisis consolidado de ventas a clientes y compras de reabastecimiento a proveedores</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="exportToCSV()"
            class="btn-secondary py-2! px-3! text-xs flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar Datos (CSV)
          </button>
          <button
            (click)="printReport()"
            class="btn-primary py-2! px-4! text-xs flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Informe
          </button>
        </div>
      </div>

      <!-- Tab Switcher: Ventas vs Compras -->
      <div class="flex items-center gap-2 border-b border-outline-variant/40 pb-2">
        <button
          (click)="activeTab.set('sales')"
          [class.text-primary]="activeTab() === 'sales'"
          [class.border-b-2]="activeTab() === 'sales'"
          [class.border-primary]="activeTab() === 'sales'"
          [class.font-bold]="activeTab() === 'sales'"
          class="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition flex items-center gap-2 cursor-pointer"
        >
          <span>📈 Tabla de Ventas a Clientes</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-primary-container text-primary">
            {{ adminService.salesOrders().length }}
          </span>
        </button>

        <button
          (click)="activeTab.set('purchases')"
          [class.text-primary]="activeTab() === 'purchases'"
          [class.border-b-2]="activeTab() === 'purchases'"
          [class.border-primary]="activeTab() === 'purchases'"
          [class.font-bold]="activeTab() === 'purchases'"
          class="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition flex items-center gap-2 cursor-pointer"
        >
          <span>📉 Tabla de Compras a Proveedores</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            {{ adminService.purchaseOrders().length }}
          </span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: INFORMES DE VENTAS -->
      <!-- ========================================================================= -->
      @if (activeTab() === 'sales') {
        <div class="space-y-6">
          <!-- Summary Metrics Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="das-card p-4">
              <span class="text-[11px] font-bold text-outline uppercase">Facturación Total (Ventas)</span>
              <div class="text-2xl font-bold text-emerald-400 mt-1">
                {{ adminService.totalRevenue() | currency:'USD':'symbol':'1.2-2' }}
              </div>
              <p class="text-[11px] text-outline mt-1">{{ totalActiveSalesCount() }} pedidos efectivos</p>
            </div>

            <div class="das-card p-4">
              <span class="text-[11px] font-bold text-outline uppercase">Impuestos Recaudados (IVA)</span>
              <div class="text-2xl font-bold text-primary mt-1">
                {{ totalTaxCollected() | currency:'USD':'symbol':'1.2-2' }}
              </div>
              <p class="text-[11px] text-outline mt-1">Retenciones fiscales</p>
            </div>

            <div class="das-card p-4">
              <span class="text-[11px] font-bold text-outline uppercase">Ticket Promedio por Venta</span>
              <div class="text-2xl font-bold text-on-surface mt-1">
                {{ averageTicket() | currency:'USD':'symbol':'1.2-2' }}
              </div>
              <p class="text-[11px] text-outline mt-1">Promedio por orden</p>
            </div>

            <div class="das-card p-4">
              <span class="text-[11px] font-bold text-outline uppercase">Total Ítems Vendidos</span>
              <div class="text-2xl font-bold text-tertiary mt-1">
                {{ totalItemsSold() }} uds.
              </div>
              <p class="text-[11px] text-outline mt-1">Componentes entregados</p>
            </div>
          </div>

          <!-- Sales Table -->
          <div class="das-card overflow-hidden">
            <div class="p-4 border-b border-outline-variant/40 flex items-center justify-between">
              <h3 class="font-bold text-sm text-on-surface">Registro Detallado de Órdenes de Venta (Sales Orders)</h3>
              <span class="text-xs text-outline">{{ adminService.salesOrders().length }} registros</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-on-surface-variant">
                <thead class="bg-surface-container-low text-outline uppercase text-[11px] border-b border-outline-variant/40">
                  <tr>
                    <th class="py-3 px-4">Factura / ID</th>
                    <th class="py-3 px-4">Fecha & Hora</th>
                    <th class="py-3 px-4">Cliente</th>
                    <th class="py-3 px-4">Subtotal</th>
                    <th class="py-3 px-4">IVA</th>
                    <th class="py-3 px-4">Total Pagado</th>
                    <th class="py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/30">
                  @for (order of paginatedSalesOrders(); track order.id) {
                    <tr class="hover:bg-surface-container/60 transition">
                      <td class="py-3.5 px-4 font-mono font-bold text-primary">
                        #{{ order.id.slice(0, 8).toUpperCase() }}
                      </td>
                      <td class="py-3.5 px-4">
                        {{ order.created_at | date:'dd/MM/yyyy HH:mm' }}
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="font-semibold text-on-surface">{{ order.customer?.first_name }} {{ order.customer?.last_name }}</div>
                        <div class="text-[11px] text-outline">{{ order.customer?.phone || 'Sin tel' }}</div>
                      </td>
                      <td class="py-3.5 px-4">
                        {{ order.subtotal | currency:'USD':'symbol':'1.2-2' }}
                      </td>
                      <td class="py-3.5 px-4 text-outline">
                        {{ order.tax | currency:'USD':'symbol':'1.2-2' }}
                      </td>
                      <td class="py-3.5 px-4 font-bold text-emerald-400">
                        {{ order.total | currency:'USD':'symbol':'1.2-2' }}
                      </td>
                      <td class="py-3.5 px-4">
                        <span
                          [class.bg-amber-950]="order.status === 'pending'"
                          [class.text-amber-300]="order.status === 'pending'"
                          [class.bg-sky-950]="order.status === 'processing'"
                          [class.text-sky-300]="order.status === 'processing'"
                          [class.bg-emerald-950]="order.status === 'delivered'"
                          [class.text-emerald-300]="order.status === 'delivered'"
                          class="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold"
                        >
                          {{ order.status }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="text-center py-8 text-outline">Sin ventas registradas.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-admin-pagination
              [currentPage]="salesPage()"
              [totalItems]="adminService.salesOrders().length"
              [pageSize]="pageSize"
              (pageChange)="salesPage.set($event)"
            ></app-admin-pagination>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- TAB 2: INFORMES DE COMPRAS A PROVEEDORES -->
      <!-- ========================================================================= -->
      @if (activeTab() === 'purchases') {
        <div class="space-y-6">
          <!-- Summary Metrics Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="das-card p-4">
              <span class="text-[11px] font-bold text-outline uppercase">Gasto Total en Compras</span>
              <div class="text-2xl font-bold text-rose-400 mt-1">
                {{ adminService.totalPurchases() | currency:'USD':'symbol':'1.2-2' }}
              </div>
              <p class="text-[11px] text-outline mt-1">Reabastecimiento de inventario</p>
            </div>

            <div class="das-card p-4">
              <span class="text-[11px] font-bold text-outline uppercase">Órdenes de Compra Emitidas</span>
              <div class="text-2xl font-bold text-primary mt-1">
                {{ adminService.purchaseOrders().length }} órdenes
              </div>
              <p class="text-[11px] text-outline mt-1">Con proveedores mayoristas</p>
            </div>

            <div class="das-card p-4">
              <span class="text-[11px] font-bold text-outline uppercase">Proveedores Activos</span>
              <div class="text-2xl font-bold text-on-surface mt-1">
                {{ adminService.suppliers().length }} empresas
              </div>
              <p class="text-[11px] text-outline mt-1">Distribuidores autorizados</p>
            </div>
          </div>

          <!-- Purchase Orders Table -->
          <div class="das-card overflow-hidden">
            <div class="p-4 border-b border-outline-variant/40 flex items-center justify-between">
              <h3 class="font-bold text-sm text-on-surface">Órdenes de Compra a Proveedores (Purchase Orders)</h3>
              <span class="text-xs text-outline">{{ adminService.purchaseOrders().length }} órdenes</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-on-surface-variant">
                <thead class="bg-surface-container-low text-outline uppercase text-[11px] border-b border-outline-variant/40">
                  <tr>
                    <th class="py-3 px-4">ID Orden</th>
                    <th class="py-3 px-4">Fecha Compra</th>
                    <th class="py-3 px-4">Proveedor / Mayorista</th>
                    <th class="py-3 px-4">NIT / Tax ID</th>
                    <th class="py-3 px-4">Contacto</th>
                    <th class="py-3 px-4">Total Comprado</th>
                    <th class="py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/30">
                  @for (po of paginatedPurchaseOrders(); track po.id) {
                    <tr class="hover:bg-surface-container/60 transition">
                      <td class="py-3.5 px-4 font-mono font-bold text-primary">
                        #{{ po.id }}
                      </td>
                      <td class="py-3.5 px-4">
                        {{ po.purchased_at | date:'dd/MM/yyyy' }}
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="font-semibold text-on-surface">{{ po.supplier?.business_name || 'Proveedor General' }}</div>
                        <div class="text-[11px] text-outline">{{ po.supplier?.email }}</div>
                      </td>
                      <td class="py-3.5 px-4 font-mono text-outline">
                        {{ po.supplier?.tax_id || 'N/A' }}
                      </td>
                      <td class="py-3.5 px-4 text-on-surface">
                        {{ po.supplier?.contact_name || po.supplier?.phone || '-' }}
                      </td>
                      <td class="py-3.5 px-4 font-bold text-rose-400">
                        {{ po.total_amount | currency:'USD':'symbol':'1.2-2' }}
                      </td>
                      <td class="py-3.5 px-4">
                        <span class="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          {{ po.status }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="text-center py-8 text-outline">No hay órdenes de compra registradas.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-admin-pagination
              [currentPage]="purchasesPage()"
              [totalItems]="adminService.purchaseOrders().length"
              [pageSize]="pageSize"
              (pageChange)="purchasesPage.set($event)"
            ></app-admin-pagination>
          </div>

          <!-- Suppliers Directory Table -->
          <div class="das-card overflow-hidden">
            <div class="p-4 border-b border-outline-variant/40">
              <h3 class="font-bold text-sm text-on-surface">Directorio de Proveedores y Distribuidores (Suppliers)</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-on-surface-variant">
                <thead class="bg-surface-container-low text-outline uppercase text-[11px] border-b border-outline-variant/40">
                  <tr>
                    <th class="py-2.5 px-4">Razón Social</th>
                    <th class="py-2.5 px-4">Contacto</th>
                    <th class="py-2.5 px-4">Email</th>
                    <th class="py-2.5 px-4">Teléfono</th>
                    <th class="py-2.5 px-4">NIT / RUT</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/20">
                  @for (sup of paginatedSuppliers(); track sup.id) {
                    <tr>
                      <td class="py-3 px-4 font-bold text-on-surface">{{ sup.business_name }}</td>
                      <td class="py-3 px-4">{{ sup.contact_name || '-' }}</td>
                      <td class="py-3 px-4 text-primary">{{ sup.email || '-' }}</td>
                      <td class="py-3 px-4">{{ sup.phone || '-' }}</td>
                      <td class="py-3 px-4 font-mono text-outline">{{ sup.tax_id || '-' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-admin-pagination
              [currentPage]="suppliersPage()"
              [totalItems]="adminService.suppliers().length"
              [pageSize]="pageSize"
              (pageChange)="suppliersPage.set($event)"
            ></app-admin-pagination>
          </div>
        </div>
      }
    </div>
  `
})
export class ReportsComponent {
  readonly adminService = inject(AdminService);

  activeTab = signal<'sales' | 'purchases'>('sales');
  readonly pageSize = 10;
  readonly salesPage = signal<number>(1);
  readonly purchasesPage = signal<number>(1);
  readonly suppliersPage = signal<number>(1);

  readonly paginatedSalesOrders = computed(() => {
    const list = this.adminService.salesOrders();
    const totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    const safePage = Math.max(1, Math.min(this.salesPage(), totalPages));
    const start = (safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  readonly paginatedPurchaseOrders = computed(() => {
    const list = this.adminService.purchaseOrders();
    const totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    const safePage = Math.max(1, Math.min(this.purchasesPage(), totalPages));
    const start = (safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  readonly paginatedSuppliers = computed(() => {
    const list = this.adminService.suppliers();
    const totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    const safePage = Math.max(1, Math.min(this.suppliersPage(), totalPages));
    const start = (safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  readonly totalActiveSalesCount = computed(() => {
    return this.adminService.salesOrders().filter((o) => o.status !== 'cancelled').length;
  });

  readonly totalTaxCollected = computed(() => {
    return this.adminService.salesOrders()
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.tax || 0), 0);
  });

  readonly averageTicket = computed(() => {
    const count = this.totalActiveSalesCount();
    if (count === 0) return 0;
    return this.adminService.totalRevenue() / count;
  });

  readonly totalItemsSold = computed(() => {
    return this.adminService.salesOrders()
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.items?.reduce((iSum, it) => iSum + it.quantity, 0) || 0), 0);
  });

  exportToCSV(): void {
    const isSales = this.activeTab() === 'sales';
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (isSales) {
      csvContent += 'ID,Fecha,Cliente,Subtotal,Impuestos,Total,Estado\n';
      this.adminService.salesOrders().forEach((o) => {
        const custName = o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : 'General';
        csvContent += `"${o.id}","${o.created_at}","${custName}",${o.subtotal},${o.tax},${o.total},"${o.status}"\n`;
      });
    } else {
      csvContent += 'ID,Fecha,Proveedor,Contacto,NIT,Total,Estado\n';
      this.adminService.purchaseOrders().forEach((p) => {
        const supName = p.supplier ? p.supplier.business_name : 'General';
        csvContent += `"${p.id}","${p.purchased_at}","${supName}","${p.supplier?.contact_name || ''}","${p.supplier?.tax_id || ''}",${p.total_amount},"${p.status}"\n`;
      });
    }

    if (typeof window !== 'undefined') {
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', isSales ? 'reporte_ventas_dasfusion.csv' : 'reporte_compras_dasfusion.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  printReport(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
