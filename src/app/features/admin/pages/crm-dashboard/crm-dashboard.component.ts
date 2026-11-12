import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { DbCrmLead, LeadStage, TicketStatus, TicketPriority } from '../../../../core/models/supabase.model';
import { AdminPaginationComponent } from '../../../../shared/components/admin-pagination/admin-pagination.component';

@Component({
  selector: 'app-crm-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminPaginationComponent],
  template: `
    <div class="space-y-6">
      <!-- Header with Title & Action Button -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-[#e3e2e6] tracking-tight">Dashboard CRM & Pipeline</h1>
          <p class="text-xs sm:text-sm text-outline">Gestión de prospectos, oportunidades de venta y tickets de soporte al cliente</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            (click)="openLeadModal()"
            class="btn-primary py-2! px-4! text-xs flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Prospecto / Lead
          </button>
          <button
            (click)="openInteractionModal()"
            class="btn-secondary py-2! px-3! text-xs flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Registrar Interacción
          </button>
        </div>
      </div>

      <!-- KPI Metrics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- KPI 1: Pipeline Total -->
        <div class="das-card p-4 sm:p-5 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-outline">Valor Pipeline</span>
            <div class="p-2 rounded-lg bg-primary-container text-[#aec7f7]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-bold text-[#e3e2e6]">{{ adminService.totalPipelineValue() | currency:'USD':'symbol':'1.2-2' }}</div>
            <p class="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <span>↑ Oportunidades estimadas</span>
            </p>
          </div>
        </div>

        <!-- KPI 2: Total Leads -->
        <div class="das-card p-4 sm:p-5 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-outline">Total Leads</span>
            <div class="p-2 rounded-lg bg-surface-container-high text-[#aec7f7]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-bold text-[#e3e2e6]">{{ adminService.leads().length }}</div>
            <p class="text-xs text-on-surface-variant mt-1">{{ adminService.wonLeadsCount() }} ventas cerradas exitosamente</p>
          </div>
        </div>

        <!-- KPI 3: Tasa de Cierre -->
        <div class="das-card p-4 sm:p-5 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-outline">Tasa de Conversión</span>
            <div class="p-2 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-bold text-emerald-400">
              {{ adminService.leads().length ? ((adminService.wonLeadsCount() / adminService.leads().length) * 100 | number:'1.0-1') : 0 }}%
            </div>
            <p class="text-xs text-outline mt-1">Ratio cerrados ganados</p>
          </div>
        </div>

        <!-- KPI 4: Tickets de Soporte -->
        <div class="das-card p-4 sm:p-5 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-outline">Tickets Activos</span>
            <div class="p-2 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-bold text-[#e3e2e6]">{{ adminService.activeTicketsCount() }}</div>
            <p class="text-xs text-amber-400 mt-1">Casos en progreso o abiertos</p>
          </div>
        </div>
      </div>

      <!-- Pipeline Kanban Board -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-[#e3e2e6] flex items-center gap-2">
            <span>Embudo de Ventas (Pipeline Kanban)</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-surface-container text-outline border border-outline-variant/30">5 Etapas</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <!-- Column: Prospect -->
          <div class="bg-[#16171a] rounded-xl p-3 border border-outline-variant/40 flex flex-col min-h-95">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/30">
              <span class="text-xs font-bold uppercase tracking-wider text-[#aec7f7]">1. Prospectos</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-primary-container text-[#aec7f7]">
                {{ getLeadsByStage('prospect').length }}
              </span>
            </div>
            <div class="space-y-2.5 flex-1 overflow-y-auto">
              @for (lead of getLeadsByStage('prospect'); track lead.id) {
                <div class="p-3 rounded-lg bg-surface-container border border-outline-variant/40 hover:border-[#aec7f7]/40 transition space-y-2">
                  <div class="font-semibold text-xs text-[#e3e2e6]">{{ lead.full_name }}</div>
                  <div class="text-[11px] text-outline">{{ lead.email }}</div>
                  @if (lead.estimated_budget) {
                    <div class="text-xs font-bold text-emerald-400">{{ lead.estimated_budget | currency:'USD':'symbol':'1.0-0' }}</div>
                  }
                  @if (lead.notes) {
                    <p class="text-[11px] text-on-surface-variant line-clamp-2 bg-[#121316] p-1.5 rounded">{{ lead.notes }}</p>
                  }
                  <div class="flex items-center justify-between pt-1">
                    <button
                      (click)="moveLead(lead.id, 'qualified')"
                      class="text-[10px] text-[#aec7f7] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Avanzar a Calificado →
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="text-center py-8 text-xs text-outline">Sin prospectos</div>
              }
            </div>
          </div>

          <!-- Column: Qualified -->
          <div class="bg-[#16171a] rounded-xl p-3 border border-outline-variant/40 flex flex-col min-h-95">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/30">
              <span class="text-xs font-bold uppercase tracking-wider text-sky-300">2. Calificados</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-sky-950 text-sky-300">
                {{ getLeadsByStage('qualified').length }}
              </span>
            </div>
            <div class="space-y-2.5 flex-1 overflow-y-auto">
              @for (lead of getLeadsByStage('qualified'); track lead.id) {
                <div class="p-3 rounded-lg bg-surface-container border border-outline-variant/40 hover:border-sky-400/40 transition space-y-2">
                  <div class="font-semibold text-xs text-[#e3e2e6]">{{ lead.full_name }}</div>
                  <div class="text-[11px] text-outline">{{ lead.email }}</div>
                  @if (lead.estimated_budget) {
                    <div class="text-xs font-bold text-emerald-400">{{ lead.estimated_budget | currency:'USD':'symbol':'1.0-0' }}</div>
                  }
                  <div class="flex items-center justify-between pt-1">
                    <button
                      (click)="moveLead(lead.id, 'quote_sent')"
                      class="text-[10px] text-sky-400 hover:underline cursor-pointer"
                    >
                      Enviar Cotización →
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="text-center py-8 text-xs text-outline">Sin calificados</div>
              }
            </div>
          </div>

          <!-- Column: Quote Sent -->
          <div class="bg-[#16171a] rounded-xl p-3 border border-outline-variant/40 flex flex-col min-h-95">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/30">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-300">3. Cotización Enviada</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-300">
                {{ getLeadsByStage('quote_sent').length }}
              </span>
            </div>
            <div class="space-y-2.5 flex-1 overflow-y-auto">
              @for (lead of getLeadsByStage('quote_sent'); track lead.id) {
                <div class="p-3 rounded-lg bg-surface-container border border-outline-variant/40 hover:border-amber-400/40 transition space-y-2">
                  <div class="font-semibold text-xs text-[#e3e2e6]">{{ lead.full_name }}</div>
                  <div class="text-[11px] text-outline">{{ lead.phone || lead.email }}</div>
                  @if (lead.estimated_budget) {
                    <div class="text-xs font-bold text-amber-300">{{ lead.estimated_budget | currency:'USD':'symbol':'1.0-0' }}</div>
                  }
                  <div class="flex items-center justify-between gap-2 pt-1">
                    <button
                      (click)="moveLead(lead.id, 'closed_won')"
                      class="text-[10px] text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      ✓ Ganada
                    </button>
                    <button
                      (click)="moveLead(lead.id, 'closed_lost')"
                      class="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      ✗ Perdida
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="text-center py-8 text-xs text-outline">Sin cotizaciones</div>
              }
            </div>
          </div>

          <!-- Column: Closed Won -->
          <div class="bg-[#16171a] rounded-xl p-3 border border-emerald-500/20 flex flex-col min-h-95">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/20">
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">4. Ganadas (Won)</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300">
                {{ getLeadsByStage('closed_won').length }}
              </span>
            </div>
            <div class="space-y-2.5 flex-1 overflow-y-auto">
              @for (lead of getLeadsByStage('closed_won'); track lead.id) {
                <div class="p-3 rounded-lg bg-surface-container border border-emerald-500/30 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <div class="font-semibold text-xs text-emerald-200">{{ lead.full_name }}</div>
                    <span class="text-[10px] text-emerald-400 font-bold">✓ CERRADA</span>
                  </div>
                  @if (lead.estimated_budget) {
                    <div class="text-xs font-bold text-emerald-400">{{ lead.estimated_budget | currency:'USD':'symbol':'1.0-0' }}</div>
                  }
                  <div class="text-[11px] text-outline">{{ lead.email }}</div>
                </div>
              } @empty {
                <div class="text-center py-8 text-xs text-outline">Sin ventas ganadas</div>
              }
            </div>
          </div>

          <!-- Column: Closed Lost -->
          <div class="bg-[#16171a] rounded-xl p-3 border border-outline-variant/30 flex flex-col min-h-95">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/20">
              <span class="text-xs font-bold uppercase tracking-wider text-rose-400">5. Perdidas</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300">
                {{ getLeadsByStage('closed_lost').length }}
              </span>
            </div>
            <div class="space-y-2.5 flex-1 overflow-y-auto">
              @for (lead of getLeadsByStage('closed_lost'); track lead.id) {
                <div class="p-3 rounded-lg bg-surface-container border border-rose-500/20 opacity-75 space-y-1">
                  <div class="font-semibold text-xs text-[#e3e2e6]">{{ lead.full_name }}</div>
                  <div class="text-[11px] text-outline">{{ lead.email }}</div>
                  <button
                    (click)="moveLead(lead.id, 'prospect')"
                    class="text-[10px] text-[#aec7f7] hover:underline pt-1 cursor-pointer"
                  >
                    Reabrir Prospecto ↺
                  </button>
                </div>
              } @empty {
                <div class="text-center py-8 text-xs text-outline">Sin pérdidas</div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary Row: Recent Activity & Support Tickets -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- CRM Support Tickets -->
        <div class="das-card p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-[#e3e2e6] flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Tickets de Soporte al Cliente
            </h3>
            <span class="text-xs text-outline">{{ adminService.tickets().length }} en total</span>
          </div>

          <div class="space-y-3">
            @for (ticket of paginatedTickets(); track ticket.id) {
              <div class="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-start justify-between gap-3">
                <div class="space-y-1">
                  <div class="text-xs font-semibold text-[#e3e2e6]">{{ ticket.subject }}</div>
                  <div class="flex items-center gap-2 text-[11px] text-outline">
                    <span>Prioridad: <strong [class.text-rose-400]="ticket.priority === 'high' || ticket.priority === 'urgent'" class="uppercase">{{ ticket.priority }}</strong></span>
                    <span>•</span>
                    <span>{{ ticket.created_at | date:'short' }}</span>
                  </div>
                </div>

                <!-- Ticket Status Dropdown -->
                <select
                  [ngModel]="ticket.status"
                  (ngModelChange)="onTicketStatusChange(ticket.id, $event)"
                  class="bg-surface-container-high border border-outline-variant text-xs rounded-lg px-2.5 py-1 text-[#e3e2e6] focus:outline-none focus:border-[#aec7f7]"
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                </select>
              </div>
            } @empty {
              <p class="text-xs text-outline py-4 text-center">No hay tickets de soporte registrados.</p>
            }
          </div>
          <app-admin-pagination
            [currentPage]="ticketsPage()"
            [totalItems]="adminService.tickets().length"
            [pageSize]="pageSize"
            (pageChange)="ticketsPage.set($event)"
          ></app-admin-pagination>
        </div>

        <!-- Recent CRM Interactions Feed -->
        <div class="das-card p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-[#e3e2e6] flex items-center gap-2">
              <svg class="w-5 h-5 text-[#aec7f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Bitácora de Comunicaciones
            </h3>
            <span class="text-xs text-outline">{{ adminService.interactions().length }} registros</span>
          </div>

          <div class="space-y-3">
            @for (inter of paginatedInteractions(); track inter.id) {
              <div class="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-container text-[#aec7f7] border border-[#aec7f7]/30">
                    {{ inter.channel }}
                  </span>
                  <span class="text-[11px] text-outline">{{ inter.interaction_date | date:'mediumDate' }}</span>
                </div>
                <p class="text-xs text-on-surface-variant">{{ inter.summary }}</p>
              </div>
            } @empty {
              <p class="text-xs text-outline py-4 text-center">Sin interacciones recientes registradas.</p>
            }
          </div>
          <app-admin-pagination
            [currentPage]="interactionsPage()"
            [totalItems]="adminService.interactions().length"
            [pageSize]="pageSize"
            (pageChange)="interactionsPage.set($event)"
          ></app-admin-pagination>
        </div>
      </div>
    </div>

    <!-- Modal: Crear Nuevo Lead -->
    @if (isLeadModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 class="text-base font-bold text-[#e3e2e6]">Registrar Nuevo Lead / Prospecto</h3>
            <button (click)="isLeadModalOpen.set(false)" class="text-outline hover:text-white">✕</button>
          </div>

          <form (ngSubmit)="saveNewLead()" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Nombre Completo / Empresa *</label>
              <input
                type="text"
                [(ngModel)]="newLeadForm.full_name"
                name="full_name"
                required
                class="das-input text-xs"
                placeholder="Ej. Juan Pérez - Estudio Creativo"
              />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Email *</label>
                <input
                  type="email"
                  [(ngModel)]="newLeadForm.email"
                  name="email"
                  required
                  class="das-input text-xs"
                  placeholder="juan@ejemplo.com"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  [(ngModel)]="newLeadForm.phone"
                  name="phone"
                  class="das-input text-xs"
                  placeholder="+57 300..."
                />
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Presupuesto Estimado ($ USD)</label>
                <input
                  type="number"
                  [(ngModel)]="newLeadForm.estimated_budget"
                  name="budget"
                  class="das-input text-xs"
                  placeholder="1500"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Etapa Inicial</label>
                <select [(ngModel)]="newLeadForm.stage" name="stage" class="das-input text-xs">
                  <option value="prospect">1. Prospecto</option>
                  <option value="qualified">2. Calificado</option>
                  <option value="quote_sent">3. Cotización Enviada</option>
                  <option value="closed_won">4. Cerrada Ganada</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Notas / Requisitos de Hardware</label>
              <textarea
                [(ngModel)]="newLeadForm.notes"
                name="notes"
                rows="3"
                class="das-input text-xs"
                placeholder="Componentes de interés, ensamble deseado o cotización requerida..."
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
              <button
                type="button"
                (click)="isLeadModalOpen.set(false)"
                class="btn-secondary py-2! px-4! text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary py-2! px-5! text-xs"
              >
                Guardar Prospecto
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal: Registrar Interacción -->
    @if (isInteractionModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 class="text-base font-bold text-[#e3e2e6]">Registrar Interacción con Cliente</h3>
            <button (click)="isInteractionModalOpen.set(false)" class="text-outline hover:text-white">✕</button>
          </div>

          <form (ngSubmit)="saveInteraction()" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Vincular a Lead / Prospecto (Opcional)</label>
              <select [(ngModel)]="newInterForm.lead_id" name="lead_id" class="das-input text-xs">
                <option [ngValue]="null">-- General (Sin Lead asignado) --</option>
                @for (l of adminService.leads(); track l.id) {
                  <option [value]="l.id">{{ l.full_name }} ({{ l.stage }})</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Canal de Comunicación *</label>
              <select [(ngModel)]="newInterForm.channel" name="channel" class="das-input text-xs">
                <option value="WhatsApp">WhatsApp</option>
                <option value="Llamada Telefónica">Llamada Telefónica</option>
                <option value="Correo Electrónico">Correo Electrónico</option>
                <option value="Reunión Presencial / Mostrador">Reunión Presencial / Mostrador</option>
                <option value="Soporte Web">Soporte Web</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Resumen de la Conversación *</label>
              <textarea
                [(ngModel)]="newInterForm.summary"
                name="summary"
                rows="3"
                required
                class="das-input text-xs"
                placeholder="Detalla lo conversado, acuerdos o próximos pasos acordados con el cliente..."
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
              <button
                type="button"
                (click)="isInteractionModalOpen.set(false)"
                class="btn-secondary py-2! px-4! text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary py-2! px-5! text-xs"
              >
                Guardar Interacción
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class CrmDashboardComponent {
  readonly adminService = inject(AdminService);

  readonly pageSize = 10;
  readonly ticketsPage = signal<number>(1);
  readonly interactionsPage = signal<number>(1);

  readonly paginatedTickets = computed(() => {
    const list = this.adminService.tickets();
    const totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    const safePage = Math.max(1, Math.min(this.ticketsPage(), totalPages));
    const start = (safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  readonly paginatedInteractions = computed(() => {
    const list = this.adminService.interactions();
    const totalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
    const safePage = Math.max(1, Math.min(this.interactionsPage(), totalPages));
    const start = (safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  readonly isLeadModalOpen = signal<boolean>(false);
  readonly isInteractionModalOpen = signal<boolean>(false);

  newLeadForm: Partial<DbCrmLead> = {
    full_name: '',
    email: '',
    phone: '',
    stage: 'prospect',
    estimated_budget: undefined,
    notes: ''
  };

  newInterForm: { lead_id: string | null; channel: string; summary: string } = {
    lead_id: null,
    channel: 'WhatsApp',
    summary: ''
  };

  getLeadsByStage(stage: LeadStage): DbCrmLead[] {
    return this.adminService.leads().filter((l) => l.stage === stage);
  }

  async moveLead(leadId: string, newStage: LeadStage): Promise<void> {
    await this.adminService.updateLeadStage(leadId, newStage);
  }

  async onTicketStatusChange(ticketId: string, status: TicketStatus): Promise<void> {
    await this.adminService.updateTicketStatus(ticketId, status);
  }

  openLeadModal(): void {
    this.newLeadForm = {
      full_name: '',
      email: '',
      phone: '',
      stage: 'prospect',
      estimated_budget: undefined,
      notes: ''
    };
    this.isLeadModalOpen.set(true);
  }

  openInteractionModal(): void {
    this.newInterForm = {
      lead_id: null,
      channel: 'WhatsApp',
      summary: ''
    };
    this.isInteractionModalOpen.set(true);
  }

  async saveNewLead(): Promise<void> {
    if (!this.newLeadForm.full_name || !this.newLeadForm.email) return;
    await this.adminService.createLead(this.newLeadForm);
    this.isLeadModalOpen.set(false);
  }

  async saveInteraction(): Promise<void> {
    if (!this.newInterForm.summary) return;
    await this.adminService.createInteraction({
      lead_id: this.newInterForm.lead_id,
      channel: this.newInterForm.channel,
      summary: this.newInterForm.summary
    });
    this.isInteractionModalOpen.set(false);
  }
}
