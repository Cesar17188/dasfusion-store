import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../core/services/cart.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyFormatPipe, ButtonComponent],
  templateUrl: './cart.component.html'
})
export class CartComponent {
  readonly cartService = inject(CartService);

  couponCode = '';
  couponMessage = signal<string>('');
  couponSuccess = signal<boolean>(false);

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
