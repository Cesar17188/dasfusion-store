import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { AdminService, AdminProductWithVariants } from '../../../../core/services/admin.service';
import { ProductService } from '../../../../core/services/product.service';
import { DbProductVariant, DbCategory, DbBrand } from '../../../../core/models/supabase.model';
import { ProductSpecification } from '../../../../core/models/product.model';
import { AdminPaginationComponent } from '../../../../shared/components/admin-pagination/admin-pagination.component';

export interface SpecGroupItem {
  key: string;
  value: string;
}

export interface SpecGroup {
  category: string;
  items: SpecGroupItem[];
}

export interface ParsedImportItem {
  sku: string;
  model: string;
  category: string;
  brand: string;
  price: number;
  compare_at_price?: number;
  discount_percent?: number;
  stock: number;
  stock_physical: number;
  stock_virtual: number;
  variant_name: string;
  image_url?: string;
  short_description?: string;
  isExisting: boolean;
  isValid: boolean;
  errorMessage?: string;
  action: 'create' | 'update' | 'error';
}

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminPaginationComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-on-surface tracking-tight">Manejo de Inventario, Categorías & Marcas</h1>
          <p class="text-xs sm:text-sm text-outline">Control integral de hardware, existencias, taxonomía de categorías, subcategorías y marcas asociadas</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            (click)="openImportModal()"
            class="btn-secondary py-2! px-3.5! text-xs flex items-center gap-1.5 border-primary/40 hover:border-primary text-primary hover:bg-primary/10 transition-all shadow-sm"
          >
            <span>📥</span>
            <span>Importar CSV / XLSX</span>
          </button>
          <button
            (click)="openCategoryModal()"
            class="btn-secondary py-2! px-3! text-xs flex items-center gap-1.5"
          >
            <span>🏷️</span>
            <span>+ Nueva Categoría</span>
          </button>
          <button
            (click)="openBrandModal()"
            class="btn-secondary py-2! px-3! text-xs flex items-center gap-1.5"
          >
            <span>🏢</span>
            <span>+ Nueva Marca</span>
          </button>
          <button
            (click)="openNewProductModal()"
            class="btn-primary py-2! px-4! text-xs flex items-center gap-2 shadow-lg"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto / Variante
          </button>
        </div>
      </div>

      <!-- Navigation Tabs: Inventario vs Categorías vs Marcas -->
      <div class="flex items-center gap-2 border-b border-outline-variant/40 pb-2 overflow-x-auto text-xs sm:text-sm">
        <button
          (click)="activeTab.set('inventory')"
          [class.text-primary]="activeTab() === 'inventory'"
          [class.border-b-2]="activeTab() === 'inventory'"
          [class.border-primary]="activeTab() === 'inventory'"
          [class.font-bold]="activeTab() === 'inventory'"
          class="px-4 py-2 text-on-surface-variant hover:text-on-surface transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <span>📦 Catálogo & Existencias</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-primary-container text-primary">
            {{ adminService.products().length }}
          </span>
        </button>

        <button
          (click)="activeTab.set('categories')"
          [class.text-primary]="activeTab() === 'categories'"
          [class.border-b-2]="activeTab() === 'categories'"
          [class.border-primary]="activeTab() === 'categories'"
          [class.font-bold]="activeTab() === 'categories'"
          class="px-4 py-2 text-on-surface-variant hover:text-on-surface transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <span>🏷️ Categorías & Subcategorías</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            {{ adminService.categories().length }}
          </span>
        </button>

        <button
          (click)="activeTab.set('brands')"
          [class.text-primary]="activeTab() === 'brands'"
          [class.border-b-2]="activeTab() === 'brands'"
          [class.border-primary]="activeTab() === 'brands'"
          [class.font-bold]="activeTab() === 'brands'"
          class="px-4 py-2 text-on-surface-variant hover:text-on-surface transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <span>🏢 Marcas & Vínculos</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            {{ adminService.brands().length }}
          </span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: INVENTARIO & CATÁLOGO DE PRODUCTOS -->
      <!-- ========================================================================= -->
      @if (activeTab() === 'inventory') {
        <div class="space-y-6">
          <!-- KPI Metrics Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="das-card p-4">
              <span class="text-[11px] font-bold text-outline uppercase">Total Productos Base</span>
              <div class="text-2xl font-bold text-on-surface mt-1">{{ adminService.products().length }}</div>
            </div>
            <div class="das-card p-4">
              <span class="text-[11px] font-bold text-outline uppercase">SKUs / Variantes Activas</span>
              <div class="text-2xl font-bold text-primary mt-1">{{ adminService.totalVariantsCount() }}</div>
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
                @for (cat of organizedCategories(); track cat.id) {
                  <option [value]="cat.id">
                    {{ cat.parent_id ? '↳ ' + cat.name : cat.name }}
                  </option>
                }
              </select>

              <!-- Brand Filter -->
              <select [(ngModel)]="selectedBrand" class="das-input text-xs w-auto!">
                <option value="ALL">Todas las Marcas</option>
                @for (brand of adminService.brands(); track brand.id) {
                  <option [value]="brand.id">{{ brand.name }}</option>
                }
              </select>

              <!-- Visibility Filter -->
              <select [(ngModel)]="selectedVisibility" class="das-input text-xs w-auto!">
                <option value="ALL">Visibilidad: Todos</option>
                <option value="VISIBLE">Solo Visibles en Tienda</option>
                <option value="HIDDEN">Solo Ocultos (Borrador)</option>
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

              <!-- New Strip Products Toggle -->
              <button
                type="button"
                (click)="onlyNewStrip.update((v) => !v)"
                [class.bg-primary-container]="onlyNewStrip()"
                [class.text-primary]="onlyNewStrip()"
                [class.border-primary]="onlyNewStrip()"
                class="px-3 py-2 rounded-lg text-xs font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container-high transition cursor-pointer"
                title="Filtrar productos seleccionados en la Franja de Productos Nuevos"
              >
                ✨ Franja Nuevos ({{ productService.newPromoProductIds().length }})
              </button>
            </div>
          </div>

          <!-- Multi-select Bulk Actions Banner -->
          @if (selectedProductIds().size > 0) {
            <div class="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div class="flex items-center gap-3">
                <span class="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30">
                  {{ selectedProductIds().size }} {{ selectedProductIds().size === 1 ? 'producto seleccionado' : 'productos seleccionados' }}
                </span>
                <span class="text-xs text-outline hidden sm:inline">
                  Puedes eliminar los productos seleccionados de forma masiva del catálogo y stock.
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="clearSelection()"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/40 transition cursor-pointer"
                >
                  Deseleccionar todos
                </button>

                <button
                  type="button"
                  (click)="deleteSelectedProducts()"
                  [disabled]="isDeletingMultiple()"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-950/50"
                >
                  <span>🗑️</span>
                  <span>{{ isDeletingMultiple() ? 'Eliminando...' : 'Eliminar seleccionados (' + selectedProductIds().size + ')' }}</span>
                </button>
              </div>
            </div>
          }

          <!-- Inventory Table -->
          <div class="das-card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-on-surface-variant">
                <thead class="bg-surface-container-low text-outline uppercase text-[11px] border-b border-outline-variant/40">
                  <tr>
                    <th class="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        [checked]="isAllSelected()"
                        [indeterminate]="isIndeterminate()"
                        (change)="toggleSelectAll($event)"
                        class="rounded border-outline-variant bg-surface-container text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        title="Seleccionar / deseleccionar todos los productos visibles"
                      />
                    </th>
                    <th class="py-3 px-4">Producto / Modelo</th>
                    <th class="py-3 px-4">Categoría & Marca</th>
                    <th class="py-3 px-4">SKU / Variante</th>
                    <th class="py-3 px-4">Precio Venta ($)</th>
                    <th class="py-3 px-4">Descuento / Oferta</th>
                    <th class="py-3 px-4 text-center">Stock Físico</th>
                    <th class="py-3 px-4 text-center">Stock Virtual</th>
                    <th class="py-3 px-4 text-center">Total Tienda</th>
                    <th class="py-3 px-4">Estado Stock</th>
                    <th class="py-3 px-4 text-center">Visibilidad Tienda</th>
                    <th class="py-3 px-4 text-right">Acciones & Ajuste</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/30">
                  @for (item of paginatedVariants(); track item.variant.id) {
                    <tr
                      class="hover:bg-surface-container/60 transition"
                      [class.opacity-60]="item.product.is_active === false"
                      [class.bg-rose-950/20]="isProductSelected(item.product.id)"
                    >
                      <td class="py-3.5 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          [checked]="isProductSelected(item.product.id)"
                          (change)="toggleSelectProduct(item.product.id)"
                          class="rounded border-outline-variant bg-surface-container text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          title="Seleccionar este producto"
                        />
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-3">
                          <div
                            (click)="openEditProductModal(item.product)"
                            class="w-11 h-11 rounded-lg bg-surface-container-high border border-outline-variant/50 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:border-primary/60 transition"
                            title="Editar producto"
                          >
                            @if (item.product.images && item.product.images.length > 0) {
                              <img [src]="item.product.images[0]" [alt]="item.product.model" class="w-full h-full object-cover" />
                            } @else {
                              <span class="text-xs text-outline font-bold">📦</span>
                            }
                          </div>
                          <div>
                            <div
                              (click)="openEditProductModal(item.product)"
                              class="font-bold text-on-surface hover:text-primary transition cursor-pointer"
                              title="Editar producto e imágenes"
                            >
                              {{ item.product.model }}
                            </div>
                            <div class="flex items-center gap-1.5 mt-0.5">
                              <span class="text-[10px] text-outline flex items-center gap-0.5">
                                📷 {{ item.product.images?.length || 0 }}/10
                              </span>
                              @if (item.variant.is_bundle) {
                                <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary-container text-primary">
                                  BUNDLE
                                </span>
                              }
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="text-on-surface">{{ item.product.category?.name || 'General' }}</div>
                        <div class="text-[11px] text-outline">{{ item.product.brand?.name || 'Hardware' }}</div>
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="font-mono text-primary font-semibold">{{ item.variant.sku }}</div>
                        <div class="text-[11px] text-outline">{{ item.variant.variant_name }}</div>
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-1">
                          <span class="text-outline font-bold">$</span>
                          <input
                            type="number"
                            [ngModel]="item.variant.price"
                            (blur)="onPriceChange(item.variant.id, $event)"
                            min="0"
                            step="0.01"
                            class="w-20 bg-surface border border-outline-variant rounded px-2 py-1 text-xs text-on-surface font-mono font-bold focus:outline-none focus:border-primary"
                            title="Precio final de venta en tienda"
                          />
                        </div>
                      </td>
                      <td class="py-3.5 px-4 min-w-45">
                        <div class="flex flex-col gap-1.5">
                          <div class="flex items-center gap-1.5">
                            <div class="relative flex items-center">
                              <input
                                type="number"
                                [ngModel]="item.variant.discount_percent || 0"
                                (blur)="onDiscountPercentChange(item.variant, $event)"
                                min="0"
                                max="99"
                                class="w-14 bg-surface border rounded px-1.5 py-0.5 text-xs font-bold text-center focus:outline-none transition"
                                [class.border-amber-400]="(item.variant.discount_percent || 0) > 0"
                                [class.text-amber-300]="(item.variant.discount_percent || 0) > 0"
                                [class.border-outline-variant]="!(item.variant.discount_percent || 0)"
                                [class.text-on-surface]="!(item.variant.discount_percent || 0)"
                                title="Porcentaje de descuento para este producto"
                              />
                              <span class="ml-1 text-[11px] font-bold text-outline">%</span>
                            </div>

                            @if ((item.variant.discount_percent || 0) > 0 || (item.variant.compare_at_price && item.variant.compare_at_price > item.variant.price)) {
                              <button
                                type="button"
                                (click)="quickSetDiscount(item.variant, 0)"
                                class="text-[10px] text-outline hover:text-rose-400 px-1 py-0.5 rounded bg-surface-container hover:bg-surface-container-high transition cursor-pointer"
                                title="Quitar descuento y volver a precio regular"
                              >
                                ✕ Quitar
                              </button>
                            }
                          </div>

                          @if (item.variant.compare_at_price && item.variant.compare_at_price > item.variant.price && (item.variant.discount_percent || 0) > 0) {
                            <div class="flex items-center gap-1.5 flex-wrap">
                              <span class="text-[10px] text-outline line-through">
                                &dollar;{{ item.variant.compare_at_price | number:'1.2-2' }}
                              </span>
                              <span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-tertiary-container! text-[#f1bd81]! border border-[#f1bd81]/30">
                                OFERTA -{{ item.variant.discount_percent }}%
                              </span>
                            </div>
                          }

                          <!-- Quick discount preset chips -->
                          <div class="flex items-center gap-1 text-[9px]">
                            <button
                              type="button"
                              (click)="quickSetDiscount(item.variant, 10)"
                              class="px-1.5 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-outline hover:text-amber-300 transition cursor-pointer font-semibold"
                            >
                              10%
                            </button>
                            <button
                              type="button"
                              (click)="quickSetDiscount(item.variant, 20)"
                              class="px-1.5 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-outline hover:text-amber-300 transition cursor-pointer font-semibold"
                            >
                              20%
                            </button>
                            <button
                              type="button"
                              (click)="quickSetDiscount(item.variant, 30)"
                              class="px-1.5 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-outline hover:text-amber-300 transition cursor-pointer font-semibold"
                            >
                              30%
                            </button>
                            <button
                              type="button"
                              (click)="quickSetDiscount(item.variant, 50)"
                              class="px-1.5 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-outline hover:text-amber-300 transition cursor-pointer font-semibold"
                            >
                              50%
                            </button>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-center">
                        <div class="inline-flex items-center gap-1">
                          <button
                            type="button"
                            (click)="adjustPhysicalStock(item.variant, -1)"
                            class="w-5 h-5 rounded bg-surface-container-high hover:bg-surface-container-highest text-outline hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer transition"
                            title="Restar 1 unidad física"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            [ngModel]="item.variant.stock_physical ?? item.variant.stock"
                            (blur)="onPhysicalStockChange(item.variant, $event)"
                            min="0"
                            class="w-14 bg-surface border border-outline-variant rounded px-1.5 py-0.5 text-xs font-bold text-center text-on-surface focus:outline-none focus:border-primary"
                            title="Stock Físico disponible"
                          />
                          <button
                            type="button"
                            (click)="adjustPhysicalStock(item.variant, 1)"
                            class="w-5 h-5 rounded bg-surface-container-high hover:bg-surface-container-highest text-outline hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer transition"
                            title="Sumar 1 unidad física"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-center">
                        <div class="inline-flex items-center gap-1">
                          <input
                            type="number"
                            [ngModel]="item.variant.stock_virtual ?? 0"
                            (blur)="onVirtualStockChange(item.variant, $event)"
                            min="0"
                            class="w-14 bg-surface border border-purple-500/40 rounded px-1.5 py-0.5 text-xs font-bold text-center text-purple-300 focus:outline-none focus:border-purple-400"
                            title="Stock Virtual / Proveedor"
                          />
                          <span class="text-[11px] text-purple-400/80">uds.</span>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-center">
                        <span class="font-mono font-bold text-xs text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded whitespace-nowrap" title="Total disponible para compras en tienda (Físico + Virtual)">
                          {{ item.variant.stock }} uds.
                        </span>
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
                      <td class="py-3.5 px-4 text-center">
                        <div class="flex flex-col items-center gap-1.5">
                          <button
                            type="button"
                            (click)="toggleProductVisibility(item.product.id)"
                            [class.bg-emerald-950]="item.product.is_active !== false"
                            [class.text-emerald-300]="item.product.is_active !== false"
                            [class.border-emerald-500/40]="item.product.is_active !== false"
                            [class.bg-surface-container-high]="item.product.is_active === false"
                            [class.text-outline]="item.product.is_active === false"
                            [class.border-outline-variant]="item.product.is_active === false"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer hover:brightness-125"
                            [title]="item.product.is_active !== false ? 'Producto visible en tienda. Clic para ocultar' : 'Producto oculto. Clic para mostrar en tienda'"
                          >
                            <span class="h-2 w-2 rounded-full" [class.bg-emerald-400]="item.product.is_active !== false" [class.bg-outline]="item.product.is_active === false"></span>
                            <span>{{ item.product.is_active !== false ? '👁️ Visible' : '🚫 Oculto' }}</span>
                          </button>

                          <button
                            type="button"
                            (click)="productService.toggleProductInNewStrip(item.product.id)"
                            [class.bg-primary-container]="productService.isProductInNewStrip(item.product.id)"
                            [class.text-primary]="productService.isProductInNewStrip(item.product.id)"
                            [class.border-primary/40]="productService.isProductInNewStrip(item.product.id)"
                            [class.bg-surface-container-high]="!productService.isProductInNewStrip(item.product.id)"
                            [class.text-outline]="!productService.isProductInNewStrip(item.product.id)"
                            [class.border-outline-variant/40]="!productService.isProductInNewStrip(item.product.id)"
                            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer hover:brightness-125 whitespace-nowrap"
                            [title]="productService.isProductInNewStrip(item.product.id) ? 'En la Franja de Productos Nuevos (Clic para quitar)' : 'Agregar a la Franja de Productos Nuevos'"
                          >
                            <span>{{ productService.isProductInNewStrip(item.product.id) ? '✨ En Franja Nuevos' : '+ Franja Nuevos' }}</span>
                          </button>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button
                            (click)="openEditProductModal(item.product)"
                            title="Editar producto, descuentos e imágenes"
                            class="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-[11px] font-semibold text-primary transition cursor-pointer flex items-center gap-1"
                          >
                            <span>✏️</span>
                            <span>Editar</span>
                          </button>
                          <button
                            (click)="adjustPhysicalStock(item.variant, 5)"
                            title="Sumar +5 unidades al stock físico"
                            class="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-[11px] font-semibold text-on-surface-variant transition cursor-pointer"
                          >
                            +5
                          </button>
                          <button
                            (click)="adjustPhysicalStock(item.variant, 10)"
                            title="Sumar +10 unidades al stock físico"
                            class="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-[11px] font-semibold text-on-surface-variant transition cursor-pointer"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            (click)="deleteProduct(item.product.id)"
                            title="Eliminar este producto"
                            class="p-1 rounded bg-surface-container-high hover:bg-rose-950/60 text-outline hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="12" class="text-center py-8 text-outline">
                        No se encontraron productos o variantes con los filtros actuales.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-admin-pagination
              [currentPage]="inventoryPage()"
              [totalItems]="flattenedVariants().length"
              [pageSize]="pageSize"
              (pageChange)="inventoryPage.set($event)"
            ></app-admin-pagination>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- TAB 2: GESTIÓN DE CATEGORÍAS & SUBCATEGORÍAS -->
      <!-- ========================================================================= -->
      @if (activeTab() === 'categories') {
        <div class="space-y-6">
          <div class="das-card p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/40 pb-3">
              <div>
                <h3 class="text-base font-bold text-on-surface">Estructura Jerárquica de Categorías</h3>
                <p class="text-xs text-outline">Crea categorías principales y subcategorías anidadas. Puedes habilitarlas, deshabilitarlas o editarlas.</p>
              </div>
              <button
                (click)="openCategoryModal()"
                class="btn-primary py-2! px-4! text-xs flex items-center gap-1.5"
              >
                <span>+ Nueva Categoría / Subcategoría</span>
              </button>
            </div>

            <!-- Categories Tree Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-on-surface-variant">
                <thead class="bg-surface-container-low text-outline uppercase text-[11px] border-b border-outline-variant/40">
                  <tr>
                    <th class="py-3 px-4">Nombre de Categoría</th>
                    <th class="py-3 px-4">Tipo / Jerarquía</th>
                    <th class="py-3 px-4">Slug URL</th>
                    <th class="py-3 px-4">Marcas Asociadas</th>
                    <th class="py-3 px-4">Estado</th>
                    <th class="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/20">
                  @for (cat of paginatedCategories(); track cat.id) {
                    <tr class="hover:bg-surface-container/60 transition" [class.bg-surface-container/20]="cat.parent_id">
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-2">
                          @if (cat.parent_id) {
                            <span class="text-outline pl-4 font-mono">↳</span>
                            <span class="font-medium text-on-surface">{{ cat.name }}</span>
                          } @else {
                            <span class="text-primary font-bold">📁</span>
                            <span class="font-bold text-on-surface">{{ cat.name }}</span>
                          }
                        </div>
                      </td>
                      <td class="py-3.5 px-4">
                        @if (cat.parent_id) {
                          <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container-high text-on-surface-variant">
                            Subcategoría de {{ getCategoryName(cat.parent_id) }}
                          </span>
                        } @else {
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-container text-primary">
                            Categoría Principal
                          </span>
                        }
                      </td>
                      <td class="py-3.5 px-4 font-mono text-[11px] text-outline">
                        /{{ cat.slug }}
                      </td>
                      <td class="py-3.5 px-4">
                        <span class="font-semibold text-primary">
                          {{ getBrandsForCatCount(cat.id) }} marcas
                        </span>
                      </td>
                      <td class="py-3.5 px-4">
                        @if (cat.is_active !== false) {
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            Activa
                          </span>
                        } @else {
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Deshabilitada
                          </span>
                        }
                      </td>
                      <td class="py-3.5 px-4 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button
                            (click)="toggleCategoryStatus(cat.id)"
                            [title]="cat.is_active !== false ? 'Deshabilitar categoría' : 'Habilitar categoría'"
                            class="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-xs transition cursor-pointer"
                          >
                            {{ cat.is_active !== false ? 'Desactivar' : 'Activar' }}
                          </button>
                          <button
                            (click)="editCategory(cat)"
                            class="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-semibold transition cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            (click)="deleteCategory(cat.id)"
                            class="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs transition cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="text-center py-8 text-outline">
                        No hay categorías registradas.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-admin-pagination
              [currentPage]="categoriesPage()"
              [totalItems]="organizedCategories().length"
              [pageSize]="pageSize"
              (pageChange)="categoriesPage.set($event)"
            ></app-admin-pagination>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- TAB 3: GESTIÓN DE MARCAS LIGADAS A CATEGORÍAS -->
      <!-- ========================================================================= -->
      @if (activeTab() === 'brands') {
        <div class="space-y-6">
          <div class="das-card p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/40 pb-3">
              <div>
                <h3 class="text-base font-bold text-on-surface">Directorio de Marcas & Categorías Vinculadas</h3>
                <p class="text-xs text-outline">Gestiona los fabricantes y asigna a qué categorías pertenecen para filtrar automáticamente en la creación de productos.</p>
              </div>
              <button
                (click)="openBrandModal()"
                class="btn-primary py-2! px-4! text-xs flex items-center gap-1.5"
              >
                <span>+ Nueva Marca</span>
              </button>
            </div>

            <!-- Brands Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-on-surface-variant">
                <thead class="bg-surface-container-low text-outline uppercase text-[11px] border-b border-outline-variant/40">
                  <tr>
                    <th class="py-3 px-4">Marca</th>
                    <th class="py-3 px-4">Slug</th>
                    <th class="py-3 px-4">Categorías Ligadas</th>
                    <th class="py-3 px-4">Productos Actuales</th>
                    <th class="py-3 px-4">Estado</th>
                    <th class="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/20">
                  @for (brand of paginatedBrands(); track brand.id) {
                    <tr class="hover:bg-surface-container/60 transition">
                      <td class="py-3.5 px-4 font-bold text-on-surface">
                        <div class="flex items-center gap-2">
                          <span class="h-6 w-6 rounded bg-surface-container-high text-primary flex items-center justify-center font-extrabold text-[10px]">
                            {{ brand.name.charAt(0) }}
                          </span>
                          <span>{{ brand.name }}</span>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 font-mono text-[11px] text-outline">
                        {{ brand.slug }}
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="flex flex-wrap gap-1 max-w-md">
                          @if (!brand.category_ids || brand.category_ids.length === 0) {
                            <span class="px-2 py-0.5 rounded text-[10px] bg-surface-container-high text-outline">
                              Global (Aplica a todas)
                            </span>
                          } @else {
                            @for (catId of brand.category_ids; track catId) {
                              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-container text-primary border border-primary/20">
                                {{ getCategoryName(catId) }}
                              </span>
                            }
                          }
                        </div>
                      </td>
                      <td class="py-3.5 px-4">
                        <span class="font-bold text-on-surface">
                          {{ getProductsForBrandCount(brand.id) }} productos
                        </span>
                      </td>
                      <td class="py-3.5 px-4">
                        @if (brand.is_active !== false) {
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            Activa
                          </span>
                        } @else {
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Deshabilitada
                          </span>
                        }
                      </td>
                      <td class="py-3.5 px-4 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button
                            (click)="toggleBrandStatus(brand.id)"
                            [title]="brand.is_active !== false ? 'Deshabilitar marca' : 'Habilitar marca'"
                            class="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-xs transition cursor-pointer"
                          >
                            {{ brand.is_active !== false ? 'Desactivar' : 'Activar' }}
                          </button>
                          <button
                            (click)="editBrand(brand)"
                            class="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-semibold transition cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            (click)="deleteBrand(brand.id)"
                            class="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs transition cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="text-center py-8 text-outline">
                        No hay marcas registradas.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-admin-pagination
              [currentPage]="brandsPage()"
              [totalItems]="adminService.brands().length"
              [pageSize]="pageSize"
              (pageChange)="brandsPage.set($event)"
            ></app-admin-pagination>
          </div>
        </div>
      }
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL 1: NUEVO PRODUCTO Y VARIANTE (CON VÍNCULO CATEGORÍA-MARCA DINÁMICO) -->
    <!-- ========================================================================= -->
    @if (isNewProductModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-3xl space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 class="text-base font-bold text-on-surface">Registrar Nuevo Producto & Variante</h3>
            <button (click)="isNewProductModalOpen.set(false)" class="text-outline hover:text-white">✕</button>
          </div>

          <form (ngSubmit)="saveProduct()" class="space-y-4">
            <!-- Product Info -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-primary">1. Información del Producto Base</h4>
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
                <!-- Category Selector with Direct Manage Button -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-xs font-semibold text-on-surface-variant">Categoría *</label>
                    <button
                      type="button"
                      (click)="openCategoryModal()"
                      class="text-[11px] text-primary hover:underline cursor-pointer"
                    >
                      + Gestionar
                    </button>
                  </div>
                  <select
                    [(ngModel)]="newProdForm.category_id"
                    (ngModelChange)="onProductCategorySelected($event)"
                    name="category_id"
                    required
                    class="das-input text-xs"
                  >
                    @for (cat of organizedCategories(); track cat.id) {
                      <option [value]="cat.id">
                        {{ cat.parent_id ? '↳ ' + cat.name : cat.name }}
                      </option>
                    }
                  </select>
                </div>

                <!-- Brand Selector (Linked dynamically to category) with Direct Manage Button -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-xs font-semibold text-on-surface-variant">Marca Vinculada *</label>
                    <button
                      type="button"
                      (click)="openBrandModal()"
                      class="text-[11px] text-primary hover:underline cursor-pointer"
                    >
                      + Gestionar
                    </button>
                  </div>
                  <select
                    [(ngModel)]="newProdForm.brand_id"
                    name="brand_id"
                    required
                    class="das-input text-xs"
                  >
                    @if (availableBrandsForNewProd().length === 0) {
                      <option value="" disabled selected>No hay marcas vinculadas a esta categoría</option>
                    }
                    @for (brand of availableBrandsForNewProd(); track brand.id) {
                      <option [value]="brand.id">{{ brand.name }}</option>
                    }
                  </select>
                  <p class="text-[10px] text-outline mt-1">
                    @if (availableBrandsForNewProd().length > 0) {
                      {{ availableBrandsForNewProd().length }} marcas disponibles para esta categoría
                    } @else {
                      <span class="text-amber-400">Sin marcas vinculadas. Pulsa '+ Gestionar' para vincular una.</span>
                    }
                  </p>
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

              <div class="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="new_is_active"
                  [(ngModel)]="newProdForm.is_active"
                  name="new_is_active"
                  class="rounded bg-surface border-outline-variant text-primary"
                />
                <label for="new_is_active" class="text-xs text-on-surface-variant cursor-pointer">Producto Activo y Visible en la Tienda</label>
              </div>
            </div>

            <!-- 2. Product Images Management (Min 1, Max 10) -->
            <div class="space-y-2.5 border-t border-outline-variant/40 pt-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div class="flex items-center gap-2">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-primary">2. Fotografías del Producto *</h4>
                  <span class="text-xs font-bold text-on-surface">({{ newProdImages().length }} / 10)</span>
                </div>
                @if (newProdImages().length === 0) {
                  <span class="text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full">
                    ⚠️ Mínimo 1 imagen requerida
                  </span>
                } @else if (newProdImages().length === 10) {
                  <span class="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Máximo alcanzado (10)
                  </span>
                } @else {
                  <span class="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    ✓ Válido ({{ newProdImages().length }} imagen{{ newProdImages().length > 1 ? 'es' : '' }})
                  </span>
                }
              </div>

              <p class="text-[11px] text-outline">
                Ingresa al menos 1 imagen y hasta 10 fotos. La primera imagen será la portada visible en la tienda.
              </p>

              <!-- Upload buttons / URL bar -->
              <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <!-- File Input Button -->
                <input
                  type="file"
                  #newProdFileInput
                  (change)="onUploadNewProductImages($event)"
                  multiple
                  accept="image/png, image/jpeg, image/webp, image/avif, image/gif"
                  class="hidden"
                />
                <button
                  type="button"
                  (click)="newProdFileInput.click()"
                  [disabled]="newProdImages().length >= 10 || isUploadingNewImages()"
                  class="btn-secondary py-2! px-3! text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  @if (isUploadingNewImages()) {
                    <span class="animate-spin text-sm">⏳</span>
                    <span>Subiendo...</span>
                  } @else {
                    <span>📁 Subir desde PC</span>
                  }
                </button>

                <!-- URL Input -->
                <div class="flex items-center gap-1 flex-1">
                  <input
                    type="url"
                    [(ngModel)]="newProdUrlInput"
                    name="newProdUrl"
                    placeholder="O pegar URL directa (https://...)"
                    class="das-input text-xs py-1.5 flex-1"
                    (keydown.enter)="$event.preventDefault(); addNewProductImageUrl()"
                  />
                  <button
                    type="button"
                    (click)="addNewProductImageUrl()"
                    [disabled]="newProdImages().length >= 10 || !newProdUrlInput.trim()"
                    class="px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    + Añadir
                  </button>
                </div>
              </div>

              <!-- Thumbnails Grid -->
              @if (newProdImages().length > 0) {
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                  @for (img of newProdImages(); track $index) {
                    <div class="relative group aspect-square rounded-xl overflow-hidden border border-outline-variant/60 bg-surface-container-high">
                      <img [src]="img" alt="Preview" class="w-full h-full object-cover" />
                      
                      <!-- Badge Cover -->
                      @if ($index === 0) {
                        <span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-black shadow-md">
                          ⭐ Portada
                        </span>
                      }

                      <!-- Hover Overlay with Actions -->
                      <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 p-1">
                        @if ($index !== 0) {
                          <button
                            type="button"
                            (click)="setPrimaryNewProductImage($index)"
                            class="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold hover:brightness-110 cursor-pointer"
                          >
                            Hacer Portada
                          </button>
                        }
                        <button
                          type="button"
                          (click)="removeNewProductImage($index)"
                          class="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                        >
                          ✕ Eliminar
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div
                  (click)="newProdFileInput.click()"
                  class="border-2 border-dashed border-outline-variant/60 rounded-xl p-4 text-center cursor-pointer hover:border-primary/60 transition bg-surface/40"
                >
                  <div class="text-2xl mb-1">🖼️</div>
                  <p class="text-xs font-semibold text-on-surface">No hay imágenes agregadas aún</p>
                  <p class="text-[11px] text-outline">Haz clic aquí para seleccionar fotos desde tu PC o pega una URL arriba</p>
                </div>
              }
            </div>

            <!-- 3. Ficha Técnica / Especificaciones Dinámicas -->
            <div class="space-y-3 border-t border-outline-variant/40 pt-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-primary">3. Ficha Técnica & Especificaciones</h4>
                  <p class="text-[11px] text-outline">
                    Visible en la pestaña "Ficha Técnica" de la tienda y utilizada para compatibilidad en el PC Builder.
                  </p>
                </div>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="applyNewProdSpecTemplate()"
                    class="px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>⚡</span>
                    <span>Plantilla Sugerida</span>
                  </button>
                  <button
                    type="button"
                    (click)="addNewProdSpecGroup()"
                    class="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>+</span>
                    <span>Nueva Sección</span>
                  </button>
                </div>
              </div>

              @if (newProdSpecGroups().length > 0) {
                <div class="space-y-3">
                  @for (group of newProdSpecGroups(); track $index; let gIdx = $index) {
                    <div class="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/50 space-y-2.5">
                      <!-- Group Header -->
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 flex-1 min-w-0">
                          <span class="text-xs font-bold text-primary whitespace-nowrap">📁 Sección:</span>
                          <input
                            type="text"
                            [(ngModel)]="group.category"
                            [name]="'new_spec_group_' + gIdx"
                            placeholder="Ej. Rendimiento, Conectividad, Pantalla..."
                            class="w-full min-w-0 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none text-xs font-bold text-on-surface placeholder:text-outline/50 transition"
                          />
                        </div>
                        <button
                          type="button"
                          (click)="removeNewProdSpecGroup(gIdx)"
                          class="p-1.5 rounded-lg hover:bg-rose-950/40 text-outline hover:text-rose-400 text-xs transition cursor-pointer"
                          title="Eliminar sección completa"
                        >
                          🗑️
                        </button>
                      </div>

                      <!-- Key-Value Items Rows -->
                      <div class="space-y-2 pl-2 sm:pl-3 border-l-2 border-outline-variant/40">
                        @for (item of group.items; track $index; let iIdx = $index) {
                          <div class="grid grid-cols-[minmax(120px,2fr)_auto_minmax(160px,3fr)_auto] items-center gap-2">
                            <input
                              type="text"
                              [(ngModel)]="item.key"
                              [name]="'new_spec_k_' + gIdx + '_' + iIdx"
                              placeholder="Atributo (ej. Capacidad, Socket)"
                              class="w-full min-w-0 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none text-xs text-on-surface-variant font-medium placeholder:text-outline/50 transition"
                            />
                            <span class="text-outline text-xs font-bold select-none">:</span>
                            <input
                              type="text"
                              [(ngModel)]="item.value"
                              [name]="'new_spec_v_' + gIdx + '_' + iIdx"
                              placeholder="Valor (ej. 2TB, 7450 MB/s, 16GB)"
                              class="w-full min-w-0 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none text-xs font-mono text-on-surface placeholder:text-outline/50 transition"
                            />
                            <button
                              type="button"
                              (click)="removeNewProdSpecItem(gIdx, iIdx)"
                              class="p-1.5 rounded-lg hover:bg-rose-950/40 text-outline hover:text-rose-400 text-xs transition cursor-pointer flex items-center justify-center"
                              title="Eliminar atributo"
                            >
                              ✕
                            </button>
                          </div>
                        }

                        <div class="pt-1">
                          <button
                            type="button"
                            (click)="addNewProdSpecItem(gIdx)"
                            class="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>+</span>
                            <span>Añadir fila a esta sección</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="border border-dashed border-outline-variant/60 rounded-xl p-3 text-center bg-surface/30">
                  <p class="text-xs text-outline mb-2">No has agregado ficha técnica a este producto.</p>
                  <div class="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      (click)="applyNewProdSpecTemplate()"
                      class="btn-secondary py-1.5! px-3! text-[11px] flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>⚡ Cargar Plantilla Sugerida</span>
                    </button>
                    <button
                      type="button"
                      (click)="addNewProdSpecGroup()"
                      class="btn-secondary py-1.5! px-3! text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Añadir Sección</span>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- 4. Ediciones / Variantes & Existencias -->
            <div class="space-y-3 border-t border-outline-variant/40 pt-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-primary">4. Ediciones, Variantes & Inventario</h4>
                  <p class="text-[11px] text-outline">
                    Define si este producto tiene una única edición estándar o múltiples variantes (capacidad, color, etc.).
                  </p>
                </div>
                <!-- Mode selector pills -->
                <div class="inline-flex rounded-lg bg-surface-container p-1 border border-outline-variant/40">
                  <button
                    type="button"
                    (click)="setNewProdVariantMode(false)"
                    [class.bg-primary]="!isNewProdMultiVariant()"
                    [class.text-on-primary]="!isNewProdMultiVariant()"
                    [class.text-on-surface-variant]="isNewProdMultiVariant()"
                    class="px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer"
                  >
                    Producto Simple (1 Edición)
                  </button>
                  <button
                    type="button"
                    (click)="setNewProdVariantMode(true)"
                    [class.bg-primary]="isNewProdMultiVariant()"
                    [class.text-on-primary]="isNewProdMultiVariant()"
                    [class.text-on-surface-variant]="!isNewProdMultiVariant()"
                    class="px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer"
                  >
                    Múltiples Ediciones
                  </button>
                </div>
              </div>

              @if (!isNewProdMultiVariant()) {
                <!-- Simple Product: 1 standard edition -->
                <div class="p-3.5 rounded-xl bg-surface-container/40 border border-outline-variant/40 space-y-3">
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
                      <label class="block text-xs font-semibold text-on-surface-variant mb-1">Nombre de la Edición</label>
                      <input
                        type="text"
                        [(ngModel)]="newVarForm.variant_name"
                        name="variant_name"
                        class="das-input text-xs"
                        placeholder="Estándar (predeterminado)"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label class="block text-xs font-semibold text-on-surface-variant mb-1">Precio de Venta ($ USD) *</label>
                      <input
                        type="number"
                        [(ngModel)]="newVarForm.price"
                        name="price"
                        required
                        min="0"
                        step="0.01"
                        class="das-input text-xs font-mono font-bold"
                        placeholder="999.00"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-on-surface-variant mb-1">Precio Antes / Regular ($)</label>
                      <input
                        type="number"
                        [(ngModel)]="newVarForm.compare_at_price"
                        name="compare_at_price"
                        min="0"
                        step="0.01"
                        class="das-input text-xs font-mono"
                        placeholder="Opcional (para Descuento)"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-on-surface-variant mb-1">Stock Físico *</label>
                      <input
                        type="number"
                        [(ngModel)]="newVarForm.stock_physical"
                        name="stock_physical"
                        required
                        min="0"
                        class="das-input text-xs font-bold"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-on-surface-variant mb-1">Stock Virtual</label>
                      <input
                        type="number"
                        [(ngModel)]="newVarForm.stock_virtual"
                        name="stock_virtual"
                        min="0"
                        class="das-input text-xs font-bold"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  @if (newVarForm.compare_at_price && newVarForm.compare_at_price > newVarForm.price) {
                    <div class="flex items-center gap-2 p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs">
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-tertiary-container! text-[#f1bd81]! border border-[#f1bd81]/30">
                        OFERTA -{{ calculateDiscountPercent(newVarForm.compare_at_price, newVarForm.price) }}%
                      </span>
                      <span class="text-amber-200">
                        Precio regular tachado: &dollar;{{ newVarForm.compare_at_price | number:'1.2-2' }} &bull; Ahorro cliente: &dollar;{{ (newVarForm.compare_at_price - newVarForm.price) | number:'1.2-2' }}
                      </span>
                    </div>
                  }

                  <div class="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-high/60 border border-outline-variant/40 text-xs">
                    <span class="text-on-surface-variant font-medium">Stock Total Disponible en Tienda:</span>
                    <span class="font-bold text-primary font-mono text-sm bg-primary/10 px-2 py-0.5 rounded">
                      {{ (newVarForm.stock_physical || 0) + (newVarForm.stock_virtual || 0) }} unidades
                    </span>
                  </div>

                  <div class="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="is_bundle"
                      [(ngModel)]="newVarForm.is_bundle"
                      name="is_bundle"
                      class="rounded bg-surface border-outline-variant text-primary"
                    />
                    <label for="is_bundle" class="text-xs text-on-surface-variant">Este ítem es un Combo / Bundle con múltiples piezas</label>
                  </div>
                </div>
              } @else {
                <!-- Multi-variant: dynamic list of editions -->
                <div class="space-y-3">
                  @for (v of newProdVariants(); track $index; let vIdx = $index) {
                    <div class="p-3.5 rounded-xl bg-surface-container/60 border border-outline-variant/60 space-y-2.5">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-primary flex items-center gap-1.5">
                          <span>🏷️ Edición #{{ vIdx + 1 }}</span>
                          @if (vIdx === 0) {
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Principal</span>
                          }
                        </span>
                        @if (newProdVariants().length > 1) {
                          <button
                            type="button"
                            (click)="removeNewProdVariantRow(vIdx)"
                            class="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                          >
                            🗑️ Eliminar
                          </button>
                        }
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Nombre de la Edición / Variante *</label>
                          <input
                            type="text"
                            [(ngModel)]="v.variant_name"
                            [name]="'new_var_name_' + vIdx"
                            placeholder="Ej. 256GB / Negro, Edición OC, 32GB RAM"
                            required
                            class="das-input text-xs"
                          />
                        </div>
                        <div>
                          <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">SKU Único *</label>
                          <input
                            type="text"
                            [(ngModel)]="v.sku"
                            [name]="'new_var_sku_' + vIdx"
                            placeholder="Ej. IP16-256-BLK"
                            required
                            class="das-input text-xs font-mono uppercase"
                          />
                        </div>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                        <div>
                          <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Precio Venta ($) *</label>
                          <input
                            type="number"
                            [(ngModel)]="v.price"
                            [name]="'new_var_price_' + vIdx"
                            min="0"
                            step="0.01"
                            required
                            class="das-input text-xs font-mono font-bold"
                            placeholder="799.00"
                          />
                        </div>
                        <div>
                          <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Precio Antes ($)</label>
                          <input
                            type="number"
                            [(ngModel)]="v.compare_at_price"
                            [name]="'new_var_compare_' + vIdx"
                            min="0"
                            step="0.01"
                            class="das-input text-xs font-mono"
                            placeholder="Opcional"
                          />
                        </div>
                        <div>
                          <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Stock Físico *</label>
                          <input
                            type="number"
                            [(ngModel)]="v.stock_physical"
                            [name]="'new_var_phys_stock_' + vIdx"
                            min="0"
                            required
                            class="das-input text-xs font-bold"
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Stock Virtual</label>
                          <input
                            type="number"
                            [(ngModel)]="v.stock_virtual"
                            [name]="'new_var_virt_stock_' + vIdx"
                            min="0"
                            class="das-input text-xs font-bold"
                            placeholder="0"
                          />
                        </div>
                        <div class="flex items-center pt-4">
                          <label class="flex items-center gap-1.5 cursor-pointer text-[11px] text-on-surface-variant">
                            <input
                              type="checkbox"
                              [(ngModel)]="v.is_bundle"
                              [name]="'new_var_bundle_' + vIdx"
                              class="rounded bg-surface border-outline-variant text-primary"
                            />
                            <span>Combo</span>
                          </label>
                        </div>
                      </div>

                      @if (v.compare_at_price && v.compare_at_price > v.price) {
                        <div class="flex items-center gap-2 p-1.5 rounded-lg bg-amber-950/20 border border-amber-500/25 text-[11px]">
                          <span class="px-1.5 py-0.2 rounded font-black text-[9px] bg-tertiary-container! text-[#f1bd81]! border border-[#f1bd81]/30">
                            -{{ calculateDiscountPercent(v.compare_at_price, v.price) }}%
                          </span>
                          <span class="text-amber-200">
                            Ahorro: &dollar;{{ (v.compare_at_price - v.price) | number:'1.2-2' }}
                          </span>
                        </div>
                      }

                      <div class="text-[11px] text-outline flex items-center justify-end gap-1.5 pt-1">
                        <span>Total disponible:</span>
                        <span class="font-bold text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                          {{ (v.stock_physical || 0) + (v.stock_virtual || 0) }} uds.
                        </span>
                      </div>
                    </div>
                  }

                  <button
                    type="button"
                    (click)="addNewProdVariantRow()"
                    class="w-full py-2.5 rounded-xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>+ Añadir Otra Edición / Variante</span>
                  </button>
                </div>
              }
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
                [disabled]="newProdImages().length < 1 || newProdImages().length > 10 || isUploadingNewImages()"
                class="btn-primary py-2! px-5! text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar en Inventario
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ========================================================================= -->
    <!-- MODAL 2: CREAR / EDITAR CATEGORÍA O SUBCATEGORÍA -->
    <!-- ========================================================================= -->
    @if (isCategoryModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 class="text-base font-bold text-on-surface">
              {{ editingCategory() ? 'Editar Categoría / Subcategoría' : 'Nueva Categoría / Subcategoría' }}
            </h3>
            <button (click)="isCategoryModalOpen.set(false)" class="text-outline hover:text-white">✕</button>
          </div>

          <form (ngSubmit)="saveCategoryForm()" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Nombre de la Categoría *</label>
              <input
                type="text"
                [(ngModel)]="categoryForm.name"
                name="cat_name"
                required
                class="das-input text-xs"
                placeholder="Ej. Tarjetas Gráficas, o RTX Serie 50..."
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Jerarquía / Categoría Padre</label>
              <select [(ngModel)]="categoryForm.parent_id" name="cat_parent" class="das-input text-xs">
                <option [ngValue]="null">📂 Ninguna (Categoría Principal Raíz)</option>
                @for (parent of parentCategories(); track parent.id) {
                  @if (!editingCategory() || editingCategory()!.id !== parent.id) {
                    <option [value]="parent.id">↳ Subcategoría de: {{ parent.name }}</option>
                  }
                }
              </select>
              <p class="text-[10px] text-outline mt-1">Selecciona una categoría padre si deseas que sea una subcategoría.</p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Slug URL (Opcional)</label>
              <input
                type="text"
                [(ngModel)]="categoryForm.slug"
                name="cat_slug"
                class="das-input text-xs font-mono"
                placeholder="ej. gpus-nvidia (se genera automáticamente)"
              />
            </div>

            <div class="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="cat_active"
                [(ngModel)]="categoryForm.is_active"
                name="cat_active"
                class="rounded bg-surface border-outline-variant text-primary"
              />
              <label for="cat_active" class="text-xs text-on-surface-variant">Categoría Activa y Habilitada para el catálogo</label>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
              <button
                type="button"
                (click)="isCategoryModalOpen.set(false)"
                class="btn-secondary py-2! px-4! text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary py-2! px-5! text-xs"
              >
                {{ editingCategory() ? 'Actualizar Categoría' : 'Crear Categoría' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ========================================================================= -->
    <!-- MODAL 3: CREAR / EDITAR MARCA (CON VÍNCULO A CATEGORÍAS) -->
    <!-- ========================================================================= -->
    @if (isBrandModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 class="text-base font-bold text-on-surface">
              {{ editingBrand() ? 'Editar Marca & Vínculos' : 'Nueva Marca' }}
            </h3>
            <button (click)="isBrandModalOpen.set(false)" class="text-outline hover:text-white">✕</button>
          </div>

          <form (ngSubmit)="saveBrandForm()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Nombre de la Marca *</label>
              <input
                type="text"
                [(ngModel)]="brandForm.name"
                name="brand_name"
                required
                class="das-input text-xs"
                placeholder="Ej. ASUS, Corsair, NVIDIA, Sony, Razer..."
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Slug URL (Opcional)</label>
              <input
                type="text"
                [(ngModel)]="brandForm.slug"
                name="brand_slug"
                class="das-input text-xs font-mono"
                placeholder="ej. asus-rog (se genera automáticamente)"
              />
            </div>

            <!-- Category Association Multi-Selector -->
            <div class="space-y-2">
              <label class="block text-xs font-semibold text-on-surface-variant">
                Categorías a las que aplica esta marca *
              </label>
              <p class="text-[10px] text-outline">
                Selecciona las categorías donde esta marca fabrica o comercializa productos. Solo aparecerá vinculada a estas categorías al crear productos.
              </p>
              <div class="max-h-44 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-surface border border-outline-variant/40">
                @for (cat of organizedCategories(); track cat.id) {
                  <label class="flex items-center gap-2 text-xs text-on-surface-variant hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      [checked]="isCategoryLinkedToBrand(cat.id)"
                      (change)="toggleCategoryInBrand(cat.id)"
                      class="rounded bg-surface-container border-outline-variant text-primary"
                    />
                    <span [class.pl-3]="cat.parent_id" [class.text-primary]="!cat.parent_id">
                      {{ cat.parent_id ? '↳ ' + cat.name : cat.name }}
                    </span>
                  </label>
                }
              </div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="brand_active"
                [(ngModel)]="brandForm.is_active"
                name="brand_active"
                class="rounded bg-surface border-outline-variant text-primary"
              />
              <label for="brand_active" class="text-xs text-on-surface-variant">Marca Activa y Habilitada para el catálogo</label>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
              <button
                type="button"
                (click)="isBrandModalOpen.set(false)"
                class="btn-secondary py-2! px-4! text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary py-2! px-5! text-xs"
              >
                {{ editingBrand() ? 'Actualizar Marca' : 'Crear Marca' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ========================================================================= -->
    <!-- MODAL 4: EDITAR PRODUCTO & GESTIÓN / SUBIDA DE IMÁGENES -->
    <!-- ========================================================================= -->
    @if (isEditProductModalOpen() && editingProduct()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-3xl space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <div>
              <span class="text-[10px] uppercase font-bold tracking-wider text-primary">Edición de Catálogo</span>
              <h3 class="text-base font-bold text-on-surface">Editar Producto: {{ editingProduct()!.model }}</h3>
            </div>
            <button (click)="isEditProductModalOpen.set(false)" class="text-outline hover:text-white">✕</button>
          </div>

          <form (ngSubmit)="saveEditProduct()" class="space-y-4">
            <!-- Basic Info -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-primary">1. Datos del Producto</h4>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Nombre / Modelo del Producto *</label>
                <input
                  type="text"
                  [(ngModel)]="editProdForm.model"
                  name="edit_model"
                  required
                  class="das-input text-xs"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-semibold text-on-surface-variant mb-1 block">Categoría *</label>
                  <select
                    [(ngModel)]="editProdForm.category_id"
                    (ngModelChange)="onEditProductCategorySelected($event)"
                    name="edit_category_id"
                    required
                    class="das-input text-xs"
                  >
                    @for (cat of organizedCategories(); track cat.id) {
                      <option [value]="cat.id">
                        {{ cat.parent_id ? '↳ ' + cat.name : cat.name }}
                      </option>
                    }
                  </select>
                </div>

                <div>
                  <label class="text-xs font-semibold text-on-surface-variant mb-1 block">Marca Vinculada *</label>
                  <select
                    [(ngModel)]="editProdForm.brand_id"
                    name="edit_brand_id"
                    required
                    class="das-input text-xs"
                  >
                    @if (availableBrandsForEditProd().length === 0) {
                      <option value="" disabled selected>No hay marcas vinculadas a esta categoría</option>
                    }
                    @for (brand of availableBrandsForEditProd(); track brand.id) {
                      <option [value]="brand.id">{{ brand.name }}</option>
                    }
                  </select>
                  <p class="text-[10px] text-outline mt-1">
                    @if (availableBrandsForEditProd().length > 0) {
                      {{ availableBrandsForEditProd().length }} marcas disponibles para esta categoría
                    } @else {
                      <span class="text-amber-400">Sin marcas vinculadas. Pulsa en Marcas para vincular una.</span>
                    }
                  </p>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Descripción Breve</label>
                <input
                  type="text"
                  [(ngModel)]="editProdForm.short_description"
                  name="edit_short_desc"
                  class="das-input text-xs"
                />
              </div>

              <div class="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  [(ngModel)]="editProdForm.is_active"
                  name="edit_is_active"
                  class="rounded bg-surface border-outline-variant text-primary"
                />
                <label for="edit_is_active" class="text-xs text-on-surface-variant">Producto Activo y Visible en la Tienda</label>
              </div>
            </div>

            <!-- Image Management in Edit Mode (Min 1, Max 10, Upload more images) -->
            <div class="space-y-2.5 border-t border-outline-variant/40 pt-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div class="flex items-center gap-2">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-primary">2. Fotografías Ligadas al Producto *</h4>
                  <span class="text-xs font-bold text-on-surface">({{ editProdImages().length }} / 10)</span>
                </div>
                @if (editProdImages().length === 0) {
                  <span class="text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full">
                    ⚠️ Mínimo 1 imagen requerida
                  </span>
                } @else if (editProdImages().length === 10) {
                  <span class="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Máximo alcanzado (10)
                  </span>
                } @else {
                  <span class="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    ✓ Válido ({{ editProdImages().length }} imagen{{ editProdImages().length > 1 ? 'es' : '' }})
                  </span>
                }
              </div>

              <p class="text-[11px] text-outline">
                Puedes subir más imágenes desde tu ordenador o agregar enlaces para enriquecer la galería del producto (hasta 10 fotos).
              </p>

              <!-- Upload buttons / URL bar -->
              <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <input
                  type="file"
                  #editProdFileInput
                  (change)="onUploadEditProductImages($event)"
                  multiple
                  accept="image/png, image/jpeg, image/webp, image/avif, image/gif"
                  class="hidden"
                />
                <button
                  type="button"
                  (click)="editProdFileInput.click()"
                  [disabled]="editProdImages().length >= 10 || isUploadingEditImages()"
                  class="btn-secondary py-2! px-3! text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  @if (isUploadingEditImages()) {
                    <span class="animate-spin text-sm">⏳</span>
                    <span>Subiendo...</span>
                  } @else {
                    <span>📁 Subir Más Fotos desde PC</span>
                  }
                </button>

                <!-- URL Input -->
                <div class="flex items-center gap-1 flex-1">
                  <input
                    type="url"
                    [(ngModel)]="editProdUrlInput"
                    name="editProdUrl"
                    placeholder="O pegar URL directa (https://...)"
                    class="das-input text-xs py-1.5 flex-1"
                    (keydown.enter)="$event.preventDefault(); addEditProductImageUrl()"
                  />
                  <button
                    type="button"
                    (click)="addEditProductImageUrl()"
                    [disabled]="editProdImages().length >= 10 || !editProdUrlInput.trim()"
                    class="px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    + Añadir
                  </button>
                </div>
              </div>

              <!-- Thumbnails Grid -->
              @if (editProdImages().length > 0) {
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                  @for (img of editProdImages(); track $index) {
                    <div class="relative group aspect-square rounded-xl overflow-hidden border border-outline-variant/60 bg-surface-container-high">
                      <img [src]="img" alt="Preview" class="w-full h-full object-cover" />
                      
                      @if ($index === 0) {
                        <span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-black shadow-md">
                          ⭐ Portada
                        </span>
                      }

                      <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 p-1">
                        @if ($index !== 0) {
                          <button
                            type="button"
                            (click)="setPrimaryEditProductImage($index)"
                            class="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold hover:brightness-110 cursor-pointer"
                          >
                            Hacer Portada
                          </button>
                        }
                        <button
                          type="button"
                          (click)="removeEditProductImage($index)"
                          class="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                        >
                          ✕ Eliminar
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div
                  (click)="editProdFileInput.click()"
                  class="border-2 border-dashed border-rose-500/40 bg-rose-950/10 rounded-xl p-4 text-center cursor-pointer hover:border-rose-500/70 transition"
                >
                  <div class="text-2xl mb-1">⚠️</div>
                  <p class="text-xs font-semibold text-rose-300">El producto debe tener al menos 1 imagen</p>
                  <p class="text-[11px] text-outline">Sube una imagen o añade una URL para poder guardar los cambios.</p>
                </div>
              }
            </div>

            <!-- 3. Ficha Técnica / Especificaciones Dinámicas (Edición) -->
            <div class="space-y-3 border-t border-outline-variant/40 pt-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-primary">3. Ficha Técnica & Especificaciones</h4>
                  <p class="text-[11px] text-outline">
                    Modifica o añade secciones y atributos para la ficha técnica del producto.
                  </p>
                </div>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="applyEditProdSpecTemplate()"
                    class="px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>⚡</span>
                    <span>Plantilla Sugerida</span>
                  </button>
                  <button
                    type="button"
                    (click)="addEditProdSpecGroup()"
                    class="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>+</span>
                    <span>Nueva Sección</span>
                  </button>
                </div>
              </div>

              @if (editProdSpecGroups().length > 0) {
                <div class="space-y-3">
                  @for (group of editProdSpecGroups(); track $index; let gIdx = $index) {
                    <div class="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/50 space-y-2.5">
                      <!-- Group Header -->
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 flex-1 min-w-0">
                          <span class="text-xs font-bold text-primary whitespace-nowrap">📁 Sección:</span>
                          <input
                            type="text"
                            [(ngModel)]="group.category"
                            [name]="'edit_spec_group_' + gIdx"
                            placeholder="Ej. Rendimiento, Conectividad, Pantalla..."
                            class="w-full min-w-0 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none text-xs font-bold text-on-surface placeholder:text-outline/50 transition"
                          />
                        </div>
                        <button
                          type="button"
                          (click)="removeEditProdSpecGroup(gIdx)"
                          class="p-1.5 rounded-lg hover:bg-rose-950/40 text-outline hover:text-rose-400 text-xs transition cursor-pointer"
                          title="Eliminar sección completa"
                        >
                          🗑️
                        </button>
                      </div>

                      <!-- Key-Value Items Rows -->
                      <div class="space-y-2 pl-2 sm:pl-3 border-l-2 border-outline-variant/40">
                        @for (item of group.items; track $index; let iIdx = $index) {
                          <div class="grid grid-cols-[minmax(120px,2fr)_auto_minmax(160px,3fr)_auto] items-center gap-2">
                            <input
                              type="text"
                              [(ngModel)]="item.key"
                              [name]="'edit_spec_k_' + gIdx + '_' + iIdx"
                              placeholder="Atributo (ej. Capacidad, Socket)"
                              class="w-full min-w-0 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none text-xs text-on-surface-variant font-medium placeholder:text-outline/50 transition"
                            />
                            <span class="text-outline text-xs font-bold select-none">:</span>
                            <input
                              type="text"
                              [(ngModel)]="item.value"
                              [name]="'edit_spec_v_' + gIdx + '_' + iIdx"
                              placeholder="Valor (ej. 2TB, 7450 MB/s, 16GB)"
                              class="w-full min-w-0 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none text-xs font-mono text-on-surface placeholder:text-outline/50 transition"
                            />
                            <button
                              type="button"
                              (click)="removeEditProdSpecItem(gIdx, iIdx)"
                              class="p-1.5 rounded-lg hover:bg-rose-950/40 text-outline hover:text-rose-400 text-xs transition cursor-pointer flex items-center justify-center"
                              title="Eliminar atributo"
                            >
                              ✕
                            </button>
                          </div>
                        }

                        <div class="pt-1">
                          <button
                            type="button"
                            (click)="addEditProdSpecItem(gIdx)"
                            class="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>+</span>
                            <span>Añadir fila a esta sección</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="border border-dashed border-outline-variant/60 rounded-xl p-3 text-center bg-surface/30">
                  <p class="text-xs text-outline mb-2">Este producto no cuenta con especificaciones técnicas detalladas.</p>
                  <div class="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      (click)="applyEditProdSpecTemplate()"
                      class="btn-secondary py-1.5! px-3! text-[11px] flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>⚡ Cargar Plantilla Sugerida</span>
                    </button>
                    <button
                      type="button"
                      (click)="addEditProdSpecGroup()"
                      class="btn-secondary py-1.5! px-3! text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Añadir Sección</span>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- 4. Ediciones & Variantes del Producto -->
            <div class="space-y-3 border-t border-outline-variant/40 pt-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-primary">4. Ediciones & Existencias (Variantes)</h4>
                  <p class="text-[11px] text-outline">
                    Administra las diferentes ediciones del producto. Si tiene más de 1 edición, la tienda mostrará el selector para que el cliente elija.
                  </p>
                </div>
                <button
                  type="button"
                  (click)="addEditProdVariantRow()"
                  class="px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>+ Añadir Edición</span>
                </button>
              </div>

              <div class="space-y-3">
                @for (v of editProdVariants(); track $index; let vIdx = $index) {
                  <div class="p-3.5 rounded-xl bg-surface-container/60 border border-outline-variant/60 space-y-2.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-primary">🏷️ Edición #{{ vIdx + 1 }}</span>
                        @if (v.isNew) {
                          <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                            Nueva
                          </span>
                        }
                        @if (vIdx === 0 && editProdVariants().length > 1) {
                          <span class="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-medium">
                            Predeterminada
                          </span>
                        }
                      </div>
                      @if (editProdVariants().length > 1) {
                        <button
                          type="button"
                          (click)="removeEditProdVariantRow(vIdx)"
                          class="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                        >
                          🗑️ Eliminar
                        </button>
                      }
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Nombre de la Edición *</label>
                        <input
                          type="text"
                          [(ngModel)]="v.variant_name"
                          [name]="'edit_var_name_' + vIdx"
                          placeholder="Ej. Estándar, 512GB Blanco, Edición OC"
                          required
                          class="das-input text-xs"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">SKU *</label>
                        <input
                          type="text"
                          [(ngModel)]="v.sku"
                          [name]="'edit_var_sku_' + vIdx"
                          placeholder="Ej. GPU-RTX-5080-OC"
                          required
                          class="das-input text-xs font-mono uppercase"
                        />
                      </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                      <div>
                        <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Precio Venta ($) *</label>
                        <input
                          type="number"
                          [(ngModel)]="v.price"
                          [name]="'edit_var_price_' + vIdx"
                          min="0"
                          step="0.01"
                          required
                          class="das-input text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Precio Antes ($)</label>
                        <input
                          type="number"
                          [(ngModel)]="v.compare_at_price"
                          [name]="'edit_var_compare_' + vIdx"
                          min="0"
                          step="0.01"
                          class="das-input text-xs font-mono"
                          placeholder="Opcional (Oferta)"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Stock Físico *</label>
                        <input
                          type="number"
                          [(ngModel)]="v.stock_physical"
                          [name]="'edit_var_phys_stock_' + vIdx"
                          min="0"
                          required
                          class="das-input text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Stock Virtual</label>
                        <input
                          type="number"
                          [(ngModel)]="v.stock_virtual"
                          [name]="'edit_var_virt_stock_' + vIdx"
                          min="0"
                          class="das-input text-xs font-bold"
                        />
                      </div>
                      <div class="flex items-center pt-4">
                        <label class="flex items-center gap-1.5 cursor-pointer text-[11px] text-on-surface-variant">
                          <input
                            type="checkbox"
                            [(ngModel)]="v.is_bundle"
                            [name]="'edit_var_bundle_' + vIdx"
                            class="rounded bg-surface border-outline-variant text-primary"
                          />
                          <span>Combo</span>
                        </label>
                      </div>
                    </div>

                    @if (v.compare_at_price && v.compare_at_price > v.price) {
                      <div class="flex items-center gap-2 p-1.5 rounded-lg bg-amber-950/20 border border-amber-500/25 text-[11px]">
                        <span class="px-1.5 py-0.2 rounded font-black text-[9px] bg-tertiary-container! text-[#f1bd81]! border border-[#f1bd81]/30">
                          OFERTA -{{ calculateDiscountPercent(v.compare_at_price, v.price) }}%
                        </span>
                        <span class="text-amber-200">
                          Precio tachado: &dollar;{{ v.compare_at_price | number:'1.2-2' }} &bull; Ahorro cliente: &dollar;{{ (v.compare_at_price - v.price) | number:'1.2-2' }}
                        </span>
                      </div>
                    }
                    <div class="text-[11px] text-outline flex items-center justify-end gap-1.5 pt-1">
                      <span>Total disponible:</span>
                      <span class="font-bold text-primary font-mono bg-primary/10 px-1.5 py-0.2 rounded">
                        {{ (v.stock_physical || 0) + (v.stock_virtual || 0) }} uds.
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-outline-variant/40">
              <button
                type="button"
                (click)="deleteProduct(editingProduct()!.id)"
                class="px-3 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-semibold transition cursor-pointer"
              >
                Eliminar Producto
              </button>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="isEditProductModalOpen.set(false)"
                  class="btn-secondary py-2! px-4! text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="editProdImages().length < 1 || editProdImages().length > 10"
                  class="btn-primary py-2! px-5! text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Actualizar Producto
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ========================================================================= -->
    <!-- MODAL 5: IMPORTADOR MASIVO DE PRODUCTOS (CSV / EXCEL XLSX) -->
    <!-- ========================================================================= -->
    @if (isImportModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-outline-variant/40 p-5 bg-surface-container/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl">
                📥
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-bold text-on-surface">Importador Masivo de Catálogo</h3>
                <p class="text-xs text-outline">Carga o actualiza masivamente productos, categorías, marcas, precios y existencias vía CSV o Excel (.xlsx)</p>
              </div>
            </div>
            <button
              (click)="closeImportModal()"
              [disabled]="isImporting()"
              class="text-outline hover:text-white p-2 rounded-lg hover:bg-surface-container-high transition"
            >
              ✕
            </button>
          </div>

          <!-- Modal Scrollable Content -->
          <div class="p-6 overflow-y-auto space-y-6 flex-1">
            <!-- Action bar & Template Downloads -->
            <div class="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div class="space-y-1">
                <span class="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span>💡</span> ¿No tienes el archivo listo? Descarga las plantillas oficiales:
                </span>
                <p class="text-[11px] text-outline">
                  Contienen las columnas predefinidas y filas de ejemplo con componentes de hardware reales listos para usar en Excel.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  (click)="downloadCsvTemplate()"
                  class="btn-secondary py-1.5! px-3! text-xs flex items-center gap-1.5 text-primary border-primary/30 hover:border-primary"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Plantilla CSV (.csv)
                </button>
                <button
                  type="button"
                  (click)="downloadXlsxTemplate()"
                  class="btn-secondary py-1.5! px-3! text-xs flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 hover:border-emerald-500"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Plantilla Excel (.xlsx)
                </button>
              </div>
            </div>

            <!-- Guidelines Chips -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div class="bg-surface-container/40 border border-outline-variant/30 rounded-lg p-3 space-y-1.5">
                <span class="font-bold text-primary flex items-center gap-1">
                  <span>📌</span> Columnas Obligatorias (Infaltables)
                </span>
                <div class="flex flex-wrap gap-1">
                  <span class="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">sku</span>
                  <span class="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">modelo</span>
                  <span class="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">categoria</span>
                  <span class="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">marca</span>
                  <span class="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">precio</span>
                  <span class="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">stock</span>
                </div>
                <p class="text-outline text-[10px]">Categorías y marcas inexistentes se crearán automáticamente durante la importación.</p>
              </div>

              <div class="bg-surface-container/40 border border-outline-variant/30 rounded-lg p-3 space-y-1.5">
                <span class="font-bold text-on-surface flex items-center gap-1">
                  <span>⚙️</span> Columnas Opcionales / Especiales
                </span>
                <div class="flex flex-wrap gap-1">
                  <span class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono text-[10px]">precio_regular</span>
                  <span class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono text-[10px]">descuento_porcentaje</span>
                  <span class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono text-[10px]">stock_fisico</span>
                  <span class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono text-[10px]">stock_virtual</span>
                  <span class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono text-[10px]">variante</span>
                  <span class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono text-[10px]">imagen_url</span>
                </div>
                <p class="text-outline text-[10px]">Si el SKU ya existe en la tienda, actualizará automáticamente sus existencias y descuentos.</p>
              </div>
            </div>

            <!-- Upload Area -->
            <div>
              <input
                #importFileInputRef
                type="file"
                (change)="onFileSelected($event)"
                accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                class="hidden"
              />

              @if (!selectedImportFileName()) {
                <div
                  (click)="importFileInputRef.click()"
                  class="border-2 border-dashed border-outline-variant/60 hover:border-primary/80 bg-surface-container-lowest hover:bg-primary/5 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div class="w-14 h-14 rounded-2xl bg-surface-container-high group-hover:bg-primary/20 flex items-center justify-center text-3xl transition-transform group-hover:scale-110">
                    📊
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-on-surface group-hover:text-primary transition">
                      Haz clic para seleccionar o arrastra tu archivo aquí
                    </p>
                    <p class="text-xs text-outline mt-1">Soporta archivos de Excel (.XLSX) o archivos delimitados (.CSV)</p>
                  </div>
                </div>
              } @else {
                <div class="bg-surface-container border border-outline-variant/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs uppercase"
                      [class.bg-emerald-500/20]="selectedImportFileType() === 'xlsx'"
                      [class.text-emerald-400]="selectedImportFileType() === 'xlsx'"
                      [class.bg-primary/20]="selectedImportFileType() === 'csv'"
                      [class.text-primary]="selectedImportFileType() === 'csv'"
                    >
                      {{ selectedImportFileType() === 'xlsx' ? 'XLSX' : 'CSV' }}
                    </div>
                    <div>
                      <div class="text-xs font-bold text-on-surface flex items-center gap-2">
                        <span>{{ selectedImportFileName() }}</span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-outline">
                          {{ selectedImportFileSize() }}
                        </span>
                      </div>
                      <p class="text-[11px] text-outline">
                        {{ importParsedItems().length }} filas procesadas para previsualización
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="importFileInputRef.click()"
                      [disabled]="isImporting()"
                      class="btn-secondary py-1.5! px-3! text-xs"
                    >
                      Cambiar Archivo
                    </button>
                    <button
                      type="button"
                      (click)="clearImportData()"
                      [disabled]="isImporting()"
                      class="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Result / Error Alert Message -->
            @if (importResultMessage()) {
              <div
                class="p-4 rounded-xl text-xs flex items-center gap-3 border"
                [class.bg-emerald-500/10]="importResultMessage()?.type === 'success'"
                [class.border-emerald-500/30]="importResultMessage()?.type === 'success'"
                [class.text-emerald-300]="importResultMessage()?.type === 'success'"
                [class.bg-red-500/10]="importResultMessage()?.type === 'error'"
                [class.border-red-500/30]="importResultMessage()?.type === 'error'"
                [class.text-red-300]="importResultMessage()?.type === 'error'"
              >
                <span>{{ importResultMessage()?.type === 'success' ? '✅' : '⚠️' }}</span>
                <span class="font-medium">{{ importResultMessage()?.text }}</span>
              </div>
            }

            <!-- Import Progress Bar -->
            @if (isImporting()) {
              <div class="bg-surface-container-lowest border border-primary/30 rounded-xl p-4 space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-primary font-semibold flex items-center gap-2">
                    <svg class="animate-spin h-3.5 w-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Importando catálogo en la base de datos...
                  </span>
                  <span class="text-outline font-mono">
                    {{ importProgress().current }} / {{ importProgress().total }}
                  </span>
                </div>
                <div class="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div
                    class="bg-primary h-2 rounded-full transition-all duration-300"
                    [style.width.%]="importProgress().total ? (importProgress().current / importProgress().total) * 100 : 0"
                  ></div>
                </div>
              </div>
            }

            <!-- Interactive Preview & Table (when items loaded) -->
            @if (importParsedItems().length > 0) {
              <div class="space-y-3">
                <!-- Preview KPIs & Filter Tabs -->
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      type="button"
                      (click)="importFilter.set('ALL')"
                      class="px-2.5 py-1 rounded-lg border text-xs transition"
                      [class.bg-primary]="importFilter() === 'ALL'"
                      [class.text-on-primary]="importFilter() === 'ALL'"
                      [class.border-primary]="importFilter() === 'ALL'"
                      [class.bg-surface-container]="importFilter() !== 'ALL'"
                      [class.border-outline-variant/30]="importFilter() !== 'ALL'"
                      [class.text-on-surface-variant]="importFilter() !== 'ALL'"
                    >
                      Todos ({{ totalImportCount() }})
                    </button>
                    <button
                      type="button"
                      (click)="importFilter.set('NEW')"
                      class="px-2.5 py-1 rounded-lg border text-xs transition"
                      [class.bg-emerald-500/20]="importFilter() === 'NEW'"
                      [class.text-emerald-300]="importFilter() === 'NEW'"
                      [class.border-emerald-500/40]="importFilter() === 'NEW'"
                      [class.bg-surface-container]="importFilter() !== 'NEW'"
                      [class.border-outline-variant/30]="importFilter() !== 'NEW'"
                      [class.text-on-surface-variant]="importFilter() !== 'NEW'"
                    >
                      ✨ Nuevos ({{ newImportCount() }})
                    </button>
                    <button
                      type="button"
                      (click)="importFilter.set('UPDATE')"
                      class="px-2.5 py-1 rounded-lg border text-xs transition"
                      [class.bg-blue-500/20]="importFilter() === 'UPDATE'"
                      [class.text-blue-300]="importFilter() === 'UPDATE'"
                      [class.border-blue-500/40]="importFilter() === 'UPDATE'"
                      [class.bg-surface-container]="importFilter() !== 'UPDATE'"
                      [class.border-outline-variant/30]="importFilter() !== 'UPDATE'"
                      [class.text-on-surface-variant]="importFilter() !== 'UPDATE'"
                    >
                      🔄 Actualizar Existencias ({{ updateImportCount() }})
                    </button>
                    @if (errorImportCount() > 0) {
                      <button
                        type="button"
                        (click)="importFilter.set('ERROR')"
                        class="px-2.5 py-1 rounded-lg border text-xs transition"
                        [class.bg-red-500/20]="importFilter() === 'ERROR'"
                        [class.text-red-300]="importFilter() === 'ERROR'"
                        [class.border-red-500/40]="importFilter() === 'ERROR'"
                        [class.bg-surface-container]="importFilter() !== 'ERROR'"
                        [class.border-outline-variant/30]="importFilter() !== 'ERROR'"
                        [class.text-on-surface-variant]="importFilter() !== 'ERROR'"
                      >
                        ⚠️ Con Errores ({{ errorImportCount() }})
                      </button>
                    }
                  </div>

                  <span class="text-xs text-outline">
                    {{ validImportCount() }} listos para procesar
                  </span>
                </div>

                <!-- Preview Scroll Table -->
                <div class="border border-outline-variant/40 rounded-xl overflow-hidden bg-surface-container-lowest">
                  <div class="overflow-x-auto max-h-72">
                    <table class="w-full text-left text-xs">
                      <thead class="bg-surface-container/60 text-[11px] font-bold text-outline uppercase sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                          <th class="py-2.5 px-3">Estado</th>
                          <th class="py-2.5 px-3">SKU</th>
                          <th class="py-2.5 px-3">Modelo</th>
                          <th class="py-2.5 px-3">Categoría</th>
                          <th class="py-2.5 px-3">Marca</th>
                          <th class="py-2.5 px-3 text-right">Precio</th>
                          <th class="py-2.5 px-3 text-right">Descuento</th>
                          <th class="py-2.5 px-3 text-center">Stock</th>
                          <th class="py-2.5 px-3">Variante</th>
                          <th class="py-2.5 px-3 text-center"></th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-outline-variant/20 text-on-surface">
                        @for (item of filteredImportItems(); track $index) {
                          <tr class="hover:bg-surface-container/30 transition-colors" [class.bg-red-500/5]="!item.isValid">
                            <td class="py-2 px-3 whitespace-nowrap">
                              @if (!item.isValid) {
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30" [title]="item.errorMessage">
                                  ⚠️ Error
                                </span>
                              } @else if (item.isExisting) {
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  🔄 Actualizar
                                </span>
                              } @else {
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  ✨ Nuevo
                                </span>
                              }
                            </td>
                            <td class="py-2 px-3 font-mono font-bold text-xs whitespace-nowrap">
                              {{ item.sku || '—' }}
                            </td>
                            <td class="py-2 px-3 min-w-40">
                              <div class="font-medium truncate max-w-55" [title]="item.model">{{ item.model || '—' }}</div>
                              @if (item.errorMessage) {
                                <span class="text-[10px] text-red-400 block">{{ item.errorMessage }}</span>
                              }
                            </td>
                            <td class="py-2 px-3 whitespace-nowrap text-outline">
                              {{ item.category || '—' }}
                            </td>
                            <td class="py-2 px-3 whitespace-nowrap text-outline">
                              {{ item.brand || '—' }}
                            </td>
                            <td class="py-2 px-3 text-right font-mono font-bold whitespace-nowrap">
                              {{ item.price | currency:'USD':'symbol':'1.2-2' }}
                            </td>
                            <td class="py-2 px-3 text-right whitespace-nowrap">
                              @if (item.discount_percent && item.discount_percent > 0) {
                                <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                                  -{{ item.discount_percent }}%
                                </span>
                              } @else {
                                <span class="text-outline text-[11px]">—</span>
                              }
                            </td>
                            <td class="py-2 px-3 text-center whitespace-nowrap">
                              <span class="font-bold text-primary">{{ item.stock }}</span>
                              <span class="text-[10px] text-outline ml-1">({{ item.stock_physical }}+{{ item.stock_virtual }})</span>
                            </td>
                            <td class="py-2 px-3 whitespace-nowrap text-outline text-[11px]">
                              {{ item.variant_name }}
                            </td>
                            <td class="py-2 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                (click)="removeImportItem($index)"
                                class="text-outline hover:text-red-400 p-1 transition"
                                title="Eliminar fila de la importación"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Modal Footer -->
          <div class="border-t border-outline-variant/40 p-4 bg-surface-container/30 flex items-center justify-between gap-3">
            <button
              type="button"
              (click)="closeImportModal()"
              [disabled]="isImporting()"
              class="btn-secondary py-2! px-4! text-xs"
            >
              Cerrar
            </button>
            <button
              type="button"
              (click)="confirmImport()"
              [disabled]="isImporting() || validImportCount() === 0"
              class="btn-primary py-2! px-5! text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (isImporting()) {
                <svg class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Procesando...</span>
              } @else {
                <span>🚀 Confirmar e Importar ({{ validImportCount() }} productos)</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class InventoryManagementComponent {
  readonly adminService = inject(AdminService);
  readonly productService = inject(ProductService);

  activeTab = signal<'inventory' | 'categories' | 'brands'>('inventory');
  readonly pageSize = 10;
  readonly inventoryPage = signal<number>(1);
  readonly categoriesPage = signal<number>(1);
  readonly brandsPage = signal<number>(1);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('ALL');
  selectedBrand = signal<string>('ALL');
  selectedVisibility = signal<'ALL' | 'VISIBLE' | 'HIDDEN'>('ALL');
  onlyLowStock = signal<boolean>(false);
  onlyNewStrip = signal<boolean>(false);

  // Import Modal & Parser State
  isImportModalOpen = signal<boolean>(false);
  importParsedItems = signal<ParsedImportItem[]>([]);
  importFilter = signal<'ALL' | 'VALID' | 'NEW' | 'UPDATE' | 'ERROR'>('ALL');
  selectedImportFileName = signal<string>('');
  selectedImportFileSize = signal<string>('');
  selectedImportFileType = signal<'csv' | 'xlsx' | null>(null);
  isImporting = signal<boolean>(false);
  importProgress = signal<{ current: number; total: number }>({ current: 0, total: 0 });
  importResultMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  totalImportCount = computed(() => this.importParsedItems().length);
  validImportCount = computed(() => this.importParsedItems().filter((i) => i.isValid).length);
  newImportCount = computed(() => this.importParsedItems().filter((i) => i.isValid && !i.isExisting).length);
  updateImportCount = computed(() => this.importParsedItems().filter((i) => i.isValid && i.isExisting).length);
  errorImportCount = computed(() => this.importParsedItems().filter((i) => !i.isValid).length);

  filteredImportItems = computed(() => {
    const filter = this.importFilter();
    const items = this.importParsedItems();
    if (filter === 'VALID') return items.filter((i) => i.isValid);
    if (filter === 'NEW') return items.filter((i) => i.isValid && !i.isExisting);
    if (filter === 'UPDATE') return items.filter((i) => i.isValid && i.isExisting);
    if (filter === 'ERROR') return items.filter((i) => !i.isValid);
    return items;
  });

  // Modals state
  isNewProductModalOpen = signal<boolean>(false);
  isCategoryModalOpen = signal<boolean>(false);
  isBrandModalOpen = signal<boolean>(false);
  isEditProductModalOpen = signal<boolean>(false);

  editingCategory = signal<DbCategory | null>(null);
  editingBrand = signal<DbBrand | null>(null);
  editingProduct = signal<AdminProductWithVariants | null>(null);

  // Forms
  newProdCategoryId = signal<string>('');
  newProdForm = {
    model: '',
    category_id: '',
    brand_id: '',
    short_description: '',
    product_type: 'standalone',
    is_active: true
  };

  newProdImages = signal<string[]>([]);
  newProdUrlInput = '';
  isUploadingNewImages = signal<boolean>(false);

  editProdCategoryId = signal<string>('');
  editProdForm = {
    model: '',
    category_id: '',
    brand_id: '',
    short_description: '',
    product_type: 'standalone',
    is_active: true
  };

  editProdImages = signal<string[]>([]);
  editProdUrlInput = '';
  isUploadingEditImages = signal<boolean>(false);

  // Ficha Técnica (Specifications)
  newProdSpecGroups = signal<SpecGroup[]>([]);
  editProdSpecGroups = signal<SpecGroup[]>([]);

  // Variants & Editions management
  isNewProdMultiVariant = signal<boolean>(false);
  newProdVariants = signal<Array<{
    sku: string;
    variant_name: string;
    price: number;
    compare_at_price?: number | null;
    discount_percent?: number | null;
    stock: number;
    stock_physical: number;
    stock_virtual: number;
    is_bundle: boolean;
  }>>([]);

  editProdVariants = signal<Array<{
    id: string;
    sku: string;
    variant_name: string;
    price: number;
    compare_at_price?: number | null;
    discount_percent?: number | null;
    stock: number;
    stock_physical: number;
    stock_virtual: number;
    is_bundle: boolean;
    isNew?: boolean;
  }>>([]);
  deletedVariantIds: string[] = [];

  newVarForm = {
    sku: '',
    variant_name: '',
    price: 0,
    compare_at_price: null as number | null,
    discount_percent: null as number | null,
    stock: 5,
    stock_physical: 5,
    stock_virtual: 0,
    is_bundle: false
  };

  categoryForm = {
    name: '',
    slug: '',
    parent_id: null as string | null,
    is_active: true
  };

  brandForm = {
    name: '',
    slug: '',
    category_ids: [] as string[],
    is_active: true
  };

  // Computeds
  readonly parentCategories = computed(() => {
    return this.adminService.categories().filter((c) => !c.parent_id);
  });

  /**
   * Returns categories ordered hierarchically: Parent followed immediately by its subcategories
   */
  readonly organizedCategories = computed(() => {
    const all = this.adminService.categories();
    const parents = all.filter((c) => !c.parent_id);
    const result: DbCategory[] = [];

    for (const parent of parents) {
      result.push(parent);
      const subs = all.filter((c) => c.parent_id === parent.id);
      result.push(...subs);
    }

    // Add any orphan subcategories if any
    const addedIds = new Set(result.map((r) => r.id));
    for (const c of all) {
      if (!addedIds.has(c.id)) {
        result.push(c);
      }
    }

    return result;
  });

  readonly availableBrandsForNewProd = computed(() => {
    return this.adminService.getBrandsForCategory(this.newProdCategoryId());
  });

  readonly availableBrandsForEditProd = computed(() => {
    return this.adminService.getBrandsForCategory(this.editProdCategoryId());
  });

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
    const vis = this.selectedVisibility();
    const lowStock = this.onlyLowStock();
    const onlyNew = this.onlyNewStrip();
    const newSet = new Set(this.productService.newPromoProductIds());

    for (const p of this.adminService.products()) {
      if (vis === 'VISIBLE' && p.is_active === false) continue;
      if (vis === 'HIDDEN' && p.is_active !== false) continue;
      if (onlyNew && !newSet.has(p.id)) continue;
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

  readonly paginatedVariants = computed(() => {
    const list = this.flattenedVariants();
    const totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    const safePage = Math.max(1, Math.min(this.inventoryPage(), totalPages));
    const start = (safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  readonly paginatedCategories = computed(() => {
    const list = this.organizedCategories();
    const totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    const safePage = Math.max(1, Math.min(this.categoriesPage(), totalPages));
    const start = (safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  readonly paginatedBrands = computed(() => {
    const list = this.adminService.brands();
    const totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    const safePage = Math.max(1, Math.min(this.brandsPage(), totalPages));
    const start = (safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  // Multiple Selection State
  selectedProductIds = signal<Set<string>>(new Set());
  isDeletingMultiple = signal<boolean>(false);

  readonly visibleProductIds = computed(() => {
    const ids = new Set<string>();
    for (const item of this.flattenedVariants()) {
      ids.add(item.product.id);
    }
    return ids;
  });

  readonly isAllSelected = computed(() => {
    const visible = this.visibleProductIds();
    if (visible.size === 0) return false;
    const selected = this.selectedProductIds();
    for (const id of visible) {
      if (!selected.has(id)) return false;
    }
    return true;
  });

  readonly isIndeterminate = computed(() => {
    const visible = this.visibleProductIds();
    if (visible.size === 0) return false;
    const selected = this.selectedProductIds();
    let count = 0;
    for (const id of visible) {
      if (selected.has(id)) count++;
    }
    return count > 0 && count < visible.size;
  });

  isProductSelected(productId: string): boolean {
    return this.selectedProductIds().has(productId);
  }

  toggleSelectProduct(productId: string): void {
    this.selectedProductIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const visible = this.visibleProductIds();
    this.selectedProductIds.update((prev) => {
      const next = new Set(prev);
      if (checked) {
        visible.forEach((id) => next.add(id));
      } else {
        visible.forEach((id) => next.delete(id));
      }
      return next;
    });
  }

  clearSelection(): void {
    this.selectedProductIds.set(new Set());
  }

  async deleteSelectedProducts(): Promise<void> {
    const ids = Array.from(this.selectedProductIds());
    if (ids.length === 0) return;

    const count = ids.length;
    const confirmMsg =
      count === 1
        ? '¿Estás seguro de eliminar el producto seleccionado y todas sus variantes de forma permanente?'
        : `¿Estás seguro de eliminar los ${count} productos seleccionados y todas sus variantes de forma permanente?`;

    if (!confirm(confirmMsg)) return;

    this.isDeletingMultiple.set(true);
    try {
      await this.adminService.deleteProducts(ids);
      this.productService.removeProducts(ids);
      this.clearSelection();
    } catch (err) {
      console.error('Error al eliminar productos seleccionados:', err);
      alert('Ocurrió un error al eliminar los productos seleccionados.');
    } finally {
      this.isDeletingMultiple.set(false);
    }
  }

  // Helpers
  getCategoryName(id: string): string {
    const cat = this.adminService.categories().find((c) => c.id === id);
    return cat ? cat.name : 'Desconocida';
  }

  getBrandsForCatCount(catId: string): number {
    return this.adminService.getBrandsForCategory(catId).length;
  }

  getProductsForBrandCount(brandId: string): number {
    return this.adminService.products().filter((p) => p.brand_id === brandId).length;
  }

  onProductCategorySelected(catId: string): void {
    this.newProdForm.category_id = catId;
    this.newProdCategoryId.set(catId);
    const available = this.adminService.getBrandsForCategory(catId);
    if (available.length > 0) {
      const stillValid = available.some((b) => b.id === this.newProdForm.brand_id);
      if (!stillValid) {
        this.newProdForm.brand_id = available[0].id;
      }
    } else {
      this.newProdForm.brand_id = '';
    }
  }

  // Stock / Price Inline
  async onPhysicalStockChange(variant: DbProductVariant, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const newPhys = parseInt(input.value, 10);
    if (!isNaN(newPhys) && newPhys >= 0) {
      const virt = variant.stock_virtual ?? 0;
      await this.adminService.updateVariantStock(variant.id, newPhys, virt);
      await this.productService.loadProductsFromDatabase();
    }
  }

  async onVirtualStockChange(variant: DbProductVariant, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const newVirt = parseInt(input.value, 10);
    if (!isNaN(newVirt) && newVirt >= 0) {
      const phys = variant.stock_physical ?? variant.stock;
      await this.adminService.updateVariantStock(variant.id, phys, newVirt);
      await this.productService.loadProductsFromDatabase();
    }
  }

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
      await this.productService.loadProductsFromDatabase();
    }
  }

  async onDiscountPercentChange(variant: DbProductVariant, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const val = parseFloat(input.value);
    const percent = !isNaN(val) && val > 0 ? Math.min(99, Math.round(val)) : null;
    await this.adminService.updateVariantDiscount(variant.id, { discountPercent: percent });
    await this.productService.loadProductsFromDatabase();
  }

  async quickSetDiscount(variant: DbProductVariant, percent: number): Promise<void> {
    const val = percent > 0 ? percent : null;
    await this.adminService.updateVariantDiscount(variant.id, { discountPercent: val });
    await this.productService.loadProductsFromDatabase();
  }

  async adjustPhysicalStock(variant: DbProductVariant, delta: number): Promise<void> {
    const currentPhys = variant.stock_physical !== undefined ? variant.stock_physical : variant.stock;
    const newPhys = Math.max(0, currentPhys + delta);
    const virt = variant.stock_virtual ?? 0;
    await this.adminService.updateVariantStock(variant.id, newPhys, virt);
    await this.productService.loadProductsFromDatabase();
  }

  calculateDiscountPercent(compareAt?: number | null, price?: number | null): number {
    if (!compareAt || !price || Number(compareAt) <= Number(price)) return 0;
    return Math.round(((Number(compareAt) - Number(price)) / Number(compareAt)) * 100);
  }

  async incrementStock(variantId: string, currentStock: number, add: number): Promise<void> {
    await this.adminService.updateVariantStock(variantId, currentStock + add);
    await this.productService.loadProductsFromDatabase();
  }

  // --- Category Actions ---
  openCategoryModal(category?: DbCategory): void {
    if (category) {
      this.editingCategory.set(category);
      this.categoryForm = {
        name: category.name,
        slug: category.slug,
        parent_id: category.parent_id || null,
        is_active: category.is_active !== false
      };
    } else {
      this.editingCategory.set(null);
      this.categoryForm = {
        name: '',
        slug: '',
        parent_id: null,
        is_active: true
      };
    }
    this.isCategoryModalOpen.set(true);
  }

  editCategory(cat: DbCategory): void {
    this.openCategoryModal(cat);
  }

  async saveCategoryForm(): Promise<void> {
    if (!this.categoryForm.name.trim()) return;

    try {
      if (this.editingCategory()) {
        await this.adminService.updateCategory(this.editingCategory()!.id, {
          name: this.categoryForm.name.trim(),
          slug: this.categoryForm.slug.trim(),
          parent_id: this.categoryForm.parent_id,
          is_active: this.categoryForm.is_active
        });
      } else {
        await this.adminService.createCategory({
          name: this.categoryForm.name.trim(),
          slug: this.categoryForm.slug.trim(),
          parent_id: this.categoryForm.parent_id,
          is_active: this.categoryForm.is_active
        });
      }
      this.isCategoryModalOpen.set(false);
    } catch (err: any) {
      alert('Error al guardar la categoría en la base de datos: ' + (err?.message || 'Error desconocido'));
    }
  }

  async toggleCategoryStatus(id: string): Promise<void> {
    await this.adminService.toggleCategoryStatus(id);
  }

  async deleteCategory(id: string): Promise<void> {
    if (confirm('¿Estás seguro de eliminar esta categoría? Si tiene subcategorías, también se removerán.')) {
      await this.adminService.deleteCategory(id);
    }
  }

  // --- Brand Actions ---
  openBrandModal(brand?: DbBrand): void {
    if (brand) {
      this.editingBrand.set(brand);
      this.brandForm = {
        name: brand.name,
        slug: brand.slug,
        category_ids: [...(brand.category_ids || (brand.category_id ? [brand.category_id] : []))],
        is_active: brand.is_active !== false
      };
    } else {
      this.editingBrand.set(null);
      // Pre-select current newProdForm category if open
      const initialCatIds = this.newProdForm.category_id ? [this.newProdForm.category_id] : [];
      this.brandForm = {
        name: '',
        slug: '',
        category_ids: initialCatIds,
        is_active: true
      };
    }
    this.isBrandModalOpen.set(true);
  }

  editBrand(brand: DbBrand): void {
    this.openBrandModal(brand);
  }

  isCategoryLinkedToBrand(catId: string): boolean {
    return this.brandForm.category_ids.includes(catId);
  }

  toggleCategoryInBrand(catId: string): void {
    const index = this.brandForm.category_ids.indexOf(catId);
    if (index >= 0) {
      this.brandForm.category_ids.splice(index, 1);
    } else {
      this.brandForm.category_ids.push(catId);
    }
  }

  async saveBrandForm(): Promise<void> {
    if (!this.brandForm.name.trim()) return;

    try {
      if (this.editingBrand()) {
        await this.adminService.updateBrand(this.editingBrand()!.id, {
          name: this.brandForm.name.trim(),
          slug: this.brandForm.slug.trim(),
          category_ids: this.brandForm.category_ids,
          is_active: this.brandForm.is_active
        });
      } else {
        const created = await this.adminService.createBrand({
          name: this.brandForm.name.trim(),
          slug: this.brandForm.slug.trim(),
          category_ids: this.brandForm.category_ids,
          is_active: this.brandForm.is_active
        });
        if (this.isNewProductModalOpen()) {
          this.newProdForm.brand_id = created.id;
        } else if (this.editingProduct()) {
          this.editProdForm.brand_id = created.id;
        }
      }
      this.isBrandModalOpen.set(false);
    } catch (err: any) {
      alert('Error al guardar la marca en la base de datos: ' + (err?.message || 'Error desconocido'));
    }
  }

  async toggleBrandStatus(id: string): Promise<void> {
    await this.adminService.toggleBrandStatus(id);
  }

  async deleteBrand(id: string): Promise<void> {
    if (confirm('¿Estás seguro de eliminar esta marca?')) {
      await this.adminService.deleteBrand(id);
    }
  }

  // --- Product Creation & Image Methods ---
  async onUploadNewProductImages(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const availableSlots = 10 - this.newProdImages().length;
    if (availableSlots <= 0) {
      alert('Ya alcanzaste el máximo de 10 imágenes permitidas.');
      input.value = '';
      return;
    }

    const filesToUpload = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      alert(`Solo se procesarán ${availableSlots} imagen(es) para no exceder el límite de 10.`);
    }

    this.isUploadingNewImages.set(true);
    try {
      for (const file of filesToUpload) {
        const url = await this.adminService.uploadProductImage(file);
        this.newProdImages.update((prev) => [...prev, url]);
      }
    } finally {
      this.isUploadingNewImages.set(false);
      input.value = '';
    }
  }

  addNewProductImageUrl(): void {
    const url = this.newProdUrlInput.trim();
    if (!url) return;
    if (this.newProdImages().length >= 10) {
      alert('Máximo 10 imágenes permitidas.');
      return;
    }
    this.newProdImages.update((prev) => [...prev, url]);
    this.newProdUrlInput = '';
  }

  removeNewProductImage(index: number): void {
    this.newProdImages.update((prev) => prev.filter((_, i) => i !== index));
  }

  setPrimaryNewProductImage(index: number): void {
    this.newProdImages.update((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  }

  async toggleProductVisibility(productId: string): Promise<void> {
    const prod = this.adminService.products().find((p) => p.id === productId);
    if (!prod) return;
    const newStatus = prod.is_active === false;
    await this.adminService.toggleProductStatus(productId);
    this.productService.setProductActive(productId, newStatus);
  }

  openNewProductModal(): void {
    const firstCat = this.organizedCategories()[0]?.id || '';
    this.newProdCategoryId.set(firstCat);
    const availableBrands = this.adminService.getBrandsForCategory(firstCat);
    const firstBrand = availableBrands[0]?.id || '';

    this.newProdForm = {
      model: '',
      category_id: firstCat,
      brand_id: firstBrand,
      short_description: '',
      product_type: 'standalone',
      is_active: true
    };

    this.newVarForm = {
      sku: '',
      variant_name: '',
      price: 0,
      compare_at_price: null,
      discount_percent: null,
      stock: 5,
      stock_physical: 5,
      stock_virtual: 0,
      is_bundle: false
    };

    this.isNewProdMultiVariant.set(false);
    this.newProdVariants.set([]);
    this.newProdImages.set([]);
    this.newProdUrlInput = '';
    this.newProdSpecGroups.set([]);
    this.isNewProductModalOpen.set(true);
  }

  setNewProdVariantMode(multiple: boolean): void {
    this.isNewProdMultiVariant.set(multiple);
    if (multiple && this.newProdVariants().length === 0) {
      const initPhys = this.newVarForm.stock_physical ?? 5;
      const initVirt = this.newVarForm.stock_virtual ?? 0;
      this.newProdVariants.set([
        {
          sku: this.newVarForm.sku || '',
          variant_name: this.newVarForm.variant_name || 'Edición Estándar',
          price: this.newVarForm.price || 0,
          stock: initPhys + initVirt,
          stock_physical: initPhys,
          stock_virtual: initVirt,
          is_bundle: this.newVarForm.is_bundle || false
        },
        {
          sku: '',
          variant_name: '',
          price: this.newVarForm.price || 0,
          stock: 5,
          stock_physical: 5,
          stock_virtual: 0,
          is_bundle: false
        }
      ]);
    }
  }

  addNewProdVariantRow(): void {
    const nextNum = this.newProdVariants().length + 1;
    this.newProdVariants.update((list) => [
      ...list,
      {
        sku: '',
        variant_name: `Edición ${nextNum}`,
        price: list.length > 0 ? list[0].price : 0,
        stock: 5,
        stock_physical: 5,
        stock_virtual: 0,
        is_bundle: false
      }
    ]);
  }

  removeNewProdVariantRow(index: number): void {
    if (this.newProdVariants().length <= 1) {
      alert('Debes mantener al menos una variante.');
      return;
    }
    this.newProdVariants.update((list) => list.filter((_, i) => i !== index));
  }

  async saveProduct(): Promise<void> {
    if (!this.newProdForm.model?.trim()) {
      alert('Por favor ingresa el nombre / modelo del producto.');
      return;
    }
    if (this.newProdImages().length < 1) {
      alert('Debes ingresar al menos 1 imagen para el producto (máximo 10).');
      return;
    }
    if (this.newProdImages().length > 10) {
      alert('No puedes ingresar más de 10 imágenes.');
      return;
    }

    let variantsToSave: Array<{
      sku: string;
      variant_name: string;
      price: number;
      compare_at_price?: number;
      discount_percent?: number;
      stock: number;
      stock_physical?: number;
      stock_virtual?: number;
      is_bundle: boolean;
    }> = [];

    if (this.isNewProdMultiVariant()) {
      const list = this.newProdVariants();
      if (list.length === 0) {
        alert('Debes agregar al menos una edición o variante.');
        return;
      }
      for (let i = 0; i < list.length; i++) {
        const v = list[i];
        if (!v.sku.trim() || !v.variant_name.trim()) {
          alert(`Por favor completa el SKU y el nombre para la Edición #${i + 1}.`);
          return;
        }
      }
      const skus = new Set<string>();
      for (const v of list) {
        const cleanSku = v.sku.trim().toUpperCase();
        if (skus.has(cleanSku)) {
          alert(`El SKU "${cleanSku}" está repetido entre las variantes. Cada SKU debe ser único.`);
          return;
        }
        skus.add(cleanSku);
      }
      variantsToSave = list.map((v) => {
        const phys = Number(v.stock_physical) || 0;
        const virt = Number(v.stock_virtual) || 0;
        const compAt = v.compare_at_price && Number(v.compare_at_price) > Number(v.price) ? Number(v.compare_at_price) : undefined;
        const discPct = compAt ? Math.round(((compAt - Number(v.price)) / compAt) * 100) : (v.discount_percent ? Number(v.discount_percent) : undefined);
        return {
          sku: v.sku.trim().toUpperCase(),
          variant_name: v.variant_name.trim(),
          price: Number(v.price) || 0,
          compare_at_price: compAt,
          discount_percent: discPct,
          stock: phys + virt,
          stock_physical: phys,
          stock_virtual: virt,
          is_bundle: !!v.is_bundle
        };
      });
    } else {
      if (!this.newVarForm.sku?.trim()) {
        alert('Por favor ingresa el SKU del producto.');
        return;
      }
      const phys = Number(this.newVarForm.stock_physical) || 0;
      const virt = Number(this.newVarForm.stock_virtual) || 0;
      const compAt = this.newVarForm.compare_at_price && Number(this.newVarForm.compare_at_price) > Number(this.newVarForm.price)
        ? Number(this.newVarForm.compare_at_price)
        : undefined;
      const discPct = compAt
        ? Math.round(((compAt - Number(this.newVarForm.price)) / compAt) * 100)
        : (this.newVarForm.discount_percent ? Number(this.newVarForm.discount_percent) : undefined);
      variantsToSave = [
        {
          sku: this.newVarForm.sku.trim().toUpperCase(),
          variant_name: this.newVarForm.variant_name.trim() || 'Estándar',
          price: Number(this.newVarForm.price) || 0,
          compare_at_price: compAt,
          discount_percent: discPct,
          stock: phys + virt,
          stock_physical: phys,
          stock_virtual: virt,
          is_bundle: !!this.newVarForm.is_bundle
        }
      ];
    }

    const specs = this.serializeSpecGroups(this.newProdSpecGroups());

    try {
      await this.adminService.createProductWithVariants(
        {
          ...this.newProdForm,
          images: this.newProdImages(),
          specifications: specs
        },
        variantsToSave
      );
      await this.productService.loadProductsFromDatabase();
      this.isNewProductModalOpen.set(false);
    } catch (err: any) {
      alert('Error al guardar el producto en la base de datos: ' + (err?.message || 'Error desconocido'));
    }
  }

  // --- Product Edition & Additional Images Methods ---
  openEditProductModal(prod: AdminProductWithVariants): void {
    this.editingProduct.set(prod);
    this.editProdCategoryId.set(prod.category_id);
    this.editProdForm = {
      model: prod.model,
      category_id: prod.category_id,
      brand_id: prod.brand_id,
      short_description: prod.short_description || '',
      product_type: prod.product_type || 'standalone',
      is_active: prod.is_active !== false
    };
    this.editProdImages.set(Array.isArray(prod.images) ? [...prod.images] : []);
    this.editProdUrlInput = '';
    this.editProdSpecGroups.set(this.deserializeProductSpecs(prod.specifications));

    this.deletedVariantIds = [];
    const existingVariants = prod.variants && prod.variants.length > 0 ? prod.variants : [];
    if (existingVariants.length === 0) {
      this.editProdVariants.set([
        {
          id: crypto.randomUUID(),
          sku: 'SKU-' + prod.model.replace(/\s+/g, '-').toUpperCase().slice(0, 10),
          variant_name: 'Estándar',
          price: 0,
          compare_at_price: null,
          discount_percent: null,
          stock: 1,
          stock_physical: 1,
          stock_virtual: 0,
          is_bundle: false,
          isNew: true
        }
      ]);
    } else {
      this.editProdVariants.set(
        existingVariants.map((v) => {
          const phys = v.stock_physical !== undefined ? Number(v.stock_physical) || 0 : (Number(v.stock) || 0);
          const virt = v.stock_virtual !== undefined ? Number(v.stock_virtual) || 0 : 0;
          const compAt = v.compare_at_price !== undefined
            ? Number(v.compare_at_price)
            : (v.attributes?.['compare_at_price'] !== undefined ? Number(v.attributes['compare_at_price']) : null);
          const discPct = v.discount_percent !== undefined
            ? Number(v.discount_percent)
            : (v.attributes?.['discount_percent'] !== undefined ? Number(v.attributes['discount_percent']) : (compAt && compAt > v.price ? Math.round(((compAt - v.price) / compAt) * 100) : null));
          return {
            id: v.id,
            sku: v.sku,
            variant_name: v.variant_name || 'Estándar',
            price: v.price,
            compare_at_price: compAt,
            discount_percent: discPct,
            stock: phys + virt,
            stock_physical: phys,
            stock_virtual: virt,
            is_bundle: !!v.is_bundle,
            isNew: false
          };
        })
      );
    }

    this.isEditProductModalOpen.set(true);
  }

  addEditProdVariantRow(): void {
    const prod = this.editingProduct();
    const nextNum = this.editProdVariants().length + 1;
    const defaultSku = prod?.model
      ? `${prod.model.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase().slice(0, 8)}-V${nextNum}`
      : `SKU-V${nextNum}`;
    const firstPrice = this.editProdVariants().length > 0 ? this.editProdVariants()[0].price : 0;

    this.editProdVariants.update((list) => [
      ...list,
      {
        id: crypto.randomUUID(),
        sku: defaultSku,
        variant_name: `Edición ${nextNum}`,
        price: firstPrice,
        compare_at_price: null,
        discount_percent: null,
        stock: 5,
        stock_physical: 5,
        stock_virtual: 0,
        is_bundle: false,
        isNew: true
      }
    ]);
  }

  removeEditProdVariantRow(index: number): void {
    const variants = this.editProdVariants();
    if (variants.length <= 1) {
      alert('Un producto debe tener al menos una variante o edición.');
      return;
    }
    const toRemove = variants[index];
    if (!toRemove.isNew && toRemove.id) {
      this.deletedVariantIds.push(toRemove.id);
    }
    this.editProdVariants.update((list) => list.filter((_, i) => i !== index));
  }

  onEditProductCategorySelected(catId: string): void {
    this.editProdForm.category_id = catId;
    this.editProdCategoryId.set(catId);
    const available = this.adminService.getBrandsForCategory(catId);
    if (available.length > 0) {
      const stillValid = available.some((b) => b.id === this.editProdForm.brand_id);
      if (!stillValid) {
        this.editProdForm.brand_id = available[0].id;
      }
    } else {
      this.editProdForm.brand_id = '';
    }
  }

  async onUploadEditProductImages(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const availableSlots = 10 - this.editProdImages().length;
    if (availableSlots <= 0) {
      alert('Ya alcanzaste el máximo de 10 imágenes permitidas para este producto.');
      input.value = '';
      return;
    }

    const filesToUpload = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      alert(`Solo se procesarán ${availableSlots} imagen(es) para no exceder el límite de 10.`);
    }

    this.isUploadingEditImages.set(true);
    try {
      for (const file of filesToUpload) {
        const url = await this.adminService.uploadProductImage(file);
        this.editProdImages.update((prev) => [...prev, url]);
      }
    } finally {
      this.isUploadingEditImages.set(false);
      input.value = '';
    }
  }

  addEditProductImageUrl(): void {
    const url = this.editProdUrlInput.trim();
    if (!url) return;
    if (this.editProdImages().length >= 10) {
      alert('Máximo 10 imágenes permitidas.');
      return;
    }
    this.editProdImages.update((prev) => [...prev, url]);
    this.editProdUrlInput = '';
  }

  removeEditProductImage(index: number): void {
    this.editProdImages.update((prev) => prev.filter((_, i) => i !== index));
  }

  setPrimaryEditProductImage(index: number): void {
    this.editProdImages.update((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  }

  async saveEditProduct(): Promise<void> {
    if (!this.editingProduct()) return;
    if (!this.editProdForm.model.trim()) {
      alert('El nombre / modelo del producto es obligatorio.');
      return;
    }
    if (this.editProdImages().length < 1) {
      alert('Debes incluir al menos 1 imagen para el producto.');
      return;
    }
    if (this.editProdImages().length > 10) {
      alert('No puedes superar el límite de 10 imágenes.');
      return;
    }

    const variants = this.editProdVariants();
    if (variants.length === 0) {
      alert('El producto debe tener al menos una variante o edición.');
      return;
    }
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.sku?.trim() || !v.variant_name?.trim()) {
        alert(`La edición #${i + 1} debe tener SKU y Nombre.`);
        return;
      }
    }

    const skus = new Set<string>();
    for (const v of variants) {
      const cleanSku = v.sku.trim().toUpperCase();
      if (skus.has(cleanSku)) {
        alert(`El SKU "${cleanSku}" está repetido. Cada SKU debe ser único.`);
        return;
      }
      skus.add(cleanSku);
    }

    const specs = this.serializeSpecGroups(this.editProdSpecGroups());

    try {
      // 1. Update product base info
      await this.adminService.updateProduct(this.editingProduct()!.id, {
        model: this.editProdForm.model.trim(),
        category_id: this.editProdForm.category_id,
        brand_id: this.editProdForm.brand_id,
        short_description: this.editProdForm.short_description.trim(),
        product_type: this.editProdForm.product_type,
        is_active: this.editProdForm.is_active,
        images: this.editProdImages(),
        specifications: specs
      });

      // 2. Delete removed variants
      for (const vId of this.deletedVariantIds) {
        await this.adminService.deleteVariant(vId);
      }

      // 3. Update existing or insert new variants
      for (const v of variants) {
        const phys = Number(v.stock_physical) || 0;
        const virt = Number(v.stock_virtual) || 0;
        const total = phys + virt;
        const compAt = v.compare_at_price && Number(v.compare_at_price) > Number(v.price) ? Number(v.compare_at_price) : undefined;
        const discPct = compAt ? Math.round(((compAt - Number(v.price)) / compAt) * 100) : (v.discount_percent ? Number(v.discount_percent) : undefined);

        if (v.isNew) {
          await this.adminService.addVariantToProduct(this.editingProduct()!.id, {
            sku: v.sku.trim().toUpperCase(),
            variant_name: v.variant_name.trim(),
            price: Number(v.price) || 0,
            compare_at_price: compAt,
            discount_percent: discPct,
            stock: total,
            stock_physical: phys,
            stock_virtual: virt,
            is_bundle: !!v.is_bundle
          });
        } else {
          await this.adminService.updateVariant(v.id, {
            sku: v.sku.trim().toUpperCase(),
            variant_name: v.variant_name.trim(),
            price: Number(v.price) || 0,
            compare_at_price: compAt,
            discount_percent: discPct,
            stock: total,
            stock_physical: phys,
            stock_virtual: virt,
            is_bundle: !!v.is_bundle
          });
        }
      }

      await this.productService.loadProductsFromDatabase();
      this.productService.setProductActive(this.editingProduct()!.id, this.editProdForm.is_active);
      this.isEditProductModalOpen.set(false);
    } catch (err: any) {
      alert('Error al actualizar el producto en la base de datos: ' + (err?.message || 'Error desconocido'));
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    if (confirm('¿Estás seguro de eliminar este producto y sus variantes de forma permanente?')) {
      await this.adminService.deleteProduct(productId);
      this.productService.removeProducts([productId]);
      this.selectedProductIds.update((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      this.isEditProductModalOpen.set(false);
    }
  }

  // --- Ficha Técnica (Specifications) Helper & Management Methods ---
  serializeSpecGroups(groups: SpecGroup[]): ProductSpecification[] {
    return groups
      .filter((g) => g.category.trim() !== '')
      .map((g) => {
        const specs: Record<string, string> = {};
        g.items.forEach((it) => {
          if (it.key.trim() && it.value.trim()) {
            specs[it.key.trim()] = it.value.trim();
          }
        });
        return { category: g.category.trim(), specs };
      })
      .filter((g) => Object.keys(g.specs).length > 0);
  }

  deserializeProductSpecs(specs?: ProductSpecification[]): SpecGroup[] {
    if (!specs || specs.length === 0) return [];
    return specs.map((s) => ({
      category: s.category,
      items: Object.entries(s.specs || {}).map(([key, value]) => ({ key, value }))
    }));
  }

  getSuggestedSpecsForCategory(categoryId?: string): SpecGroup[] {
    const cat = this.adminService.categories().find((c) => c.id === categoryId);
    const parentCat = cat?.parent_id ? this.adminService.categories().find((c) => c.id === cat.parent_id) : null;
    const catSlug = `${cat?.slug || ''} ${cat?.name || ''} ${parentCat?.slug || ''} ${parentCat?.name || ''}`.toLowerCase();

    if (catSlug.includes('cpu') || catSlug.includes('procesador')) {
      return [
        {
          category: 'Rendimiento',
          items: [
            { key: 'Socket', value: 'AM5' },
            { key: 'Núcleos / Hilos', value: '8 / 16' },
            { key: 'Frecuencia Base', value: '4.2 GHz' },
            { key: 'Frecuencia Boost', value: '5.0 GHz' },
            { key: 'Caché', value: '96MB L3' },
            { key: 'TDP', value: '120W' }
          ]
        },
        {
          category: 'Compatibilidad & Memoria',
          items: [
            { key: 'Tipo de Memoria', value: 'DDR5 hasta 5200 MT/s' },
            { key: 'PCIe Versión', value: 'PCIe 5.0' },
            { key: 'Gráficos Integrados', value: 'AMD Radeon Graphics' }
          ]
        }
      ];
    }

    if (catSlug.includes('gpu') || catSlug.includes('grafica') || catSlug.includes('gráfica') || catSlug.includes('video')) {
      return [
        {
          category: 'Motor Gráfico & Memoria',
          items: [
            { key: 'Capacidad VRAM', value: '16GB' },
            { key: 'Tipo de Memoria', value: 'GDDR6X' },
            { key: 'Bus de Memoria', value: '256-bit' },
            { key: 'Interfaz', value: 'PCIe 4.0 x16' }
          ]
        },
        {
          category: 'Alimentación & Salidas',
          items: [
            { key: 'Puertos de Video', value: '3x DisplayPort 1.4a, 1x HDMI 2.1' },
            { key: 'Conectores de Poder', value: '1x 16-pin (12VHPWR)' },
            { key: 'Fuente Recomendada', value: '750W' },
            { key: 'Consumo (TDP)', value: '285W' }
          ]
        }
      ];
    }

    if (catSlug.includes('ram') || catSlug.includes('memoria')) {
      return [
        {
          category: 'Especificaciones de Memoria',
          items: [
            { key: 'Capacidad Total', value: '32GB (2x16GB)' },
            { key: 'Tipo', value: 'DDR5' },
            { key: 'Frecuencia', value: '6000 MHz' },
            { key: 'Latencia (CAS)', value: 'CL30' },
            { key: 'Voltaje', value: '1.35V' },
            { key: 'Perfil de Rendimiento', value: 'Intel XMP 3.0 / AMD EXPO' }
          ]
        }
      ];
    }

    if (catSlug.includes('placa') || catSlug.includes('motherboard') || catSlug.includes('madre')) {
      return [
        {
          category: 'Placa Base & Chipset',
          items: [
            { key: 'Socket', value: 'AM5' },
            { key: 'Chipset', value: 'AMD B650' },
            { key: 'Factor de Forma', value: 'ATX' },
            { key: 'Ranuras RAM', value: '4x DDR5 (Hasta 192GB)' },
            { key: 'Puertos M.2', value: '3x PCIe 4.0/5.0 NVMe' },
            { key: 'Conectividad', value: 'Wi-Fi 6E + Bluetooth 5.3 + 2.5Gb LAN' }
          ]
        }
      ];
    }

    if (catSlug.includes('ssd') || catSlug.includes('disco') || catSlug.includes('almacenamiento')) {
      return [
        {
          category: 'Rendimiento de Almacenamiento',
          items: [
            { key: 'Capacidad', value: '2TB' },
            { key: 'Factor de Forma', value: 'M.2 2280' },
            { key: 'Interfaz', value: 'PCIe Gen 4.0 x4, NVMe 2.0' },
            { key: 'Lectura Secuencial', value: '7450 MB/s' },
            { key: 'Escritura Secuencial', value: '6900 MB/s' },
            { key: 'TBW (Resistencia)', value: '1200 TBW' }
          ]
        }
      ];
    }

    // Default template
    return [
      {
        category: 'Especificaciones Generales',
        items: [
          { key: 'Garantía Oficial', value: '2 Años de Fábrica' },
          { key: 'Color / Acabado', value: 'Negro / Dark Titanium' },
          { key: 'Dimensiones', value: 'Estándar' },
          { key: 'Contenido del Paquete', value: 'Componente, Manual, Guía rápida' }
        ]
      }
    ];
  }

  // Creation Spec Handlers
  addNewProdSpecGroup(name = 'General'): void {
    this.newProdSpecGroups.update((groups) => [
      ...groups,
      { category: name, items: [{ key: '', value: '' }] }
    ]);
  }

  removeNewProdSpecGroup(index: number): void {
    this.newProdSpecGroups.update((groups) => groups.filter((_, i) => i !== index));
  }

  addNewProdSpecItem(groupIndex: number): void {
    this.newProdSpecGroups.update((groups) => {
      const copy = [...groups];
      copy[groupIndex] = {
        ...copy[groupIndex],
        items: [...copy[groupIndex].items, { key: '', value: '' }]
      };
      return copy;
    });
  }

  removeNewProdSpecItem(groupIndex: number, itemIndex: number): void {
    this.newProdSpecGroups.update((groups) => {
      const copy = [...groups];
      copy[groupIndex] = {
        ...copy[groupIndex],
        items: copy[groupIndex].items.filter((_, i) => i !== itemIndex)
      };
      return copy;
    });
  }

  applyNewProdSpecTemplate(): void {
    const catId = this.newProdCategoryId() || this.newProdForm.category_id;
    const template = this.getSuggestedSpecsForCategory(catId);
    this.newProdSpecGroups.set(JSON.parse(JSON.stringify(template)));
  }

  // Edition Spec Handlers
  addEditProdSpecGroup(name = 'General'): void {
    this.editProdSpecGroups.update((groups) => [
      ...groups,
      { category: name, items: [{ key: '', value: '' }] }
    ]);
  }

  removeEditProdSpecGroup(index: number): void {
    this.editProdSpecGroups.update((groups) => groups.filter((_, i) => i !== index));
  }

  addEditProdSpecItem(groupIndex: number): void {
    this.editProdSpecGroups.update((groups) => {
      const copy = [...groups];
      copy[groupIndex] = {
        ...copy[groupIndex],
        items: [...copy[groupIndex].items, { key: '', value: '' }]
      };
      return copy;
    });
  }

  removeEditProdSpecItem(groupIndex: number, itemIndex: number): void {
    this.editProdSpecGroups.update((groups) => {
      const copy = [...groups];
      copy[groupIndex] = {
        ...copy[groupIndex],
        items: copy[groupIndex].items.filter((_, i) => i !== itemIndex)
      };
      return copy;
    });
  }

  applyEditProdSpecTemplate(): void {
    const catId = this.editProdCategoryId() || this.editProdForm.category_id;
    const template = this.getSuggestedSpecsForCategory(catId);
    this.editProdSpecGroups.set(JSON.parse(JSON.stringify(template)));
  }

  // =========================================================================
  // BULK PRODUCT IMPORTER (CSV & XLSX)
  // =========================================================================
  openImportModal(): void {
    this.clearImportData();
    this.isImportModalOpen.set(true);
  }

  closeImportModal(): void {
    if (this.isImporting()) return;
    this.isImportModalOpen.set(false);
    this.clearImportData();
  }

  clearImportData(): void {
    this.importParsedItems.set([]);
    this.selectedImportFileName.set('');
    this.selectedImportFileSize.set('');
    this.selectedImportFileType.set(null);
    this.importResultMessage.set(null);
    this.importFilter.set('ALL');
  }

  removeImportItem(index: number): void {
    this.importParsedItems.update((items) => items.filter((_, i) => i !== index));
  }

  downloadCsvTemplate(): void {
    const headers = [
      'sku',
      'modelo',
      'categoria',
      'marca',
      'precio',
      'precio_regular',
      'descuento_porcentaje',
      'stock_fisico',
      'stock_virtual',
      'variante',
      'imagen_url',
      'descripcion'
    ];

    const sampleRows = [
      [
        'AMD-RYZ7-7800X3D',
        'AMD Ryzen 7 7800X3D',
        'Procesadores',
        'AMD',
        '449.99',
        '499.99',
        '10',
        '15',
        '5',
        'Box con Cooler',
        'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
        'Procesador gaming 8 nucleos 16 hilos con 3D V-Cache'
      ],
      [
        'COR-DDR5-32GB-6000',
        'Corsair Vengeance RGB 32GB (2x16GB) 6000MHz',
        'Memorias RAM',
        'Corsair',
        '129.99',
        '149.99',
        '13',
        '25',
        '10',
        'Negro RGB',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80',
        'Kit de memoria RAM DDR5 de alto rendimiento'
      ],
      [
        'ASUS-RTX4070S-OC',
        'ASUS TUF Gaming GeForce RTX 4070 Super 12GB',
        'Tarjetas de Video',
        'ASUS',
        '689.99',
        '',
        '',
        '8',
        '2',
        'OC Edition',
        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
        'Tarjeta grafica NVIDIA RTX 4070 Super con disipacion triple fan'
      ]
    ];

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...sampleRows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    this.downloadFile(csvContent, 'plantilla_productos_dasfusion.csv', 'text/csv;charset=utf-8;');
  }

  downloadXlsxTemplate(): void {
    const sampleRows = [
      {
        sku: 'AMD-RYZ7-7800X3D',
        modelo: 'AMD Ryzen 7 7800X3D',
        categoria: 'Procesadores',
        marca: 'AMD',
        precio: 449.99,
        precio_regular: 499.99,
        descuento_porcentaje: 10,
        stock_fisico: 15,
        stock_virtual: 5,
        variante: 'Box con Cooler',
        imagen_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
        descripcion: 'Procesador gaming 8 nucleos 16 hilos con 3D V-Cache'
      },
      {
        sku: 'COR-DDR5-32GB-6000',
        modelo: 'Corsair Vengeance RGB 32GB (2x16GB) 6000MHz',
        categoria: 'Memorias RAM',
        marca: 'Corsair',
        precio: 129.99,
        precio_regular: 149.99,
        descuento_porcentaje: 13,
        stock_fisico: 25,
        stock_virtual: 10,
        variante: 'Negro RGB',
        imagen_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80',
        descripcion: 'Kit de memoria RAM DDR5 de alto rendimiento'
      },
      {
        sku: 'ASUS-RTX4070S-OC',
        modelo: 'ASUS TUF Gaming GeForce RTX 4070 Super 12GB',
        categoria: 'Tarjetas de Video',
        marca: 'ASUS',
        precio: 689.99,
        precio_regular: '',
        descuento_porcentaje: '',
        stock_fisico: 8,
        stock_virtual: 2,
        variante: 'OC Edition',
        imagen_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
        descripcion: 'Tarjeta grafica NVIDIA RTX 4070 Super con disipacion triple fan'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
    XLSX.writeFile(workbook, 'plantilla_productos_dasfusion.xlsx');
  }

  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.selectedImportFileName.set(file.name);
    this.selectedImportFileSize.set((file.size / 1024).toFixed(1) + ' KB');
    this.importResultMessage.set(null);

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

    if (!isCsv && !isXlsx) {
      this.importResultMessage.set({
        type: 'error',
        text: 'Por favor selecciona un archivo con extensión .csv o .xlsx válido.'
      });
      input.value = '';
      return;
    }

    this.selectedImportFileType.set(isCsv ? 'csv' : 'xlsx');

    const reader = new FileReader();

    if (isCsv) {
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text || text.trim().length === 0) {
            this.importResultMessage.set({
              type: 'error',
              text: 'El archivo seleccionado está vacío.'
            });
            return;
          }

          const items = this.parseCsv(text);
          if (items.length === 0) {
            this.importResultMessage.set({
              type: 'error',
              text: 'No se encontraron registros de productos válidos en el archivo.'
            });
          }
          this.importParsedItems.set(items);
        } catch (err: any) {
          this.importResultMessage.set({
            type: 'error',
            text: `Error al procesar el archivo CSV: ${err?.message || 'Formato inválido'}`
          });
        }
      };
      reader.readAsText(file, 'utf-8');
    } else {
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer || buffer.byteLength === 0) {
            this.importResultMessage.set({
              type: 'error',
              text: 'El archivo de Excel seleccionado está vacío.'
            });
            return;
          }

          const items = this.parseXlsx(buffer);
          if (items.length === 0) {
            this.importResultMessage.set({
              type: 'error',
              text: 'No se encontraron filas de productos en la hoja de Excel.'
            });
          }
          this.importParsedItems.set(items);
        } catch (err: any) {
          this.importResultMessage.set({
            type: 'error',
            text: `Error al leer el archivo Excel: ${err?.message || 'Formato inválido'}`
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }

    reader.onerror = () => {
      this.importResultMessage.set({
        type: 'error',
        text: 'Error de lectura al cargar el archivo desde el disco.'
      });
    };

    input.value = '';
  }

  private parseCsv(text: string): ParsedImportItem[] {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) return [];

    const firstLine = lines[0];
    const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

    const rawHeaders = this.parseCsvLine(lines[0], delimiter).map((h) => this.normalizeHeader(h));
    const items: ParsedImportItem[] = [];

    const existingVariantsMap = new Map<string, DbProductVariant>();
    for (const prod of this.adminService.products()) {
      for (const v of prod.variants || []) {
        if (v.sku) {
          existingVariantsMap.set(v.sku.trim().toUpperCase(), v);
        }
      }
    }

    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCsvLine(lines[i], delimiter);
      if (row.length === 0 || row.every((val) => !val)) continue;

      const rowMap: Record<string, string> = {};
      rawHeaders.forEach((header, idx) => {
        rowMap[header] = row[idx] ? row[idx].trim() : '';
      });

      items.push(this.createParsedItemFromMap(rowMap, existingVariantsMap));
    }

    return items;
  }

  private parseCsvLine(text: string, delimiter: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  }

  private parseXlsx(buffer: ArrayBuffer): ParsedImportItem[] {
    const data = new Uint8Array(buffer);
    const workbook = XLSX.read(data, { type: 'array' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) return [];

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return [];

    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
    if (!rawRows || rawRows.length === 0) return [];

    const existingVariantsMap = new Map<string, DbProductVariant>();
    for (const prod of this.adminService.products()) {
      for (const v of prod.variants || []) {
        if (v.sku) {
          existingVariantsMap.set(v.sku.trim().toUpperCase(), v);
        }
      }
    }

    const items: ParsedImportItem[] = [];
    for (const row of rawRows) {
      const rowMap: Record<string, string> = {};
      for (const [key, val] of Object.entries(row)) {
        const normKey = this.normalizeHeader(key);
        rowMap[normKey] = val !== null && val !== undefined ? String(val).trim() : '';
      }

      if (Object.values(rowMap).some((v) => v.length > 0)) {
        items.push(this.createParsedItemFromMap(rowMap, existingVariantsMap));
      }
    }

    return items;
  }

  private normalizeHeader(header: string): string {
    const clean = header
      .toLowerCase()
      .trim()
      .replace(/["']/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (['sku', 'codigo', 'cod', 'id'].includes(clean)) return 'sku';
    if (['modelo', 'model', 'nombre', 'producto', 'name', 'title'].includes(clean)) return 'modelo';
    if (['categoria', 'category', 'rubro'].includes(clean)) return 'categoria';
    if (['marca', 'brand', 'fabricante'].includes(clean)) return 'marca';
    if (['precio', 'price', 'precio_venta', 'valor'].includes(clean)) return 'precio';
    if (['precio_regular', 'compare_at_price', 'precio_anterior', 'precio_lista'].includes(clean)) return 'precio_regular';
    if (['descuento_porcentaje', 'discount_percent', 'descuento', 'oferta'].includes(clean)) return 'descuento_porcentaje';
    if (['stock_fisico', 'stock_physical', 'fisico'].includes(clean)) return 'stock_fisico';
    if (['stock_virtual', 'stock_virtual', 'virtual'].includes(clean)) return 'stock_virtual';
    if (['stock', 'cantidad', 'existencias', 'stock_total'].includes(clean)) return 'stock';
    if (['variante', 'variant_name', 'version', 'variacion'].includes(clean)) return 'variante';
    if (['imagen_url', 'image_url', 'imagen', 'foto', 'imagenes'].includes(clean)) return 'imagen_url';
    if (['descripcion', 'short_description', 'desc', 'detalle'].includes(clean)) return 'descripcion';
    return clean;
  }

  private createParsedItemFromMap(
    rowMap: Record<string, string>,
    existingVariantsMap: Map<string, DbProductVariant>
  ): ParsedImportItem {
    const sku = (rowMap['sku'] || '').trim().toUpperCase();
    const model = (rowMap['modelo'] || '').trim();
    const category = (rowMap['categoria'] || '').trim();
    const brand = (rowMap['marca'] || '').trim();
    const rawPrice = parseFloat((rowMap['precio'] || '').replace(',', '.'));
    const price = isNaN(rawPrice) ? 0 : rawPrice;

    const rawRegularPrice = parseFloat((rowMap['precio_regular'] || '').replace(',', '.'));
    const compare_at_price = !isNaN(rawRegularPrice) && rawRegularPrice > 0 ? rawRegularPrice : undefined;

    const rawDiscount = parseFloat((rowMap['descuento_porcentaje'] || '').replace(',', '.'));
    let discount_percent = !isNaN(rawDiscount) && rawDiscount > 0 ? Math.min(99, Math.round(rawDiscount)) : undefined;

    if (!discount_percent && compare_at_price && compare_at_price > price) {
      discount_percent = Math.round(((compare_at_price - price) / compare_at_price) * 100);
    }

    const rawStock = parseInt(rowMap['stock'] || '0', 10);
    const rawPhysical = parseInt(rowMap['stock_fisico'] || '', 10);
    const rawVirtual = parseInt(rowMap['stock_virtual'] || '0', 10);

    const stock_physical = !isNaN(rawPhysical)
      ? Math.max(0, rawPhysical)
      : (!isNaN(rawStock) ? Math.max(0, rawStock) : 0);
    const stock_virtual = !isNaN(rawVirtual) ? Math.max(0, rawVirtual) : 0;
    const stock = stock_physical + stock_virtual;

    const variant_name = (rowMap['variante'] || 'Estándar').trim();
    const image_url = (rowMap['imagen_url'] || '').trim();
    const short_description = (rowMap['descripcion'] || '').trim();

    const errors: string[] = [];
    if (!sku) errors.push('Falta SKU');
    if (!model) errors.push('Falta Modelo/Nombre');
    if (!category) errors.push('Falta Categoría');
    if (!brand) errors.push('Falta Marca');
    if (price <= 0) errors.push('Precio debe ser > 0');

    const isValid = errors.length === 0;
    const isExisting = existingVariantsMap.has(sku);

    return {
      sku,
      model,
      category,
      brand,
      price,
      compare_at_price,
      discount_percent,
      stock,
      stock_physical,
      stock_virtual,
      variant_name,
      image_url: image_url || undefined,
      short_description: short_description || undefined,
      isValid,
      errorMessage: errors.join(' • '),
      isExisting,
      action: !isValid ? 'error' : isExisting ? 'update' : 'create'
    };
  }

  async confirmImport(): Promise<void> {
    const validItems = this.importParsedItems().filter((item) => item.isValid);
    if (validItems.length === 0) return;

    this.isImporting.set(true);
    this.importProgress.set({ current: 0, total: validItems.length });
    this.importResultMessage.set(null);

    let createdCount = 0;
    let updatedCount = 0;

    try {
      // 1. Build category map (lowercase name -> id)
      const categoriesMap = new Map<string, string>();
      for (const cat of this.adminService.categories()) {
        categoriesMap.set(cat.name.toLowerCase().trim(), cat.id);
      }

      // 2. Build brand map (lowercase name -> id)
      const brandsMap = new Map<string, string>();
      for (const b of this.adminService.brands()) {
        brandsMap.set(b.name.toLowerCase().trim(), b.id);
      }

      // 3. Existing variants map
      const existingVariantsMap = new Map<string, { variantId: string; productId: string }>();
      for (const prod of this.adminService.products()) {
        for (const v of prod.variants || []) {
          if (v.sku) {
            existingVariantsMap.set(v.sku.trim().toUpperCase(), {
              variantId: v.id,
              productId: prod.id
            });
          }
        }
      }

      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        this.importProgress.set({ current: i + 1, total: validItems.length });

        // Resolve or create Category
        const catKey = item.category.toLowerCase().trim();
        let catId = categoriesMap.get(catKey);
        if (!catId) {
          const newCat = await this.adminService.createCategory({ name: item.category });
          catId = newCat.id;
          categoriesMap.set(catKey, catId);
        }

        // Resolve or create Brand
        const brandKey = item.brand.toLowerCase().trim();
        let brandId = brandsMap.get(brandKey);
        if (!brandId) {
          const newBrand = await this.adminService.createBrand({
            name: item.brand,
            category_ids: [catId]
          });
          brandId = newBrand.id;
          brandsMap.set(brandKey, brandId);
        }

        const existing = existingVariantsMap.get(item.sku);
        if (existing) {
          // UPDATE existing variant price, discount, and stock
          await this.adminService.updateVariantPrice(existing.variantId, item.price);
          await this.adminService.updateVariantDiscount(existing.variantId, {
            discountPercent: item.discount_percent ?? null,
            compareAtPrice: item.compare_at_price ?? null
          });
          await this.adminService.updateVariantStock(existing.variantId, item.stock_physical, item.stock_virtual);
          updatedCount++;
        } else {
          // CREATE new product with variant
          const fallbackImg =
            item.image_url ||
            'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80';

          await this.adminService.createProductWithVariants(
            {
              model: item.model,
              category_id: catId,
              brand_id: brandId,
              short_description: item.short_description || `Producto ${item.model}`,
              images: [fallbackImg],
              product_type: 'standalone',
              is_active: true
            },
            [
              {
                sku: item.sku,
                variant_name: item.variant_name || 'Estándar',
                price: item.price,
                compare_at_price: item.compare_at_price,
                discount_percent: item.discount_percent,
                stock: item.stock,
                stock_physical: item.stock_physical,
                stock_virtual: item.stock_virtual
              }
            ]
          );

          createdCount++;
        }
      }

      // Reload products to sync state in both services
      await this.productService.loadProductsFromDatabase();

      this.importResultMessage.set({
        type: 'success',
        text: `¡Importación completada con éxito! Se crearon ${createdCount} producto(s) nuevo(s) y se actualizaron ${updatedCount} existencia(s).`
      });

      this.importParsedItems.set([]);
      this.selectedImportFileName.set('');
    } catch (err: any) {
      console.error('Error durante la importación masiva:', err);
      this.importResultMessage.set({
        type: 'error',
        text: `Ocurrió un error al procesar la importación: ${err?.message || 'Error desconocido'}`
      });
    } finally {
      this.isImporting.set(false);
    }
  }
}
