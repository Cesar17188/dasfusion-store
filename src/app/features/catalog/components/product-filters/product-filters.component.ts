import { Component, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductFilter } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-filters.component.html'
})
export class ProductFiltersComponent {
  readonly categories = input<string[]>([]);
  readonly brands = input<string[]>([]);
  readonly currentFilter = input<ProductFilter>({});

  readonly filterChanged = output<ProductFilter>();

  selectedCategory = '';
  selectedBrands: string[] = [];
  minPrice: number | null = null;
  maxPrice: number | null = null;
  inStockOnly = false;

  constructor() {
    effect(() => {
      const filter = this.currentFilter();
      const validBrands = this.brands();

      this.selectedCategory = filter.category || '';
      this.minPrice = filter.minPrice ?? null;
      this.maxPrice = filter.maxPrice ?? null;
      this.inStockOnly = filter.inStock ?? false;

      // Keep only selected brands that belong to the available brands list
      if (filter.brand && filter.brand.length > 0) {
        this.selectedBrands = filter.brand.filter((b) => validBrands.includes(b));
      } else {
        this.selectedBrands = this.selectedBrands.filter((b) => validBrands.includes(b));
      }
    });
  }

  onCategorySelect(cat: string): void {
    const nextCategory = this.selectedCategory === cat ? '' : cat;
    this.selectedCategory = nextCategory;

    // Reset selected brands when switching category so brands from the previous category don't block search
    this.selectedBrands = [];

    this.emitChange();
  }

  onBrandToggle(brand: string): void {
    if (this.selectedBrands.includes(brand)) {
      this.selectedBrands = this.selectedBrands.filter((b) => b !== brand);
    } else {
      this.selectedBrands = [...this.selectedBrands, brand];
    }
    this.emitChange();
  }

  onPriceChange(): void {
    this.emitChange();
  }

  onStockToggle(): void {
    this.inStockOnly = !this.inStockOnly;
    this.emitChange();
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.selectedBrands = [];
    this.minPrice = null;
    this.maxPrice = null;
    this.inStockOnly = false;
    this.emitChange();
  }

  private emitChange(): void {
    this.filterChanged.emit({
      category: this.selectedCategory || undefined,
      brand: this.selectedBrands.length ? this.selectedBrands : undefined,
      minPrice: this.minPrice ?? undefined,
      maxPrice: this.maxPrice ?? undefined,
      inStock: this.inStockOnly || undefined
    });
  }
}
