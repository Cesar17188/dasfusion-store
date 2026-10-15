import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product, ProductBundle, ProductVariant } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { TaxService } from '../../../../core/services/tax.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StockLimitDialogComponent } from '../../../../shared/components/stock-limit-dialog/stock-limit-dialog.component';
import { BundleSelectorComponent } from '../../components/bundle-selector/bundle-selector.component';
import { ProductCardComponent } from '../../../catalog/components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyFormatPipe,
    ButtonComponent,
    StockLimitDialogComponent,
    BundleSelectorComponent,
    ProductCardComponent
  ],
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  readonly taxService = inject(TaxService);

  protected readonly product = signal<Product | null>(null);
  protected readonly relatedProducts = signal<Product[]>([]);
  protected readonly selectedVariant = signal<ProductVariant | null>(null);
  protected readonly selectedBundle = signal<ProductBundle | null>(null);
  protected readonly quantity = signal<number>(1);
  protected readonly activeTab = signal<'specs' | 'description' | 'shipping'>('specs');
  protected readonly isAddedToCart = signal<boolean>(false);
  protected readonly selectedImageIndex = signal<number>(0);
  protected readonly showStockLimitDialog = signal<boolean>(false);

  readonly availableStock = computed(() => {
    const v = this.selectedVariant();
    if (v) {
      return Number(v.stock) || 0;
    }
    const p = this.product();
    return p ? (Number(p.stock) || 0) : 0;
  });

  readonly currentDisplayPrice = computed(() => {
    const bundle = this.selectedBundle();
    if (bundle) return bundle.price;
    const variant = this.selectedVariant();
    if (variant) return variant.price;
    return this.product()?.price ?? 0;
  });

  readonly currentDisplayPriceWithTax = computed(() => {
    return this.taxService.calculatePriceWithTax(this.currentDisplayPrice());
  });

  readonly currentComparePrice = computed(() => {
    if (this.selectedBundle()) return undefined;
    const variant = this.selectedVariant();
    if (variant) return variant.compareAtPrice;
    return this.product()?.compareAtPrice;
  });

  readonly currentComparePriceWithTax = computed(() => {
    const compare = this.currentComparePrice();
    if (!compare) return undefined;
    return this.taxService.calculatePriceWithTax(compare);
  });

  readonly currentDiscountPercentage = computed(() => {
    if (this.selectedBundle()) return undefined;
    const variant = this.selectedVariant();
    if (variant) return variant.discountPercentage;
    return this.product()?.discountPercentage;
  });

  readonly hasDiscount = computed(() => {
    const disc = this.currentDiscountPercentage();
    if (disc !== undefined && disc <= 0) {
      return false;
    }
    const comp = this.currentComparePrice();
    const curr = this.currentDisplayPrice();
    return !!(comp && comp > curr);
  });

  private touchStartX = 0;
  private touchEndX = 0;

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      const slug = params.get('slug');
      if (!slug) {
        this.product.set(null);
        return;
      }

      if (this.productService.isLoading()) {
        await this.productService.loadProductsFromDatabase();
      }

      const found = this.productService.getProductBySlug(slug) || this.productService.getProductById(slug);
      this.product.set(found || null);

      if (found) {
        this.relatedProducts.set(this.productService.getRelatedProducts(found, 3));
        if (found.variants && found.variants.length > 0) {
          this.selectedVariant.set(found.variants[0]);
        } else {
          this.selectedVariant.set(null);
        }
      } else {
        this.relatedProducts.set([]);
        this.selectedVariant.set(null);
      }
      this.selectedBundle.set(null);
      this.quantity.set(1);
      this.selectedImageIndex.set(0);
    });
  }

  setImageIndex(index: number): void {
    this.selectedImageIndex.set(index);
  }

  prevImage(event?: Event): void {
    event?.stopPropagation();
    const prod = this.product();
    if (!prod || !prod.images || prod.images.length <= 1) return;
    this.selectedImageIndex.update((curr) => (curr > 0 ? curr - 1 : prod.images.length - 1));
  }

  nextImage(event?: Event): void {
    event?.stopPropagation();
    const prod = this.product();
    if (!prod || !prod.images || prod.images.length <= 1) return;
    this.selectedImageIndex.update((curr) => (curr < prod.images.length - 1 ? curr + 1 : 0));
  }

  onTouchStart(e: TouchEvent): void {
    if (e.changedTouches && e.changedTouches.length > 0) {
      this.touchStartX = e.changedTouches[0].screenX;
    }
  }

  onTouchEnd(e: TouchEvent): void {
    if (e.changedTouches && e.changedTouches.length > 0) {
      this.touchEndX = e.changedTouches[0].screenX;
      const diff = this.touchStartX - this.touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          this.nextImage();
        } else {
          this.prevImage();
        }
      }
    }
  }

  setVariant(variant: ProductVariant): void {
    this.selectedVariant.set(variant);
    this.selectedBundle.set(null);
  }

  setBundle(bundle: ProductBundle | null): void {
    this.selectedBundle.set(bundle);
  }

  increaseQuantity(): void {
    const maxStock = this.availableStock();
    if (this.quantity() >= maxStock) {
      this.showStockLimitDialog.set(true);
      return;
    }
    this.quantity.update((q) => q + 1);
  }

  decreaseQuantity(): void {
    this.quantity.update((q) => (q > 1 ? q - 1 : 1));
  }

  addToCart(): void {
    const prod = this.product();
    if (!prod) return;

    const maxStock = this.availableStock();
    if (maxStock <= 0) {
      this.showStockLimitDialog.set(true);
      return;
    }

    const currentInCart = this.cartService.getItemQuantity(
      prod.id,
      this.selectedVariant()?.id,
      this.selectedBundle()?.id
    );

    if (currentInCart + this.quantity() > maxStock) {
      this.showStockLimitDialog.set(true);
      return;
    }

    this.cartService.addItem(
      prod,
      this.selectedVariant() || undefined,
      this.selectedBundle() || undefined,
      this.quantity()
    );

    this.isAddedToCart.set(true);
    setTimeout(() => this.isAddedToCart.set(false), 2500);
  }

  closeStockLimitDialog(): void {
    this.showStockLimitDialog.set(false);
  }
}
