import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { TaxService } from '../../../../core/services/tax.service';
import { AdminService } from '../../../../core/services/admin.service';
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
  readonly taxService = inject(TaxService);
  private readonly adminService = inject(AdminService);
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

  async onPlaceOrder(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    if (this.cartService.items().length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.isProcessing.set(true);

    try {
      const val = this.checkoutForm.getRawValue();
      const shippingAddress = `${val.addressLine1}, ${val.city}, ${val.state} CP ${val.postalCode}`;
      const paymentMethodMap: Record<string, string> = {
        credit_card: 'Tarjeta de Crédito/Débito',
        paypal: 'PayPal',
        crypto: 'Criptomoneda'
      };

      const orderItems = this.cartService.items().map((it) => ({
        productId: it.productId,
        variantId: it.variant?.id,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        productName: it.product?.name,
        sku: it.variant?.sku
      }));

      const createdOrder = await this.adminService.placeCustomerOrder({
        customerName: val.fullName,
        customerEmail: val.email,
        customerPhone: val.phone,
        shippingAddress,
        paymentMethod: paymentMethodMap[this.selectedPayment()] || this.selectedPayment(),
        items: orderItems,
        subtotal: this.cartService.subtotal() - this.cartService.discount() + this.cartService.shipping(),
        tax: this.cartService.tax(),
        total: this.cartService.total(),
        taxRate: this.taxService.taxRate()
      });

      const displayOrderNumber = `DAS-${createdOrder.id.slice(0, 8).toUpperCase()}`;

      this.cartService.clearCart();

      await this.router.navigate(['/checkout/confirmation'], {
        queryParams: {
          orderNumber: displayOrderNumber,
          orderId: createdOrder.id,
          email: val.email,
          total: createdOrder.total
        }
      });
    } catch (err) {
      console.error('Error al procesar el pedido:', err);
    } finally {
      this.isProcessing.set(false);
    }
  }
}

