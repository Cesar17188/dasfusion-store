import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ProductSpecification } from '../models/product.model';
import {
  DbProfile,
  DbProduct,
  DbProductVariant,
  DbCategory,
  DbBrand,
  DbSalesOrder,
  DbSalesOrderItem,
  DbPurchaseOrder,
  DbPurchaseOrderItem,
  DbSupplier,
  DbCrmLead,
  DbCrmInteraction,
  DbCrmSupportTicket,
  OrderStatus,
  LeadStage,
  TicketStatus,
  TicketPriority
} from '../models/supabase.model';

export interface AdminProductWithVariants extends DbProduct {
  category?: DbCategory;
  brand?: DbBrand;
  variants: DbProductVariant[];
}

export interface AdminSalesOrderWithDetails extends DbSalesOrder {
  customer?: DbProfile;
  tax_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  billing_address?: string | null;
  payment_receipt_url?: string | null;
  items: Array<DbSalesOrderItem & { variant?: DbProductVariant; product?: DbProduct }>;
}

export interface AdminPurchaseOrderWithDetails extends DbPurchaseOrder {
  supplier?: DbSupplier;
  items: Array<DbPurchaseOrderItem & { variant?: DbProductVariant }>;
}

import { TaxService } from './tax.service';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly supabase = inject(SupabaseService);
  readonly taxService = inject(TaxService);
  private readonly productService = inject(ProductService);

  // Reactive State Signals
  readonly leads = signal<DbCrmLead[]>([]);
  readonly interactions = signal<DbCrmInteraction[]>([]);
  readonly tickets = signal<DbCrmSupportTicket[]>([]);
  readonly salesOrders = signal<AdminSalesOrderWithDetails[]>([]);
  readonly purchaseOrders = signal<AdminPurchaseOrderWithDetails[]>([]);
  readonly suppliers = signal<DbSupplier[]>([]);
  readonly customers = signal<DbProfile[]>([]);
  readonly products = signal<AdminProductWithVariants[]>([]);
  readonly categories = signal<DbCategory[]>([]);
  readonly brands = signal<DbBrand[]>([]);
  readonly isLoading = signal<boolean>(false);

  // CRM Computed KPIs
  readonly totalPipelineValue = computed(() =>
    this.leads().reduce((sum, l) => sum + (Number(l.estimated_budget) || 0), 0)
  );

  readonly wonLeadsCount = computed(() =>
    this.leads().filter((l) => l.stage === 'closed_won').length
  );

  readonly activeTicketsCount = computed(() =>
    this.tickets().filter((t) => t.status === 'open' || t.status === 'in_progress').length
  );

  // Sales Computed KPIs
  readonly totalRevenue = computed(() =>
    this.salesOrders()
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total || 0), 0)
  );

  readonly totalPurchases = computed(() =>
    this.purchaseOrders().reduce((sum, p) => sum + Number(p.total_amount || 0), 0)
  );

  // Inventory Computed KPIs
  readonly totalVariantsCount = computed(() =>
    this.products().reduce((count, p) => count + (p.variants?.length || 0), 0)
  );

  readonly lowStockVariants = computed(() => {
    const list: Array<{ product: DbProduct; variant: DbProductVariant }> = [];
    this.products().forEach((p) => {
      p.variants?.forEach((v) => {
        if (v.stock <= 5) {
          list.push({ product: p, variant: v });
        }
      });
    });
    return list;
  });

  constructor() {
    this.loadAllData();
  }

  async loadAllData(): Promise<void> {
    this.isLoading.set(true);
    try {
      await Promise.allSettled([
        this.fetchProfiles(),
        this.fetchCategoriesAndBrands(),
        this.fetchProductsAndVariants(),
        this.fetchSalesOrders(),
        this.fetchSuppliersAndPurchases(),
        this.fetchCrmData()
      ]);
    } catch {
      // If any network issue, fallback mock data is already populated
    } finally {
      this.isLoading.set(false);
    }
  }

  // ====================================================================
  // 1. PROFILES / CUSTOMERS
  // ====================================================================
  async fetchProfiles(): Promise<void> {
    try {
      const { data, error } = await this.supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        this.customers.set(data as DbProfile[]);
        return;
      }
    } catch (err) {
      console.error('Error al cargar perfiles desde Supabase:', err);
    }
    this.customers.set([]);
  }

  async createCustomer(customer: Partial<DbProfile>): Promise<DbProfile> {
    const newCustomer: DbProfile = {
      id: customer.id || crypto.randomUUID(),
      role: customer.role || 'customer',
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      phone: customer.phone || null,
      address: customer.address || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await this.supabase.from('profiles').insert(newCustomer as any).select().single();
      if (!error && data) {
        this.customers.update((prev) => [data as DbProfile, ...prev]);
        return data as DbProfile;
      }
    } catch {}

    this.customers.update((prev) => [newCustomer, ...prev]);
    return newCustomer;
  }

  // ====================================================================
  // 2. CATEGORIES & BRANDS (WITH SUBCATEGORIES & BRAND LINKING)
  // ====================================================================
  async fetchCategoriesAndBrands(): Promise<void> {
    try {
      let [catRes, brandRes] = await Promise.all([
        this.supabase.publicFrom('categories').select('*').order('name'),
        this.supabase.publicFrom('brands').select('*').order('name')
      ]);

      if (catRes.error || brandRes.error) {
        [catRes, brandRes] = await Promise.all([
          this.supabase.from('categories').select('*').order('name'),
          this.supabase.from('brands').select('*').order('name')
        ]);
      }

      if (!catRes.error && catRes.data) {
        this.categories.set((catRes.data as any[]).map((c) => ({
          ...c,
          is_active: c.is_active ?? true
        })));
      } else {
        this.categories.set([]);
      }

      if (!brandRes.error && brandRes.data) {
        this.brands.set((brandRes.data as any[]).map((b) => ({
          ...b,
          is_active: b.is_active ?? true,
          category_ids: b.category_ids || (b.category_id ? [b.category_id] : [])
        })));
      } else {
        this.brands.set([]);
      }
    } catch (err) {
      console.error('Error al cargar categorías y marcas desde Supabase:', err);
      this.categories.set([]);
      this.brands.set([]);
    }
  }

  // --- Category CRUD ---
  async createCategory(cat: { name: string; slug?: string; parent_id?: string | null; is_active?: boolean }): Promise<DbCategory> {
    const slug = cat.slug || cat.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newCategory: DbCategory = {
      id: crypto.randomUUID(),
      name: cat.name.trim(),
      slug,
      parent_id: cat.parent_id || null,
      is_active: cat.is_active ?? true
    };

    try {
      const { data, error } = await (this.supabase.from('categories') as any).insert({
        id: newCategory.id,
        name: newCategory.name,
        slug: newCategory.slug,
        parent_id: newCategory.parent_id,
        is_active: newCategory.is_active
      }).select().single();

      if (error) {
        console.error('❌ Error al guardar categoría en Supabase:', error.message, error);
        throw new Error(error.message || 'Error al guardar categoría en Supabase');
      }

      if (data) {
        newCategory.id = data.id;
        console.log('✅ Categoría guardada exitosamente en Supabase:', newCategory.id, newCategory.name);
      }
    } catch (err: any) {
      console.error('❌ Fallo al insertar categoría en Supabase:', err);
      throw err;
    }

    this.categories.update((prev) => [...prev, newCategory]);
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<DbCategory>): Promise<DbCategory | null> {
    let updatedCat: DbCategory | null = null;
    this.categories.update((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updatedCat = { ...c, ...updates };
          return updatedCat;
        }
        return c;
      })
    );

    if (updatedCat) {
      try {
        const payload: any = {
          name: (updatedCat as DbCategory).name,
          slug: (updatedCat as DbCategory).slug,
          parent_id: (updatedCat as DbCategory).parent_id,
          is_active: (updatedCat as DbCategory).is_active ?? true
        };
        const { error } = await (this.supabase.from('categories') as any).update(payload).eq('id', id);
        if (error) {
          console.error('❌ Error al actualizar categoría en Supabase:', error.message, error);
        }
      } catch (err) {
        console.warn('Error al actualizar categoría en Supabase:', err);
      }
    }
    return updatedCat;
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await (this.supabase.from('categories') as any).delete().eq('id', id);
      if (error) {
        console.error('❌ Error al eliminar categoría en Supabase:', error.message, error);
      }
    } catch {}

    // Remove category and any child subcategories
    this.categories.update((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
    return true;
  }

  async toggleCategoryStatus(id: string): Promise<void> {
    const target = this.categories().find((c) => c.id === id);
    if (!target) return;
    const newStatus = target.is_active === false;
    await this.updateCategory(id, { is_active: newStatus });
  }

  // --- Brand CRUD ---
  async createBrand(brand: { name: string; slug?: string; category_ids?: string[]; is_active?: boolean }): Promise<DbBrand> {
    const slug = brand.slug || brand.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newBrand: DbBrand = {
      id: crypto.randomUUID(),
      name: brand.name.trim(),
      slug,
      category_ids: brand.category_ids || [],
      category_id: brand.category_ids?.[0] || null,
      is_active: brand.is_active ?? true
    };

    try {
      const { data, error } = await (this.supabase.from('brands') as any).insert({
        id: newBrand.id,
        name: newBrand.name,
        slug: newBrand.slug,
        is_active: newBrand.is_active,
        category_ids: newBrand.category_ids
      }).select().single();

      if (error) {
        console.error('❌ Error al guardar marca en Supabase:', error.message, error);
        throw new Error(error.message || 'Error al guardar marca en Supabase');
      }

      if (data) {
        newBrand.id = data.id;
        console.log('✅ Marca guardada exitosamente en Supabase:', newBrand.id, newBrand.name);
      }
    } catch (err: any) {
      console.error('❌ Fallo al insertar marca en Supabase:', err);
      throw err;
    }

    this.brands.update((prev) => [...prev, newBrand]);
    return newBrand;
  }

  async updateBrand(id: string, updates: Partial<DbBrand>): Promise<DbBrand | null> {
    let updatedBrand: DbBrand | null = null;
    this.brands.update((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          updatedBrand = { ...b, ...updates };
          return updatedBrand;
        }
        return b;
      })
    );

    if (updatedBrand) {
      try {
        const payload: any = {
          name: (updatedBrand as DbBrand).name,
          slug: (updatedBrand as DbBrand).slug,
          is_active: (updatedBrand as DbBrand).is_active ?? true,
          category_ids: (updatedBrand as DbBrand).category_ids || []
        };
        await (this.supabase.from('brands') as any).update(payload).eq('id', id);
      } catch (err) {
        console.warn('Error al actualizar marca en Supabase:', err);
      }
    }
    return updatedBrand;
  }

  async deleteBrand(id: string): Promise<boolean> {
    try {
      await (this.supabase.from('brands') as any).delete().eq('id', id);
    } catch {}

    this.brands.update((prev) => prev.filter((b) => b.id !== id));
    return true;
  }

  async toggleBrandStatus(id: string): Promise<void> {
    const target = this.brands().find((b) => b.id === id);
    if (!target) return;
    const newStatus = target.is_active === false;
    await this.updateBrand(id, { is_active: newStatus });
  }

  /**
   * Returns only active brands linked to a given category ID (or all active brands if no category selected).
   * Checks bidirectional taxonomy: direct assignment, parent category, and child/sibling subcategories.
   */
  getBrandsForCategory(categoryId?: string | null): DbBrand[] {
    const activeBrands = this.brands().filter((b) => b.is_active !== false);
    if (!categoryId || categoryId === 'ALL') {
      return activeBrands;
    }

    const categories = this.categories();
    const catObj = categories.find((c) => c.id === categoryId);

    // Build complete set of related category IDs in the taxonomy tree
    const relatedCatIds = new Set<string>();
    relatedCatIds.add(categoryId);

    if (catObj?.parent_id) {
      // It's a subcategory: include its parent and all sibling subcategories
      relatedCatIds.add(catObj.parent_id);
      for (const c of categories) {
        if (c.parent_id === catObj.parent_id) {
          relatedCatIds.add(c.id);
        }
      }
    } else {
      // It's a parent category: include all child subcategories
      for (const c of categories) {
        if (c.parent_id === categoryId) {
          relatedCatIds.add(c.id);
        }
      }
    }

    return activeBrands.filter((b) => {
      const brandCatIds = Array.isArray(b.category_ids) && b.category_ids.length > 0
        ? b.category_ids
        : (b.category_id ? [b.category_id] : []);

      // If brand has no specific categories assigned, it is considered generic/available everywhere
      if (brandCatIds.length === 0) return true;

      return brandCatIds.some((id) => relatedCatIds.has(id));
    });
  }

  // ====================================================================
  // 3. PRODUCTS & VARIANTS
  // ====================================================================
  async fetchProductsAndVariants(): Promise<void> {
    try {
      let [prodRes, varRes] = await Promise.all([
        (this.supabase.publicFrom('products') as any).select('*').order('created_at', { ascending: false }),
        (this.supabase.publicFrom('product_variants') as any).select('*')
      ]);

      if (prodRes.error || varRes.error) {
        [prodRes, varRes] = await Promise.all([
          (this.supabase.from('products') as any).select('*').order('created_at', { ascending: false }),
          (this.supabase.from('product_variants') as any).select('*')
        ]);
      }

      const { data: prodData, error: prodErr } = prodRes;
      const { data: varData, error: varErr } = varRes;

      if (!prodErr && !varErr && prodData) {
        const productsList = prodData as DbProduct[];
        const rawVariants = (varData || []) as DbProductVariant[];

        const variantsList: DbProductVariant[] = rawVariants.map((v) => {
          const phys = v.attributes?.['stock_physical'] !== undefined ? Number(v.attributes['stock_physical']) : (Number(v.stock) || 0);
          const virt = v.attributes?.['stock_virtual'] !== undefined ? Number(v.attributes['stock_virtual']) : 0;
          const compareAt = v.attributes?.['compare_at_price'] !== undefined
            ? (v.attributes['compare_at_price'] !== null ? Number(v.attributes['compare_at_price']) : undefined)
            : (v.compare_at_price !== undefined && v.compare_at_price !== null ? Number(v.compare_at_price) : undefined);
          const discPct = v.attributes?.['discount_percent'] !== undefined
            ? (v.attributes['discount_percent'] !== null ? Number(v.attributes['discount_percent']) : undefined)
            : (compareAt && compareAt > Number(v.price) ? Math.round(((compareAt - Number(v.price)) / compareAt) * 100) : undefined);

          return {
            ...v,
            compare_at_price: compareAt,
            discount_percent: discPct,
            stock_physical: phys,
            stock_virtual: virt,
            stock: phys + virt
          };
        });

        const fullProducts: AdminProductWithVariants[] = productsList.map((p) => {
          const variants = variantsList.filter((v) => v.product_id === p.id);
          const category = this.categories().find((c) => c.id === p.category_id);
          const brand = this.brands().find((b) => b.id === p.brand_id);
          return {
            ...p,
            images: Array.isArray(p.images) ? p.images : [],
            specifications: Array.isArray(p.specifications) ? p.specifications : [],
            category,
            brand,
            variants
          };
        });
        this.products.set(fullProducts);
        return;
      }
    } catch (err) {
      console.error('Error al cargar productos en Admin desde Supabase:', err);
    }

    this.products.set([]);
  }

  async updateVariantStock(variantId: string, physicalStock: number, virtualStock?: number): Promise<void> {
    const existing = this.products().flatMap((p) => p.variants).find((v) => v.id === variantId);
    const phys = Math.max(0, Number(physicalStock) || 0);
    const virt = Math.max(0, virtualStock !== undefined ? Number(virtualStock) || 0 : (existing?.stock_virtual ?? 0));
    const total = phys + virt;
    const updatedAttributes = {
      ...(existing?.attributes || {}),
      stock_physical: phys,
      stock_virtual: virt,
      compare_at_price: existing?.compare_at_price ?? existing?.attributes?.['compare_at_price'] ?? null,
      discount_percent: existing?.discount_percent ?? existing?.attributes?.['discount_percent'] ?? null
    };

    try {
      await (this.supabase.from('product_variants') as any)
        .update({ stock: total, attributes: updatedAttributes })
        .eq('id', variantId);
    } catch (err) {
      console.error('Error al actualizar stock de variante en Supabase:', err);
    }

    this.products.update((prods) =>
      prods.map((p) => ({
        ...p,
        variants: p.variants.map((v) =>
          v.id === variantId
            ? {
                ...v,
                stock: total,
                stock_physical: phys,
                stock_virtual: virt,
                attributes: updatedAttributes
              }
            : v
        )
      }))
    );

    // Sincronizar de inmediato el stock en la vista pública de la tienda
    this.productService.updateVariantStockInStore(variantId, phys, virt);
  }

  /**
   * Descuenta una cantidad vendida del stock de la variante (priorizando stock físico y luego virtual)
   * y actualiza tanto Supabase como la vista de la tienda.
   */
  async deductVariantStockByQuantity(variantId: string, quantity: number): Promise<void> {
    const qty = Math.max(0, Number(quantity) || 0);
    if (!variantId || qty <= 0) return;

    const existing = this.products().flatMap((p) => p.variants).find((v) => v.id === variantId);
    let currentPhys = existing?.stock_physical ?? (Number(existing?.stock) || 0);
    let currentVirt = existing?.stock_virtual ?? 0;

    if (!existing) {
      try {
        const { data } = await (this.supabase.from('product_variants') as any)
          .select('*')
          .eq('id', variantId)
          .maybeSingle();
        if (data) {
          currentPhys = data.attributes?.['stock_physical'] !== undefined
            ? Number(data.attributes['stock_physical'])
            : (Number(data.stock) || 0);
          currentVirt = data.attributes?.['stock_virtual'] !== undefined
            ? Number(data.attributes['stock_virtual'])
            : 0;
        }
      } catch {}
    }

    let newPhys = currentPhys;
    let newVirt = currentVirt;

    if (newPhys >= qty) {
      newPhys -= qty;
    } else {
      const remainder = qty - newPhys;
      newPhys = 0;
      newVirt = Math.max(0, newVirt - remainder);
    }

    await this.updateVariantStock(variantId, newPhys, newVirt);
  }

  /**
   * Restituye una cantidad cancelada al inventario de la variante tanto en Supabase como en la tienda pública.
   */
  async restoreVariantStockByQuantity(variantId: string, quantity: number): Promise<void> {
    const qty = Math.max(0, Number(quantity) || 0);
    if (!variantId || qty <= 0) return;

    const existing = this.products().flatMap((p) => p.variants).find((v) => v.id === variantId);
    let currentPhys = existing?.stock_physical ?? (Number(existing?.stock) || 0);
    let currentVirt = existing?.stock_virtual ?? 0;

    try {
      const { data } = await (this.supabase.from('product_variants') as any)
        .select('*')
        .eq('id', variantId)
        .maybeSingle();
      if (data) {
        currentPhys = data.attributes?.['stock_physical'] !== undefined
          ? Number(data.attributes['stock_physical'])
          : (Number(data.stock) || 0);
        currentVirt = data.attributes?.['stock_virtual'] !== undefined
          ? Number(data.attributes['stock_virtual'])
          : 0;
      }
    } catch {}

    const newPhys = Math.max(0, currentPhys) + qty;
    const newVirt = Math.max(0, currentVirt);

    await this.updateVariantStock(variantId, newPhys, newVirt);
  }

  async updateVariantPrice(variantId: string, newPrice: number): Promise<void> {
    const existing = this.products().flatMap((p) => p.variants).find((v) => v.id === variantId);
    let compareAt = existing?.compare_at_price ?? existing?.attributes?.['compare_at_price'];
    let discPct: number | undefined = undefined;

    if (compareAt && compareAt > newPrice) {
      discPct = Math.round(((compareAt - newPrice) / compareAt) * 100);
    } else {
      compareAt = undefined;
    }

    const updatedAttrs = {
      ...(existing?.attributes || {}),
      compare_at_price: compareAt ?? null,
      discount_percent: discPct ?? null
    };

    try {
      await (this.supabase.from('product_variants') as any).update({ price: newPrice, attributes: updatedAttrs }).eq('id', variantId);
    } catch {}

    this.products.update((prods) =>
      prods.map((p) => ({
        ...p,
        variants: p.variants.map((v) => (v.id === variantId ? {
          ...v,
          price: newPrice,
          compare_at_price: compareAt,
          discount_percent: discPct,
          attributes: updatedAttrs
        } : v))
      }))
    );
  }

  async updateVariantDiscount(
    variantId: string,
    options: {
      discountPercent?: number | null;
      compareAtPrice?: number | null;
      newPrice?: number;
    }
  ): Promise<void> {
    const existing = this.products().flatMap((p) => p.variants).find((v) => v.id === variantId);
    if (!existing) return;

    let compareAt: number | null | undefined = options.compareAtPrice !== undefined
      ? options.compareAtPrice
      : (existing.compare_at_price ?? existing.attributes?.['compare_at_price']);
    let discPct: number | null | undefined = options.discountPercent !== undefined
      ? options.discountPercent
      : (existing.discount_percent ?? existing.attributes?.['discount_percent']);
    let finalPrice = options.newPrice !== undefined
      ? Math.max(0, Number(options.newPrice) || 0)
      : Number(existing.price) || 0;

    if (options.discountPercent !== undefined) {
      if (options.discountPercent !== null && options.discountPercent > 0) {
        // Base regular price is previous compare_at_price (if item was already discounted) or current price
        const basePrice = (existing.compare_at_price && existing.compare_at_price > existing.price)
          ? existing.compare_at_price
          : existing.price;
        compareAt = basePrice;
        discPct = Math.min(99, Math.max(1, Math.round(options.discountPercent)));
        finalPrice = Math.max(0, Math.round((basePrice * (1 - discPct / 100)) * 100) / 100);
      } else {
        // Remove discount: revert to base price if compare_at_price was set
        if (existing.compare_at_price && existing.compare_at_price > existing.price) {
          finalPrice = existing.compare_at_price;
        }
        compareAt = null;
        discPct = null;
      }
    } else if (options.compareAtPrice !== undefined) {
      if (options.compareAtPrice !== null && options.compareAtPrice > finalPrice) {
        compareAt = options.compareAtPrice;
        discPct = Math.round(((compareAt - finalPrice) / compareAt) * 100);
      } else {
        compareAt = null;
        discPct = null;
      }
    }

    const updatedAttrs = {
      ...(existing.attributes || {}),
      compare_at_price: compareAt ?? null,
      discount_percent: discPct ?? null
    };

    try {
      await (this.supabase.from('product_variants') as any)
        .update({
          price: finalPrice,
          attributes: updatedAttrs
        })
        .eq('id', variantId);
    } catch (err) {
      console.warn('Error al actualizar descuento de variante en Supabase:', err);
    }

    this.products.update((prods) =>
      prods.map((p) => ({
        ...p,
        variants: p.variants.map((v) =>
          v.id === variantId
            ? {
                ...v,
                price: finalPrice,
                compare_at_price: compareAt ? Number(compareAt) : undefined,
                discount_percent: discPct ? Number(discPct) : undefined,
                attributes: updatedAttrs
              }
            : v
        )
      }))
    );
  }

  async uploadProductImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { data, error } = await this.supabase.storage
        .from('products')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (!error && data) {
        const { data: publicUrlData } = this.supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (e) {
      console.warn('Supabase storage upload failed, fallback to base64 Data URL', e);
    }

    // Fallback to FileReader base64 Data URL if storage bucket is not yet configured
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  async createProductWithVariants(
    productData: {
      model: string;
      category_id: string;
      brand_id: string;
      short_description?: string;
      long_description?: string;
      product_type?: string;
      is_active?: boolean;
      images?: string[];
      specifications?: ProductSpecification[];
    },
    variantsData: Array<{
      sku: string;
      variant_name: string;
      price: number;
      compare_at_price?: number;
      discount_percent?: number;
      stock: number;
      stock_physical?: number;
      stock_virtual?: number;
      attributes?: Record<string, any>;
      is_bundle?: boolean;
    }>
  ): Promise<void> {
    const prodId = crypto.randomUUID();

    const newProd: DbProduct = {
      id: prodId,
      category_id: productData.category_id,
      brand_id: productData.brand_id,
      model: productData.model,
      short_description: productData.short_description || '',
      long_description: productData.long_description || '',
      product_type: productData.product_type || 'standalone',
      is_active: productData.is_active !== false,
      images: productData.images && productData.images.length > 0 ? productData.images : [],
      specifications: productData.specifications && productData.specifications.length > 0 ? productData.specifications : [],
      created_at: new Date().toISOString()
    };

    const newVariants: DbProductVariant[] = variantsData.map((v) => {
      const phys = v.stock_physical !== undefined ? Number(v.stock_physical) || 0 : (Number(v.stock) || 0);
      const virt = v.stock_virtual !== undefined ? Number(v.stock_virtual) || 0 : 0;
      const total = phys + virt;
      const compareAt = v.compare_at_price !== undefined ? Number(v.compare_at_price) : undefined;
      const discPct = v.discount_percent !== undefined ? Number(v.discount_percent) : undefined;
      const attrs = {
        ...(v.attributes || {}),
        stock_physical: phys,
        stock_virtual: virt,
        compare_at_price: compareAt ?? null,
        discount_percent: discPct ?? null
      };

      return {
        id: crypto.randomUUID(),
        product_id: prodId,
        sku: v.sku.trim(),
        variant_name: v.variant_name.trim() || 'Estándar',
        price: Number(v.price) || 0,
        compare_at_price: compareAt,
        discount_percent: discPct,
        stock: total,
        stock_physical: phys,
        stock_virtual: virt,
        attributes: attrs,
        is_bundle: !!v.is_bundle,
        created_at: new Date().toISOString()
      };
    });

    try {
      const { error: prodError } = await (this.supabase.from('products') as any).insert(newProd);
      if (prodError) {
        console.error('❌ Error al insertar producto en Supabase:', prodError.message, prodError);
        throw new Error(`Error en producto: ${prodError.message}`);
      }

      if (newVariants.length > 0) {
        // Prepare DB insert payload without ephemeral/non-column fields
        const insertPayload = newVariants.map((nv) => {
          const { stock_physical, stock_virtual, compare_at_price, discount_percent, ...dbFields } = nv;
          return dbFields;
        });
        const { error: varError } = await (this.supabase.from('product_variants') as any).insert(insertPayload);
        if (varError) {
          console.error('❌ Error al insertar variantes en Supabase:', varError.message, varError);
          throw new Error(`Error en variantes del producto: ${varError.message}`);
        }
      }
      console.log('✅ Producto y variantes guardados exitosamente en Supabase:', newProd.id, newProd.model);
    } catch (err: any) {
      console.error('❌ Fallo al guardar producto en Supabase:', err);
      throw err;
    }

    const category = this.categories().find((c) => c.id === newProd.category_id);
    const brand = this.brands().find((b) => b.id === newProd.brand_id);

    const fullProd: AdminProductWithVariants = {
      ...newProd,
      category,
      brand,
      variants: newVariants
    };

    this.products.update((prev) => [fullProd, ...prev]);
  }

  async createProductWithVariant(
    productData: {
      model: string;
      category_id: string;
      brand_id: string;
      short_description?: string;
      long_description?: string;
      product_type?: string;
      images?: string[];
      specifications?: ProductSpecification[];
    },
    variantData: {
      sku: string;
      variant_name: string;
      price: number;
      compare_at_price?: number;
      discount_percent?: number;
      stock: number;
      stock_physical?: number;
      stock_virtual?: number;
      attributes?: Record<string, any>;
      is_bundle?: boolean;
    }
  ): Promise<void> {
    return this.createProductWithVariants(productData, [variantData]);
  }

  async addVariantToProduct(
    productId: string,
    variantData: {
      sku: string;
      variant_name: string;
      price: number;
      compare_at_price?: number;
      discount_percent?: number;
      stock: number;
      stock_physical?: number;
      stock_virtual?: number;
      attributes?: Record<string, any>;
      is_bundle?: boolean;
    }
  ): Promise<DbProductVariant> {
    const phys = variantData.stock_physical !== undefined ? Number(variantData.stock_physical) || 0 : (Number(variantData.stock) || 0);
    const virt = variantData.stock_virtual !== undefined ? Number(variantData.stock_virtual) || 0 : 0;
    const total = phys + virt;
    const compareAt = variantData.compare_at_price !== undefined ? Number(variantData.compare_at_price) : undefined;
    const discPct = variantData.discount_percent !== undefined ? Number(variantData.discount_percent) : undefined;

    const attrs = {
      ...(variantData.attributes || {}),
      stock_physical: phys,
      stock_virtual: virt,
      compare_at_price: compareAt ?? null,
      discount_percent: discPct ?? null
    };

    const newVariant: DbProductVariant = {
      id: crypto.randomUUID(),
      product_id: productId,
      sku: variantData.sku.trim(),
      variant_name: variantData.variant_name.trim() || 'Nueva Edición',
      price: Number(variantData.price) || 0,
      compare_at_price: compareAt,
      discount_percent: discPct,
      stock: total,
      stock_physical: phys,
      stock_virtual: virt,
      attributes: attrs,
      is_bundle: !!variantData.is_bundle,
      created_at: new Date().toISOString()
    };

    try {
      const { stock_physical, stock_virtual, compare_at_price, discount_percent, ...dbFields } = newVariant;
      const { error } = await (this.supabase.from('product_variants') as any).insert(dbFields);
      if (error) {
        console.error('❌ Error al insertar variante en Supabase:', error.message, error);
        throw new Error(`Error al insertar variante: ${error.message}`);
      }
      console.log('✅ Variante guardada exitosamente en Supabase:', newVariant.id, newVariant.sku);
    } catch (err: any) {
      console.error('❌ Fallo al insertar variante en Supabase:', err);
      throw err;
    }

    this.products.update((prods) =>
      prods.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          variants: [...(p.variants || []), newVariant]
        };
      })
    );

    return newVariant;
  }

  async updateVariant(
    variantId: string,
    variantData: Partial<DbProductVariant>
  ): Promise<void> {
    const existing = this.products().flatMap((p) => p.variants).find((v) => v.id === variantId);
    const phys = variantData.stock_physical !== undefined
      ? Number(variantData.stock_physical) || 0
      : (existing?.stock_physical ?? (Number(existing?.stock) || 0));
    const virt = variantData.stock_virtual !== undefined
      ? Number(variantData.stock_virtual) || 0
      : (existing?.stock_virtual ?? 0);
    const total = (variantData.stock_physical !== undefined || variantData.stock_virtual !== undefined)
      ? (phys + virt)
      : (variantData.stock !== undefined ? Number(variantData.stock) || 0 : (existing?.stock ?? (phys + virt)));

    const compareAt = variantData.compare_at_price !== undefined
      ? variantData.compare_at_price
      : (existing?.compare_at_price ?? existing?.attributes?.['compare_at_price'] ?? null);

    const discPct = variantData.discount_percent !== undefined
      ? variantData.discount_percent
      : (existing?.discount_percent ?? existing?.attributes?.['discount_percent'] ?? null);

    const mergedAttrs = {
      ...(existing?.attributes || {}),
      ...(variantData.attributes || {}),
      stock_physical: phys,
      stock_virtual: virt,
      compare_at_price: compareAt,
      discount_percent: discPct
    };

    const dbPayload: any = {
      ...variantData,
      stock: total,
      attributes: mergedAttrs
    };
    delete dbPayload.stock_physical;
    delete dbPayload.stock_virtual;
    delete dbPayload.compare_at_price;
    delete dbPayload.discount_percent;

    try {
      await (this.supabase.from('product_variants') as any).update(dbPayload).eq('id', variantId);
    } catch {}

    this.products.update((prods) =>
      prods.map((p) => ({
        ...p,
        variants: (p.variants || []).map((v) =>
          v.id === variantId
            ? {
                ...v,
                ...variantData,
                compare_at_price: compareAt ?? undefined,
                discount_percent: discPct ?? undefined,
                stock: total,
                stock_physical: phys,
                stock_virtual: virt,
                attributes: mergedAttrs
              }
            : v
        )
      }))
    );
  }

  async deleteVariant(variantId: string): Promise<void> {
    try {
      await (this.supabase.from('product_variants') as any).delete().eq('id', variantId);
    } catch {}

    this.products.update((prods) =>
      prods.map((p) => ({
        ...p,
        variants: (p.variants || []).filter((v) => v.id !== variantId)
      }))
    );
  }

  async updateProduct(productId: string, data: Partial<DbProduct>): Promise<void> {
    try {
      await (this.supabase.from('products') as any).update(data).eq('id', productId);
    } catch {}

    this.products.update((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const updatedCat = data.category_id ? this.categories().find((c) => c.id === data.category_id) : p.category;
        const updatedBrand = data.brand_id ? this.brands().find((b) => b.id === data.brand_id) : p.brand;
        return {
          ...p,
          ...data,
          category: updatedCat,
          brand: updatedBrand
        };
      })
    );
  }

  async toggleProductStatus(productId: string): Promise<void> {
    const prod = this.products().find((p) => p.id === productId);
    if (!prod) return;
    const newStatus = !prod.is_active;
    await this.updateProduct(productId, { is_active: newStatus });
  }

  async deleteProducts(productIds: string[]): Promise<void> {
    if (!productIds || productIds.length === 0) return;
    try {
      const { error: vErr } = await (this.supabase.from('product_variants') as any).delete().in('product_id', productIds);
      if (vErr) {
        console.error('Error al eliminar variantes en base de datos:', vErr);
      }
      const { error: pErr } = await (this.supabase.from('products') as any).delete().in('id', productIds);
      if (pErr) {
        console.error('Error al eliminar productos en base de datos:', pErr);
      }
    } catch (err) {
      console.error('Error al eliminar productos en lote:', err);
    }

    const idSet = new Set(productIds);
    this.products.update((prev) => prev.filter((p) => !idSet.has(p.id)));
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.deleteProducts([productId]);
  }

  // ====================================================================
  // 4. SALES ORDERS & INVOICING / POS
  // ====================================================================
  private loadLocalOrders(): AdminSalesOrderWithDetails[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('das_saved_sales_orders');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [];
  }

  private saveLocalOrders(orders: AdminSalesOrderWithDetails[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('das_saved_sales_orders', JSON.stringify(orders));
    } catch {}
  }

  async fetchSalesOrders(): Promise<void> {
    let dbOrders: AdminSalesOrderWithDetails[] = [];
    try {
      const { data: orders, error: oErr } = await (this.supabase.from('sales_orders') as any).select('*').order('created_at', { ascending: false });
      const { data: items, error: iErr } = await (this.supabase.from('sales_order_items') as any).select('*');

      if (!oErr && !iErr && orders) {
        const ordersList = orders as DbSalesOrder[];
        const itemsList = (items || []) as DbSalesOrderItem[];

        dbOrders = ordersList.map((o) => {
          const customer = this.customers().find((c) => c.id === o.customer_id);
          const orderItems = itemsList
            .filter((it) => it.sales_order_id === o.id)
            .map((it) => {
              let variant: DbProductVariant | undefined;
              let product: DbProduct | undefined;
              for (const p of this.products()) {
                const foundV = p.variants?.find((v) => v.id === it.variant_id);
                if (foundV) {
                  variant = foundV;
                  product = p;
                  break;
                }
              }
              return { ...it, variant, product };
            });

          let parsedTaxId: string | undefined = o.tax_id || undefined;
          let parsedName: string | undefined = o.customer_name || undefined;
          let parsedPhone: string | undefined = o.customer_phone || undefined;
          let parsedEmail: string | undefined = o.customer_email || undefined;
          let parsedBillingAddress: string | undefined =
            o.billing_address && !o.billing_address.startsWith('[RECEIPT_IMG]:')
              ? o.billing_address
              : undefined;
          let parsedReceiptUrl: string | null = o.payment_receipt_url || null;

          if (!parsedReceiptUrl && o.billing_address?.startsWith('[RECEIPT_IMG]:')) {
            parsedReceiptUrl = o.billing_address.replace('[RECEIPT_IMG]:', '');
          }

          if (o.shipping_address) {
            const taxMatch = o.shipping_address.match(/CI\/RUC:\s*([^|\]]+)/i);
            if (!parsedTaxId && taxMatch) parsedTaxId = taxMatch[1].trim();
            const nameMatch = o.shipping_address.match(/Factura:\s*([^|\]]+)/i);
            if (!parsedName && nameMatch) parsedName = nameMatch[1].trim();
            const phoneMatch = o.shipping_address.match(/Tel:\s*([^|\]]+)/i);
            if (!parsedPhone && phoneMatch) parsedPhone = phoneMatch[1].trim();
            const emailMatch = o.shipping_address.match(/Email:\s*([^|\]]+)/i);
            if (!parsedEmail && emailMatch) parsedEmail = emailMatch[1].trim();
            const dirMatch = o.shipping_address.match(/Dir:\s*([^|\]]+)/i);
            if (!parsedBillingAddress && dirMatch) parsedBillingAddress = dirMatch[1].trim();
          }

          return {
            ...o,
            customer,
            tax_id: parsedTaxId,
            customer_name: parsedName,
            customer_phone: parsedPhone,
            customer_email: parsedEmail,
            billing_address: parsedBillingAddress,
            payment_receipt_url: parsedReceiptUrl,
            items: orderItems
          };
        });
      }
    } catch (err) {
      console.error('Error al cargar órdenes de venta desde Supabase:', err);
    }

    // Merge Supabase orders with locally saved orders (ensures no web/POS orders or receipts are ever lost)
    const localOrders = this.loadLocalOrders();
    const mergedMap = new Map<string, AdminSalesOrderWithDetails>();
    localOrders.forEach((o) => mergedMap.set(o.id, o));
    dbOrders.forEach((dbOrd) => {
      const localOrd = mergedMap.get(dbOrd.id);
      const effectiveReceipt = dbOrd.payment_receipt_url ?? localOrd?.payment_receipt_url ?? null;
      let effectiveStatus = dbOrd.status;
      if (localOrd?.status === 'cancelled') {
        effectiveStatus = 'cancelled';
      } else if (effectiveReceipt && effectiveStatus === 'pending') {
        effectiveStatus = 'processing';
      } else if (localOrd && localOrd.status !== 'pending' && dbOrd.status === 'pending') {
        effectiveStatus = localOrd.status;
      }

      mergedMap.set(dbOrd.id, {
        ...dbOrd,
        status: effectiveStatus,
        payment_receipt_url: effectiveReceipt
      });
    });

    const mergedList = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    this.salesOrders.set(mergedList);
    this.saveLocalOrders(mergedList);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const existingOrder = this.salesOrders().find((o) => o.id === orderId);
    const previousStatus = existingOrder?.status;

    // Un pedido ya cancelado no permite cambios de estado posteriores
    if (!existingOrder || previousStatus === 'cancelled' || previousStatus === status) return;

    // Si pasa de un estado activo a 'cancelled', restituir los productos al inventario
    if (status === 'cancelled') {
      await this.cancelOrderAndRestoreStock(orderId);
      return;
    }

    try {
      await (this.supabase.from('sales_orders') as any).update({ status }).eq('id', orderId);
    } catch {}

    this.salesOrders.update((orders) => {
      const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
      this.saveLocalOrders(updated);
      return updated;
    });
  }

  /**
   * Cancela un pedido y restituye cada producto/variante al inventario tanto en la base de datos
   * de Supabase como en la vista pública de la tienda.
   */
  async cancelOrderAndRestoreStock(orderId: string): Promise<void> {
    const order = this.salesOrders().find((o) => o.id === orderId);
    if (!order || order.status === 'cancelled') return;

    let itemsToRestore = order.items || [];

    // Si por algún motivo no hay ítems en memoria, consultarlos en sales_order_items de Supabase
    if (itemsToRestore.length === 0) {
      try {
        const { data } = await (this.supabase.from('sales_order_items') as any)
          .select('*')
          .eq('sales_order_id', orderId);
        if (Array.isArray(data) && data.length > 0) {
          itemsToRestore = data;
        }
      } catch {}
    }

    // Restituir cada ítem al inventario en base de datos y en la vista de la tienda
    for (const item of itemsToRestore) {
      if (item.variant_id && item.quantity > 0) {
        await this.restoreVariantStockByQuantity(item.variant_id, item.quantity);
      }
    }

    // Actualizar estado del pedido a 'cancelled' en Supabase
    try {
      await (this.supabase.from('sales_orders') as any)
        .update({ status: 'cancelled' })
        .eq('id', orderId);
    } catch (err) {
      console.error('Error al actualizar estado de orden cancelada en Supabase:', err);
    }

    // Actualizar estado local y reactivo de pedidos
    this.salesOrders.update((orders) => {
      const updated = orders.map((o) =>
        o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o
      );
      this.saveLocalOrders(updated);
      return updated;
    });

    // Sincronizar catálogo de la tienda con la base de datos para reflejar el stock restituido
    await this.productService.loadProductsFromDatabase();
  }

  async updateOrderTax(orderId: string, newTaxRate: number): Promise<void> {
    const order = this.salesOrders().find((o) => o.id === orderId);
    if (!order) return;
    const subtotal = order.subtotal;
    const tax = Math.round(subtotal * newTaxRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    try {
      await (this.supabase.from('sales_orders') as any).update({ tax, total }).eq('id', orderId);
    } catch (err) {
      console.warn('Could not persist updated tax to Supabase sales_orders:', err);
    }

    this.salesOrders.update((orders) => {
      const updated = orders.map((o) => (o.id === orderId ? { ...o, tax, total } : o));
      this.saveLocalOrders(updated);
      return updated;
    });
  }

  /**
   * Comprime una imagen en navegador para almacenamiento óptimo en base de datos
   */
  private compressReceiptImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = (err) => reject(err);
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (typeof document === 'undefined') {
          resolve(dataUrl);
          return;
        }
        const img = new Image();
        img.onerror = () => resolve(dataUrl);
        img.onload = () => {
          const maxDim = 1100;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Sube (opcionalmente) la imagen del comprobante de pago de un pedido y la guarda en la base de datos (sales_orders)
   */
  async uploadOrderPaymentReceipt(orderId: string, file: File): Promise<string> {
    let receiptUrl = '';

    // 1. Intentar subir al bucket de Supabase Storage si está habilitado
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `receipt_${orderId.slice(0, 8)}_${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { data, error } = await this.supabase.storage
        .from('products')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (!error && data) {
        const { data: publicUrlData } = this.supabase.storage
          .from('products')
          .getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          receiptUrl = publicUrlData.publicUrl;
        }
      }
    } catch {
      // Fallback a Data URL optimizada
    }

    // 2. Si Storage no devolvió URL pública, convertir y comprimir a Data URL para guardar en la tabla sales_orders
    if (!receiptUrl) {
      receiptUrl = await this.compressReceiptImage(file);
    }

    await this.updateOrderPaymentReceipt(orderId, receiptUrl);
    return receiptUrl;
  }

  /**
   * Guarda o elimina la URL/imagen del comprobante de pago en la tabla sales_orders de la base de datos.
   * Si se sube un comprobante (receiptUrl presente) y el pedido no está cancelado, cambia el estado automáticamente a 'processing' (En Proceso).
   */
  async updateOrderPaymentReceipt(orderId: string, receiptUrl: string | null): Promise<void> {
    const existingOrder = this.salesOrders().find((o) => o.id === orderId);
    const shouldMoveToProcessing = !!receiptUrl && existingOrder?.status !== 'cancelled';
    const nextStatus: OrderStatus | undefined = shouldMoveToProcessing
      ? 'processing'
      : existingOrder?.status;

    try {
      const updatePayload: Record<string, any> = {
        payment_receipt_url: receiptUrl
      };
      if (shouldMoveToProcessing) {
        updatePayload['status'] = 'processing';
      }

      const { error } = await (this.supabase.from('sales_orders') as any)
        .update(updatePayload)
        .eq('id', orderId);

      // Si la columna payment_receipt_url aún no ha sido creada en Supabase, respaldar en billing_address de sales_orders y actualizar status
      if (error) {
        const fallbackPayload: Record<string, any> = {
          billing_address: receiptUrl ? `[RECEIPT_IMG]:${receiptUrl}` : null
        };
        if (shouldMoveToProcessing) {
          fallbackPayload['status'] = 'processing';
        }
        await (this.supabase.from('sales_orders') as any)
          .update(fallbackPayload)
          .eq('id', orderId);
      }
    } catch (err) {
      console.warn('No se pudo persistir el comprobante en Supabase, guardado en estado local:', err);
    }

    this.salesOrders.update((orders) => {
      const updated = orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              payment_receipt_url: receiptUrl,
              status: nextStatus || o.status
            }
          : o
      );
      this.saveLocalOrders(updated);
      return updated;
    });
  }

  /**
   * Registra un pedido realizado desde la tienda web por un cliente
   */
  async placeCustomerOrder(payload: {
    orderId?: string;
    customerName: string;
    taxId?: string;
    customerEmail: string;
    customerPhone: string;
    billingAddress?: string;
    shippingAddress: string;
    paymentMethod?: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      unitPrice: number;
      productName?: string;
      sku?: string;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    taxRate?: number;
  }): Promise<AdminSalesOrderWithDetails> {
    const orderId = payload.orderId || crypto.randomUUID();
    const nameParts = payload.customerName.trim().split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || (payload.taxId ? `(${payload.taxId})` : 'General');
    const effectiveAddress = payload.billingAddress || payload.shippingAddress;

    // 1. Resolver o registrar perfil de cliente
    let customer = this.customers().find(
      (c) => c.email && c.email.toLowerCase() === payload.customerEmail.toLowerCase()
    );

    let customerId = customer?.id;
    let isProfileSavedInDb = !!customer;
    let newCustId = '';

    if (!customer) {
      newCustId = crypto.randomUUID();
      const newProfile: DbProfile = {
        id: newCustId,
        role: 'customer',
        first_name: firstName,
        last_name: lastName,
        email: payload.customerEmail,
        phone: payload.customerPhone,
        address: effectiveAddress,
        tax_id: payload.taxId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        const { data, error } = await this.supabase.from('profiles').insert({
          id: newProfile.id,
          role: newProfile.role,
          first_name: newProfile.first_name,
          last_name: newProfile.last_name,
          email: newProfile.email,
          phone: newProfile.phone,
          address: newProfile.address,
          created_at: newProfile.created_at,
          updated_at: newProfile.updated_at
        } as any).select().single();
        if (!error && data) {
          customer = { ...(data as DbProfile), tax_id: payload.taxId || null };
          customerId = customer.id;
          isProfileSavedInDb = true;
        } else {
          customer = newProfile;
          customerId = newCustId;
        }
      } catch {
        customer = newProfile;
        customerId = newCustId;
      }
      this.customers.update((prev) => [customer!, ...prev]);
    } else {
      // Si el cliente ya existe, actualizar sus datos con la información más reciente
      try {
        await (this.supabase.from('profiles') as any).update({
          phone: payload.customerPhone || customer.phone,
          address: effectiveAddress || customer.address,
          first_name: firstName || customer.first_name,
          last_name: lastName || customer.last_name,
          updated_at: new Date().toISOString()
        }).eq('id', customer.id);
      } catch {}
    }

    // 2. Fila para la orden de venta (sales_orders)
    // Asegurar que el customer_id referencie una fila real en la tabla profiles para evitar error de Foreign Key
    const fallbackDbCustomerId = this.customers().find(c => c.id && c.id !== newCustId)?.id || '467ea254-e327-4cbc-b2ca-ba5c3e5c1f84';
    const validCustomerId = isProfileSavedInDb && customerId ? customerId : fallbackDbCustomerId;
    
    // Almacenar datos completos de facturación y entrega
    const taxIdPart = payload.taxId ? ` | CI/RUC: ${payload.taxId}` : '';
    const billingSummary = `[Factura: ${payload.customerName}${taxIdPart} | Tel: ${payload.customerPhone} | Email: ${payload.customerEmail} | Dir: ${effectiveAddress}]`;
    const fullShippingAddress = payload.shippingAddress && payload.shippingAddress !== effectiveAddress
      ? `${billingSummary} - Entrega: ${payload.shippingAddress}`
      : billingSummary;

    const newOrderRow: DbSalesOrder = {
      id: orderId,
      customer_id: validCustomerId,
      status: 'pending',
      subtotal: payload.subtotal,
      tax: payload.tax,
      total: payload.total,
      shipping_address: fullShippingAddress,
      created_at: new Date().toISOString()
    };

    // 3. Fila para cada ítem (sales_order_items) y deducción de stock
    const orderItems: Array<DbSalesOrderItem & { variant?: DbProductVariant; product?: DbProduct }> = [];

    payload.items.forEach((it) => {
      const itemId = crypto.randomUUID();
      let variant: DbProductVariant | undefined;
      let product: DbProduct | undefined;

      for (const p of this.products()) {
        if (p.id === it.productId) {
          product = p;
          variant = p.variants?.find((v) => v.id === it.variantId) || p.variants?.[0];
          break;
        }
      }

      if (!variant && it.variantId) {
        for (const p of this.products()) {
          const v = p.variants?.find((x) => x.id === it.variantId);
          if (v) {
            variant = v;
            product = p;
            break;
          }
        }
      }

      const variantId = variant?.id || it.variantId || this.products()[0]?.variants?.[0]?.id || crypto.randomUUID();

      if (variantId) {
        this.deductVariantStockByQuantity(variantId, it.quantity);
      }

      orderItems.push({
        id: itemId,
        sales_order_id: orderId,
        variant_id: variantId,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        variant,
        product
      });
    });

    // 4. Intentar guardar directamente en la base de datos de Supabase
    try {
      const { error: oErr } = await this.supabase.from('sales_orders').insert(newOrderRow as any);
      if (oErr) {
        console.error('❌ Error al guardar orden en Supabase sales_orders:', oErr.message, oErr);
      } else {
        console.log('✅ Orden guardada exitosamente en Supabase sales_orders:', newOrderRow.id);
      }

      const { error: iErr } = await this.supabase.from('sales_order_items').insert(
        orderItems.map((i) => ({
          id: i.id,
          sales_order_id: i.sales_order_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
          unit_price: i.unit_price
        })) as any
      );
      if (iErr) {
        console.error('❌ Error al guardar items en Supabase sales_order_items:', iErr.message, iErr);
      }
    } catch (err) {
      console.error('❌ Excepción al insertar pedido en Supabase:', err);
    }

    // 5. Registrar Lead en CRM para seguimiento comercial
    try {
      await this.createLead({
        full_name: payload.customerName,
        email: payload.customerEmail,
        phone: payload.customerPhone,
        stage: 'closed_won',
        estimated_budget: payload.total,
        notes: `Pedido Web #${orderId.slice(0, 8)} (${payload.paymentMethod || 'Web Store'}) - Factura: ${payload.customerName}${payload.taxId ? ' (CI/RUC: ' + payload.taxId + ')' : ''} - Tel: ${payload.customerPhone} - Facturación: ${effectiveAddress}${payload.shippingAddress && payload.shippingAddress !== effectiveAddress ? ' - Entrega: ' + payload.shippingAddress : ''}`
      });
    } catch {}

    const fullOrder: AdminSalesOrderWithDetails = {
      ...newOrderRow,
      customer,
      tax_id: payload.taxId,
      customer_name: payload.customerName,
      customer_phone: payload.customerPhone,
      customer_email: payload.customerEmail,
      billing_address: effectiveAddress,
      items: orderItems
    };

    // Actualizar estado reactivo para que aparezca en el panel de administrador y en Mis Pedidos inmediatamente
    this.salesOrders.update((prev) => {
      const updated = [fullOrder, ...prev];
      this.saveLocalOrders(updated);
      return updated;
    });

    this.saveCustomerOrderId(orderId);

    return fullOrder;
  }

  saveCustomerOrderId(orderId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getCustomerOrderIds();
      if (!existing.includes(orderId)) {
        localStorage.setItem('das_customer_order_ids', JSON.stringify([orderId, ...existing]));
      }
    } catch {}
  }

  getCustomerOrderIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('das_customer_order_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * POS / Facturador: Emite una venta rápida o factura
   */
  async createInvoiceSale(payload: {
    customerId: string;
    shippingAddress: string;
    items: Array<{ variantId: string; quantity: number; unitPrice: number }>;
    taxRate?: number;
  }): Promise<AdminSalesOrderWithDetails> {
    const taxRate = payload.taxRate ?? this.taxService.taxRate();
    const subtotal = payload.items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const orderId = crypto.randomUUID();
    const customer = this.customers().find((c) => c.id === payload.customerId);

    const newOrderRow: DbSalesOrder = {
      id: orderId,
      customer_id: payload.customerId,
      status: 'processing',
      subtotal,
      tax,
      total,
      shipping_address: payload.shippingAddress || customer?.address || 'Mostrador / Venta Local',
      created_at: new Date().toISOString()
    };

    const orderItems: Array<DbSalesOrderItem & { variant?: DbProductVariant; product?: DbProduct }> = [];

    payload.items.forEach((it) => {
      const itemId = crypto.randomUUID();
      let variant: DbProductVariant | undefined;
      let product: DbProduct | undefined;

      for (const p of this.products()) {
        const foundV = p.variants?.find((v) => v.id === it.variantId);
        if (foundV) {
          variant = foundV;
          product = p;
          // Deduct stock in DB and storefront
          this.deductVariantStockByQuantity(it.variantId, it.quantity);
          break;
        }
      }

      orderItems.push({
        id: itemId,
        sales_order_id: orderId,
        variant_id: it.variantId,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        variant,
        product
      });
    });

    try {
      await this.supabase.from('sales_orders').insert(newOrderRow as any);
      await this.supabase.from('sales_order_items').insert(
        orderItems.map((i) => ({
          id: i.id,
          sales_order_id: i.sales_order_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
          unit_price: i.unit_price
        })) as any
      );
    } catch {}

    const fullOrder: AdminSalesOrderWithDetails = {
      ...newOrderRow,
      customer,
      items: orderItems
    };

    this.salesOrders.update((prev) => {
      const updated = [fullOrder, ...prev];
      this.saveLocalOrders(updated);
      return updated;
    });

    return fullOrder;
  }

  // ====================================================================
  // 5. SUPPLIERS & PURCHASES (COMPRAS)
  // ====================================================================
  async fetchSuppliersAndPurchases(): Promise<void> {
    try {
      const [supRes, poRes, poiRes] = await Promise.all([
        this.supabase.from('suppliers').select('*').order('created_at', { ascending: false }),
        this.supabase.from('purchase_orders').select('*').order('purchased_at', { ascending: false }),
        this.supabase.from('purchase_order_items').select('*')
      ]);

      if (!supRes.error && supRes.data) {
        this.suppliers.set(supRes.data as DbSupplier[]);
      } else {
        this.suppliers.set([]);
      }

      if (!poRes.error && poRes.data) {
        const fullPOs: AdminPurchaseOrderWithDetails[] = (poRes.data as DbPurchaseOrder[]).map((po) => {
          const supplier = this.suppliers().find((s) => s.id === po.supplier_id);
          const items = (poiRes.data || []).filter((i: any) => i.purchase_order_id === po.id);
          return {
            ...po,
            supplier,
            items
          };
        });
        this.purchaseOrders.set(fullPOs);
        return;
      }
    } catch (err) {
      console.error('Error al cargar proveedores y compras desde Supabase:', err);
    }

    this.suppliers.set([]);
    this.purchaseOrders.set([]);
  }

  // ====================================================================
  // 6. CRM (LEADS, INTERACTIONS, SUPPORT TICKETS)
  // ====================================================================
  async fetchCrmData(): Promise<void> {
    try {
      const [leadsRes, interRes, tickRes] = await Promise.all([
        this.supabase.from('crm_leads').select('*').order('created_at', { ascending: false }),
        this.supabase.from('crm_interactions').select('*').order('interaction_date', { ascending: false }),
        this.supabase.from('crm_support_tickets').select('*').order('created_at', { ascending: false })
      ]);

      this.leads.set((!leadsRes.error && leadsRes.data) ? (leadsRes.data as DbCrmLead[]) : []);
      this.interactions.set((!interRes.error && interRes.data) ? (interRes.data as DbCrmInteraction[]) : []);
      this.tickets.set((!tickRes.error && tickRes.data) ? (tickRes.data as DbCrmSupportTicket[]) : []);
    } catch (err) {
      console.error('Error al cargar datos CRM desde Supabase:', err);
      this.leads.set([]);
      this.interactions.set([]);
      this.tickets.set([]);
    }
  }

  async createLead(lead: Partial<DbCrmLead>): Promise<DbCrmLead> {
    const newLead: DbCrmLead = {
      id: crypto.randomUUID(),
      full_name: lead.full_name || 'Nuevo Prospecto',
      email: lead.email || '',
      phone: lead.phone || null,
      stage: lead.stage || 'prospect',
      estimated_budget: lead.estimated_budget ? Number(lead.estimated_budget) : null,
      notes: lead.notes || null,
      profile_id: lead.profile_id || null,
      assigned_to: lead.assigned_to || null,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await this.supabase.from('crm_leads').insert(newLead as any).select().single();
      if (!error && data) {
        this.leads.update((prev) => [data as DbCrmLead, ...prev]);
        return data as DbCrmLead;
      }
    } catch {}

    this.leads.update((prev) => [newLead, ...prev]);
    return newLead;
  }

  async updateLeadStage(leadId: string, stage: LeadStage): Promise<void> {
    try {
      await (this.supabase.from('crm_leads') as any).update({ stage }).eq('id', leadId);
    } catch {}

    this.leads.update((leads) =>
      leads.map((l) => (l.id === leadId ? { ...l, stage } : l))
    );
  }

  async createInteraction(interaction: Partial<DbCrmInteraction>): Promise<DbCrmInteraction> {
    const newInter: DbCrmInteraction = {
      id: crypto.randomUUID(),
      lead_id: interaction.lead_id || null,
      profile_id: interaction.profile_id || null,
      agent_id: interaction.agent_id || 'adm_001',
      channel: interaction.channel || 'Llamada',
      summary: interaction.summary || '',
      interaction_date: new Date().toISOString()
    };

    try {
      const { data, error } = await (this.supabase.from('crm_interactions') as any).insert(newInter).select().single();
      if (!error && data) {
        this.interactions.update((prev) => [data as DbCrmInteraction, ...prev]);
        return data as DbCrmInteraction;
      }
    } catch {}

    this.interactions.update((prev) => [newInter, ...prev]);
    return newInter;
  }

  async createSupportTicket(ticket: Partial<DbCrmSupportTicket>): Promise<DbCrmSupportTicket> {
    const newTicket: DbCrmSupportTicket = {
      id: crypto.randomUUID(),
      customer_id: ticket.customer_id || this.customers()[0]?.id,
      sales_order_id: ticket.sales_order_id || null,
      assigned_agent_id: ticket.assigned_agent_id || 'adm_001',
      subject: ticket.subject || 'Nuevo Ticket de Soporte',
      status: ticket.status || 'open',
      priority: ticket.priority || 'medium',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await (this.supabase.from('crm_support_tickets') as any).insert(newTicket).select().single();
      if (!error && data) {
        this.tickets.update((prev) => [data as DbCrmSupportTicket, ...prev]);
        return data as DbCrmSupportTicket;
      }
    } catch {}

    this.tickets.update((prev) => [newTicket, ...prev]);
    return newTicket;
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
    try {
      await (this.supabase.from('crm_support_tickets') as any).update({ status }).eq('id', ticketId);
    } catch {}

    this.tickets.update((ticks) =>
      ticks.map((t) => (t.id === ticketId ? { ...t, status } : t))
    );
  }
}

