import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PcBuilderService } from '../../services/pc-builder.service';
import { CartService } from '../../../../core/services/cart.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-builder-summary',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe, ButtonComponent],
  template: `
    <div class="bg-[#1e2022]/90 border border-[#44474e]/40 rounded-2xl p-6 backdrop-blur-md space-y-6">
      <div class="flex items-center justify-between pb-3 border-b border-[#44474e]/40">
        <h3 class="text-label-md text-[#e3e2e6]">Tu Configuración</h3>
        <button
          type="button"
          (click)="pcBuilderService.resetBuild()"
          class="text-xs text-[#8e9099] hover:text-[#ffb4ab] transition"
        >
          Reiniciar
        </button>
      </div>

      <!-- Wattage & Compatibility Indicator -->
      <div class="p-4 rounded-xl border border-[#44474e]/50 bg-[#121316] space-y-2.5">
        <div class="flex items-center justify-between text-xs">
          <span class="text-[#c4c6cf]">Consumo Estimado:</span>
          <span class="font-bold text-[#f1bd81] font-mono">{{ pcBuilderService.estimatedWattage() }} W</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-[#c4c6cf]">Compatibilidad:</span>
          @if (pcBuilderService.compatibility().isCompatible) {
            <span class="font-bold text-[#aec7f7] flex items-center gap-1">✓ 100% Compatible</span>
          } @else {
            <span class="font-bold text-[#ffb4ab] flex items-center gap-1">⚠ Conflicto detectado</span>
          }
        </div>
      </div>

      <!-- Selected Components List -->
      <div class="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        @for (step of pcBuilderService.steps(); track step.id) {
          @let item = pcBuilderService.selectedComponents()[step.id];
          <div class="flex items-center justify-between text-xs p-3 rounded-xl bg-[#292a2d] border border-[#44474e]/30">
            <div class="space-y-0.5 truncate pr-2">
              <span class="text-[10px] uppercase font-bold text-[#8e9099] block">{{ step.name }}</span>
              @if (item) {
                <span class="font-semibold text-[#e3e2e6] truncate block">{{ item.product.name }}</span>
              } @else {
                <span class="text-[#8e9099] italic">No seleccionado</span>
              }
            </div>

            @if (item) {
              <div class="flex items-center gap-2">
                <span class="font-bold text-[#aec7f7] font-mono">{{ item.product.price | currencyFormat }}</span>
                <button
                  type="button"
                  (click)="pcBuilderService.removeComponent(step.id)"
                  class="text-[#8e9099] hover:text-[#ffb4ab] p-1 transition"
                >
                  ✕
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Total & Action -->
      <div class="pt-4 border-t border-[#44474e]/40 space-y-4">
        <div class="flex items-baseline justify-between">
          <span class="text-sm font-medium text-[#c4c6cf]">Total Build:</span>
          <span class="text-2xl font-black text-[#e3e2e6] font-mono">{{ pcBuilderService.totalPrice() | currencyFormat }}</span>
        </div>

        <app-button
          variant="primary"
          [fullWidth]="true"
          [disabled]="pcBuilderService.totalPrice() === 0"
          (clicked)="addBuildToCart()"
        >
          Añadir Todo al Carrito
        </app-button>
      </div>
    </div>
  `
})
export class BuilderSummaryComponent {
  readonly pcBuilderService = inject(PcBuilderService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  addBuildToCart(): void {
    const list = Object.values(this.pcBuilderService.selectedComponents()).filter(
      (item): item is NonNullable<typeof item> => item !== null
    );

    list.forEach((item) => {
      this.cartService.addItem(item.product, undefined, undefined, item.quantity);
    });

    this.router.navigateByUrl('/checkout/cart');
  }
}
