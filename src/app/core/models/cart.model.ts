import { Product, ProductVariant, ProductBundle } from './product.model';

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  variant?: ProductVariant;
  bundle?: ProductBundle;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface PaymentMethod {
  type: 'credit_card' | 'paypal' | 'crypto' | 'bank_transfer';
  provider?: string;
  details?: Record<string, string>;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  items: CartItem[];
  summary: CartSummary;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}
