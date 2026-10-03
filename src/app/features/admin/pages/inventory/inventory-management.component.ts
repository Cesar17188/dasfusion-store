import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminProductWithVariants } from '../../../../core/services/admin.service';
import { DbProductVariant, DbCategory, DbBrand } from '../../../../core/models/supabase.model';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
                        <div class="font-bold text-on-surface">{{ item.product.model }}</div>
                        @if (item.variant.is_bundle) {
                          <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-primary-container text-primary border border-primary/30">
                            COMBO / BUNDLE
                          </span>
                        }
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
                          <span class="text-outline">$</span>
                          <input
                            type="number"
                            [ngModel]="item.variant.price"
                            (blur)="onPriceChange(item.variant.id, $event)"
                            class="w-20 bg-surface border border-outline-variant rounded px-1.5 py-0.5 text-xs text-on-surface focus:outline-none focus:border-primary"
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
                            class="w-16 bg-surface border border-outline-variant rounded px-1.5 py-0.5 text-xs font-bold text-center text-on-surface focus:outline-none focus:border-primary"
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
                            class="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-[11px] font-semibold text-primary transition cursor-pointer"
                          >
                            +5 Stock
                          </button>
                          <button
                            (click)="incrementStock(item.variant.id, item.variant.stock, 10)"
                            title="Sumar +10 unidades al stock"
                            class="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-[11px] font-semibold text-primary transition cursor-pointer"
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
                  @for (cat of organizedCategories(); track cat.id) {
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
                  @for (brand of adminService.brands(); track brand.id) {
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
          </div>
        </div>
      }
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL 1: NUEVO PRODUCTO Y VARIANTE (CON VÍNCULO CATEGORÍA-MARCA DINÁMICO) -->
    <!-- ========================================================================= -->
    @if (isNewProductModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-xl space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                    @for (brand of availableBrandsForNewProd(); track brand.id) {
                      <option [value]="brand.id">{{ brand.name }}</option>
                    }
                  </select>
                  <p class="text-[10px] text-outline mt-1">
                    {{ availableBrandsForNewProd().length }} marcas disponibles para esta categoría
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
            </div>

            <!-- Variant Info -->
            <div class="space-y-3 border-t border-outline-variant/40 pt-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-primary">2. Variante Inicial & Inventario</h4>
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
                  class="rounded bg-surface border-outline-variant text-primary"
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
  `
})
export class InventoryManagementComponent {
  readonly adminService = inject(AdminService);

  activeTab = signal<'inventory' | 'categories' | 'brands'>('inventory');

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('ALL');
  selectedBrand = signal<string>('ALL');
  onlyLowStock = signal<boolean>(false);

  // Modals state
  isNewProductModalOpen = signal<boolean>(false);
  isCategoryModalOpen = signal<boolean>(false);
  isBrandModalOpen = signal<boolean>(false);

  editingCategory = signal<DbCategory | null>(null);
  editingBrand = signal<DbBrand | null>(null);

  // Forms
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
    stock: 5,
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
    return this.adminService.getBrandsForCategory(this.newProdForm.category_id);
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
    const available = this.adminService.getBrandsForCategory(catId);
    if (available.length > 0) {
      const stillValid = available.some((b) => b.id === this.newProdForm.brand_id);
      if (!stillValid) {
        this.newProdForm.brand_id = available[0].id;
      }
    }
  }

  // Stock / Price Inline
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

    if (this.editingBrand()) {
      await this.adminService.updateBrand(this.editingBrand()!.id, {
        name: this.brandForm.name.trim(),
        slug: this.brandForm.slug.trim(),
        category_ids: this.brandForm.category_ids,
        is_active: this.brandForm.is_active
      });
    } else {
      await this.adminService.createBrand({
        name: this.brandForm.name.trim(),
        slug: this.brandForm.slug.trim(),
        category_ids: this.brandForm.category_ids,
        is_active: this.brandForm.is_active
      });
    }

    this.isBrandModalOpen.set(false);
  }

  async toggleBrandStatus(id: string): Promise<void> {
    await this.adminService.toggleBrandStatus(id);
  }

  async deleteBrand(id: string): Promise<void> {
    if (confirm('¿Estás seguro de eliminar esta marca?')) {
      await this.adminService.deleteBrand(id);
    }
  }

  // --- Product Modal Actions ---
  openNewProductModal(): void {
    const firstCat = this.organizedCategories()[0]?.id || '';
    const availableBrands = this.adminService.getBrandsForCategory(firstCat);
    const firstBrand = availableBrands[0]?.id || this.adminService.brands()[0]?.id || '';

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
