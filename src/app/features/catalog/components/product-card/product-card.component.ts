import { Component, inject, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../../core/models/product.model';
import { CartService } from '../../../../core/services/cart.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyFormatPipe, ButtonComponent],
  templateUrl: './product-card.component.html'
})
export class ProductCardComponent {
  private readonly cartService = inject(CartService);

  readonly product = input.required<Product>();
  readonly isAdded = signal<boolean>(false);

  readonly hasDiscount = computed(() => {
    const p = this.product();
    if (p.discountPercentage !== undefined && p.discountPercentage <= 0) {
      return false;
    }
    return !!(p.compareAtPrice && p.compareAtPrice > p.price);
  });

  addToCart(event: MouseEvent): void {
    event.stopPropagation();
    this.cartService.addItem(this.product());
    this.isAdded.set(true);
    setTimeout(() => this.isAdded.set(false), 1500);
  }
}
