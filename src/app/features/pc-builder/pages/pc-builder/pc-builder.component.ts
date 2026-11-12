import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PcBuilderService } from '../../services/pc-builder.service';
import { BuilderStepperComponent } from '../../components/builder-stepper/builder-stepper.component';
import { BuilderSummaryComponent } from '../../components/builder-summary/builder-summary.component';
import { Product } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { SeoService } from '../../../../core/services/seo.service';
import { TaxService } from '../../../../core/services/tax.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import {
  checkProductCompatibility,
  getStepSmartFilterRule
} from '../../../../core/utils/pc-hardware.util';

@Component({
  selector: 'app-pc-builder',
  standalone: true,
  imports: [CommonModule, BuilderStepperComponent, BuilderSummaryComponent, CurrencyFormatPipe, ButtonComponent],
  templateUrl: './pc-builder.component.html'
})
export class PcBuilderComponent {
  readonly pcBuilderService = inject(PcBuilderService);
  readonly taxService = inject(TaxService);
  private readonly productService = inject(ProductService);
  private readonly seoService = inject(SeoService);

  readonly filterCompatibleOnly = signal<boolean>(true);

  constructor() {
    this.seoService.setPcBuilderSeo();
  }

  readonly activeFilterRule = computed(() => {
    const step = this.pcBuilderService.currentStep();
    if (!step) return null;
    return getStepSmartFilterRule(step.id, this.pcBuilderService.selectedComponents());
  });

  readonly rawCategoryProducts = computed(() => {
    const step = this.pcBuilderService.currentStep();
    if (!step) return [];

    const products = this.productService.products();

    // Map builder step ID to matching category names or keywords
    const stepKeywordMap: Record<string, string[]> = {
      cpu: ['cpu', 'procesador', 'procesadores', 'processor', 'ryzen', 'intel core', 'core ultra'],
      motherboard: [
        'tarjeta madre',
        'tarjetas madre',
        'placa madre',
        'placas madre',
        'placa base',
        'placas base',
        'madre',
        'motherboard',
        'motherboards',
        'mainboard',
        'mainboards',
        'board',
        'mobo'
      ],
      ram: ['ram', 'memoria ram', 'memorias ram', 'memoria', 'memorias', 'ddr4', 'ddr5'],
      gpu: [
        'gpu',
        'tarjetas de video',
        'tarjeta de video',
        'tarjeta gráfica',
        'tarjetas gráficas',
        'tarjeta grafica',
        'tarjetas graficas',
        'gráfica',
        'grafica',
        'geforce',
        'radeon',
        'rtx',
        'video'
      ],
      storage: [
        'storage',
        'almacenamiento',
        'disco duro',
        'discos duros',
        'discos de estado sólido',
        'disco de estado sólido',
        'ssd',
        'm.2',
        'nvme',
        'disco',
        'discos'
      ],
      power_supply: ['power_supply', 'fuente', 'fuentes', 'fuente de poder', 'fuentes de poder', 'psu'],
      case: ['case', 'cases', 'cajas / gabinetes', 'caja', 'cajas', 'gabinete', 'gabinetes', 'chasis', 'torre', 'torres'],
      cooler: ['cooler', 'coolers', 'disipador', 'disipadores', 'refrigeración', 'refrigeracion', 'cooling']
    };

    const keywords = stepKeywordMap[step.id] || [step.id.toLowerCase()];

    return products.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const subCat = (p.subCategory || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const tags = (p.tags || []).join(' ').toLowerCase();

      return keywords.some((kw) =>
        cat.includes(kw) || subCat.includes(kw) || tags.includes(kw) || name.includes(kw)
      );
    });
  });

  readonly currentCategoryProducts = computed(() => {
    const raw = this.rawCategoryProducts();
    const step = this.pcBuilderService.currentStep();
    if (!step) return [];

    const selected = this.pcBuilderService.selectedComponents();
    const filterOnly = this.filterCompatibleOnly();

    if (!filterOnly) {
      // Return all, with compatible ones first
      return [...raw].sort((a, b) => {
        const compA = checkProductCompatibility(step.id, a, selected).isCompatible ? 1 : 0;
        const compB = checkProductCompatibility(step.id, b, selected).isCompatible ? 1 : 0;
        return compB - compA;
      });
    }

    return raw.filter((p) => checkProductCompatibility(step.id, p, selected).isCompatible);
  });

  getProductCompatibility(product: Product): { isCompatible: boolean; reason?: string; badgeText?: string } {
    const step = this.pcBuilderService.currentStep();
    if (!step) return { isCompatible: true };
    return checkProductCompatibility(step.id, product, this.pcBuilderService.selectedComponents());
  }

  toggleFilterCompatibleOnly(): void {
    this.filterCompatibleOnly.update((v) => !v);
  }

  selectProduct(product: Product): void {
    const step = this.pcBuilderService.currentStep();
    if (step) {
      this.pcBuilderService.selectComponent(step.id, product);
    }
  }

  scrollToSummary(): void {
    const summaryEl = document.querySelector('app-builder-summary');
    if (summaryEl) {
      summaryEl.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
