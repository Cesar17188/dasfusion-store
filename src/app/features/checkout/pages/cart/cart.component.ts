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

  // Modal y datos de Cotización
  isQuoteModalOpen = signal<boolean>(false);
  quoteNumber = signal<string>('');
  quoteDate = signal<string>('');
  quoteValidity = signal<string>('');

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

  openQuoteModal(): void {
    if (this.cartService.items().length === 0) return;
    const now = new Date();
    this.quoteNumber.set(`COT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`);
    this.quoteDate.set(now.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' }));
    this.quoteValidity.set(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' }));
    this.isQuoteModalOpen.set(true);
  }

  closeQuoteModal(): void {
    this.isQuoteModalOpen.set(false);
  }

  printQuote(): void {
    if (this.cartService.items().length === 0) return;
    this.openQuoteModal();
    this.triggerPrint();
  }

  triggerPrint(): void {
    const items = this.cartService.items();
    const subtotal = this.cartService.subtotal();
    const discount = this.cartService.discount();
    const shipping = this.cartService.shipping();
    const tax = this.cartService.tax();
    const total = this.cartService.total();
    const taxRate = this.taxService.taxPercentage();
    const qNum = this.quoteNumber() || `COT-${Date.now().toString().slice(-6)}`;
    const qDate = this.quoteDate() || new Date().toLocaleDateString('es-EC');
    const qVal = this.quoteValidity() || '15 días';

    const fmt = (n: number) => `$${n.toFixed(2)}`;

    const rowsHtml = items.map((it, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 8px; text-align: center; color: #6b7280; font-size: 12px;">${idx + 1}</td>
        <td style="padding: 10px 8px;">
          <strong style="color: #111827; font-size: 13px; display: block;">${it.product.name}</strong>
          ${it.variant ? `<span style="color: #6b7280; font-size: 11px;">Variante: ${it.variant.name} ${it.variant.sku ? `(SKU: ${it.variant.sku})` : ''}</span>` : ''}
          ${it.bundle ? `<span style="color: #2563eb; font-size: 11px; display: block;">Bundle: ${it.bundle.name}</span>` : ''}
        </td>
        <td style="padding: 10px 8px; text-align: center; font-weight: 600; color: #111827; font-size: 13px;">${it.quantity}</td>
        <td style="padding: 10px 8px; text-align: right; color: #374151; font-size: 13px; font-family: monospace;">${fmt(it.unitPrice)}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #111827; font-size: 13px; font-family: monospace;">${fmt(it.totalPrice)}</td>
      </tr>
    `).join('');

    const printHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Cotización ${qNum} - DasFusion Store</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 25px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
          .brand h1 { margin: 0; font-size: 24px; font-weight: 900; color: #1e3a8a; letter-spacing: -0.5px; }
          .brand p { margin: 3px 0; font-size: 11px; color: #4b5563; }
          .quote-box { text-align: right; }
          .quote-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; margin-bottom: 6px; border: 1px solid #bfdbfe; }
          .quote-num { font-size: 16px; font-weight: 800; font-family: monospace; color: #111827; margin: 0; }
          .quote-date { font-size: 11px; color: #6b7280; margin: 3px 0; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f9fafb; padding: 12px 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px; font-size: 12px; }
          .meta-grid div p { margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f3f4f6; color: #374151; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb; }
          .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 25px; }
          .totals-table { width: 320px; font-size: 13px; }
          .totals-table tr td { padding: 5px 8px; }
          .totals-table .total-row { font-size: 16px; font-weight: 800; color: #1e3a8a; border-top: 2px solid #1e3a8a; }
          .terms { background: #f8fafc; border-left: 3.5px solid #2563eb; padding: 12px 15px; border-radius: 0 8px 8px 0; font-size: 11px; color: #475569; margin-bottom: 20px; }
          .terms h4 { margin: 0 0 6px 0; font-size: 12px; color: #0f172a; text-transform: uppercase; }
          .terms ul { margin: 0; padding-left: 18px; }
          .footer { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 11px; color: #9ca3af; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <h1>DASFUSION STORE</h1>
            <p><strong>Razón Social:</strong> DASFUSION STORE C.A. • <strong>RUC:</strong> 1792994123001</p>
            <p><strong>Dirección:</strong> Av. Amazonas N24-15 y Colón, Edif. Torres del Parque, Quito - Ecuador</p>
            <p><strong>Contacto:</strong> ventas@dasfusion.ec | Tel: +593 99 123 4567 | www.dasfusion.store</p>
          </div>
          <div class="quote-box">
            <span class="quote-badge">COTIZACIÓN / PROFORMA</span>
            <p class="quote-num">${qNum}</p>
            <p class="quote-date"><strong>Fecha de Emisión:</strong> ${qDate}</p>
            <p class="quote-date"><strong>Válido Hasta:</strong> ${qVal}</p>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <p style="color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 10px;">Cliente / Solicitante</p>
            <p style="font-weight: 700; font-size: 13px; color: #111827;">Cliente Particular / Corporativo</p>
            <p style="color: #4b5563;">Atención comercial tienda web</p>
          </div>
          <div>
            <p style="color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 10px;">Condiciones Comerciales</p>
            <p><strong>Forma de Pago:</strong> Transferencia Bancaria Directa / Tarjeta de Crédito</p>
            <p><strong>Garantía:</strong> 1 Año Oficial de Fábrica por componente</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>Descripción del Producto</th>
              <th style="width: 60px; text-align: center;">Cant.</th>
              <th style="width: 100px; text-align: right;">Precio Unit.</th>
              <th style="width: 100px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="totals-wrap">
          <table class="totals-table">
            <tr>
              <td style="color: #6b7280;">Subtotal:</td>
              <td style="text-align: right; font-family: monospace; font-weight: 600;">${fmt(subtotal)}</td>
            </tr>
            ${discount > 0 ? `
              <tr>
                <td style="color: #059669;">Descuento aplicado:</td>
                <td style="text-align: right; font-family: monospace; font-weight: 600; color: #059669;">-${fmt(discount)}</td>
              </tr>
            ` : ''}
            <tr>
              <td style="color: #6b7280;">Envío estimado:</td>
              <td style="text-align: right; font-family: monospace; font-weight: 600;">${shipping === 0 ? 'GRATIS' : fmt(shipping)}</td>
            </tr>
            <tr>
              <td style="color: #6b7280;">IVA (${taxRate}%):</td>
              <td style="text-align: right; font-family: monospace; font-weight: 600;">${fmt(tax)}</td>
            </tr>
            <tr class="total-row">
              <td style="padding-top: 8px;">TOTAL COTIZADO:</td>
              <td style="text-align: right; padding-top: 8px; font-family: monospace;">${fmt(total)}</td>
            </tr>
          </table>
        </div>

        <div class="terms">
          <h4>Términos & Cuentas Autorizadas</h4>
          <ul>
            <li>Precios expresados en Dólares de los Estados Unidos (USD), incluyen impuestos de ley (IVA).</li>
            <li><strong>Datos Generales del Beneficiario:</strong>
              <br/>• Titular: Omar David Santillán Fernández | CI: 1715593388 | Teléfono: 0987148786 | Correo: pagos@dasfusion.ec
            </li>
            <li><strong>Cuentas Bancarias Autorizadas:</strong>
              <br/>• Banco Internacional: Cuenta de Ahorros N° 808083672
              <br/>• Banco Guayaquil (Peigo): Cuenta de Ahorros N° 0061661586
              <br/>• Produbanco: Cuenta Digital N° 20002218923
              <br/>• Banco General Rumiñahui (BGR): Cuenta de Ahorro N° 8687596500
            </li>
            <li>Para validar tu pago, envía tu comprobante por WhatsApp al <strong>+593 98 714 8786</strong> (0987148786) o a <strong>pagos@dasfusion.ec</strong> adjuntando el N° ${qNum}.</li>
          </ul>
        </div>

        <div class="footer">
          <p>Documento informativo no tributario emitido por DasFusion Store • www.dasfusion.store • Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    }
  }
}
