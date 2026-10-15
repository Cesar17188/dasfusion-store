import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminProductWithVariants, AdminSalesOrderWithDetails } from '../../../../core/services/admin.service';
import { TaxService } from '../../../../core/services/tax.service';
import { DbProductVariant, DbProfile } from '../../../../core/models/supabase.model';

interface PosCartItem {
  variant: DbProductVariant;
  product: AdminProductWithVariants;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-pos-invoicing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-on-surface tracking-tight">Facturador & Punto de Venta (POS)</h1>
          <p class="text-xs sm:text-sm text-outline">Emisión de ventas de mostrador, cotizaciones directas y facturación electrónica</p>
        </div>
        <div class="flex items-center gap-2">
          @if (cartItems().length > 0) {
            <button
              (click)="clearCart()"
              class="btn-secondary py-2! px-3! text-xs text-rose-300 border-rose-500/40 hover:bg-rose-950/40"
            >
              Vaciar Canasta
            </button>
          }
        </div>
      </div>

      <!-- Main Layout: 2 Columns (Catalog Picker + Active Invoice Cart) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left 7 Cols: Hardware Catalog Picker -->
        <div class="lg:col-span-7 space-y-4">
          <!-- Search & Category Filters -->
          <div class="das-card p-4 space-y-3">
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Escanear SKU o buscar hardware (RTX, Ryzen, RAM, SSD)..."
                class="das-input text-xs pl-9 py-2.5!"
                autofocus
              />
              <svg class="absolute left-3 top-3 w-4 h-4 text-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <!-- Categories Filter Chips -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                (click)="selectedCategory.set('ALL')"
                [class.bg-primary-container]="selectedCategory() === 'ALL'"
                [class.text-primary]="selectedCategory() === 'ALL'"
                class="px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition whitespace-nowrap cursor-pointer"
              >
                Todo
              </button>
              @for (cat of adminService.categories(); track cat.id) {
                <button
                  (click)="selectedCategory.set(cat.id)"
                  [class.bg-primary-container]="selectedCategory() === cat.id"
                  [class.text-primary]="selectedCategory() === cat.id"
                  class="px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition whitespace-nowrap cursor-pointer"
                >
                  {{ cat.name }}
                </button>
              }
            </div>
          </div>

          <!-- Products Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-150 overflow-y-auto pr-1">
            @for (item of availableVariants(); track item.variant.id) {
              <div class="das-card p-3.5 flex flex-col justify-between hover:border-primary/40 transition space-y-3">
                <div class="space-y-1">
                  <div class="flex items-start justify-between gap-2">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-outline">{{ item.product.brand?.name || 'Hardware' }}</span>
                    <span
                      [class.text-emerald-400]="item.variant.stock > 5"
                      [class.text-amber-300]="item.variant.stock <= 5 && item.variant.stock > 0"
                      [class.text-rose-400]="item.variant.stock <= 0"
                      class="text-[10px] font-bold"
                    >
                      Stock: {{ item.variant.stock }}
                    </span>
                  </div>
                  <h3 class="font-bold text-xs text-on-surface line-clamp-1">{{ item.product.model }}</h3>
                  <div class="text-[11px] text-outline">{{ item.variant.variant_name }}</div>
                  <div class="text-[10px] font-mono text-primary">SKU: {{ item.variant.sku }}</div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                  <span class="text-sm font-bold text-on-surface">
                    {{ item.variant.price | currency:'USD':'symbol':'1.2-2' }}
                  </span>
                  <button
                    (click)="addToCart(item.product, item.variant)"
                    [disabled]="item.variant.stock <= 0"
                    class="btn-primary py-1.5! px-3! text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Añadir
                  </button>
                </div>
              </div>
            } @empty {
              <div class="col-span-2 text-center py-12 text-xs text-outline">
                No se encontraron productos coincidentes.
              </div>
            }
          </div>
        </div>

        <!-- Right 5 Cols: Factura / Carrito POS -->
        <div class="lg:col-span-5 space-y-4">
          <div class="das-card p-5 space-y-4 border border-primary/20 shadow-xl bg-surface-container-low">
            <div class="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div class="flex items-center gap-2">
                <span class="p-1.5 rounded-lg bg-primary-container text-primary">🧾</span>
                <h3 class="font-bold text-sm text-on-surface">Nueva Venta / Factura</h3>
              </div>
              <span class="text-xs font-mono text-outline">{{ cartItems().length }} ítems</span>
            </div>

