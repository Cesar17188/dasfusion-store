import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product, ProductBundle, ProductVariant } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BundleSelectorComponent } from '../../components/bundle-selector/bundle-selector.component';
import { ProductCardComponent } from '../../../catalog/components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyFormatPipe, ButtonComponent, BundleSelectorComponent, ProductCardComponent],
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  protected readonly product = signal<Product | null>(null);
  protected readonly relatedProducts = signal<Product[]>([]);
  protected readonly selectedVariant = signal<ProductVariant | null>(null);
  protected readonly selectedBundle = signal<ProductBundle | null>(null);
  protected readonly quantity = signal<number>(1);
  protected readonly activeTab = signal<'specs' | 'description' | 'shipping'>('specs');
  protected readonly isAddedToCart = signal<boolean>(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') || 'apple-iphone-16-pro-max';
      const found = this.productService.getProductBySlug(slug) || this.productService.products()[0];
      this.product.set(found);

      if (found) {
        this.relatedProducts.set(this.productService.getRelatedProducts(found, 3));
        if (found.variants && found.variants.length > 0) {
          this.selectedVariant.set(found.variants[0]);
        } else {
          this.selectedVariant.set(null);
        }
      }
      this.selectedBundle.set(null);
      this.quantity.set(1);
    });
  }

  setVariant(variant: ProductVariant): void {
    this.selectedVariant.set(variant);
    this.selectedBundle.set(null);
  }

  setBundle(bundle: ProductBundle | null): void {
    this.selectedBundle.set(bundle);
  }

  increaseQuantity(): void {
    this.quantity.update((q) => q + 1);
  }

  decreaseQuantity(): void {
    this.quantity.update((q) => (q > 1 ? q - 1 : 1));
  }

  addToCart(): void {
    const prod = this.product();
    if (!prod) return;

    this.cartService.addItem(
      prod,
      this.selectedVariant() || undefined,
      this.selectedBundle() || undefined,
      this.quantity()
    );

    this.isAddedToCart.set(true);
    setTimeout(() => this.isAddedToCart.set(false), 2500);
  }
}
