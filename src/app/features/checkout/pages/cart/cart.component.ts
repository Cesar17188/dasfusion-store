import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../core/services/cart.service';
import { TaxService } from '../../../../core/services/tax.service';
import { CartItem } from '../../../../core/models/cart.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StockLimitDialogComponent } from '../../../../shared/components/stock-limit-dialog/stock-limit-dialog.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CurrencyFormatPipe,
    ButtonComponent,
    StockLimitDialogComponent
  ],
  templateUrl: './cart.component.html'
})
export class CartComponent {
  readonly cartService = inject(CartService);
  readonly taxService = inject(TaxService);

  couponCode = '';
  couponMessage = signal<string>('');
  couponSuccess = signal<boolean>(false);

  showStockLimitDialog = signal<boolean>(false);
  selectedStockItem = signal<CartItem | null>(null);

  increaseQuantity(item: CartItem): void {
    const maxStock = this.cartService.getItemMaxStock(item);
    if (item.quantity >= maxStock) {
      this.selectedStockItem.set(item);
      this.showStockLimitDialog.set(true);
      return;
    }
    this.cartService.updateQuantity(item.id, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem): void {
    this.cartService.updateQuantity(item.id, item.quantity - 1);
  }

  closeStockLimitDialog(): void {
    this.showStockLimitDialog.set(false);
    this.selectedStockItem.set(null);
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) return;

    const success = this.cartService.applyCoupon(this.couponCode);
    if (success) {
      this.couponSuccess.set(true);
      this.couponMessage.set('¡Cupón DASFUSION10 aplicado con 10% de descuento!');
    } else {
      this.couponSuccess.set(false);
      this.couponMessage.set('Cupón inválido (prueba con DASFUSION10)');
    }
  }
}
