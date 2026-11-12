import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

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
  private readonly supabase = inject(SupabaseService);
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
    this.listenToStorageEvents();
    this.syncTaxConfigFromDatabase();
  }

  private listenToStorageEvents(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === this.STORAGE_RATE_KEY && event.newValue !== null) {
        const parsed = parseFloat(event.newValue);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.taxRate.set(parsed);
        }
      }
      if (event.key === this.STORAGE_REASON_KEY && event.newValue) {
        this.taxReason.set(event.newValue);
      }
    });
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

  /**
   * Sincroniza la tarifa de IVA configurada por el Administrador desde Supabase
   * para que se refleje en todos los dispositivos y navegadores de la tienda.
   */
  async syncTaxConfigFromDatabase(): Promise<void> {
    try {
      const { data, error } = await (this.supabase.publicFrom('product_variants') as any)
        .select('id, attributes, created_at')
        .limit(50);

      if (!error && Array.isArray(data)) {
        // Buscar la configuración global de IVA más reciente guardada en attributes
        let latestUpdatedAt = 0;
        let foundRate: number | null = null;
        let foundReason: string | null = null;

        for (const row of data) {
          const attrs = row?.attributes;
          if (attrs && typeof attrs['store_tax_rate'] === 'number') {
            const ts = typeof attrs['store_tax_updated_at'] === 'number' ? attrs['store_tax_updated_at'] : 1;
            if (ts >= latestUpdatedAt) {
              latestUpdatedAt = ts;
              foundRate = attrs['store_tax_rate'];
              foundReason = typeof attrs['store_tax_reason'] === 'string' ? attrs['store_tax_reason'] : null;
            }
          }
        }

        if (foundRate !== null && foundRate >= 0 && foundRate <= 1) {
          const clamped = Math.max(0, Math.min(1, Math.round(foundRate * 100) / 100));
          const reason =
            foundReason ||
            (clamped === 0.15
              ? 'Tarifa Estándar (15%)'
              : clamped === 0
              ? 'Día Sin IVA / Exonerado (0%)'
              : `Tarifa Personalizada (${Math.round(clamped * 100)}%)`);

          this.taxRate.set(clamped);
          this.taxReason.set(reason);

          if (typeof window !== 'undefined') {
            localStorage.setItem(this.STORAGE_RATE_KEY, clamped.toString());
            localStorage.setItem(this.STORAGE_REASON_KEY, reason);
          }
        }
      }
    } catch {}
  }

  async setTaxRate(rate: number, reason?: string): Promise<void> {
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

    // Persistir globalmente en Supabase para que todos los visitantes de la tienda vean la nueva tarifa
    try {
      const { data } = await (this.supabase.from('product_variants') as any)
        .select('id, attributes')
        .limit(10);

      if (Array.isArray(data) && data.length > 0) {
        const updatedAt = Date.now();
        await Promise.allSettled(
          data.map((row: any) =>
            (this.supabase.from('product_variants') as any)
              .update({
                attributes: {
                  ...(row.attributes || {}),
                  store_tax_rate: clampedRate,
                  store_tax_reason: finalReason,
                  store_tax_updated_at: updatedAt
                }
              })
              .eq('id', row.id)
          )
        );
      }
    } catch {}
  }

  calculateTax(subtotal: number): number {
    return Math.round(subtotal * this.taxRate() * 100) / 100;
  }

  calculatePriceWithTax(basePrice: number): number {
    return Math.round(basePrice * (1 + this.taxRate()) * 100) / 100;
  }
}
