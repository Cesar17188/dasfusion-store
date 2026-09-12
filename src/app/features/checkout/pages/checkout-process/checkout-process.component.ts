import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-checkout-process',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, CurrencyFormatPipe],
  templateUrl: './checkout-process.component.html'
})
export class CheckoutProcessComponent {
  private readonly fb = inject(FormBuilder);
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  protected readonly isProcessing = signal<boolean>(false);
  protected readonly selectedPayment = signal<'credit_card' | 'paypal' | 'crypto'>('credit_card');

  protected readonly checkoutForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    addressLine1: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    postalCode: ['', [Validators.required]],
    cardNumber: [''],
    cardExp: [''],
    cardCvc: ['']
  });

  onPlaceOrder(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isProcessing.set(true);

    setTimeout(() => {
      this.isProcessing.set(false);
      const orderId = `DAS-${Math.floor(100000 + Math.random() * 900000)}`;
      this.cartService.clearCart();
      this.router.navigate(['/checkout/confirmation'], {
        queryParams: { orderNumber: orderId }
      });
    }, 1200);
  }
}
