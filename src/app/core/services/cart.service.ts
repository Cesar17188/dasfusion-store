import { Injectable, computed, signal } from '@angular/core';
import { CartItem, CartSummary } from '../models/cart.model';
import { Product, ProductVariant, ProductBundle } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>([]);
  private readonly couponSignal = signal<{ code: string; discountPercentage: number } | null>(null);

  readonly items = this.itemsSignal.asReadonly();
  readonly itemCount = computed(() =>
    this.itemsSignal().reduce((acc, item) => acc + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.itemsSignal().reduce((acc, item) => acc + item.totalPrice, 0)
  );

  readonly discount = computed(() => {
    const coupon = this.couponSignal();
    if (!coupon) return 0;
    return (this.subtotal() * coupon.discountPercentage) / 100;
  });

  readonly shipping = computed(() => {
    const sub = this.subtotal();
    if (sub === 0) return 0;
    return sub >= 150 ? 0 : 15; // Free shipping over $150
  });

  readonly tax = computed(() => {
    return (this.subtotal() - this.discount()) * 0.16; // 16% Tax
  });

  readonly total = computed(() => {
    return Math.max(0, this.subtotal() - this.discount() + this.shipping() + this.tax());
  });

  readonly summary = computed<CartSummary>(() => ({
    items: this.itemsSignal(),
    itemCount: this.itemCount(),
    subtotal: this.subtotal(),
    discount: this.discount(),
    shipping: this.shipping(),
    tax: this.tax(),
    total: this.total(),
    couponCode: this.couponSignal()?.code
  }));

  constructor() {
    this.loadPersistedCart();
  }

  private loadPersistedCart(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('das_cart');
      if (saved) {
        try {
          this.itemsSignal.set(JSON.parse(saved));
        } catch {
          this.clearCart();
        }
      }
    }
  }

  private persistCart(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('das_cart', JSON.stringify(this.itemsSignal()));
    }
  }

  addItem(product: Product, variant?: ProductVariant, bundle?: ProductBundle, quantity = 1): void {
    const itemId = `${product.id}_${variant?.id || 'default'}_${bundle?.id || 'none'}`;
    const unitPrice = bundle ? bundle.price : variant ? variant.price : product.price;

    this.itemsSignal.update((items) => {
      const existingIndex = items.findIndex((i) => i.id === itemId);
      if (existingIndex > -1) {
        const updated = [...items];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalPrice: newQty * unitPrice
        };
        return updated;
      }

      const newItem: CartItem = {
        id: itemId,
        productId: product.id,
        product,
        variant,
        bundle,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity
      };
      return [...items, newItem];
    });

    this.persistCart();
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    this.itemsSignal.update((items) =>
      items.map((item) =>
        item.id === itemId
          ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
          : item
      )
    );
    this.persistCart();
  }

  removeItem(itemId: string): void {
    this.itemsSignal.update((items) => items.filter((item) => item.id !== itemId));
    this.persistCart();
  }

  clearCart(): void {
    this.itemsSignal.set([]);
    this.couponSignal.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('das_cart');
    }
  }

  applyCoupon(code: string): boolean {
    if (code.toUpperCase() === 'DASFUSION10') {
      this.couponSignal.set({ code: 'DASFUSION10', discountPercentage: 10 });
      return true;
    }
    return false;
  }

  removeCoupon(): void {
    this.couponSignal.set(null);
  }
}
