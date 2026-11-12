import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalItems() > 0) {
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-outline-variant/40 bg-surface-container-low/60 text-xs">
        <div class="text-outline">
          Mostrando <strong class="text-on-surface font-mono">{{ showingStart() }}–{{ showingEnd() }}</strong> de
          <strong class="text-primary font-mono">{{ totalItems() }}</strong> registros
          <span class="text-[11px] text-outline/80 ml-1">(Máx. {{ pageSize() }} por página)</span>
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              type="button"
              (click)="goToPage(safeCurrentPage() - 1)"
              [disabled]="safeCurrentPage() <= 1"
              class="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs font-bold text-on-surface hover:border-primary hover:text-white disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              ← Anterior
            </button>

            @for (page of visiblePages(); track page) {
              <button
                type="button"
                (click)="goToPage(page)"
                class="min-w-8 h-8 px-2 rounded-lg border text-xs font-bold font-mono transition cursor-pointer"
                [class.bg-primary]="safeCurrentPage() === page"
                [class.text-on-primary]="safeCurrentPage() === page"
                [class.border-primary]="safeCurrentPage() === page"
                [class.bg-surface]="safeCurrentPage() !== page"
                [class.text-on-surface]="safeCurrentPage() !== page"
                [class.border-outline-variant]="safeCurrentPage() !== page"
                [class.hover:border-primary]="safeCurrentPage() !== page"
              >
                {{ page }}
              </button>
            }

            <button
              type="button"
              (click)="goToPage(safeCurrentPage() + 1)"
              [disabled]="safeCurrentPage() >= totalPages()"
              class="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs font-bold text-on-surface hover:border-primary hover:text-white disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              Siguiente →
            </button>
          </div>
        }
      </div>
    }
  `
})
export class AdminPaginationComponent {
  readonly currentPage = input<number>(1);
  readonly totalItems = input<number>(0);
  readonly pageSize = input<number>(10);

  readonly pageChange = output<number>();

  readonly totalPages = computed(() => {
    const size = Math.max(1, this.pageSize());
    return Math.max(1, Math.ceil(this.totalItems() / size));
  });

  readonly safeCurrentPage = computed(() => {
    return Math.max(1, Math.min(this.currentPage(), this.totalPages()));
  });

  readonly showingStart = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.safeCurrentPage() - 1) * this.pageSize() + 1;
  });

  readonly showingEnd = computed(() => {
    if (this.totalItems() === 0) return 0;
    return Math.min(this.safeCurrentPage() * this.pageSize(), this.totalItems());
  });

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.safeCurrentPage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const start = Math.max(1, Math.min(current - 3, total - 6));
    return Array.from({ length: 7 }, (_, i) => start + i);
  });

  goToPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    if (clamped !== this.currentPage()) {
      this.pageChange.emit(clamped);
    }
  }
}

