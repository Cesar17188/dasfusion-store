import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stock-limit-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-200"
        (click)="onBackdropClick($event)"
      >
        <div
          class="relative w-full max-w-md bg-surface-container-high border border-outline-variant/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
        >
          <!-- Top Icon & Close -->
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-400 shrink-0">
              ⚠️
            </div>
            <button
              type="button"
              (click)="closed.emit()"
              class="text-outline hover:text-white p-2 rounded-xl hover:bg-surface-container transition cursor-pointer"
              aria-label="Cerrar alerta"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Titles -->
          <div class="space-y-1">
            <h3 class="text-lg sm:text-xl font-black text-on-surface tracking-tight">
              Límite de Stock Superado
            </h3>
            <p class="text-xs text-outline leading-relaxed">
              La cantidad que deseas ordenar excede el stock total disponible para entrega inmediata.
            </p>
          </div>

          <!-- Product Details Card -->
          <div class="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-2 text-xs">
            <div class="flex justify-between items-center text-on-surface">
              <span class="text-outline">Producto:</span>
              <span class="font-bold text-right max-w-52.5 truncate">{{ productName() }}</span>
            </div>
            @if (variantName()) {
              <div class="flex justify-between items-center text-on-surface">
                <span class="text-outline">Variante:</span>
                <span class="font-semibold text-primary">{{ variantName() }}</span>
              </div>
            }
            <div class="flex justify-between items-center pt-2 border-t border-outline-variant/30">
              <span class="text-outline">Stock disponible:</span>
              <span class="font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-md">
                {{ maxStock() }} {{ maxStock() === 1 ? 'unidad' : 'unidades' }}
              </span>
            </div>
          </div>

          <!-- WhatsApp Message Explanation -->
          <div class="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
            <div class="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <span class="text-base">💬</span>
              <span>¿Necesitas más existencias?</span>
            </div>
            <p class="text-[11px] text-emerald-200/90 leading-relaxed">
              Puedes comunicarte directamente con nuestro asesor vía WhatsApp para verificar existencias adicionales en bodega o realizar una reserva con el vendedor.
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-2.5 pt-1">
            <a
              [href]="whatsappUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Consultar por WhatsApp</span>
            </a>
            <button
              type="button"
              (click)="closed.emit()"
              class="py-3 px-4 rounded-xl bg-surface-container border border-outline-variant/60 hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition cursor-pointer text-center"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class StockLimitDialogComponent {
  readonly isOpen = input<boolean>(false);
  readonly productName = input<string>('');
  readonly variantName = input<string>('');
  readonly maxStock = input<number>(0);
  readonly requestedQuantity = input<number>(1);
  readonly whatsappPhone = input<string>(''); // e.g. '573001234567' or empty
  readonly closed = output<void>();

  readonly whatsappUrl = computed(() => {
    const pName = this.productName() || 'este producto';
    const vName = this.variantName() ? ` (${this.variantName()})` : '';
    const stock = this.maxStock();
    const qty = this.requestedQuantity();
    const phone = this.whatsappPhone().replace(/[^0-9]/g, '');

    const text = `¡Hola! Me comunico desde DasFusion Store. Estoy interesado en el producto "${pName}${vName}". Deseo ordenar ${qty} unidades, pero el sistema indica ${stock} unidades disponibles. ¿Podrían confirmarme si cuentan con existencias adicionales en bodega o con el vendedor?`;

    const encoded = encodeURIComponent(text);
    return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  });

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}
