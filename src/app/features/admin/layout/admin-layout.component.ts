import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { TaxService } from '../../../core/services/tax.service';
import { BannerService } from '../../../core/services/banner.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-surface-container-lowest text-[#e3e2e6] flex flex-col font-sans selection:bg-primary-container selection:text-[#aec7f7]">
      <!-- Top Admin Navigation Bar -->
      <header class="sticky top-0 z-50 h-16 border-b border-outline-variant/40 bg-[#121316]/95 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <!-- Mobile Toggle Button -->
          <button
            (click)="isSidebarOpen.update((v) => !v)"
            class="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-[#e3e2e6] transition"
            aria-label="Abrir panel lateral"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Admin Brand Logo -->
          <div class="flex items-center gap-2">
            <a routerLink="/admin/crm" class="flex items-center gap-2">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-[#aec7f7] to-primary-container text-on-primary-fixed font-black text-base shadow-lg shadow-primary-container/40">
                ⚡
              </div>
              <div class="flex flex-col">
                <span class="font-bold tracking-wider text-sm bg-linear-to-r from-[#aec7f7] via-primary-fixed to-[#f1bd81] bg-clip-text text-transparent">
                  DASFUSION
                </span>
                <span class="text-[10px] uppercase font-bold text-[#aec7f7] tracking-widest -mt-1">ADMIN HUB</span>
              </div>
            </a>
          </div>

          <!-- Role Badge -->
          <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-container/50 border border-[#aec7f7]/30 text-xs text-[#aec7f7]">
            <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="font-medium">Modo Administrador</span>
          </div>

          <!-- Active Tax Badge -->
          <a
            routerLink="/admin/orders"
            class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold transition border"
            [class.bg-emerald-500/10]="!taxService.isSpecialRate()"
            [class.text-emerald-400]="!taxService.isSpecialRate()"
            [class.border-emerald-500/20]="!taxService.isSpecialRate()"
            [class.bg-amber-500/20]="taxService.isSpecialRate()"
            [class.text-amber-300]="taxService.isSpecialRate()"
            [class.border-amber-500/40]="taxService.isSpecialRate()"
            [title]="'Tarifa de IVA activa: ' + taxService.taxReason() + ' (Clic para cambiar)'"
          >
            <span>IVA: {{ taxService.taxPercentage() }}%</span>
            @if (taxService.isSpecialRate()) {
              <span class="text-[9px] uppercase font-extrabold text-amber-300">Especial</span>
            }
          </a>
        </div>

        <!-- Top Right Actions -->
        <div class="flex items-center gap-3">
          <!-- Quick Pos Shortcut -->
          <a
            routerLink="/admin/pos"
            class="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#aec7f7] hover:bg-primary-fixed text-on-primary-fixed text-xs font-bold transition shadow-md hover:scale-[1.02]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Facturador Rápido
          </a>

          <!-- Return to Storefront -->
          <a
            routerLink="/catalog"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-[#e3e2e6] text-xs font-semibold border border-outline-variant/40 transition"
          >
            <svg class="w-4 h-4 text-[#aec7f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span class="hidden sm:inline">Ver Tienda</span>
          </a>

          <!-- Admin User Profile Pill & Role Toggle -->
          <div class="flex items-center gap-2 pl-2 border-l border-outline-variant/50">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-tr from-primary-container to-[#343538] text-xs font-bold text-[#aec7f7] border border-[#aec7f7]/40 shadow">
              {{ authService.currentUser()?.name?.charAt(0)?.toUpperCase() || 'A' }}
            </div>
            <div class="hidden lg:flex flex-col text-left">
              <span class="text-xs font-semibold leading-tight text-[#e3e2e6]">{{ authService.currentUser()?.name || 'Administrador' }}</span>
              <span class="text-[10px] text-[#aec7f7]">Super Admin</span>
            </div>
            <button
              (click)="logout()"
              title="Cerrar sesión"
              class="p-2 text-outline hover:text-error hover:bg-surface-container rounded-lg transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div class="flex flex-1 overflow-hidden relative">
        <!-- Sidebar Navigation -->
        <aside
          [class.translate-x-0]="isSidebarOpen()"
          [class.-translate-x-full]="!isSidebarOpen()"
          class="fixed lg:static inset-y-0 left-0 top-16 z-40 w-64 border-r border-outline-variant/40 bg-[#121316] flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto"
        >
          <div class="space-y-6">
            <!-- Navigation Sections -->
            <div>
              <div class="px-3 mb-2 text-[11px] font-bold tracking-wider text-outline uppercase">
                Módulos Principales
              </div>
              <nav class="space-y-1">
                <!-- 1. CRM Dashboard -->
                <a
                  routerLink="/admin/crm"
                  routerLinkActive="bg-primary-container/60 text-[#aec7f7] border-l-4 border-[#aec7f7] font-semibold"
                  (click)="closeSidebarOnMobile()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container hover:text-[#e3e2e6] transition group"
                >
                  <svg class="w-5 h-5 text-outline group-hover:text-[#aec7f7] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Dashboard CRM</span>
                  <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-primary-container text-[#aec7f7] border border-[#aec7f7]/30">
                    {{ adminService.leads().length }}
                  </span>
                </a>

                <!-- 2. Orders Management -->
                <a
                  routerLink="/admin/orders"
                  routerLinkActive="bg-primary-container/60 text-[#aec7f7] border-l-4 border-[#aec7f7] font-semibold"
                  (click)="closeSidebarOnMobile()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container hover:text-[#e3e2e6] transition group"
                >
                  <svg class="w-5 h-5 text-outline group-hover:text-[#aec7f7] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Manejo de Pedidos</span>
                  <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                    {{ adminService.salesOrders().length }}
                  </span>
                </a>

                <!-- 3. Inventory Management -->
                <a
                  routerLink="/admin/inventory"
                  routerLinkActive="bg-primary-container/60 text-[#aec7f7] border-l-4 border-[#aec7f7] font-semibold"
                  (click)="closeSidebarOnMobile()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container hover:text-[#e3e2e6] transition group"
                >
                  <svg class="w-5 h-5 text-outline group-hover:text-[#aec7f7] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>Inventario & Stock</span>
                  @if (adminService.lowStockVariants().length > 0) {
                    <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {{ adminService.lowStockVariants().length }} alertas
                    </span>
                  }
                </a>

                <!-- 4. Facturador / POS -->
                <a
                  routerLink="/admin/pos"
                  routerLinkActive="bg-primary-container/60 text-[#aec7f7] border-l-4 border-[#aec7f7] font-semibold"
                  (click)="closeSidebarOnMobile()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container hover:text-[#e3e2e6] transition group"
                >
                  <svg class="w-5 h-5 text-outline group-hover:text-[#aec7f7] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Facturador (POS)</span>
                  <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Venta
                  </span>
                </a>

                <!-- 5. Customers Management -->
                <a
                  routerLink="/admin/customers"
                  routerLinkActive="bg-primary-container/60 text-[#aec7f7] border-l-4 border-[#aec7f7] font-semibold"
                  (click)="closeSidebarOnMobile()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container hover:text-[#e3e2e6] transition group"
                >
                  <svg class="w-5 h-5 text-outline group-hover:text-[#aec7f7] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Manejo de Clientes</span>
                </a>

                <!-- 6. Reports & Analytics -->
                <a
                  routerLink="/admin/reports"
                  routerLinkActive="bg-primary-container/60 text-[#aec7f7] border-l-4 border-[#aec7f7] font-semibold"
                  (click)="closeSidebarOnMobile()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container hover:text-[#e3e2e6] transition group"
                >
                  <svg class="w-5 h-5 text-outline group-hover:text-[#aec7f7] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  <span>Informes & Tablas</span>
                </a>

                <!-- 7. Promotional Banners Carousel & New Products Strip -->
                <a
                  routerLink="/admin/banners"
                  routerLinkActive="bg-primary-container/60 text-[#aec7f7] border-l-4 border-[#aec7f7] font-semibold"
                  (click)="closeSidebarOnMobile()"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container hover:text-[#e3e2e6] transition group"
                >
                  <svg class="w-5 h-5 text-outline group-hover:text-[#aec7f7] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Banners & Nuevos</span>
                  <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                    {{ bannerService.banners().length }}
                  </span>
                </a>
              </nav>
            </div>

            <!-- Quick Sync State -->
            <div class="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                <span>Estado Supabase</span>
                <span class="flex items-center gap-1 text-[10px] text-emerald-400">
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Conectado
                </span>
              </div>
              <button
                (click)="adminService.loadAllData()"
                class="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-surface-container-high hover:bg-[#343538] text-[11px] text-[#aec7f7] font-medium transition cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" [class.animate-spin]="adminService.isLoading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sincronizar Datos
              </button>
            </div>
          </div>

          <!-- Bottom Footer Info -->
          <div class="pt-4 border-t border-outline-variant/30 text-center">
            <p class="text-[11px] text-outline">DASFusion Core v2.4 • Admin Portal</p>
          </div>
        </aside>

        <!-- Backdrop for mobile drawer -->
        @if (isSidebarOpen()) {
          <div
            (click)="isSidebarOpen.set(false)"
            class="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          ></div>
        }

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto bg-surface-container-lowest p-4 sm:p-6 lg:p-8">
          <div class="mx-auto max-w-7xl">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);
  readonly adminService = inject(AdminService);
  readonly taxService = inject(TaxService);
  readonly bannerService = inject(BannerService);
  private readonly router = inject(Router);

  readonly isSidebarOpen = signal<boolean>(false);

  closeSidebarOnMobile(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.isSidebarOpen.set(false);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
