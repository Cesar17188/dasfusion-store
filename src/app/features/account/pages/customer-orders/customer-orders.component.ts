import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, AdminSalesOrderWithDetails } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderStatus } from '../../../../core/models/supabase.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import {
  PAYMENT_WHATSAPP_PHONE,
  PAYMENT_WHATSAPP_DISPLAY
} from '../../../../core/constants/bank-accounts.constant';

export interface OrderTrackingStep {
  key: OrderStatus;
  stepNumber: number;
  title: string;
  subtitle: string;
  description: string;
}

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyFormatPipe],
  templateUrl: './customer-orders.component.html'
})
export class CustomerOrdersComponent implements OnInit {
  readonly adminService = inject(AdminService);
  readonly authService = inject(AuthService);

  readonly paymentWhatsAppPhone = PAYMENT_WHATSAPP_PHONE;
  readonly paymentWhatsAppDisplay = PAYMENT_WHATSAPP_DISPLAY;

  readonly selectedFilter = signal<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  readonly searchQuery = signal<string>('');
  readonly selectedOrderDetail = signal<AdminSalesOrderWithDetails | null>(null);
  readonly isRefreshing = signal<boolean>(false);

  // Secuencia gráfica de las 4 etapas de un pedido
  readonly trackingSteps: OrderTrackingStep[] = [
    {
      key: 'pending',
      stepNumber: 1,
      title: 'Pedido Recibido',
      subtitle: 'Pendiente de verificación',
      description: 'Tu pedido ha sido registrado en el sistema y estamos verificando la confirmación de tu pago.'
    },
    {
      key: 'processing',
      stepNumber: 2,
      title: 'En Proceso',
      subtitle: 'Pago verificado y alistamiento',
      description: '¡Tu pago fue validado! Nuestro equipo técnico está preparando y embalando tus productos.'
    },
    {
      key: 'shipped',
      stepNumber: 3,
      title: 'Enviado / En Camino',
      subtitle: 'Despachado a destino',
      description: 'Tu pedido está en ruta hacia la dirección indicada o listo para retiro en nuestra tienda física.'
    },
    {
      key: 'delivered',
      stepNumber: 4,
      title: 'Entregado',
      subtitle: 'Pedido finalizado',
      description: 'Tu pedido ha sido entregado satisfactoriamente. ¡Gracias por confiar en DasFusion Store!'
    }
  ];

  // Todos los pedidos pertenecientes a la cuenta del cliente (o realizados desde su sesión)
  readonly customerOrders = computed<AdminSalesOrderWithDetails[]>(() => {
    const allOrders = this.adminService.salesOrders();
    const user = this.authService.currentUser();
    const localIds = new Set(this.adminService.getCustomerOrderIds());

    if (!user) {
      // Si no ha iniciado sesión, mostrar los pedidos realizados en este navegador
      if (localIds.size > 0) {
        return allOrders.filter((o) => localIds.has(o.id));
      }
      return [];
    }

    const userEmail = (user.email || '').trim().toLowerCase();
    const userName = (user.name || '').trim().toLowerCase();

    const matched = allOrders.filter((o) => {
      if (localIds.has(o.id)) return true;
      if (o.customer_id && o.customer_id === user.id) return true;
      if (userEmail && o.customer_email?.toLowerCase() === userEmail) return true;
      if (userEmail && o.customer?.email?.toLowerCase() === userEmail) return true;
      if (userEmail && o.shipping_address?.toLowerCase().includes(userEmail)) return true;
      if (userName && userName.length > 3 && o.customer_name?.toLowerCase() === userName) return true;
      return false;
    });

    // Si es una cuenta demo o administrador sin coincidencias directas por email, mostrar los pedidos disponibles
    if (matched.length === 0 && (this.authService.isAdmin() || user.id === 'usr_001' || user.id === 'adm_001')) {
      return allOrders;
    }

    return matched;
  });

  // Pedidos activos (que NO están cancelados ni terminados/entregados)
  readonly activeOrders = computed<AdminSalesOrderWithDetails[]>(() =>
    this.customerOrders().filter((o) => this.isOrderActive(o.status))
  );

  readonly completedOrdersCount = computed<number>(() =>
    this.customerOrders().filter((o) => o.status === 'delivered').length
  );

