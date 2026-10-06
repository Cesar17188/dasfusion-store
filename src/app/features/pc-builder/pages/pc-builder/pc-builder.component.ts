import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PcBuilderService } from '../../services/pc-builder.service';
import { BuilderStepperComponent } from '../../components/builder-stepper/builder-stepper.component';
import { BuilderSummaryComponent } from '../../components/builder-summary/builder-summary.component';
import { Product } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-pc-builder',
  standalone: true,
  imports: [CommonModule, BuilderStepperComponent, BuilderSummaryComponent, CurrencyFormatPipe, ButtonComponent],
  templateUrl: './pc-builder.component.html'
})
export class PcBuilderComponent {
  readonly pcBuilderService = inject(PcBuilderService);
  private readonly productService = inject(ProductService);

  readonly currentCategoryProducts = computed(() => {
    const step = this.pcBuilderService.currentStep();
    if (!step) return [];

    const products = this.productService.products();

    // Map builder step ID to matching category names or keywords
    const stepKeywordMap: Record<string, string[]> = {
      cpu: ['cpu', 'procesador', 'processor', 'ryzen', 'intel core'],
      motherboard: ['motherboard', 'placa base', 'tarjeta madre', 'placa madre', 'board'],
      ram: ['ram', 'memoria', 'ddr4', 'ddr5'],
      gpu: ['gpu', 'tarjeta gráfica', 'tarjeta grafica', 'gráfica', 'geforce', 'radeon', 'rtx', 'video'],
      storage: ['storage', 'almacenamiento', 'ssd', 'm.2', 'nvme', 'disco'],
      power_supply: ['power_supply', 'fuente', 'fuente de poder', 'psu'],
      case: ['case', 'gabinete', 'chasis', 'torre'],
      cooler: ['cooler', 'disipador', 'refrigeración', 'refrigeracion', 'cooling']
    };

    const keywords = stepKeywordMap[step.id] || [step.id.toLowerCase()];

    return products.filter((p) => {
      const cat = p.category.toLowerCase();
      const name = p.name.toLowerCase();
      const tags = (p.tags || []).join(' ').toLowerCase();

      return keywords.some((kw) => cat.includes(kw) || name.includes(kw) || tags.includes(kw));
    });
  });

  selectProduct(product: Product): void {
    const step = this.pcBuilderService.currentStep();
    if (step) {
      this.pcBuilderService.selectComponent(step.id, product);
    }
  }
}
