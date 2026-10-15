import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminSalesOrderWithDetails } from '../../../../core/services/admin.service';
import { TaxService } from '../../../../core/services/tax.service';
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

      <!-- Tax / IVA Active Policy Configuration Panel -->
      <div
        class="das-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-l-4 transition-all"
        [class.border-l-primary]="!taxService.isSpecialRate()"
        [class.border-l-amber-400]="taxService.isSpecialRate()"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-bold uppercase tracking-wider text-outline">Tarifa de IVA para Nuevos Pedidos y Tienda</span>
            <span
              class="px-2 py-0.5 rounded-full text-xs font-bold font-mono border"
              [class.bg-emerald-500/10]="!taxService.isSpecialRate()"
              [class.text-emerald-400]="!taxService.isSpecialRate()"
              [class.border-emerald-500/20]="!taxService.isSpecialRate()"
              [class.bg-amber-500/20]="taxService.isSpecialRate()"
              [class.text-amber-300]="taxService.isSpecialRate()"
              [class.border-amber-500/40]="taxService.isSpecialRate()"
            >
              {{ taxService.taxPercentage() }}% Vigente
            </span>
            @if (taxService.isSpecialRate()) {
              <span class="px-2 py-0.5 rounded text-[10px] bg-amber-400 text-black font-extrabold uppercase animate-pulse">
                ⚡ Tarifa Especial Activa
              </span>
            }
          </div>
          <p class="text-xs text-on-surface-variant">
            Motivo actual: <strong class="text-white">{{ taxService.taxReason() }}</strong>. 
            Aplica a nuevos pedidos web, catálogo de productos y ventas en mostrador (POS).
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            (click)="taxService.setTaxRate(0.15, 'Tarifa Estándar SRI (15%)')"
            [class.bg-primary-container]="taxService.taxRate() === 0.15"
            [class.text-[#aec7f7]]="taxService.taxRate() === 0.15"
            [class.border-[#aec7f7]/50]="taxService.taxRate() === 0.15"
            class="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-container text-on-surface border border-outline-variant/40 hover:bg-surface-container-high transition cursor-pointer"
          >
            15% Estándar
          </button>
          <button
            type="button"
            (click)="taxService.setTaxRate(0, 'Día Sin IVA / Exoneración (0%)')"
            [class.bg-emerald-500/20]="taxService.taxRate() === 0"
            [class.text-emerald-300]="taxService.taxRate() === 0"
            [class.border-emerald-500/50]="taxService.taxRate() === 0"
            class="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-container text-on-surface border border-outline-variant/40 hover:bg-surface-container-high transition cursor-pointer"
          >
            0% Días Sin IVA
          </button>
          <button
            type="button"
            (click)="openCustomTaxModal()"
            class="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-container text-outline hover:text-white border border-outline-variant/40 hover:bg-surface-container-high transition cursor-pointer"
          >
            ⚙️ Personalizar
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

          <!-- Totals Breakdown & Adjust Tax for this Order -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-outline-variant/40">
            <!-- Individual Order Tax Recalculation -->
            <div class="space-y-1.5 p-3 rounded-xl bg-[#121316] border border-outline-variant/30 text-xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-outline block">Ajustar IVA de esta Orden:</span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  (click)="onAdjustOrderTax(selectedOrder()!.id, 0.15)"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface transition cursor-pointer"
                  title="Fijar IVA en 15% estándar"
                >
                  15% (Estándar)
                </button>
                <button
                  type="button"
                  (click)="onAdjustOrderTax(selectedOrder()!.id, 0)"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition cursor-pointer"
                  title="Fijar IVA en 0% (Día Sin IVA o exonerado)"
                >
                  0% (Sin IVA)
                </button>
              </div>
            </div>

            <div class="w-64 space-y-1.5 text-xs text-on-surface-variant">
              <div class="flex justify-between">
                <span>Subtotal Neto:</span>
                <span>{{ selectedOrder()!.subtotal | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Impuestos (IVA):</span>
                <span class="font-medium font-mono text-on-surface">{{ selectedOrder()!.tax | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-sm font-bold text-[#e3e2e6] border-t border-outline-variant/40 pt-1.5">
                <span>Total Factura:</span>
                <span class="text-emerald-400 font-mono">{{ selectedOrder()!.total | currency:'USD':'symbol':'1.2-2' }}</span>
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

    <!-- Custom Tax Modal -->
    @if (isCustomTaxModalOpen()) {
      <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="w-full max-w-md das-card p-6 space-y-4 border border-outline-variant/60 shadow-2xl animate-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between pb-3 border-b border-outline-variant/40">
            <h3 class="text-base font-bold text-[#e3e2e6]">Ajustar Tarifa de IVA Vigente</h3>
            <button
              type="button"
              (click)="isCustomTaxModalOpen.set(false)"
              class="text-outline hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p class="text-xs text-outline">
            Configura el porcentaje de IVA para la tienda. Se aplicará a todos los cálculos de catálogo, checkout y pedidos nuevos.
          </p>

          <div class="space-y-3">
            <div>
              <label class="text-xs font-semibold text-outline block mb-1">Porcentaje de IVA (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                [ngModel]="customTaxInput()"
                (ngModelChange)="customTaxInput.set($event)"
                placeholder="Ej. 12, 15"
                class="das-input text-sm font-mono w-full"
              />
            </div>

            <div>
              <label class="text-xs font-semibold text-outline block mb-1">Motivo / Nombre de la Fecha Especial</label>
              <input
                type="text"
                [ngModel]="customTaxReason()"
                (ngModelChange)="customTaxReason.set($event)"
                placeholder="Ej. Cyber Day Sin IVA, Exoneración..."
                class="das-input text-xs w-full"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/40">
            <button
              type="button"
              (click)="isCustomTaxModalOpen.set(false)"
              class="btn-secondary py-2! px-4! text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="applyCustomTax()"
              class="btn-primary py-2! px-5! text-xs cursor-pointer"
            >
              Guardar Tarifa
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class OrdersManagementComponent {
  readonly adminService = inject(AdminService);
  readonly taxService = inject(TaxService);

  searchQuery = signal<string>('');
  selectedStatusFilter = signal<string>('ALL');
  selectedOrder = signal<AdminSalesOrderWithDetails | null>(null);

  isCustomTaxModalOpen = signal<boolean>(false);
  customTaxInput = signal<number>(15);
  customTaxReason = signal<string>('Tarifa Estándar SRI (15%)');

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

  async onAdjustOrderTax(orderId: string, rate: number): Promise<void> {
    await this.adminService.updateOrderTax(orderId, rate);
    const updated = this.adminService.salesOrders().find((o) => o.id === orderId);
    if (updated) {
      this.selectedOrder.set(updated);
    }
  }

  openCustomTaxModal(): void {
    this.customTaxInput.set(this.taxService.taxPercentage());
    this.customTaxReason.set(this.taxService.taxReason());
    this.isCustomTaxModalOpen.set(true);
  }

  applyCustomTax(): void {
    const pct = this.customTaxInput();
    const rate = pct / 100;
    const reason = this.customTaxReason().trim() || `Tarifa Especial (${pct}%)`;
    this.taxService.setTaxRate(rate, reason);
    this.isCustomTaxModalOpen.set(false);
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
