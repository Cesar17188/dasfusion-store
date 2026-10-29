import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CookieService } from '../../../core/services/cookie.service';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (cookieService.showBanner()) {
      <div
        class="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-5 pointer-events-none flex justify-center"
        role="region"
        aria-label="Aviso de cookies"
      >
        <div
          class="pointer-events-auto w-full max-w-4xl rounded-2xl bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant/70 shadow-2xl p-4 sm:p-6 text-on-surface space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <!-- Encabezado y descripción principal -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-start gap-3.5">
              <div
                class="w-10 h-10 rounded-xl bg-primary-container/60 border border-primary/30 flex items-center justify-center text-lg shrink-0 text-primary"
              >
                🍪
              </div>
              <div class="space-y-1">
                <h3 class="text-sm sm:text-base font-bold text-on-surface">
                  Uso de Cookies y Privacidad
                </h3>
                <p class="text-xs text-outline leading-relaxed">
                  Utilizamos cookies propias y de terceros en tu navegador para garantizar el correcto funcionamiento de la tienda, recordar tu carrito de compras, guardar tus configuraciones del PC Builder y mejorar tu experiencia. Puedes aceptar todas las cookies, rechazar las opcionales o personalizar tu elección.
                </p>
              </div>
            </div>

            <!-- Botones de acción rápida -->
            <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
              <button
                type="button"
                (click)="cookieService.togglePreferencesPanel()"
                class="px-3.5 py-2 rounded-xl border border-outline-variant hover:border-outline bg-transparent text-on-surface-variant hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                {{ cookieService.showPreferences() ? 'Ocultar opciones' : 'Personalizar' }}
              </button>
              <button
                type="button"
                (click)="cookieService.acceptNecessaryOnly()"
                class="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-on-surface text-xs font-semibold transition cursor-pointer"
              >
                Solo necesarias
              </button>
              <button
                type="button"
                (click)="cookieService.acceptAll()"
                class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition cursor-pointer"
              >
                Aceptar todas
              </button>
            </div>
          </div>

          <!-- Panel desplegable de personalización de cookies -->
          @if (cookieService.showPreferences()) {
            <div class="pt-4 border-t border-outline-variant/50 space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <!-- Necesarias -->
                <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/40 flex items-start justify-between gap-3">
                  <div>
                    <span class="font-bold text-on-surface block">Cookies Estrictamente Necesarias</span>
                    <span class="text-[11px] text-outline">
                      Esenciales para el carrito de compras, sesión de usuario y seguridad de pagos.
                    </span>
                  </div>
                  <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                    Siempre activas
                  </span>
                </div>

                <!-- Preferencias -->
                <label class="p-3 rounded-xl bg-surface-container border border-outline-variant/40 flex items-start justify-between gap-3 cursor-pointer hover:border-outline-variant transition">
                  <div>
                    <span class="font-bold text-on-surface block">Cookies de Preferencias</span>
                    <span class="text-[11px] text-outline">
                      Guardan tus ajustes visuales, filtros de catálogo y progreso del PC Builder.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    [checked]="preferencesEnabled()"
                    (change)="preferencesEnabled.set($any($event.target).checked)"
                    class="mt-0.5 h-4 w-4 rounded border-outline-variant accent-blue-500 cursor-pointer shrink-0"
                  />
                </label>

                <!-- Analíticas -->
                <label class="p-3 rounded-xl bg-surface-container border border-outline-variant/40 flex items-start justify-between gap-3 cursor-pointer hover:border-outline-variant transition">
                  <div>
                    <span class="font-bold text-on-surface block">Cookies Analíticas</span>
                    <span class="text-[11px] text-outline">
                      Nos ayudan a medir el rendimiento del sitio y mejorar la velocidad de navegación.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    [checked]="analyticsEnabled()"
                    (change)="analyticsEnabled.set($any($event.target).checked)"
                    class="mt-0.5 h-4 w-4 rounded border-outline-variant accent-blue-500 cursor-pointer shrink-0"
                  />
                </label>

                <!-- Marketing -->
                <label class="p-3 rounded-xl bg-surface-container border border-outline-variant/40 flex items-start justify-between gap-3 cursor-pointer hover:border-outline-variant transition">
                  <div>
                    <span class="font-bold text-on-surface block">Cookies de Marketing</span>
                    <span class="text-[11px] text-outline">
                      Permiten mostrarte promociones de hardware y bundles relevantes para ti.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    [checked]="marketingEnabled()"
                    (change)="marketingEnabled.set($any($event.target).checked)"
                    class="mt-0.5 h-4 w-4 rounded border-outline-variant accent-blue-500 cursor-pointer shrink-0"
                  />
                </label>
              </div>

              <div class="flex justify-end pt-1">
                <button
                  type="button"
                  (click)="saveCustom()"
                  class="px-4 py-2 rounded-xl bg-primary hover:bg-white text-surface-container-lowest text-xs font-bold transition cursor-pointer"
                >
                  Guardar mis preferencias
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class CookieBannerComponent {
  readonly cookieService = inject(CookieService);

  readonly preferencesEnabled = signal<boolean>(true);
  readonly analyticsEnabled = signal<boolean>(true);
  readonly marketingEnabled = signal<boolean>(false);

  constructor() {
    effect(() => {
      const current = this.cookieService.consent();
      if (current) {
        this.preferencesEnabled.set(current.preferences);
        this.analyticsEnabled.set(current.analytics);
        this.marketingEnabled.set(current.marketing);
      }
    });
  }

  saveCustom(): void {
    this.cookieService.saveCustomPreferences({
      preferences: this.preferencesEnabled(),
      analytics: this.analyticsEnabled(),
      marketing: this.marketingEnabled()
    });
  }
}