            <!-- Customer Selection -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-on-surface-variant">Cliente Asociado *</label>
                <button
                  (click)="isQuickCustomerModalOpen.set(true)"
                  class="text-[11px] text-primary hover:underline cursor-pointer"
                >
                  + Nuevo Cliente Rápido
                </button>
              </div>
              <select [(ngModel)]="selectedCustomerId" class="das-input text-xs">
                @for (c of adminService.customers(); track c.id) {
                  <option [value]="c.id">{{ c.first_name }} {{ c.last_name }} ({{ c.phone || 'Sin tel' }})</option>
                }
              </select>
            </div>

            <!-- Shipping / Dispatch Address -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-on-surface-variant">Dirección de Entrega / Retiro</label>
              <input
                type="text"
                [(ngModel)]="shippingAddress"
                placeholder="Mostrador Principal / Venta Local"
                class="das-input text-xs"
              />
            </div>

            <!-- Cart Items List -->
            <div class="space-y-2 border-t border-outline-variant/30 pt-3">
              <span class="text-[11px] font-bold uppercase tracking-wider text-outline">Detalle de Productos</span>
              <div class="max-h-60 overflow-y-auto space-y-2 pr-1">
                @for (item of cartItems(); track item.variant.id) {
                  <div class="p-2.5 rounded-lg bg-surface border border-outline-variant/40 flex items-center justify-between gap-3 text-xs">
                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-on-surface truncate">{{ item.product.model }}</div>
                      <div class="text-[11px] text-outline truncate">{{ item.variant.variant_name }}</div>
                      <div class="text-[11px] font-bold text-primary mt-0.5">
                        {{ item.unitPrice | currency:'USD':'symbol':'1.2-2' }} c/u
                      </div>
                    </div>

                    <!-- Quantity Adjusters -->
                    <div class="flex items-center gap-1.5">
                      <button
                        (click)="decreaseQty(item)"
                        class="h-6 w-6 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span class="font-bold w-6 text-center text-xs text-on-surface">{{ item.quantity }}</span>
                      <button
                        (click)="increaseQty(item)"
                        class="h-6 w-6 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        (click)="removeItem(item)"
                        class="text-outline hover:text-rose-400 ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-6 text-xs text-outline">
                    La factura está vacía. Selecciona hardware del catálogo.
                  </div>
                }
              </div>
            </div>

