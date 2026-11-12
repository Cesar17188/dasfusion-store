import { Component, inject, signal, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product, ProductFilter } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TaxService } from '../../../../core/services/tax.service';
import { SeoService } from '../../../../core/services/seo.service';
import { BannerService } from '../../../../core/services/banner.service';
import { CartService } from '../../../../core/services/cart.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyFormatPipe, ProductCardComponent, ProductFiltersComponent],
  templateUrl: './catalog-list.component.html'
})
export class CatalogListComponent implements OnInit, OnDestroy {
  readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);
  readonly taxService = inject(TaxService);
  readonly seoService = inject(SeoService);
  readonly bannerService = inject(BannerService);
  private readonly cartService = inject(CartService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly currentFilter = signal<ProductFilter>({ sortBy: 'featured' });
  protected readonly searchQuery = signal<string>('');
  protected readonly isMobileFiltersOpen = signal<boolean>(false);
  protected readonly showAdminNotice = signal<boolean>(false);

  readonly pageSizeOptions: readonly number[] = [9, 15, 21];
  readonly pageSize = signal<number>(9);
  readonly currentPage = signal<number>(1);

  readonly currentBannerIndex = signal<number>(0);
  private bannerAutoPlayTimer: ReturnType<typeof setInterval> | null = null;
  private bannerTouchStartX = 0;

  // State for "Franja de Productos Nuevos" below Promotional Banner Carousel
  readonly addedNewPromoId = signal<string | null>(null);

  readonly activeBanner = computed(() => {
    const list = this.bannerService.banners();
    if (list.length === 0) return null;
    const safeIdx = ((this.currentBannerIndex() % list.length) + list.length) % list.length;
    return list[safeIdx];
  });

  constructor() {
    this.route.queryParams.subscribe((params) => {
      if (params['accessDenied'] === 'admin_required') {
        this.showAdminNotice.set(true);
      }
      if (params['q']) {
        this.searchQuery.set(params['q']);
      }
      if (params['brand']) {
        this.currentFilter.update((f) => ({
          ...f,
          brand: [params['brand']]
        }));
        this.currentPage.set(1);
      }
      if (params['category']) {
        this.currentFilter.update((f) => ({
          ...f,
          category: params['category']
        }));
        this.currentPage.set(1);
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
    this.startBannerAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopBannerAutoPlay();
  }

  private startBannerAutoPlay(): void {
    this.stopBannerAutoPlay();
    if (typeof window !== 'undefined') {
      this.bannerAutoPlayTimer = setInterval(() => {
        const count = this.bannerService.banners().length;
        if (count > 1) {
          this.currentBannerIndex.update((idx) => (idx + 1) % count);
        }
      }, 5000);
    }
  }

  private stopBannerAutoPlay(): void {
    if (this.bannerAutoPlayTimer) {
      clearInterval(this.bannerAutoPlayTimer);
      this.bannerAutoPlayTimer = null;
    }
  }

  nextBanner(event?: Event): void {
    event?.stopPropagation();
    const count = this.bannerService.banners().length;
    if (count <= 1) return;
    this.currentBannerIndex.update((idx) => (idx + 1) % count);
    this.startBannerAutoPlay();
  }

  prevBanner(event?: Event): void {
    event?.stopPropagation();
    const count = this.bannerService.banners().length;
    if (count <= 1) return;
    this.currentBannerIndex.update((idx) => (idx - 1 + count) % count);
    this.startBannerAutoPlay();
  }

  goToBanner(index: number, event?: Event): void {
    event?.stopPropagation();
    const count = this.bannerService.banners().length;
    if (index >= 0 && index < count) {
      this.currentBannerIndex.set(index);
      this.startBannerAutoPlay();
    }
  }

  onBannerClick(linkUrl?: string | null): void {
    const target = (linkUrl || '').trim() || '/';
    if (/^https?:\/\//i.test(target)) {
      if (typeof window !== 'undefined') {
        window.location.href = target;
      }
      return;
    }

    if (target === '/' || target === '/catalog') {
      this.currentFilter.update((f) => ({ ...f, category: undefined, brand: undefined }));
      this.searchQuery.set('');
      this.currentPage.set(1);
    }

    this.router.navigateByUrl(target);
  }

  onBannerTouchStart(event: TouchEvent): void {
    if (event.changedTouches && event.changedTouches.length > 0) {
      this.bannerTouchStartX = event.changedTouches[0].screenX;
    }
  }

  onBannerTouchEnd(event: TouchEvent): void {
    if (event.changedTouches && event.changedTouches.length > 0) {
      const endX = event.changedTouches[0].screenX;
      const diff = this.bannerTouchStartX - endX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          this.nextBanner();
        } else {
          this.prevBanner();
        }
      }
    }
  }

  scrollNewPromoStrip(container: HTMLElement, direction: 'left' | 'right'): void {
    if (!container) return;
    const scrollAmount = Math.max(280, Math.round(container.clientWidth * 0.75));
    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  }

  addNewPromoToCart(product: Product, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.cartService.addItem(product);
    this.addedNewPromoId.set(product.id);
    setTimeout(() => {
      if (this.addedNewPromoId() === product.id) {
        this.addedNewPromoId.set(null);
      }
    }, 1500);
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

  readonly totalPages = computed(() => {
    const total = this.filteredProducts().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  readonly paginatedProducts = computed(() => {
    const list = this.filteredProducts();
    const size = this.pageSize();
    const safePage = Math.min(this.currentPage(), this.totalPages());
    const start = (safePage - 1) * size;
    return list.slice(start, start + size);
  });

  readonly showingStart = computed(() => {
    const total = this.filteredProducts().length;
    if (total === 0) return 0;
    const safePage = Math.min(this.currentPage(), this.totalPages());
    return (safePage - 1) * this.pageSize() + 1;
  });

  readonly showingEnd = computed(() => {
    const total = this.filteredProducts().length;
    if (total === 0) return 0;
    const safePage = Math.min(this.currentPage(), this.totalPages());
    return Math.min(safePage * this.pageSize(), total);
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  onSearchQueryChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  onPageSizeChange(value: number | string | Event): void {
    const rawValue =
      typeof value === 'object' && value !== null && 'target' in value
        ? (value.target as HTMLSelectElement).value
        : value;
    const nextSize = Number(rawValue);
    if (this.pageSizeOptions.includes(nextSize)) {
      this.pageSize.set(nextSize);
      this.currentPage.set(1);
    }
  }

  goToPage(page: number): void {
    const target = Math.max(1, Math.min(page, this.totalPages()));
    this.currentPage.set(target);
  }

  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

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
    this.currentPage.set(1);
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
    this.currentPage.set(1);
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ProductFilter['sortBy'];
    this.currentFilter.update((f) => ({ ...f, sortBy: value }));
    this.currentPage.set(1);
  }
}
