import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminProductWithVariants } from '../../../../core/services/admin.service';
import { DbProductVariant } from '../../../../core/models/supabase.model';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-[#e3e2e6] tracking-tight">Manejo de Inventario & Catálogo</h1>
          <p class="text-xs sm:text-sm text-outline">Control de existencias de hardware, SKUs, precios y alertas de stock bajo</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            (click)="openNewProductModal()"
            class="btn-primary py-2! px-4! text-xs flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto / Variante
          </button>
        </div>
      </div>

      <!-- KPI Metrics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="das-card p-4">
          <span class="text-[11px] font-bold text-outline uppercase">Total Productos Base</span>
          <div class="text-2xl font-bold text-[#e3e2e6] mt-1">{{ adminService.products().length }}</div>
        </div>
        <div class="das-card p-4">
          <span class="text-[11px] font-bold text-outline uppercase">SKUs / Variantes Activas</span>
          <div class="text-2xl font-bold text-[#aec7f7] mt-1">{{ adminService.totalVariantsCount() }}</div>
        </div>
        <div class="das-card p-4">
          <span class="text-[11px] font-bold text-outline uppercase">Alertas de Stock Bajo</span>
          <div class="text-2xl font-bold text-amber-300 mt-1">
            {{ adminService.lowStockVariants().length }}
          </div>
          <p class="text-[11px] text-outline mt-0.5">Menos de 5 unidades</p>
        </div>
        <div class="das-card p-4">
          <span class="text-[11px] font-bold text-outline uppercase">Valoración Estimada Stock</span>
          <div class="text-2xl font-bold text-emerald-400 mt-1">
            {{ totalInventoryValuation() | currency:'USD':'symbol':'1.0-0' }}
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="das-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div class="relative w-full md:w-80">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar por modelo, SKU o variante..."
            class="das-input text-xs pl-9"
          />
          <svg class="absolute left-3 top-2.5 w-4 h-4 text-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <!-- Category Filter -->
          <select [(ngModel)]="selectedCategory" class="das-input text-xs w-auto!">
            <option value="ALL">Todas las Categorías</option>
            @for (cat of adminService.categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>

          <!-- Brand Filter -->
          <select [(ngModel)]="selectedBrand" class="das-input text-xs w-auto!">
            <option value="ALL">Todas las Marcas</option>
            @for (brand of adminService.brands(); track brand.id) {
              <option [value]="brand.id">{{ brand.name }}</option>
            }
          </select>

          <!-- Low Stock Toggle -->
          <button
            (click)="onlyLowStock.update((v) => !v)"
            [class.bg-amber-950]="onlyLowStock()"
            [class.text-amber-300]="onlyLowStock()"
            [class.border-amber-500]="onlyLowStock()"
            class="px-3 py-2 rounded-lg text-xs font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container-high transition cursor-pointer"
          >
            ⚠️ Solo Stock Bajo (≤5)
          </button>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="das-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-on-surface-variant">
            <thead class="bg-surface-container-low text-outline uppercase text-[11px] border-b border-outline-variant/40">
              <tr>
                <th class="py-3 px-4">Producto / Modelo</th>
                <th class="py-3 px-4">Categoría & Marca</th>
                <th class="py-3 px-4">SKU / Variante</th>
                <th class="py-3 px-4">Precio ($)</th>
                <th class="py-3 px-4">Stock Actual</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Ajuste Rápido</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/30">
              @for (item of flattenedVariants(); track item.variant.id) {
                <tr class="hover:bg-surface-container/60 transition">
                  <td class="py-3.5 px-4">
                    <div class="font-bold text-[#e3e2e6]">{{ item.product.model }}</div>
                    @if (item.variant.is_bundle) {
                      <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-primary-container text-[#aec7f7] border border-[#aec7f7]/30">
                        COMBO / BUNDLE
                      </span>
                    }
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="text-[#e3e2e6]">{{ item.product.category?.name || 'General' }}</div>
                    <div class="text-[11px] text-outline">{{ item.product.brand?.name || 'Hardware' }}</div>
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="font-mono text-[#aec7f7] font-semibold">{{ item.variant.sku }}</div>
                    <div class="text-[11px] text-outline">{{ item.variant.variant_name }}</div>
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-1">
                      <span class="text-outline">$</span>
                      <input
                        type="number"
                        [ngModel]="item.variant.price"
                        (blur)="onPriceChange(item.variant.id, $event)"
                        class="w-20 bg-[#121316] border border-outline-variant rounded px-1.5 py-0.5 text-xs text-[#e3e2e6] focus:outline-none focus:border-[#aec7f7]"
                      />
                    </div>
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-1">
                      <input
                        type="number"
                        [ngModel]="item.variant.stock"
                        (blur)="onStockChange(item.variant.id, $event)"
                        min="0"
                        class="w-16 bg-[#121316] border border-outline-variant rounded px-1.5 py-0.5 text-xs font-bold text-center text-[#e3e2e6] focus:outline-none focus:border-[#aec7f7]"
                      />
                      <span class="text-[11px] text-outline">uds.</span>
                    </div>
                  </td>
                  <td class="py-3.5 px-4">
                    @if (item.variant.stock <= 0) {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                        Agotado
                      </span>
                    } @else if (item.variant.stock <= 5) {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                        Crítico ({{ item.variant.stock }})
                      </span>
                    } @else {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        En Stock
                      </span>
                    }
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        (click)="incrementStock(item.variant.id, item.variant.stock, 5)"
                        title="Sumar +5 unidades al stock"
                        class="px-2 py-1 rounded bg-surface-container-high hover:bg-[#343538] text-[11px] font-semibold text-[#aec7f7] transition cursor-pointer"
                      >
                        +5 Stock
                      </button>
                      <button
                        (click)="incrementStock(item.variant.id, item.variant.stock, 10)"
                        title="Sumar +10 unidades al stock"
                        class="px-2 py-1 rounded bg-surface-container-high hover:bg-[#343538] text-[11px] font-semibold text-[#aec7f7] transition cursor-pointer"
                      >
                        +10
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="text-center py-8 text-outline">
                    No se encontraron productos o variantes con los filtros actuales.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal: Nuevo Producto y Variante -->
    @if (isNewProductModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-xl space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 class="text-base font-bold text-[#e3e2e6]">Registrar Nuevo Producto & Variante</h3>
            <button (click)="isNewProductModalOpen.set(false)" class="text-outline hover:text-white">✕</button>
          </div>

          <form (ngSubmit)="saveProduct()" class="space-y-4">
            <!-- Product Info -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-[#aec7f7]">1. Información del Producto Base</h4>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Nombre / Modelo del Producto *</label>
                <input
                  type="text"
                  [(ngModel)]="newProdForm.model"
                  name="model"
                  required
                  class="das-input text-xs"
                  placeholder="Ej. GeForce RTX 5080 Gaming 16GB"
                />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-on-surface-variant mb-1">Categoría *</label>
                  <select [(ngModel)]="newProdForm.category_id" name="category_id" required class="das-input text-xs">
                    @for (cat of adminService.categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-on-surface-variant mb-1">Marca *</label>
                  <select [(ngModel)]="newProdForm.brand_id" name="brand_id" required class="das-input text-xs">
                    @for (brand of adminService.brands(); track brand.id) {
                      <option [value]="brand.id">{{ brand.name }}</option>
                    }
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Descripción Breve</label>
                <input
                  type="text"
                  [(ngModel)]="newProdForm.short_description"
                  name="short_description"
                  class="das-input text-xs"
                  placeholder="Resumen de especificaciones clave..."
                />
              </div>
            </div>

            <!-- Variant Info -->
            <div class="space-y-3 border-t border-outline-variant/40 pt-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-[#aec7f7]">2. Variante Inicial & Inventario</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-on-surface-variant mb-1">SKU Único *</label>
                  <input
                    type="text"
                    [(ngModel)]="newVarForm.sku"
                    name="sku"
                    required
                    class="das-input text-xs font-mono uppercase"
                    placeholder="GPU-RTX-5080-16G"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-on-surface-variant mb-1">Nombre de la Variante *</label>
                  <input
                    type="text"
                    [(ngModel)]="newVarForm.variant_name"
                    name="variant_name"
                    required
                    class="das-input text-xs"
                    placeholder="Standard Edition OC"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-on-surface-variant mb-1">Precio de Venta ($ USD) *</label>
                  <input
                    type="number"
                    [(ngModel)]="newVarForm.price"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    class="das-input text-xs"
                    placeholder="999.00"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-on-surface-variant mb-1">Stock Inicial *</label>
                  <input
                    type="number"
                    [(ngModel)]="newVarForm.stock"
                    name="stock"
                    required
                    min="0"
                    class="das-input text-xs"
                    placeholder="10"
                  />
                </div>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_bundle"
                  [(ngModel)]="newVarForm.is_bundle"
                  name="is_bundle"
                  class="rounded bg-[#121316] border-outline-variant text-[#aec7f7]"
                />
                <label for="is_bundle" class="text-xs text-on-surface-variant">Este ítem es un Combo / Bundle con múltiples piezas</label>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
              <button
                type="button"
                (click)="isNewProductModalOpen.set(false)"
                class="btn-secondary py-2! px-4! text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary py-2! px-5! text-xs"
              >
                Guardar en Inventario
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class InventoryManagementComponent {
  readonly adminService = inject(AdminService);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('ALL');
  selectedBrand = signal<string>('ALL');
  onlyLowStock = signal<boolean>(false);
  isNewProductModalOpen = signal<boolean>(false);

  newProdForm = {
    model: '',
    category_id: '',
    brand_id: '',
    short_description: '',
    product_type: 'standalone'
  };

  newVarForm = {
    sku: '',
    variant_name: '',
    price: 0,
    stock: 1,
    is_bundle: false
  };

  readonly totalInventoryValuation = computed(() => {
    return this.adminService.products().reduce((total, p) => {
      const pSum = (p.variants || []).reduce((acc, v) => acc + (Number(v.price) * Number(v.stock)), 0);
      return total + pSum;
    }, 0);
  });

  readonly flattenedVariants = computed(() => {
    const list: Array<{ product: AdminProductWithVariants; variant: DbProductVariant }> = [];
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const brand = this.selectedBrand();
    const lowStock = this.onlyLowStock();

    for (const p of this.adminService.products()) {
      if (cat !== 'ALL' && p.category_id !== cat) continue;
      if (brand !== 'ALL' && p.brand_id !== brand) continue;

      for (const v of p.variants || []) {
        if (lowStock && v.stock > 5) continue;

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

  async onStockChange(variantId: string, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const newStock = parseInt(input.value, 10);
    if (!isNaN(newStock) && newStock >= 0) {
      await this.adminService.updateVariantStock(variantId, newStock);
    }
  }

  async onPriceChange(variantId: string, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const newPrice = parseFloat(input.value);
    if (!isNaN(newPrice) && newPrice >= 0) {
      await this.adminService.updateVariantPrice(variantId, newPrice);
    }
  }

  async incrementStock(variantId: string, currentStock: number, add: number): Promise<void> {
    await this.adminService.updateVariantStock(variantId, currentStock + add);
  }

  openNewProductModal(): void {
    const firstCat = this.adminService.categories()[0]?.id || '';
    const firstBrand = this.adminService.brands()[0]?.id || '';

    this.newProdForm = {
      model: '',
      category_id: firstCat,
      brand_id: firstBrand,
      short_description: '',
      product_type: 'standalone'
    };

    this.newVarForm = {
      sku: '',
      variant_name: '',
      price: 0,
      stock: 5,
      is_bundle: false
    };

    this.isNewProductModalOpen.set(true);
  }

  async saveProduct(): Promise<void> {
    if (!this.newProdForm.model || !this.newVarForm.sku || !this.newVarForm.variant_name) return;
    await this.adminService.createProductWithVariant(this.newProdForm, this.newVarForm);
    this.isNewProductModalOpen.set(false);
  }
}
