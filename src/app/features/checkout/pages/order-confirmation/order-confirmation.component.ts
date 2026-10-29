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
  protected readonly email = signal<string>('');
  protected readonly name = signal<string>('');
  protected readonly taxId = signal<string>('');
  protected readonly total = signal<number | null>(null);
  protected readonly paymentMethod = signal<string>('transfer');

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
    const name = this.name();
    const totalVal = this.total();
    const totalFormatted = totalVal !== null ? `$${totalVal.toFixed(2)}` : '';

    let msg = `¡Hola! He realizado la transferencia bancaria para mi pedido *${num}* en DasFusion Store.`;
    if (name) {
      msg += `\n*Cliente:* ${name}`;
    }
    if (totalFormatted) {
      msg += `\n*Total:* ${totalFormatted}`;
    }
    msg += '\n\nAdjunto aquí el comprobante de pago para procesar mi despacho. ¡Muchas gracias!';

    return `https://wa.me/${this.paymentWhatsAppPhone}?text=${encodeURIComponent(msg)}`;
  });

  ngOnInit(): void {
    const q = this.route.snapshot.queryParams;
    if (q['orderNumber']) {
      this.orderNumber.set(q['orderNumber']);
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
    if (q['paymentMethod']) {
      this.paymentMethod.set(q['paymentMethod']);
    }
  }
}
