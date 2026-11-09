import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CardComponent } from '../../../../shared/components/card/card.component';
import {
  BANK_ACCOUNTS,
  PAYMENT_WHATSAPP_PHONE,
  PAYMENT_WHATSAPP_DISPLAY,
  BENEFICIARY_INFO,
  BankAccount
} from '../../../../core/constants/bank-accounts.constant';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent],
  templateUrl: './order-confirmation.component.html'
})
export class OrderConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  protected readonly orderNumber = signal<string>('DAS-894123');
  protected readonly orderId = signal<string>('');
  protected readonly email = signal<string>('');
  protected readonly name = signal<string>('');
  protected readonly taxId = signal<string>('');
  protected readonly total = signal<number | null>(null);
  protected readonly subtotal = signal<number | null>(null);
  protected readonly paymentMethod = signal<string>('transfer');
  protected readonly cardOption = signal<string>('other_cards');

  readonly beneficiary = BENEFICIARY_INFO;
  readonly bankAccounts: BankAccount[] = BANK_ACCOUNTS;
  readonly paymentWhatsAppPhone = PAYMENT_WHATSAPP_PHONE;
  readonly paymentWhatsAppDisplay = PAYMENT_WHATSAPP_DISPLAY;
  protected readonly copiedField = signal<string | null>(null);

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
    const num = this.orderNumber();
    const id = this.orderId();
    const shortId = id ? id.slice(0, 8) : num.replace(/^DAS-/i, '');
    const name = this.name();
    const taxId = this.taxId();
    const totalVal = this.total();
    const totalFormatted = totalVal !== null ? `$${totalVal.toFixed(2)}` : '';

    let msg = '¡Hola! He realizado la transferencia bancaria para mi compra en DasFusion Store.';
    msg += `\n*ID del Pedido:* #${shortId} (${num})`;
    if (id) {
      msg += `\n*Código de Orden:* ${id}`;
    }
    if (name) {
      msg += `\n*Cliente:* ${name}`;
    }
    if (taxId) {
      msg += `\n*CI/RUC:* ${taxId}`;
    }
    if (totalFormatted) {
      msg += `\n*Total:* ${totalFormatted}`;
    }
    msg += '\n\nAdjunto el comprobante de transferencia junto con el ID de mi pedido para procesar mi despacho. ¡Muchas gracias!';

    return `https://wa.me/${this.paymentWhatsAppPhone}?text=${encodeURIComponent(msg)}`;
  });

  readonly whatsappCardLinkUrl = computed(() => {
    const num = this.orderNumber();
    const id = this.orderId();
    const shortId = id ? id.slice(0, 8) : num.replace(/^DAS-/i, '');
    const name = this.name();
    const taxId = this.taxId();
    const subVal = this.subtotal();
    const totalVal = this.total();
    const cardOpt = this.cardOption();

    const cardDesc = cardOpt === 'amex_peigo'
      ? 'Tarjeta Banco Guayaquil (American Express / Peigo)'
      : 'Tarjeta de Crédito / Débito (Excepto American Express)';

    let msg = '¡Hola! Deseo solicitar el *Link de Pago con Tarjeta* para mi pedido registrado en DasFusion Store.';
    msg += `\n*ID del Pedido:* #${shortId} (${num})`;
    if (id) {
      msg += `\n*Código de Orden:* ${id}`;
    }
    msg += `\n*Modalidad de Tarjeta:* ${cardDesc}`;
    if (name) {
      msg += `\n*Cliente:* ${name}`;
    }
    if (taxId) {
      msg += `\n*CI/RUC:* ${taxId}`;
    }
    if (subVal !== null) {
      msg += `\n*Subtotal (sin envío ni IVA):* $${subVal.toFixed(2)}`;
    }
    if (totalVal !== null) {
      msg += `\n*Total a pagar:* $${totalVal.toFixed(2)}`;
    }
    msg += '\n\nQuedo atento(a) al envío del link de pago para procesar mi despacho. ¡Muchas gracias!';

    return `https://wa.me/${this.paymentWhatsAppPhone}?text=${encodeURIComponent(msg)}`;
  });

  ngOnInit(): void {
    const q = this.route.snapshot.queryParams;
    if (q['orderNumber']) {
      this.orderNumber.set(q['orderNumber']);
    }
    if (q['orderId']) {
      this.orderId.set(q['orderId']);
    }
    if (q['email']) {
      this.email.set(q['email']);
    }
    if (q['name']) {
      this.name.set(q['name']);
    }
    if (q['taxId']) {
      this.taxId.set(q['taxId']);
    }
    if (q['total'] !== undefined && q['total'] !== null) {
      this.total.set(Number(q['total']));
    }
    if (q['subtotal'] !== undefined && q['subtotal'] !== null) {
      this.subtotal.set(Number(q['subtotal']));
    }
    if (q['paymentMethod']) {
      this.paymentMethod.set(q['paymentMethod']);
    }
    if (q['cardOption']) {
      this.cardOption.set(q['cardOption']);
    }
  }
}