            <!-- Totals & Taxes Summary -->
            <div class="border-t border-outline-variant/40 pt-3 space-y-2 text-xs">
              <!-- IVA Selector for POS Sale -->
              <div class="space-y-1.5 pb-2 border-b border-outline-variant/30">
                <div class="flex items-center justify-between text-[11px] font-bold text-outline uppercase">
                  <span>Tarifa de IVA de la Venta</span>
                  <span class="text-emerald-400 font-mono font-bold">{{ selectedTaxPercentage() }}%</span>
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    (click)="selectedTaxRate.set(0.15)"
                    [class.bg-primary-container]="selectedTaxRate() === 0.15"
                    [class.text-[#aec7f7]]="selectedTaxRate() === 0.15"
                    [class.border-[#aec7f7]/50]="selectedTaxRate() === 0.15"
                    class="py-1 px-1.5 rounded-lg text-[11px] font-bold border border-outline-variant/40 bg-surface-container text-on-surface hover:bg-surface-container-high transition cursor-pointer text-center"
                  >
                    15% General
                  </button>
                  <button
                    type="button"
                    (click)="selectedTaxRate.set(0)"
                    [class.bg-emerald-500/20]="selectedTaxRate() === 0"
                    [class.text-emerald-300]="selectedTaxRate() === 0"
                    [class.border-emerald-500/50]="selectedTaxRate() === 0"
                    class="py-1 px-1.5 rounded-lg text-[11px] font-bold border border-outline-variant/40 bg-surface-container text-on-surface hover:bg-surface-container-high transition cursor-pointer text-center"
                  >
                    0% Sin IVA
                  </button>
                </div>
              </div>

              <div class="flex justify-between text-on-surface-variant">
                <span>Subtotal Neto:</span>
                <span class="font-medium">{{ cartSubtotal() | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-on-surface-variant">
                <span>IVA ({{ selectedTaxPercentage() }}%):</span>
                <span class="font-medium">{{ cartTax() | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-base font-bold text-on-surface border-t border-outline-variant/30 pt-2">
                <span>Total a Cobrar:</span>
                <span class="text-emerald-400 font-mono">{{ cartTotal() | currency:'USD':'symbol':'1.2-2' }}</span>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              (click)="processSale()"
              [disabled]="cartItems().length === 0 || isProcessingSale()"
              class="btn-primary w-full py-3! text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg cursor-pointer"
            >
              @if (isProcessingSale()) {
                <span class="animate-spin">⏳</span> Facturando...
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Generar Venta & Factura ({{ cartTotal() | currency:'USD':'symbol':'1.2-2' }})
              }
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Customer Creation Modal -->
    @if (isQuickCustomerModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 class="text-base font-bold text-on-surface">Crear Cliente Rápido</h3>
            <button (click)="isQuickCustomerModalOpen.set(false)" class="text-outline hover:text-white">✕</button>
          </div>

          <form (ngSubmit)="saveQuickCustomer()" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Nombre *</label>
                <input type="text" [(ngModel)]="quickCustForm.first_name" name="fn" required class="das-input text-xs" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Apellido *</label>
                <input type="text" [(ngModel)]="quickCustForm.last_name" name="ln" required class="das-input text-xs" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Teléfono / WhatsApp</label>
              <input type="text" [(ngModel)]="quickCustForm.phone" name="phone" class="das-input text-xs" placeholder="+57 300..." />
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Dirección / Ciudad</label>
              <input type="text" [(ngModel)]="quickCustForm.address" name="address" class="das-input text-xs" placeholder="Bogotá, Calle 100..." />
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
              <button type="button" (click)="isQuickCustomerModalOpen.set(false)" class="btn-secondary py-2! px-4! text-xs">Cancelar</button>
              <button type="submit" class="btn-primary py-2! px-5! text-xs">Guardar y Seleccionar</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Invoice Success Modal / Printable Receipt -->
    @if (completedInvoice()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div class="bg-surface border border-outline-variant rounded-2xl p-6 sm:p-8 w-full max-w-xl space-y-6 shadow-2xl">
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-4">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-lg font-bold">
                ✓
              </div>
              <div>
                <h3 class="text-base font-bold text-on-surface">Factura Generada con Éxito</h3>
                <p class="text-xs text-emerald-400">Venta registrada en base de datos e inventario actualizado</p>
              </div>
            </div>
            <button (click)="completedInvoice.set(null)" class="text-outline hover:text-white">✕</button>
          </div>

          <!-- Printable Receipt View -->
          <div class="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 space-y-4 text-xs">
            <div class="flex justify-between items-start border-b border-outline-variant/30 pb-3">
              <div>
                <h4 class="font-extrabold text-sm text-primary tracking-wider">DASFUSION STORE</h4>
                <p class="text-[10px] text-outline">NIT: 901.455.789-0 • Régimen Común</p>
                <p class="text-[10px] text-outline">Factura Electrónica de Venta</p>
              </div>
              <div class="text-right font-mono">
                <div class="font-bold text-on-surface">N° {{ completedInvoice()!.id.slice(0, 8).toUpperCase() }}</div>
                <div class="text-[10px] text-outline">{{ completedInvoice()!.created_at | date:'short' }}</div>
              </div>
            </div>

            <!-- Customer -->
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span class="text-outline">Cliente:</span>
                <div class="font-semibold text-on-surface">{{ completedInvoice()!.customer?.first_name }} {{ completedInvoice()!.customer?.last_name }}</div>
              </div>
              <div>
                <span class="text-outline">Destino:</span>
                <div class="text-on-surface-variant">{{ completedInvoice()!.shipping_address }}</div>
              </div>
            </div>

            <!-- Table -->
            <table class="w-full text-left text-xs">
              <thead class="border-y border-outline-variant/30 text-[10px] text-outline uppercase">
                <tr>
                  <th class="py-1.5">Cant</th>
                  <th class="py-1.5">Descripción</th>
                  <th class="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/20">
                @for (it of completedInvoice()!.items; track it.id) {
                  <tr>
                    <td class="py-1.5 font-bold">{{ it.quantity }}x</td>
                    <td class="py-1.5">{{ it.variant?.variant_name || 'Hardware' }}</td>
                    <td class="py-1.5 text-right font-mono">{{ (it.unit_price * it.quantity) | currency:'USD':'symbol':'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <!-- Total -->
            <div class="border-t border-outline-variant/40 pt-2 text-right space-y-1">
              <div><span class="text-outline">Subtotal: </span>{{ completedInvoice()!.subtotal | currency:'USD':'symbol':'1.2-2' }}</div>
              <div><span class="text-outline">IVA (15%): </span>{{ completedInvoice()!.tax | currency:'USD':'symbol':'1.2-2' }}</div>
              <div class="text-sm font-bold text-emerald-400"><span class="text-on-surface">TOTAL: </span>{{ completedInvoice()!.total | currency:'USD':'symbol':'1.2-2' }}</div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <button
              (click)="printInvoice()"
              class="btn-secondary py-2! px-4! text-xs flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Tirilla / Recibo
            </button>
            <button
              (click)="completedInvoice.set(null)"
              class="btn-primary py-2! px-5! text-xs"
            >
              Nueva Venta
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class PosInvoicingComponent {
  readonly adminService = inject(AdminService);
  readonly taxService = inject(TaxService);

  readonly selectedTaxRate = signal<number>(this.taxService.taxRate());
  readonly selectedTaxPercentage = computed(() => Math.round(this.selectedTaxRate() * 100));

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('ALL');
  selectedCustomerId = signal<string>('');
  shippingAddress = signal<string>('Mostrador / Venta Local');
  cartItems = signal<PosCartItem[]>([]);
  isProcessingSale = signal<boolean>(false);
  isQuickCustomerModalOpen = signal<boolean>(false);
  completedInvoice = signal<AdminSalesOrderWithDetails | null>(null);

  quickCustForm: Partial<DbProfile> = {
    first_name: '',
    last_name: '',
    phone: '',
    address: ''
  };

  constructor() {
    // Pick first customer as default
    if (this.adminService.customers().length > 0) {
      this.selectedCustomerId.set(this.adminService.customers()[0].id);
    }
  }

  readonly availableVariants = computed(() => {
    const list: Array<{ product: AdminProductWithVariants; variant: DbProductVariant }> = [];
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    for (const p of this.adminService.products()) {
      if (cat !== 'ALL' && p.category_id !== cat) continue;

      for (const v of p.variants || []) {
        if (query) {
          const matchModel = p.model.toLowerCase().includes(query);
          const matchSku = v.sku.toLowerCase().includes(query);
          const matchVarName = v.variant_name.toLowerCase().includes(query);
          if (!matchModel && !matchSku && !matchVarName) continue;
        }

        list.push({ product: p, variant: v });
      }
    }
    return list;
  });

  readonly cartSubtotal = computed(() => {
    return this.cartItems().reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  });

  readonly cartTax = computed(() => {
    return Math.round(this.cartSubtotal() * this.selectedTaxRate() * 100) / 100;
  });

  readonly cartTotal = computed(() => {
    return Math.round((this.cartSubtotal() + this.cartTax()) * 100) / 100;
  });

  addToCart(product: AdminProductWithVariants, variant: DbProductVariant): void {
    const current = this.cartItems();
    const existing = current.find((it) => it.variant.id === variant.id);

    if (existing) {
      if (existing.quantity < variant.stock) {
        this.cartItems.set(
          current.map((it) => (it.variant.id === variant.id ? { ...it, quantity: it.quantity + 1 } : it))
        );
      }
    } else {
      this.cartItems.set([
        ...current,
        {
          variant,
          product,
          quantity: 1,
          unitPrice: variant.price
        }
      ]);
    }
  }

  increaseQty(item: PosCartItem): void {
    if (item.quantity < item.variant.stock) {
      this.cartItems.update((items) =>
        items.map((i) => (i.variant.id === item.variant.id ? { ...i, quantity: i.quantity + 1 } : i))
      );
    }
  }

  decreaseQty(item: PosCartItem): void {
    if (item.quantity > 1) {
      this.cartItems.update((items) =>
        items.map((i) => (i.variant.id === item.variant.id ? { ...i, quantity: i.quantity - 1 } : i))
      );
    } else {
      this.removeItem(item);
    }
  }

  removeItem(item: PosCartItem): void {
    this.cartItems.update((items) => items.filter((i) => i.variant.id !== item.variant.id));
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  async saveQuickCustomer(): Promise<void> {
    if (!this.quickCustForm.first_name || !this.quickCustForm.last_name) return;
    const created = await this.adminService.createCustomer(this.quickCustForm);
    this.selectedCustomerId.set(created.id);
    this.isQuickCustomerModalOpen.set(false);
  }

  async processSale(): Promise<void> {
    if (this.cartItems().length === 0 || !this.selectedCustomerId()) return;

    this.isProcessingSale.set(true);
    try {
      const payload = {
        customerId: this.selectedCustomerId(),
        shippingAddress: this.shippingAddress() || 'Mostrador / Venta Local',
        taxRate: this.selectedTaxRate(),
        items: this.cartItems().map((it) => ({
          variantId: it.variant.id,
          quantity: it.quantity,
          unitPrice: it.unitPrice
        }))
      };

      const result = await this.adminService.createInvoiceSale(payload);
      this.completedInvoice.set(result);
      this.clearCart();
    } catch {
      // Handled
    } finally {
      this.isProcessingSale.set(false);
    }
  }

  printInvoice(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