  readonly cancelledOrdersCount = computed<number>(() =>
    this.customerOrders().filter((o) => o.status === 'cancelled').length
  );

  // Lista filtrada para la sección de Historial de Pedidos
  readonly filteredHistoryOrders = computed<AdminSalesOrderWithDetails[]>(() => {
    let list = this.customerOrders();
    const filter = this.selectedFilter();
    const q = this.searchQuery().toLowerCase().trim();

    if (filter === 'ACTIVE') {
      list = list.filter((o) => this.isOrderActive(o.status));
    } else if (filter === 'COMPLETED') {
      list = list.filter((o) => o.status === 'delivered');
    } else if (filter === 'CANCELLED') {
      list = list.filter((o) => o.status === 'cancelled');
    }

    if (q) {
      const cleanQ = q.replace(/^#|^das-/i, '');
      list = list.filter((o) => {
        const idMatch = o.id.toLowerCase().includes(q) || o.id.toLowerCase().includes(cleanQ);
        const addrMatch = (o.shipping_address || '').toLowerCase().includes(q);
        const itemMatch = o.items.some(
          (it) =>
            (it.variant?.variant_name || '').toLowerCase().includes(q) ||
            (it.product?.model || '').toLowerCase().includes(q)
        );
        return idMatch || addrMatch || itemMatch;
      });
    }

    return list;
  });

  async ngOnInit(): Promise<void> {
    await this.refreshOrders();
  }

  async refreshOrders(): Promise<void> {
    this.isRefreshing.set(true);
    try {
      await this.adminService.fetchSalesOrders();
    } finally {
      this.isRefreshing.set(false);
    }
  }

  isOrderActive(status: OrderStatus): boolean {
    return status !== 'cancelled' && status !== 'delivered';
  }

  getStepIndex(status: OrderStatus): number {
    switch (status) {
      case 'pending':
        return 0;
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
        return 3;
      default:
        return -1;
    }
  }

  getProgressPercentage(status: OrderStatus): number {
    switch (status) {
      case 'pending':
        return 15;
      case 'processing':
        return 50;
      case 'shipped':
        return 82;
      case 'delivered':
        return 100;
      default:
        return 0;
    }
  }

  isStepCompleted(orderStatus: OrderStatus, stepIndex: number): boolean {
    const currentIdx = this.getStepIndex(orderStatus);
    if (currentIdx === -1) return false;
    return stepIndex < currentIdx || orderStatus === 'delivered';
  }

  isStepCurrent(orderStatus: OrderStatus, stepIndex: number): boolean {
    if (orderStatus === 'delivered' || orderStatus === 'cancelled') return false;
    return this.getStepIndex(orderStatus) === stepIndex;
  }

  getCurrentStepInfo(status: OrderStatus): OrderTrackingStep {
    return this.trackingSteps.find((s) => s.key === status) || this.trackingSteps[0];
  }

  getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'En Proceso';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
    }
  }

  getCleanDeliveryAddress(rawAddress: string): string {
    if (!rawAddress) return 'Dirección registrada';
    const deliverySplit = rawAddress.split(' - Entrega:');
    if (deliverySplit.length > 1) {
      return deliverySplit[1].trim();
    }
    const dirMatch = rawAddress.match(/Dir:\s*([^|\]]+)/i);
    if (dirMatch) {
      return dirMatch[1].trim();
    }
    return rawAddress;
  }

  getWhatsAppSupportUrl(order: AdminSalesOrderWithDetails): string {
    const shortId = order.id.slice(0, 8);
    const orderNum = `DAS-${shortId.toUpperCase()}`;
    const msg =
      `¡Hola! Deseo consultar / enviar el comprobante de mi pedido en DasFusion Store.\n` +
      `*ID del Pedido:* #${shortId} (${orderNum})\n` +
      `*Código de Orden:* ${order.id}\n` +
      `*Estado actual:* ${this.getStatusLabel(order.status)}\n` +
      `*Total:* $${Number(order.total || 0).toFixed(2)}`;
    return `https://wa.me/${this.paymentWhatsAppPhone}?text=${encodeURIComponent(msg)}`;
  }

  openOrderDetail(order: AdminSalesOrderWithDetails): void {
    this.selectedOrderDetail.set(order);
  }
}

