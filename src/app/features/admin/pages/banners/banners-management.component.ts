import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BannerService, PromoBanner } from '../../../../core/services/banner.service';
import { ProductService } from '../../../../core/services/product.service';

@Component({
  selector: 'app-banners-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            Carrusel de Banners Publicitarios
          </h1>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Administra las imágenes publicitarias y sus URLs de redirección (página o producto) en la tienda.
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
    </div>
  `
})
export class BannersManagementComponent {
  readonly bannerService = inject(BannerService);
  readonly productService = inject(ProductService);

  readonly newImageUrl = signal<string>('');
  readonly newTitle = signal<string>('');
  readonly newSubtitle = signal<string>('');
  readonly newLinkUrl = signal<string>('/');
  readonly isUploadingFile = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly statusMessage = signal<string>('');
  readonly isError = signal<boolean>(false);

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
