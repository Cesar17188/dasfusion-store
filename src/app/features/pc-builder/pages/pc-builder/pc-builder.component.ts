import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PcBuilderService } from '../../services/pc-builder.service';
import { BuilderStepperComponent } from '../../components/builder-stepper/builder-stepper.component';
import { BuilderSummaryComponent } from '../../components/builder-summary/builder-summary.component';
import { Product } from '../../../../core/models/product.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

// Hardware component options catalog for builder
const BUILDER_CATALOG: Record<string, Product[]> = {
  cpu: [
    {
      id: 'cpu_1',
      name: 'AMD Ryzen 7 7800X3D (8C/16T, 5.0GHz Max Boost, AM5)',
      slug: 'amd-ryzen-7-7800x3d',
      brand: 'AMD',
      category: 'cpu',
      description: 'El procesador gaming definitivo.',
      price: 389.00,
      images: ['https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=400&q=80'],
      stock: 15,
      rating: 5.0,
      reviewCount: 94,
      specifications: [{ category: 'Specs', specs: { 'Socket': 'AM5', 'TDP': '120W' } }],
      tags: ['CPU']
    },
    {
      id: 'cpu_2',
      name: 'Intel Core i7-14700K (20C/28T, 5.6GHz Max, LGA1700)',
      slug: 'intel-core-i7-14700k',
      brand: 'Intel',
      category: 'cpu',
      description: 'Gran rendimiento en productividad y videojuegos.',
      price: 399.99,
      images: ['https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=400&q=80'],
      stock: 10,
      rating: 4.8,
      reviewCount: 40,
      specifications: [{ category: 'Specs', specs: { 'Socket': 'LGA1700', 'TDP': '125W' } }],
      tags: ['CPU']
    }
  ],
  motherboard: [
    {
      id: 'mobo_1',
      name: 'ASUS ROG Strix X670E-E Gaming WiFi (AM5, DDR5, PCIe 5.0)',
      slug: 'asus-rog-strix-x670e-e',
      brand: 'ASUS',
      category: 'motherboard',
      description: 'Placa base de gama alta con VRM robusto.',
      price: 459.99,
      images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80'],
      stock: 6,
      rating: 4.9,
      reviewCount: 22,
      specifications: [{ category: 'Specs', specs: { 'Socket': 'AM5', 'Form Factor': 'ATX' } }],
      tags: ['Motherboard']
    }
  ],
  ram: [
    {
      id: 'ram_1',
      name: 'Corsair Dominator Titanium RGB 32GB (2x16GB) 6000MHz CL30 DDR5',
      slug: 'corsair-dominator-titanium-32gb',
      brand: 'Corsair',
      category: 'ram',
      description: 'Lujo, estética premium e increíble rendimiento.',
      price: 169.99,
      images: ['https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=400&q=80'],
      stock: 20,
      rating: 4.9,
      reviewCount: 31,
      specifications: [{ category: 'Specs', specs: { 'Speed': '6000MHz', 'Latency': 'CL30' } }],
      tags: ['RAM']
    }
  ],
  gpu: [
    {
      id: 'gpu_1',
      name: 'NVIDIA GeForce RTX 4080 Super 16GB GDDR6X',
      slug: 'nvidia-geforce-rtx-4080-super',
      brand: 'NVIDIA',
      category: 'gpu',
      description: 'Juegos en 4K Ultra con Ray Tracing al máximo.',
      price: 999.99,
      images: ['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=400&q=80'],
      stock: 12,
      rating: 4.9,
      reviewCount: 42,
      specifications: [{ category: 'Specs', specs: { 'VRAM': '16GB', 'TDP': '320W' } }],
      tags: ['GPU']
    }
  ],
  storage: [
    {
      id: 'storage_1',
      name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
      slug: 'samsung-990-pro-2tb',
      brand: 'Samsung',
      category: 'storage',
      description: 'Velocidad de lectura de hasta 7450 MB/s.',
      price: 179.99,
      images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=400&q=80'],
      stock: 30,
      rating: 4.9,
      reviewCount: 112,
      specifications: [{ category: 'Specs', specs: { 'Interface': 'PCIe Gen 4', 'Capacity': '2TB' } }],
      tags: ['Storage']
    }
  ],
  power_supply: [
    {
      id: 'psu_1',
      name: 'Corsair RM850x 850W 80+ Gold Modular Power Supply',
      slug: 'corsair-rm850x-850w',
      brand: 'Corsair',
      category: 'power_supply',
      description: 'Eficiencia Gold y condensadores 100% japoneses.',
      price: 139.99,
      images: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=400&q=80'],
      stock: 18,
      rating: 4.9,
      reviewCount: 65,
      specifications: [{ category: 'Specs', specs: { 'Wattage': '850W', 'Efficiency': '80 Plus Gold' } }],
      tags: ['PSU']
    }
  ],
  case: [
    {
      id: 'case_1',
      name: 'Lian Li O11 Dynamic EVO RGB - Black Glass Case',
      slug: 'lian-li-o11-dynamic-evo',
      brand: 'Lian Li',
      category: 'case',
      description: 'El chasis más popular entre entusiastas.',
      price: 169.99,
      images: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=400&q=80'],
      stock: 14,
      rating: 4.9,
      reviewCount: 78,
      specifications: [{ category: 'Specs', specs: { 'Type': 'Mid Tower' } }],
      tags: ['Case']
    }
  ],
  cooler: [
    {
      id: 'cooler_1',
      name: 'NZXT Kraken Elite 360 RGB Liquid Cooler',
      slug: 'nzxt-kraken-elite-360-rgb',
      brand: 'NZXT',
      category: 'cooler',
      description: 'Refrigeración líquida con pantalla LCD personalizable de 2.36".',
      price: 279.99,
      images: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=400&q=80'],
      stock: 9,
      rating: 4.8,
      reviewCount: 30,
      specifications: [{ category: 'Specs', specs: { 'Radiator': '360mm' } }],
      tags: ['Cooler']
    }
  ]
};

@Component({
  selector: 'app-pc-builder',
  standalone: true,
  imports: [CommonModule, BuilderStepperComponent, BuilderSummaryComponent, CurrencyFormatPipe, ButtonComponent],
  templateUrl: './pc-builder.component.html'
})
export class PcBuilderComponent {
  readonly pcBuilderService = inject(PcBuilderService);

  readonly currentCategoryProducts = computed(() => {
    const step = this.pcBuilderService.currentStep();
    if (!step) return [];
    return BUILDER_CATALOG[step.id] || [];
  });

  selectProduct(product: Product): void {
    const step = this.pcBuilderService.currentStep();
    if (step) {
      this.pcBuilderService.selectComponent(step.id, product);
    }
  }
}
