import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { TaxService } from '../../../../core/services/tax.service';
import { AdminService } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import {
  BANK_ACCOUNTS,
  PAYMENT_WHATSAPP_PHONE,
  PAYMENT_WHATSAPP_DISPLAY,
  BENEFICIARY_INFO,
  BankAccount
} from '../../../../core/constants/bank-accounts.constant';

@Component({
  selector: 'app-checkout-process',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, CurrencyFormatPipe],
  templateUrl: './checkout-process.component.html'
})
export class CheckoutProcessComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly cartService = inject(CartService);
  readonly taxService = inject(TaxService);
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isProcessing = signal<boolean>(false);
  protected readonly selectedPayment = signal<'credit_card' | 'transfer'>('credit_card');
  // Sub-opciones para pago con tarjeta:
  // 1. 'amex_peigo': Banco Guayaquil (American Express / Peigo) -> Link de pago WhatsApp ($50 a $450 de subtotal)
  // 2. 'other_cards': Todo tipo de tarjetas (excepto American Express) -> Link de pago WhatsApp ($50 en adelante de subtotal)
  // 3. 'payphone_api': Integración directa con API de PayPhone (se habilitará próximamente)
  protected readonly selectedCardOption = signal<'amex_peigo' | 'other_cards' | 'payphone_api'>('other_cards');
  protected readonly selectedDocType = signal<'cedula' | 'ruc' | 'pasaporte' | 'consumidor_final'>('cedula');

  // Reglas de negocio basadas exclusivamente en el SUBTOTAL (sin tomar en cuenta envío ni IVA):
  readonly isCardPaymentAllowed = computed(() => this.cartService.subtotal() >= 50);
  readonly isAmexPeigoAllowed = computed(() => {
    const sub = this.cartService.subtotal();
    return sub >= 50 && sub <= 450;
  });
  readonly isOtherCardsAllowed = computed(() => this.cartService.subtotal() >= 50);

  readonly beneficiary = BENEFICIARY_INFO;
  readonly bankAccounts: BankAccount[] = BANK_ACCOUNTS;
  readonly paymentWhatsAppPhone = PAYMENT_WHATSAPP_PHONE;
  readonly paymentWhatsAppDisplay = PAYMENT_WHATSAPP_DISPLAY;
  protected readonly copiedField = signal<string | null>(null);

  // ID único preasignado al pedido para que coincida tanto al enviar el comprobante por WhatsApp como al registrar la orden
  readonly pendingOrderId = signal<string>(crypto.randomUUID());
  readonly pendingOrderNumber = computed(() => `DAS-${this.pendingOrderId().slice(0, 8).toUpperCase()}`);
  private readonly formValueSignal = signal<{ fullName?: string; identification?: string }>({});

  copyToClipboard(text: string, fieldId: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.copiedField.set(fieldId);
        setTimeout(() => {
          if (this.copiedField() === fieldId) {
            this.copiedField.set(null);
          }
        }, 2000);
      }).catch(err => {
        console.error('Error al copiar:', err);
      });
    }
  }

  readonly whatsappReceiptUrl = computed(() => {
    const formVal = this.formValueSignal();
    const name = formVal.fullName ? formVal.fullName.trim() : '';
    const taxId = formVal.identification ? formVal.identification.trim() : '';
    const total = this.cartService.total();
    const totalFormatted = total ? `$${total.toFixed(2)}` : '';
    const orderId = this.pendingOrderId();
    const shortId = orderId.slice(0, 8);
    const orderNum = this.pendingOrderNumber();
    const deliveryLabel = this.cartService.deliveryMethod() === 'shipping'
      ? 'Servicio de envío a dirección ingresada ($6.00 - Ecuador Continental)'
      : 'Entrega en tienda física (Sin costo)';

    let msg = '¡Hola! He realizado una transferencia bancaria para mi compra en DasFusion Store.';
    msg += `\n*ID del Pedido:* #${shortId} (${orderNum})`;
    msg += `\n*Código de Orden:* ${orderId}`;
    msg += `\n*Modalidad de Entrega:* ${deliveryLabel}`;
    if (name) {
      msg += `\n*Cliente:* ${name}`;
    }
    if (taxId) {
      msg += `\n*CI/RUC:* ${taxId}`;
    }
    if (totalFormatted) {
      msg += `\n*Total a pagar:* ${totalFormatted}`;
    }
    msg += '\n\nAdjunto el comprobante de transferencia junto con el ID de mi pedido para su confirmación. ¡Muchas gracias!';

    return `https://wa.me/${this.paymentWhatsAppPhone}?text=${encodeURIComponent(msg)}`;
  });

  // URL de WhatsApp para solicitar el Link de Pago con Tarjeta según la opción elegida
  readonly whatsappCardPaymentLinkUrl = computed(() => {
    const formVal = this.formValueSignal();
    const name = formVal.fullName ? formVal.fullName.trim() : '';
    const taxId = formVal.identification ? formVal.identification.trim() : '';
    const subtotal = this.cartService.subtotal();
    const total = this.cartService.total();
    const orderId = this.pendingOrderId();
    const shortId = orderId.slice(0, 8);
    const orderNum = this.pendingOrderNumber();
    const cardOpt = this.selectedCardOption();
    const deliveryLabel = this.cartService.deliveryMethod() === 'shipping'
      ? 'Servicio de envío a dirección ingresada ($6.00 - Ecuador Continental)'
      : 'Entrega en tienda física (Sin costo)';

    const cardTypeDesc = cardOpt === 'amex_peigo'
      ? 'Tarjeta Banco Guayaquil (American Express / Peigo)'
      : 'Tarjeta de Crédito / Débito (Todo tipo de tarjetas excepto American Express)';

    let msg = '¡Hola! Deseo solicitar un *Link de Pago con Tarjeta* para mi compra en DasFusion Store.';
    msg += `\n*ID del Pedido:* #${shortId} (${orderNum})`;
    msg += `\n*Código de Orden:* ${orderId}`;
    msg += `\n*Tipo de Tarjeta:* ${cardTypeDesc}`;
    msg += `\n*Modalidad de Entrega:* ${deliveryLabel}`;
    if (name) {
      msg += `\n*Cliente:* ${name}`;
    }
    if (taxId) {
      msg += `\n*CI/RUC:* ${taxId}`;
    }
    msg += `\n*Subtotal (sin envío ni IVA):* $${subtotal.toFixed(2)}`;
    msg += `\n*Total a pagar:* $${total.toFixed(2)}`;
    msg += '\n\nQuedo atento(a) al envío del link de pago para completar mi compra. ¡Muchas gracias!';

    return `https://wa.me/${this.paymentWhatsAppPhone}?text=${encodeURIComponent(msg)}`;
  });

  constructor() {
    effect(() => {
      // Si el subtotal es menor a $50, deshabilitar tarjeta y pasar automáticamente a transferencia bancaria
      if (!this.isCardPaymentAllowed() && this.selectedPayment() === 'credit_card') {
        this.selectedPayment.set('transfer');
      }
      // Si el subtotal supera los $450 y estaba seleccionada la opción Amex / Peigo, cambiar a otras tarjetas
      if (!this.isAmexPeigoAllowed() && this.selectedCardOption() === 'amex_peigo') {
        this.selectedCardOption.set('other_cards');
      }
    });
  }

  selectPaymentMethod(method: 'credit_card' | 'transfer'): void {
    if (method === 'credit_card' && !this.isCardPaymentAllowed()) {
      return;
    }
    this.selectedPayment.set(method);
  }

  selectCardOption(option: 'amex_peigo' | 'other_cards' | 'payphone_api'): void {
    if (option === 'amex_peigo' && !this.isAmexPeigoAllowed()) {
      return;
    }
    if (option === 'other_cards' && !this.isOtherCardsAllowed()) {
      return;
    }
    if (option === 'payphone_api') {
      // Reservado para futura integración con API de PayPhone
      return;
    }
    this.selectedCardOption.set(option);
  }

  // Por normativa SRI en Ecuador, Consumidor Final solo aplica para compras estrictamente menores a $50
  readonly isConsumidorFinalAllowed = computed(() => this.cartService.total() < 50);

  // Listado oficial de las 24 provincias de Ecuador
  readonly ecuadorProvinces: string[] = [
    'Azuay',
    'Bolívar',
    'Cañar',
    'Carchi',
    'Chimborazo',
    'Cotopaxi',
    'El Oro',
    'Esmeraldas',
    'Galápagos',
    'Guayas',
    'Imbabura',
    'Loja',
    'Los Ríos',
    'Manabí',
    'Morona Santiago',
    'Napo',
    'Orellana',
    'Pastaza',
    'Pichincha',
    'Santa Elena',
    'Santo Domingo de los Tsáchilas',
    'Sucumbíos',
    'Tungurahua',
    'Zamora Chinchipe'
  ];

  // Provincias del Ecuador Continental (para el servicio de envío a domicilio de $6.00)
  readonly continentalEcuadorProvinces: string[] = this.ecuadorProvinces.filter((prov) => prov !== 'Galápagos');

  setDeliveryMethod(method: 'shipping' | 'store_pickup'): void {
    this.cartService.setDeliveryMethod(method);
  }

  // Formulario principal con los Datos de Factura y de Envío requeridos
  protected readonly checkoutForm = this.fb.nonNullable.group({
    // 1. Datos de Factura requeridos:
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    identification: ['', [Validators.required, Validators.minLength(5)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    phone: ['', [Validators.required, Validators.minLength(7)]],
    province: ['Pichincha', [Validators.required]],
    city: ['Quito', [Validators.required]],

    // Opción para dirección de entrega
    sameAsBilling: [true],
    shippingAddress: [''],
    shippingProvince: ['Pichincha'],
    shippingCity: [''],

    // Método de pago (Tarjeta)
    cardNumber: [''],
    cardExp: [''],
    cardCvc: ['']
  });

  ngOnInit(): void {
    // Si el usuario ya inició sesión, auto-completar datos disponibles
    const user = this.authService.currentUser();
    if (user) {
      this.checkoutForm.patchValue({
        fullName: user.name || '',
        email: user.email || ''
      });
    }

    // Mantener sincronizados los datos del cliente para el mensaje de WhatsApp
    this.formValueSignal.set({
      fullName: this.checkoutForm.get('fullName')?.value,
      identification: this.checkoutForm.get('identification')?.value
    });
    this.checkoutForm.valueChanges.subscribe((val) => {
      this.formValueSignal.set({
        fullName: val.fullName,
        identification: val.identification
      });
    });

    // Si el monto es $50 o más, asegurar que no quede seleccionado Consumidor Final
    if (!this.isConsumidorFinalAllowed() && this.selectedDocType() === 'consumidor_final') {
      this.selectedDocType.set('cedula');
    }
  }

  setDocType(type: 'cedula' | 'ruc' | 'pasaporte' | 'consumidor_final'): void {
    // Validación de la regla SRI de $50
    if (type === 'consumidor_final' && !this.isConsumidorFinalAllowed()) {
      return;
    }

    this.selectedDocType.set(type);
    if (type === 'consumidor_final') {
      this.checkoutForm.patchValue({
        fullName: this.checkoutForm.get('fullName')?.value || 'Consumidor Final',
        identification: '9999999999999'
      });
    } else if (this.checkoutForm.get('identification')?.value === '9999999999999') {
      this.checkoutForm.patchValue({
        identification: ''
      });
    }
  }

  async onWhatsAppCheckout(whatsappUrl: string, event: Event): Promise<void> {
    event.preventDefault();
    const val = this.checkoutForm.getRawValue();

    // Validar restricción SRI: Consumidor Final no aplicable a $50 o más
    if (!this.isConsumidorFinalAllowed() && (val.identification.trim() === '9999999999999' || this.selectedDocType() === 'consumidor_final')) {
      this.selectedDocType.set('cedula');
      this.checkoutForm.get('identification')?.setErrors({ consumidorFinalNotAllowed: true });
      this.checkoutForm.get('identification')?.markAsTouched();
      return;
    }

    // Validar si seleccionó servicio de envío a dirección ingresada y la dirección de entrega es distinta a la de facturación
    if (this.cartService.deliveryMethod() === 'shipping' && !val.sameAsBilling) {
      if (!val.shippingAddress.trim() || !val.shippingCity.trim() || !val.shippingProvince.trim()) {
        this.checkoutForm.get('shippingAddress')?.markAsTouched();
        this.checkoutForm.get('shippingCity')?.markAsTouched();
        this.checkoutForm.get('shippingProvince')?.markAsTouched();
        this.checkoutForm.markAllAsTouched();
        return;
      }
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }

    await this.onPlaceOrder();
  }

  async onPlaceOrder(): Promise<void> {
    const val = this.checkoutForm.getRawValue();

    // Validar restricción SRI: Consumidor Final no aplicable a $50 o más
    if (!this.isConsumidorFinalAllowed() && (val.identification.trim() === '9999999999999' || this.selectedDocType() === 'consumidor_final')) {
      this.selectedDocType.set('cedula');
      this.checkoutForm.get('identification')?.setErrors({ consumidorFinalNotAllowed: true });
      this.checkoutForm.get('identification')?.markAsTouched();
      return;
    }

    // Validar si seleccionó servicio de envío a dirección ingresada y la dirección de entrega es distinta a la de facturación
    if (this.cartService.deliveryMethod() === 'shipping' && !val.sameAsBilling) {
      if (!val.shippingAddress.trim() || !val.shippingCity.trim() || !val.shippingProvince.trim()) {
        this.checkoutForm.get('shippingAddress')?.markAsTouched();
        this.checkoutForm.get('shippingCity')?.markAsTouched();
        this.checkoutForm.get('shippingProvince')?.markAsTouched();
        this.checkoutForm.markAllAsTouched();
        return;
      }
    }

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
      const billingAddress = `${val.address.trim()}, ${val.city.trim()}, Prov. ${val.province.trim()}`;
      const targetShippingAddress = val.sameAsBilling || !val.shippingAddress
        ? billingAddress
        : `${val.shippingAddress.trim()}, ${val.shippingCity.trim() || val.city.trim()}, Prov. ${(val.shippingProvince || val.province).trim()}`;

      const shippingAddress = this.cartService.deliveryMethod() === 'store_pickup'
        ? 'Entrega en tienda física (Bélgica y Eloy Alfaro, Quito - Lunes a Viernes con cita previa)'
        : `Servicio de envío a dirección ingresada ($6.00 - Ecuador Continental): ${targetShippingAddress}`;

      const cardOptionLabel = this.selectedCardOption() === 'amex_peigo'
        ? 'Tarjeta Banco Guayaquil (American Express / Peigo) - Link de Pago WhatsApp'
        : 'Tarjeta (Excepto American Express) - Link de Pago WhatsApp';

      const paymentMethodMap: Record<string, string> = {
        credit_card: cardOptionLabel,
        transfer: 'Transferencia Bancaria Directa'
      };

      const orderItems = this.cartService.items().map((it) => ({
        productId: it.productId,
        variantId: it.variant?.id,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        productName: it.product?.name,
        sku: it.variant?.sku
      }));

      // Guardar el pedido y persistir datos de factura en Supabase y estado local usando el mismo ID preasignado
      const createdOrder = await this.adminService.placeCustomerOrder({
        orderId: this.pendingOrderId(),
        customerName: val.fullName.trim(),
        taxId: val.identification.trim(),
        customerEmail: val.email.trim(),
        customerPhone: val.phone.trim(),
        billingAddress,
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
          name: val.fullName.trim(),
          taxId: val.identification.trim(),
          email: val.email.trim(),
          subtotal: this.cartService.subtotal(),
          total: createdOrder.total,
          paymentMethod: this.selectedPayment(),
          cardOption: this.selectedPayment() === 'credit_card' ? this.selectedCardOption() : undefined
        }
      });
    } catch (err) {
      console.error('Error al procesar el pedido:', err);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
