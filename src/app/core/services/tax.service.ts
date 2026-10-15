import { Injectable, signal, computed } from '@angular/core';

export interface TaxPreset {
  rate: number;
  label: string;
  badge: string;
  description: string;
}

export const TAX_PRESETS: TaxPreset[] = [
  {
    rate: 0.15,
    label: '15% - Tarifa Estándar',
    badge: '15%',
    description: 'Tarifa general de IVA (SRI Ecuador)'
  },
  {
    rate: 0.00,
    label: '0% - Exonerado / Días Sin IVA',
    badge: '0%',
    description: 'Jornadas de compra sin IVA y productos exentos'
  }
];

@Injectable({
  providedIn: 'root'
})
export class TaxService {
  private readonly STORAGE_RATE_KEY = 'das_tax_rate';
  private readonly STORAGE_REASON_KEY = 'das_tax_reason';

  readonly taxRate = signal<number>(0.15);
  readonly taxReason = signal<string>('Tarifa Estándar (15%)');

  readonly taxPercentage = computed<number>(() => {
    return Math.round(this.taxRate() * 100);
  });

  readonly isSpecialRate = computed<boolean>(() => {
    return this.taxRate() !== 0.15;
  });

  readonly presets = TAX_PRESETS;

  constructor() {
    this.loadPersistedTaxConfig();
  }

  private loadPersistedTaxConfig(): void {
    if (typeof window !== 'undefined') {
      const savedRate = localStorage.getItem(this.STORAGE_RATE_KEY);
      const savedReason = localStorage.getItem(this.STORAGE_REASON_KEY);

      if (savedRate !== null) {
        const parsed = parseFloat(savedRate);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          if (parsed === 0.08) {
            this.taxRate.set(0.15);
            this.taxReason.set('Tarifa Estándar (15%)');
            localStorage.setItem(this.STORAGE_RATE_KEY, '0.15');
            localStorage.setItem(this.STORAGE_REASON_KEY, 'Tarifa Estándar (15%)');
            return;
          }
          this.taxRate.set(parsed);
        }
      }
      if (savedReason) {
        this.taxReason.set(savedReason);
      }
    }
  }

  setTaxRate(rate: number, reason?: string): void {
    const clampedRate = Math.max(0, Math.min(1, Math.round(rate * 100) / 100));
    this.taxRate.set(clampedRate);

    const defaultReason = clampedRate === 0.15
      ? 'Tarifa Estándar (15%)'
      : clampedRate === 0
      ? 'Día Sin IVA / Exonerado (0%)'
      : `Tarifa Personalizada (${Math.round(clampedRate * 100)}%)`;

    const finalReason = reason?.trim() || defaultReason;
    this.taxReason.set(finalReason);

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_RATE_KEY, clampedRate.toString());
      localStorage.setItem(this.STORAGE_REASON_KEY, finalReason);
    }
  }

  calculateTax(subtotal: number): number {
    return Math.round(subtotal * this.taxRate() * 100) / 100;
  }

  calculatePriceWithTax(basePrice: number): number {
    return Math.round(basePrice * (1 + this.taxRate()) * 100) / 100;
  }
}
