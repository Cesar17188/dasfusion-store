import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminSalesOrderWithDetails } from '../../../../core/services/admin.service';
import { OrderStatus } from '../../../../core/models/supabase.model';

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-[#e3e2e6] tracking-tight">Manejo de Pedidos & Ventas</h1>
          <p class="text-xs sm:text-sm text-outline">Control de órdenes de compra de clientes, seguimiento logístico y estados</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            (click)="refreshOrders()"
            class="btn-secondary py-2! px-3! text-xs flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refrescar Pedidos
          </button>
        </div>
      </div>

      <!-- Quick Metrics Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="das-card p-4">
          <span class="text-[11px] font-bold text-outline uppercase">Ingresos Totales</span>
          <div class="text-xl font-bold text-[#aec7f7] mt-1">{{ adminService.totalRevenue() | currency:'USD':'symbol':'1.2-2' }}</div>
        </div>
        <div class="das-card p-4">
          <span class="text-[11px] font-bold text-outline uppercase">Pendientes</span>
          <div class="text-xl font-bold text-amber-300 mt-1">{{ countByStatus('pending') }}</div>
        </div>
        <div class="das-card p-4">
          <span class="text-[11px] font-bold text-outline uppercase">En Preparación</span>
          <div class="text-xl font-bold text-sky-400 mt-1">{{ countByStatus('processing') }}</div>
        </div>
        <div class="das-card p-4">
          <span class="text-[11px] font-bold text-outline uppercase">Entregados</span>
          <div class="text-xl font-bold text-emerald-400 mt-1">{{ countByStatus('delivered') }}</div>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="das-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div class="relative w-full md:w-80">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar por ID, cliente, dirección..."
            class="das-input text-xs pl-9"
          />
          <svg class="absolute left-3 top-2.5 w-4 h-4 text-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            (click)="selectedStatusFilter.set('ALL')"
            [class.bg-primary-container]="selectedStatusFilter() === 'ALL'"
            [class.text-[#aec7f7]]="selectedStatusFilter() === 'ALL'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer"
          >
            Todos ({{ adminService.salesOrders().length }})
          </button>
          <button
            (click)="selectedStatusFilter.set('pending')"
            [class.bg-amber-950]="selectedStatusFilter() === 'pending'"
            [class.text-amber-300]="selectedStatusFilter() === 'pending'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer"
          >
            Pendientes
          </button>
          <button
            (click)="selectedStatusFilter.set('processing')"
            [class.bg-sky-950]="selectedStatusFilter() === 'processing'"
            [class.text-sky-300]="selectedStatusFilter() === 'processing'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer"
          >
            Procesando
          </button>
          <button
            (click)="selectedStatusFilter.set('delivered')"
            [class.bg-emerald-950]="selectedStatusFilter() === 'delivered'"
            [class.text-emerald-300]="selectedStatusFilter() === 'delivered'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer"
          >
            Entregados
          </button>
        </div>
      </div>

      <!-- Orders Data Table -->
      <div class="das-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-on-surface-variant">
            <thead class="bg-surface-container-low text-outline uppercase text-[11px] border-b border-outline-variant/40">
              <tr>
                <th class="py-3 px-4">ID Pedido</th>
                <th class="py-3 px-4">Fecha</th>
                <th class="py-3 px-4">Cliente</th>
                <th class="py-3 px-4">Dirección</th>
                <th class="py-3 px-4">Ítems</th>
                <th class="py-3 px-4">Total</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/30">
              @for (order of filteredOrders(); track order.id) {
                <tr class="hover:bg-surface-container/60 transition">
                  <td class="py-3.5 px-4 font-mono font-bold text-[#aec7f7]">
                    #{{ order.id.slice(0, 8) }}
                  </td>
                  <td class="py-3.5 px-4">
                    {{ order.created_at | date:'dd/MM/yyyy HH:mm' }}
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="font-medium text-[#e3e2e6]">
                      {{ order.customer ? (order.customer.first_name + ' ' + order.customer.last_name) : 'Cliente General' }}
                    </div>
                    <div class="text-[11px] text-outline">{{ order.customer?.phone || '' }}</div>
                  </td>
                  <td class="py-3.5 px-4 max-w-xs truncate text-[11px] text-outline">
                    {{ order.shipping_address }}
                  </td>
                  <td class="py-3.5 px-4 font-semibold text-[#e3e2e6]">
                    {{ order.items.length }} producto(s)
                  </td>
                  <td class="py-3.5 px-4 font-bold text-[#e3e2e6]">
                    {{ order.total | currency:'USD':'symbol':'1.2-2' }}
                  </td>
                  <td class="py-3.5 px-4">
                    <select
                      [ngModel]="order.status"
                      (ngModelChange)="onUpdateStatus(order.id, $event)"
                      [class.bg-amber-950]="order.status === 'pending'"
                      [class.text-amber-300]="order.status === 'pending'"
                      [class.bg-sky-950]="order.status === 'processing'"
                      [class.text-sky-300]="order.status === 'processing'"
                      [class.bg-indigo-950]="order.status === 'shipped'"
                      [class.text-indigo-300]="order.status === 'shipped'"
                      [class.bg-emerald-950]="order.status === 'delivered'"
                      [class.text-emerald-300]="order.status === 'delivered'"
                      [class.bg-rose-950]="order.status === 'cancelled'"
                      [class.text-rose-300]="order.status === 'cancelled'"
                      class="border border-outline-variant text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#aec7f7]"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="processing">En Proceso</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <button
                      (click)="viewOrderDetails(order)"
                      class="px-2.5 py-1 rounded bg-surface-container-high hover:bg-[#343538] text-[#aec7f7] font-semibold text-xs transition cursor-pointer"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="text-center py-8 text-outline">
                    No se encontraron pedidos con los filtros aplicados.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Order Details Modal / Invoice Breakdown -->
    @if (selectedOrder()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-2xl space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-4">
            <div>
              <span class="text-xs uppercase font-bold text-[#aec7f7] tracking-wider">Detalle del Pedido</span>
              <h3 class="text-lg font-bold text-[#e3e2e6] font-mono">#{{ selectedOrder()!.id }}</h3>
            </div>
            <button (click)="selectedOrder.set(null)" class="text-outline hover:text-white text-lg">✕</button>
          </div>

          <!-- Customer Info & Shipping -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#121316] p-4 rounded-xl border border-outline-variant/30 text-xs">
            <div class="space-y-1">
              <span class="text-outline font-bold uppercase text-[10px]">Cliente</span>
              <div class="font-semibold text-[#e3e2e6]">
                {{ selectedOrder()!.customer ? (selectedOrder()!.customer!.first_name + ' ' + selectedOrder()!.customer!.last_name) : 'Venta General' }}
              </div>
              <div class="text-outline">{{ selectedOrder()!.customer?.phone || 'Sin teléfono' }}</div>
            </div>
            <div class="space-y-1">
              <span class="text-outline font-bold uppercase text-[10px]">Dirección de Entrega</span>
              <div class="text-on-surface-variant">{{ selectedOrder()!.shipping_address }}</div>
              <div class="text-outline">{{ selectedOrder()!.created_at | date:'medium' }}</div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-outline">Productos Incluidos</h4>
            <div class="border border-outline-variant/40 rounded-xl overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-[#121316] text-outline text-[11px]">
                  <tr>
                    <th class="py-2.5 px-3">Producto / Variante</th>
                    <th class="py-2.5 px-3 text-center">Cant.</th>
                    <th class="py-2.5 px-3 text-right">Precio Unit.</th>
                    <th class="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/20">
                  @for (item of selectedOrder()!.items; track item.id) {
                    <tr>
                      <td class="py-2.5 px-3">
                        <div class="font-semibold text-[#e3e2e6]">{{ item.variant?.variant_name || item.product?.model || 'Hardware Component' }}</div>
                        <div class="text-[10px] text-outline font-mono">SKU: {{ item.variant?.sku || 'N/A' }}</div>
                      </td>
                      <td class="py-2.5 px-3 text-center font-bold">{{ item.quantity }}</td>
                      <td class="py-2.5 px-3 text-right">{{ item.unit_price | currency:'USD':'symbol':'1.2-2' }}</td>
                      <td class="py-2.5 px-3 text-right font-bold text-[#aec7f7]">
                        {{ (item.unit_price * item.quantity) | currency:'USD':'symbol':'1.2-2' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Totals Breakdown -->
          <div class="flex justify-end pt-2">
            <div class="w-64 space-y-1.5 text-xs text-on-surface-variant">
              <div class="flex justify-between">
                <span>Subtotal:</span>
                <span>{{ selectedOrder()!.subtotal | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Impuestos (IVA):</span>
                <span>{{ selectedOrder()!.tax | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-sm font-bold text-[#e3e2e6] border-t border-outline-variant/40 pt-1.5">
                <span>Total Factura:</span>
                <span class="text-emerald-400">{{ selectedOrder()!.total | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="flex items-center justify-between pt-4 border-t border-outline-variant/40">
            <button
              (click)="printInvoice()"
              class="btn-secondary py-2! px-4! text-xs flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Recibo
            </button>
            <button
              (click)="selectedOrder.set(null)"
              class="btn-primary py-2! px-5! text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class OrdersManagementComponent {
  readonly adminService = inject(AdminService);

  searchQuery = signal<string>('');
  selectedStatusFilter = signal<string>('ALL');
  selectedOrder = signal<AdminSalesOrderWithDetails | null>(null);

  readonly filteredOrders = computed(() => {
    let list = this.adminService.salesOrders();
    const filter = this.selectedStatusFilter();
    const query = this.searchQuery().toLowerCase().trim();

    if (filter !== 'ALL') {
      list = list.filter((o) => o.status === filter);
    }

    if (query) {
      list = list.filter((o) => {
        const idMatch = o.id.toLowerCase().includes(query);
        const customerName = o.customer ? `${o.customer.first_name} ${o.customer.last_name}`.toLowerCase() : '';
        const addrMatch = o.shipping_address.toLowerCase().includes(query);
        return idMatch || customerName.includes(query) || addrMatch;
      });
    }

    return list;
  });

  countByStatus(status: OrderStatus): number {
    return this.adminService.salesOrders().filter((o) => o.status === status).length;
  }

  async refreshOrders(): Promise<void> {
    await this.adminService.fetchSalesOrders();
  }

  async onUpdateStatus(orderId: string, status: OrderStatus): Promise<void> {
    await this.adminService.updateOrderStatus(orderId, status);
  }

  viewOrderDetails(order: AdminSalesOrderWithDetails): void {
    this.selectedOrder.set(order);
  }

  printInvoice(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
