import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminSalesOrderWithDetails } from '../../../../core/services/admin.service';
import { DbProfile, DbCrmLead, DbCrmSupportTicket, DbCrmInteraction } from '../../../../core/models/supabase.model';

@Component({
  selector: 'app-customers-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-on-surface tracking-tight">Directorio & Manejo de Clientes</h1>
          <p class="text-xs sm:text-sm text-outline">Base de clientes registrados, historial de compras, tickets de soporte y notas CRM</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            (click)="isCreateModalOpen.set(true)"
            class="btn-primary py-2! px-4! text-xs flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Nuevo Cliente
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="das-card p-4">
          <span class="text-[11px] font-bold text-outline uppercase">Total Clientes Registrados</span>
          <div class="text-2xl font-bold text-on-surface mt-1">{{ adminService.customers().length }}</div>
        </div>
        <div class="das-card p-4">
          <span class="text-[11px] font-bold text-outline uppercase">Clientes con Compras</span>
          <div class="text-2xl font-bold text-primary mt-1">
            {{ activeBuyersCount() }}
          </div>
        </div>
        <div class="das-card p-4">
          <span class="text-[11px] font-bold text-outline uppercase">Valor Total Comprado</span>
          <div class="text-2xl font-bold text-emerald-400 mt-1">
            {{ adminService.totalRevenue() | currency:'USD':'symbol':'1.0-0' }}
          </div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="das-card p-4">
        <div class="relative w-full max-w-md">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar por nombre, teléfono, ciudad o dirección..."
            class="das-input text-xs pl-9"
          />
          <svg class="absolute left-3 top-2.5 w-4 h-4 text-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="das-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-on-surface-variant">
            <thead class="bg-surface-container-low text-outline uppercase text-[11px] border-b border-outline-variant/40">
              <tr>
                <th class="py-3 px-4">Cliente / Contacto</th>
                <th class="py-3 px-4">Teléfono</th>
                <th class="py-3 px-4">Dirección Principal</th>
                <th class="py-3 px-4">Pedidos Realizados</th>
                <th class="py-3 px-4">Total Invertido</th>
                <th class="py-3 px-4">Fecha Registro</th>
                <th class="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/30">
              @for (cust of filteredCustomers(); track cust.id) {
                <tr class="hover:bg-surface-container/60 transition">
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-2.5">
                      <div class="h-8 w-8 rounded-full bg-primary-container text-primary font-bold flex items-center justify-center text-xs">
                        {{ cust.first_name.charAt(0) }}{{ cust.last_name.charAt(0) }}
                      </div>
                      <div>
                        <div class="font-bold text-on-surface">{{ cust.first_name }} {{ cust.last_name }}</div>
                        <span class="text-[10px] text-outline uppercase">{{ cust.role }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 text-on-surface">
                    {{ cust.phone || 'No registrado' }}
                  </td>
                  <td class="py-3.5 px-4 text-outline max-w-xs truncate">
                    {{ cust.address || 'Sin dirección' }}
                  </td>
                  <td class="py-3.5 px-4 font-semibold text-primary">
                    {{ getCustomerOrders(cust.id).length }} pedidos
                  </td>
                  <td class="py-3.5 px-4 font-bold text-emerald-400">
                    {{ getCustomerSpend(cust.id) | currency:'USD':'symbol':'1.2-2' }}
                  </td>
                  <td class="py-3.5 px-4 text-outline">
                    {{ cust.created_at | date:'dd/MM/yyyy' }}
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <button
                      (click)="viewCustomerDetails(cust)"
                      class="px-3 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-xs transition cursor-pointer"
                    >
                      Ficha Cliente
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="text-center py-8 text-outline">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Customer Details Slide-over / Modal -->
    @if (selectedCustomer()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-2xl space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-4">
            <div class="flex items-center gap-3">
              <div class="h-12 w-12 rounded-full bg-linear-to-br from-primary to-primary-container text-on-primary-fixed font-bold flex items-center justify-center text-lg">
                {{ selectedCustomer()!.first_name.charAt(0) }}{{ selectedCustomer()!.last_name.charAt(0) }}
              </div>
              <div>
                <h3 class="text-lg font-bold text-on-surface">{{ selectedCustomer()!.first_name }} {{ selectedCustomer()!.last_name }}</h3>
                <p class="text-xs text-outline">{{ selectedCustomer()!.phone || 'Sin teléfono' }} • {{ selectedCustomer()!.address || 'Sin dirección' }}</p>
              </div>
            </div>
            <button (click)="selectedCustomer.set(null)" class="text-outline hover:text-white text-lg">✕</button>
          </div>

          <!-- Customer Stats -->
          <div class="grid grid-cols-2 gap-3 bg-surface p-4 rounded-xl border border-outline-variant/30 text-xs">
            <div>
              <span class="text-outline uppercase text-[10px] font-bold">Total Facturado</span>
              <div class="text-lg font-bold text-emerald-400 mt-0.5">
                {{ getCustomerSpend(selectedCustomer()!.id) | currency:'USD':'symbol':'1.2-2' }}
              </div>
            </div>
            <div>
              <span class="text-outline uppercase text-[10px] font-bold">Historial de Compras</span>
              <div class="text-lg font-bold text-primary mt-0.5">
                {{ getCustomerOrders(selectedCustomer()!.id).length }} pedidos completados
              </div>
            </div>
          </div>

          <!-- Orders History -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-primary">Pedidos de este Cliente</h4>
            <div class="border border-outline-variant/40 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-surface text-outline text-[10px] uppercase">
                  <tr>
                    <th class="py-2 px-3">ID</th>
                    <th class="py-2 px-3">Fecha</th>
                    <th class="py-2 px-3">Estado</th>
                    <th class="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/20 text-on-surface-variant">
                  @for (order of getCustomerOrders(selectedCustomer()!.id); track order.id) {
                    <tr>
                      <td class="py-2 px-3 font-mono text-primary">#{{ order.id.slice(0, 8) }}</td>
                      <td class="py-2 px-3">{{ order.created_at | date:'short' }}</td>
                      <td class="py-2 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-primary-container text-primary">
                          {{ order.status }}
                        </span>
                      </td>
                      <td class="py-2 px-3 text-right font-bold text-emerald-400">{{ order.total | currency:'USD':'symbol':'1.2-2' }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="text-center py-4 text-outline">Sin pedidos registrados aún</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Support Tickets for this customer -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-amber-300">Tickets de Soporte</h4>
            <div class="space-y-2">
              @for (tick of getCustomerTickets(selectedCustomer()!.id); track tick.id) {
                <div class="p-2.5 rounded-lg bg-surface border border-outline-variant/30 flex items-center justify-between text-xs">
                  <div>
                    <div class="font-semibold text-on-surface">{{ tick.subject }}</div>
                    <div class="text-[10px] text-outline">{{ tick.created_at | date:'short' }} • Prioridad: {{ tick.priority }}</div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300">
                    {{ tick.status }}
                  </span>
                </div>
              } @empty {
                <p class="text-xs text-outline">No cuenta con tickets de soporte abiertos.</p>
              }
            </div>
          </div>

          <div class="flex justify-end pt-3 border-t border-outline-variant/40">
            <button
              (click)="selectedCustomer.set(null)"
              class="btn-primary py-2! px-5! text-xs"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Create Customer Modal -->
    @if (isCreateModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 class="text-base font-bold text-on-surface">Registrar Nuevo Cliente</h3>
            <button (click)="isCreateModalOpen.set(false)" class="text-outline hover:text-white">✕</button>
          </div>

          <form (ngSubmit)="saveCustomer()" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Nombre *</label>
                <input type="text" [(ngModel)]="newCustomerForm.first_name" name="fn" required class="das-input text-xs" placeholder="Nombre" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Apellido *</label>
                <input type="text" [(ngModel)]="newCustomerForm.last_name" name="ln" required class="das-input text-xs" placeholder="Apellido" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Teléfono / Celular</label>
              <input type="text" [(ngModel)]="newCustomerForm.phone" name="phone" class="das-input text-xs" placeholder="+57 300 123 4567" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Dirección de Envío Principal</label>
              <input type="text" [(ngModel)]="newCustomerForm.address" name="address" class="das-input text-xs" placeholder="Calle 123 #45-67, Ciudad" />
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
              <button type="button" (click)="isCreateModalOpen.set(false)" class="btn-secondary py-2! px-4! text-xs">Cancelar</button>
              <button type="submit" class="btn-primary py-2! px-5! text-xs">Guardar Cliente</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class CustomersManagementComponent {
  readonly adminService = inject(AdminService);

  searchQuery = signal<string>('');
  selectedCustomer = signal<DbProfile | null>(null);
  isCreateModalOpen = signal<boolean>(false);

  newCustomerForm: Partial<DbProfile> = {
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    role: 'customer'
  };

  readonly filteredCustomers = computed(() => {
    const list = this.adminService.customers();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;

    return list.filter((c) => {
      const full = `${c.first_name} ${c.last_name}`.toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const addr = (c.address || '').toLowerCase();
      return full.includes(query) || phone.includes(query) || addr.includes(query);
    });
  });

  readonly activeBuyersCount = computed(() => {
    const buyerIds = new Set(this.adminService.salesOrders().map((o) => o.customer_id));
    return this.adminService.customers().filter((c) => buyerIds.has(c.id)).length;
  });

  getCustomerOrders(customerId: string): AdminSalesOrderWithDetails[] {
    return this.adminService.salesOrders().filter((o) => o.customer_id === customerId);
  }

  getCustomerSpend(customerId: string): number {
    return this.getCustomerOrders(customerId)
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
  }

  getCustomerTickets(customerId: string): DbCrmSupportTicket[] {
    return this.adminService.tickets().filter((t) => t.customer_id === customerId);
  }

  viewCustomerDetails(customer: DbProfile): void {
    this.selectedCustomer.set(customer);
  }

  async saveCustomer(): Promise<void> {
    if (!this.newCustomerForm.first_name || !this.newCustomerForm.last_name) return;
    await this.adminService.createCustomer(this.newCustomerForm);
    this.isCreateModalOpen.set(false);
  }
}
