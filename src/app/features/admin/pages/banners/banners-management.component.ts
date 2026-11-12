import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BannerService, PromoBanner } from '../../../../core/services/banner.service';
import { ProductService } from '../../../../core/services/product.service';
import { AdminPaginationComponent } from '../../../../shared/components/admin-pagination/admin-pagination.component';

@Component({
  selector: 'app-banners-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminPaginationComponent],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/40 pb-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary-container text-primary border border-primary/30">
              Marketing & Vitrinas
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-on-surface mt-1">
            Carrusel de Banners & Franja de Productos Nuevos
          </h1>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Administra los banners publicitarios y selecciona los productos nuevos que aparecen en la franja inferior de lanzamientos.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="restoreDefaults()"
            class="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-xs font-bold text-on-surface-variant hover:text-white transition cursor-pointer"
          >
            Restaurar 2 Banners por Defecto
          </button>
        </div>
      </div>

      <!-- Add New Banner Card -->
      <div class="rounded-2xl bg-surface-container/70 border border-outline-variant/40 p-5 sm:p-6 space-y-5 shadow-xl">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm sm:text-base font-bold text-on-surface">
              Ingresar Nueva Imagen al Carrusel
            </h2>
            <p class="text-xs text-outline mt-0.5">
              Sube un archivo de imagen o pega una URL y define a qué página o producto redirige (por defecto: página inicial <code class="text-primary font-mono">/</code>).
            </p>
          </div>
          <span class="text-xs font-mono font-bold text-primary bg-primary-container/50 px-2.5 py-1 rounded-lg border border-primary/30">
            Total activos: {{ bannerService.banners().length }}
          </span>
        </div>

        @if (statusMessage()) {
          <div
            class="p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border"
            [class.bg-emerald-500/10]="!isError()"
            [class.text-emerald-300]="!isError()"
            [class.border-emerald-500/30]="!isError()"
            [class.bg-rose-500/10]="isError()"
            [class.text-rose-300]="isError()"
            [class.border-rose-500/30]="isError()"
          >
            <span>{{ statusMessage() }}</span>
            <button type="button" (click)="statusMessage.set('')" class="text-xs opacity-75 hover:opacity-100 cursor-pointer">✕</button>
          </div>
        }

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div class="lg:col-span-7 space-y-4">
            <!-- Image File Upload OR URL -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Upload from Device -->
              <label
                class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low/70 hover:bg-surface-container transition cursor-pointer text-center"
              >
                <input
                  type="file"
                  accept="image/*"
                  (change)="onFileSelected($event)"
                  class="hidden"
                />
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span class="text-xs font-bold text-on-surface">
                  {{ isUploadingFile() ? 'Procesando imagen...' : 'Subir archivo de imagen' }}
                </span>
                <span class="text-[10px] text-outline">JPG, PNG, WEBP (Recomendado 1600×500px)</span>
              </label>

              <!-- Direct Image URL Input -->
              <div class="flex flex-col justify-center space-y-1.5 bg-surface-container-low/70 p-3.5 rounded-xl border border-outline-variant/40">
                <label class="text-xs font-bold text-on-surface-variant">O pegar URL de la imagen:</label>
                <input
                  type="url"
                  [(ngModel)]="newImageUrl"
                  placeholder="https://ejemplo.com/banner.jpg"
                  class="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface placeholder-outline focus:outline-none focus:border-primary"
                />
                <span class="text-[10px] text-outline">Se previsualizará automáticamente a la derecha.</span>
              </div>
            </div>

            <!-- Optional Banner Title & Subtitle -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-on-surface-variant">Título del Banner (Opcional)</label>
                <input
                  type="text"
                  [(ngModel)]="newTitle"
                  placeholder="Ej. Ofertas de Temporada Gaming"
                  class="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder-outline focus:outline-none focus:border-primary"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-on-surface-variant">Subtítulo / Descripción (Opcional)</label>
                <input
                  type="text"
                  [(ngModel)]="newSubtitle"
                  placeholder="Ej. Hasta 20% de descuento en equipos seleccionados"
                  class="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder-outline focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <!-- Redirect URL (Page or Product) with Default '/' -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/40">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-on-surface-variant">
                  URL de Redirección (Por defecto: <code class="text-primary font-mono">/</code>)
                </label>
                <input
                  type="text"
                  [(ngModel)]="newLinkUrl"
                  placeholder="/ (Página inicial) o /catalog/producto"
                  class="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs font-mono text-on-surface placeholder-outline focus:outline-none focus:border-primary"
                />
                <span class="text-[10px] text-outline block">
                  Si se deja vacío, redirigirá automáticamente a la página inicial (<code class="text-primary">/</code>).
                </span>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-on-surface-variant">
                  O elegir página / producto rápido:
                </label>
                <select
                  (change)="onQuickRedirectSelect($event)"
                  class="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="/">🏠 Página Inicial (/)</option>
                  <option value="/pc-builder">🖥️ Armador de PC (/pc-builder)</option>
                  <optgroup label="Productos de la Tienda">
                    @for (prod of productService.products(); track prod.id) {
                      <option [value]="'/catalog/' + prod.slug">
                        📦 {{ prod.name }}
                      </option>
                    }
                  </optgroup>
                </select>
                <span class="text-[10px] text-outline block">
                  Rellena automáticamente el enlace del producto o sección seleccionada.
                </span>
              </div>
            </div>

            <div class="pt-1">
              <button
                type="button"
                (click)="addBannerToCarousel()"
                [disabled]="!newImageUrl().trim() || isSaving()"
                class="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary-fixed text-on-primary-fixed font-extrabold text-xs shadow-lg transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>{{ isSaving() ? 'Guardando en el carrusel...' : 'Agregar Imagen al Carrusel' }}</span>
              </button>
            </div>
          </div>

          <!-- Live Preview Box -->
          <div class="lg:col-span-5 space-y-1.5">
            <span class="text-xs font-semibold text-on-surface-variant block">Vista Previa del Nuevo Banner:</span>
            <div class="relative h-44 sm:h-48 w-full rounded-2xl overflow-hidden border border-outline-variant/50 bg-surface-container-lowest flex items-center justify-center">
              @if (newImageUrl().trim()) {
                <img
                  [src]="newImageUrl()"
                  alt="Vista previa de banner"
                  class="h-full w-full object-cover object-center"
                />
                @if (newTitle().trim() || newSubtitle().trim()) {
                  <div class="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-4">
                    @if (newTitle().trim()) {
                      <h4 class="text-sm font-extrabold text-white leading-tight">{{ newTitle() }}</h4>
                    }
                    @if (newSubtitle().trim()) {
                      <p class="text-[11px] text-white/80 line-clamp-2 mt-0.5">{{ newSubtitle() }}</p>
                    }
                  </div>
                }
              } @else {
                <div class="text-center p-4 space-y-1">
                  <svg class="w-8 h-8 text-outline mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p class="text-xs text-outline">Sube una imagen o ingresa una URL para previsualizar el banner</p>
                </div>
              }
            </div>
            <div class="text-[11px] text-outline flex items-center gap-1.5 pt-1">
              <span>🔗 Redirige a:</span>
              <code class="text-primary font-mono font-bold">{{ newLinkUrl().trim() || '/' }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Carousel Banners Grid -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-on-surface">
            Imágenes Actuales en el Carrusel ({{ bannerService.banners().length }})
          </h2>
        </div>

        @if (bannerService.banners().length === 0) {
          <div class="rounded-2xl border border-dashed border-outline-variant/50 p-12 text-center space-y-2">
            <p class="text-sm font-semibold text-on-surface">No hay imágenes en el carrusel actualmente</p>
            <p class="text-xs text-outline">Agrega una nueva imagen arriba o restaura los 2 banners por defecto.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            @for (banner of bannerService.banners(); track banner.id; let idx = $index) {
              <div class="rounded-2xl bg-surface-container/70 border border-outline-variant/40 overflow-hidden shadow-lg flex flex-col justify-between group">
                <div class="relative h-48 w-full overflow-hidden bg-surface-container-lowest">
                  <img
                    [src]="banner.image_url"
                    [alt]="banner.title || ('Banner #' + (idx + 1))"
                    class="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                  <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/65 text-white backdrop-blur-md border border-white/15 font-mono">
                    Posición #{{ idx + 1 }}
                  </div>

                  @if (banner.title || banner.subtitle) {
                    <div class="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4">
                      @if (banner.title) {
                        <h3 class="text-sm sm:text-base font-extrabold text-white">{{ banner.title }}</h3>
                      }
                      @if (banner.subtitle) {
                        <p class="text-xs text-white/80 line-clamp-2 mt-0.5">{{ banner.subtitle }}</p>
                      }
                    </div>
                  }
                </div>

                <div class="p-4 space-y-3 bg-surface-container">
                  <div class="flex items-center justify-between gap-3">
                    <div class="truncate text-xs text-outline">
                      <span class="font-semibold text-on-surface-variant">Título:</span>
                      {{ banner.title || 'Sin título (Solo imagen)' }}
                    </div>

                    <button
                      type="button"
                      (click)="deleteBanner(banner)"
                      class="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Eliminar</span>
                    </button>
                  </div>

                  <!-- Editable Redirect Link per Banner -->
                  <div class="flex items-center gap-2 pt-2 border-t border-outline-variant/30">
                    <span class="text-[11px] font-semibold text-on-surface-variant whitespace-nowrap">🔗 URL:</span>
                    <input
                      type="text"
                      [value]="banner.link_url || '/'"
                      #linkInput
                      placeholder="/ (Página inicial)"
                      class="flex-1 bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      (click)="saveBannerLink(banner.id, linkInput.value)"
                      class="px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary text-primary hover:text-on-primary text-[11px] font-bold transition cursor-pointer shrink-0"
                    >
                      Guardar URL
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION 2: FRANJA DE PRODUCTOS NUEVOS (DEBAJO DEL CARRUSEL PROMOCIONAL) -->
      <!-- ========================================================================= -->
      <div class="pt-6 border-t border-outline-variant/40 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/15 text-primary border border-primary/30">
                ✨ Franja Inferior de Lanzamientos
              </span>
              <span class="text-xs font-mono font-bold text-primary bg-primary-container/50 px-2.5 py-0.5 rounded-lg border border-primary/30">
                {{ productService.newPromoProducts().length }} en la franja
              </span>
            </div>
            <h2 class="text-lg sm:text-xl font-extrabold text-on-surface mt-1">
              Franja de Productos Nuevos
            </h2>
            <p class="text-xs text-outline mt-0.5">
              Selecciona qué productos aparecen en la franja de <strong>Productos Nuevos</strong> ubicada justo debajo del carrusel de banners promocionales.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              (click)="restoreDefaultNewProducts()"
              class="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-xs font-bold text-on-surface-variant hover:text-white transition cursor-pointer"
            >
              ✨ Cargar 4 Más Recientes
            </button>
            @if (productService.newPromoProducts().length > 0) {
              <button
                type="button"
                (click)="clearAllNewProducts()"
                class="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition cursor-pointer"
              >
                Vaciar Franja
              </button>
            }
          </div>
        </div>

        <!-- Currently Selected Products in the Strip -->
        <div class="rounded-2xl bg-surface-container/70 border border-outline-variant/40 p-5 space-y-4 shadow-xl">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-on-surface">
              Productos Actualmente en la Franja ({{ productService.newPromoProducts().length }})
            </h3>
            <span class="text-[11px] text-outline">
              Usa las flechas ◀ ▶ para ordenar la aparición en la tienda
            </span>
          </div>

          @if (productService.newPromoProducts().length === 0) {
            <div class="rounded-xl border border-dashed border-outline-variant/50 p-8 text-center space-y-1.5">
              <p class="text-xs sm:text-sm font-semibold text-on-surface">
                No hay productos seleccionados en la franja de Productos Nuevos
              </p>
              <p class="text-xs text-outline">
                Selecciona productos en la tabla inferior o haz clic en "Cargar 4 Más Recientes".
              </p>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              @for (prod of productService.newPromoProducts(); track prod.id; let idx = $index) {
                <div class="rounded-xl bg-surface border border-primary/35 p-3 flex flex-col justify-between gap-3 shadow-md">
                  <div class="flex items-start gap-3">
                    <div class="h-14 w-14 rounded-lg bg-surface-container-lowest border border-outline-variant/30 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                      <img [src]="prod.images[0]" [alt]="prod.name" class="h-full w-full object-contain" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between gap-1">
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-primary-container text-primary">
                          #{{ idx + 1 }}
                        </span>
                        <span class="text-[10px] text-outline uppercase font-bold truncate">{{ prod.brand }}</span>
                      </div>
                      <h4 class="text-xs font-bold text-on-surface line-clamp-2 mt-1" [title]="prod.name">
                        {{ prod.name }}
                      </h4>
                      <div class="text-xs font-mono font-bold text-primary mt-0.5">
                        &dollar;{{ prod.price | number:'1.2-2' }}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-2 border-t border-outline-variant/30 gap-1.5">
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        (click)="moveNewProduct(prod.id, 'left')"
                        [disabled]="idx === 0"
                        title="Mover antes"
                        class="h-7 w-7 rounded-lg bg-surface-container hover:bg-surface-container-high disabled:opacity-35 text-xs text-on-surface flex items-center justify-center transition cursor-pointer"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        (click)="moveNewProduct(prod.id, 'right')"
                        [disabled]="idx === productService.newPromoProducts().length - 1"
                        title="Mover después"
                        class="h-7 w-7 rounded-lg bg-surface-container hover:bg-surface-container-high disabled:opacity-35 text-xs text-on-surface flex items-center justify-center transition cursor-pointer"
                      >
                        ▶
                      </button>
                    </div>

                    <button
                      type="button"
                      (click)="toggleNewProduct(prod.id)"
                      class="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-bold transition cursor-pointer"
                    >
                      ✕ Quitar
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Product Catalog Selector Table (Paginated 10 items max) -->
        <div class="rounded-2xl bg-surface-container/70 border border-outline-variant/40 overflow-hidden shadow-xl">
          <div class="p-4 sm:p-5 border-b border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="text-sm font-bold text-on-surface">
                Seleccionar Productos del Catálogo para la Franja de Nuevos
              </h3>
              <p class="text-[11px] text-outline mt-0.5">
                Activa o desactiva cualquier producto para mostrarlo u ocultarlo inmediatamente en la franja de Productos Nuevos.
              </p>
            </div>

            <div class="relative w-full sm:w-72">
              <input
                type="search"
                [ngModel]="newProductSearch()"
                (ngModelChange)="onNewProductSearchChange($event)"
                placeholder="Buscar por modelo, marca o categoría..."
                class="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface placeholder-outline focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-on-surface-variant">
              <thead class="bg-surface-container-low text-outline uppercase text-[11px] border-b border-outline-variant/40">
                <tr>
                  <th class="py-3 px-4">Producto</th>
                  <th class="py-3 px-4">Marca & Categoría</th>
                  <th class="py-3 px-4">Precio Base</th>
                  <th class="py-3 px-4 text-center">Stock</th>
                  <th class="py-3 px-4 text-center">Estado en Franja</th>
                  <th class="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/30">
                @for (prod of paginatedCatalogProducts(); track prod.id) {
                  <tr
                    class="hover:bg-surface-container/60 transition"
                    [class.bg-primary-container/15]="productService.isProductInNewStrip(prod.id)"
                  >
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div class="h-10 w-10 rounded-lg bg-surface-container-lowest border border-outline-variant/40 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                          <img [src]="prod.images[0]" [alt]="prod.name" class="h-full w-full object-contain" />
                        </div>
                        <span class="font-bold text-on-surface">{{ prod.name }}</span>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <div class="font-semibold text-on-surface">{{ prod.brand }}</div>
                      <div class="text-[11px] text-outline">{{ prod.category }}</div>
                    </td>
                    <td class="py-3 px-4 font-mono font-bold text-on-surface">
                      &dollar;{{ prod.price | number:'1.2-2' }}
                    </td>
                    <td class="py-3 px-4 text-center font-mono">
                      {{ prod.stock }} uds.
                    </td>
                    <td class="py-3 px-4 text-center">
                      @if (productService.isProductInNewStrip(prod.id)) {
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-primary border border-primary/30">
                          ✨ En Franja Nuevos
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-high text-outline">
                          No seleccionado
                        </span>
                      }
                    </td>
                    <td class="py-3 px-4 text-right">
                      <button
                        type="button"
                        (click)="toggleNewProduct(prod.id)"
                        [class.bg-rose-500/15]="productService.isProductInNewStrip(prod.id)"
                        [class.text-rose-300]="productService.isProductInNewStrip(prod.id)"
                        [class.border-rose-500/30]="productService.isProductInNewStrip(prod.id)"
                        [class.hover:bg-rose-500]="productService.isProductInNewStrip(prod.id)"
                        [class.hover:text-white]="productService.isProductInNewStrip(prod.id)"
                        [class.bg-primary-container]="!productService.isProductInNewStrip(prod.id)"
                        [class.text-primary]="!productService.isProductInNewStrip(prod.id)"
                        [class.border-primary/30]="!productService.isProductInNewStrip(prod.id)"
                        [class.hover:bg-primary]="!productService.isProductInNewStrip(prod.id)"
                        [class.hover:text-on-primary]="!productService.isProductInNewStrip(prod.id)"
                        class="px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer"
                      >
                        {{ productService.isProductInNewStrip(prod.id) ? '✕ Quitar de Franja' : '+ Agregar a Franja' }}
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="py-8 text-center text-xs text-outline">
                      No se encontraron productos con el criterio de búsqueda.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="px-4 pb-3">
            <app-admin-pagination
              [currentPage]="catalogSelectorPage()"
              [totalItems]="filteredCatalogProducts().length"
              [pageSize]="pageSize"
              (pageChange)="catalogSelectorPage.set($event)"
            />
          </div>
        </div>
      </div>
    </div>
  `
})
export class BannersManagementComponent {
  readonly bannerService = inject(BannerService);
  readonly productService = inject(ProductService);

  readonly pageSize = 10;
  readonly newProductSearch = signal<string>('');
  readonly catalogSelectorPage = signal<number>(1);

  readonly filteredCatalogProducts = computed(() => {
    const q = this.newProductSearch().toLowerCase().trim();
    const all = this.productService.products();
    if (!q) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  });

  readonly paginatedCatalogProducts = computed(() => {
    const list = this.filteredCatalogProducts();
    const totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    const safePage = Math.min(Math.max(1, this.catalogSelectorPage()), totalPages);
    const start = (safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  readonly newImageUrl = signal<string>('');
  readonly newTitle = signal<string>('');
  readonly newSubtitle = signal<string>('');
  readonly newLinkUrl = signal<string>('/');
  readonly isUploadingFile = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly statusMessage = signal<string>('');
  readonly isError = signal<boolean>(false);

  onNewProductSearchChange(value: string): void {
    this.newProductSearch.set(value);
    this.catalogSelectorPage.set(1);
  }

  async toggleNewProduct(productId: string): Promise<void> {
    const added = await this.productService.toggleProductInNewStrip(productId);
    this.isError.set(false);
    this.statusMessage.set(
      added
        ? 'Producto agregado a la Franja de Productos Nuevos.'
        : 'Producto retirado de la Franja de Productos Nuevos.'
    );
  }

  async moveNewProduct(productId: string, direction: 'left' | 'right'): Promise<void> {
    await this.productService.moveProductInNewStrip(productId, direction);
  }

  async clearAllNewProducts(): Promise<void> {
    await this.productService.clearNewStripProducts();
    this.isError.set(false);
    this.statusMessage.set('Se vació la Franja de Productos Nuevos.');
  }

  async restoreDefaultNewProducts(): Promise<void> {
    await this.productService.restoreDefaultNewStripProducts(4);
    this.isError.set(false);
    this.statusMessage.set('Se cargaron los 4 productos más recientes en la Franja de Productos Nuevos.');
  }

  onQuickRedirectSelect(event: Event): void {
    const selected = (event.target as HTMLSelectElement).value;
    this.newLinkUrl.set(selected || '/');
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingFile.set(true);
    this.statusMessage.set('');
    try {
      const uploadedUrl = await this.bannerService.uploadBannerImageFile(file);
      this.newImageUrl.set(uploadedUrl);
      this.isError.set(false);
      this.statusMessage.set('Imagen cargada y lista para agregar al carrusel.');
    } catch {
      this.isError.set(true);
      this.statusMessage.set('No se pudo procesar el archivo de imagen seleccionado.');
    } finally {
      this.isUploadingFile.set(false);
      input.value = '';
    }
  }

  async addBannerToCarousel(): Promise<void> {
    const imageUrl = this.newImageUrl().trim();
    if (!imageUrl) return;

    this.isSaving.set(true);
    try {
      await this.bannerService.addBanner({
        image_url: imageUrl,
        title: this.newTitle(),
        subtitle: this.newSubtitle(),
        link_url: this.newLinkUrl().trim() || '/'
      });
      this.newImageUrl.set('');
      this.newTitle.set('');
      this.newSubtitle.set('');
      this.newLinkUrl.set('/');
      this.isError.set(false);
      this.statusMessage.set('Banner publicitario agregado exitosamente al carrusel.');
    } catch {
      this.isError.set(true);
      this.statusMessage.set('Ocurrió un error al agregar el banner.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async saveBannerLink(bannerId: string, linkUrl: string): Promise<void> {
    await this.bannerService.updateBannerLink(bannerId, linkUrl);
    this.isError.set(false);
    this.statusMessage.set('URL de redirección actualizada correctamente.');
  }

  async deleteBanner(banner: PromoBanner): Promise<void> {
    await this.bannerService.removeBanner(banner.id);
    this.isError.set(false);
    this.statusMessage.set('Imagen eliminada del carrusel.');
  }

  async restoreDefaults(): Promise<void> {
    await this.bannerService.resetDefaultBanners();
    this.isError.set(false);
    this.statusMessage.set('Se restauraron las 2 imágenes por defecto del carrusel.');
  }
}
