import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PcBuilderService } from '../../services/pc-builder.service';
import { CartService } from '../../../../core/services/cart.service';
import { TaxService } from '../../../../core/services/tax.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-builder-summary',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe, ButtonComponent],
  template: `
    <div class="bg-surface-container/90 border border-outline-variant/40 rounded-2xl p-6 backdrop-blur-md space-y-6">
      <div class="flex items-center justify-between pb-3 border-b border-outline-variant/40">
        <h3 class="text-label-md text-on-surface">Tu Configuración</h3>
        <button
          type="button"
          (click)="pcBuilderService.resetBuild()"
          class="text-xs text-outline hover:text-error transition"
        >
          Reiniciar
        </button>
      </div>

      <!-- Wattage & Compatibility Indicator -->
      <div class="p-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest space-y-2.5">
        <div class="flex items-center justify-between text-xs">
          <span class="text-on-surface-variant">Consumo Estimado:</span>
          <span class="font-bold text-tertiary font-mono">{{ pcBuilderService.estimatedWattage() }} W</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-on-surface-variant">Compatibilidad:</span>
          @if (pcBuilderService.compatibility().isCompatible) {
            <span class="font-bold text-primary flex items-center gap-1">✓ 100% Compatible</span>
          } @else {
            <span class="font-bold text-error flex items-center gap-1">⚠ Conflicto detectado</span>
          }
        </div>
        @if (!pcBuilderService.compatibility().isCompatible && pcBuilderService.compatibility().issues.length > 0) {
          <div class="pt-2 border-t border-outline-variant/30 space-y-1">
            @for (issue of pcBuilderService.compatibility().issues; track issue) {
              <p class="text-[10px] text-error leading-tight flex items-start gap-1">
                <span>•</span>
                <span>{{ issue }}</span>
              </p>
            }
          </div>
        }
      </div>

      <!-- Selected Components List -->
      <div class="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        @for (step of pcBuilderService.steps(); track step.id) {
          @let item = pcBuilderService.selectedComponents()[step.id];
          <div class="flex items-center justify-between text-xs p-3 rounded-xl bg-surface-container-high border border-outline-variant/30">
            <div class="space-y-0.5 truncate pr-2">
              <span class="text-[10px] uppercase font-bold text-outline block">{{ step.name }}</span>
              @if (item) {
                <span class="font-semibold text-on-surface truncate block">{{ item.product.name }}</span>
              } @else {
                <span class="text-outline italic">No seleccionado</span>
              }
            </div>

            @if (item) {
              <div class="flex items-center gap-2">
                <span class="font-bold text-primary font-mono">{{ taxService.calculatePriceWithTax(item.product.price) | currencyFormat }}</span>
                <button
                  type="button"
                  (click)="pcBuilderService.removeComponent(step.id)"
                  class="text-outline hover:text-error p-1 transition"
                >
                  ✕
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Total & Action -->
      <div class="pt-4 border-t border-outline-variant/40 space-y-4">
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs text-outline">
            <span>IVA ({{ taxService.taxPercentage() }}%):</span>
            <span class="font-mono">{{ taxService.calculateTax(pcBuilderService.totalPrice()) | currencyFormat }}</span>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-sm font-medium text-on-surface-variant">Total Build:</span>
            <span class="text-2xl font-black text-on-surface font-mono">{{ taxService.calculatePriceWithTax(pcBuilderService.totalPrice()) | currencyFormat }}</span>
          </div>
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
  readonly taxService = inject(TaxService);
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
