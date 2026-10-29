import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductFilter } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TaxService } from '../../../../core/services/tax.service';
import { SeoService } from '../../../../core/services/seo.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent, ProductFiltersComponent],
  templateUrl: './catalog-list.component.html'
})
export class CatalogListComponent implements OnInit {
  readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);
  readonly taxService = inject(TaxService);
  readonly seoService = inject(SeoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly currentFilter = signal<ProductFilter>({ sortBy: 'featured' });
  protected readonly searchQuery = signal<string>('');
  protected readonly isMobileFiltersOpen = signal<boolean>(false);
  protected readonly showAdminNotice = signal<boolean>(false);

  constructor() {
    this.route.queryParams.subscribe((params) => {
      if (params['accessDenied'] === 'admin_required') {
        this.showAdminNotice.set(true);
      }
      if (params['q']) {
        this.searchQuery.set(params['q']);
      }
    });

    effect(() => {
      const products = this.filteredProducts();
      const category = this.currentFilter().category;
      this.seoService.setCatalogSeo(products, category);
    });
  }

  ngOnInit(): void {
    if (this.productService.products().length === 0 && !this.productService.isLoading()) {
      this.productService.loadProductsFromDatabase();
    }
  }

  async activateAdminAndGo(): Promise<void> {
    await this.authService.promoteCurrentToAdmin();
    this.router.navigateByUrl('/admin/crm');
  }

  dismissAdminNotice(): void {
    this.showAdminNotice.set(false);
  }

  readonly categories = this.productService.categories;

  readonly availableBrands = computed(() => {
    return this.productService.getBrandsByCategory(this.currentFilter().category);
  });

  readonly filteredProducts = computed(() => {
    return this.productService.filterProducts(this.currentFilter(), this.searchQuery());
  });

  onCategoryChipClick(category: string): void {
    const current = this.currentFilter().category;
    const nextCategory = (!category || current === category) ? undefined : category;

    const validBrands = this.productService.getBrandsByCategory(nextCategory);
    const updatedBrands = this.currentFilter().brand?.filter((b) => validBrands.includes(b));

    this.currentFilter.update((f) => ({
      ...f,
      category: nextCategory,
      brand: updatedBrands && updatedBrands.length > 0 ? updatedBrands : undefined
    }));
  }

  openMobileFilters(): void {
    this.isMobileFiltersOpen.set(true);
  }

  closeMobileFilters(): void {
    this.isMobileFiltersOpen.set(false);
  }

  onFilterChanged(newFilter: ProductFilter): void {
    const validBrands = this.productService.getBrandsByCategory(newFilter.category);
    const updatedBrands = newFilter.brand?.filter((b) => validBrands.includes(b));

    this.currentFilter.update((current) => ({
      ...current,
      ...newFilter,
      brand: updatedBrands && updatedBrands.length > 0 ? updatedBrands : undefined
    }));
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ProductFilter['sortBy'];
    this.currentFilter.update((f) => ({ ...f, sortBy: value }));
  }
}
