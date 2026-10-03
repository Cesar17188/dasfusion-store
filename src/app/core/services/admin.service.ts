import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
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
  items: Array<DbSalesOrderItem & { variant?: DbProductVariant; product?: DbProduct }>;
}

export interface AdminPurchaseOrderWithDetails extends DbPurchaseOrder {
  supplier?: DbSupplier;
  items: Array<DbPurchaseOrderItem & { variant?: DbProductVariant }>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly supabase = inject(SupabaseService);

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
      if (!error && data && data.length > 0) {
        this.customers.set(data as DbProfile[]);
        return;
      }
    } catch {}

    // Fallback Initial Customers
    if (this.customers().length === 0) {
      this.customers.set([
        {
          id: 'c1111111-1111-1111-1111-111111111111',
          role: 'customer',
          first_name: 'Carlos',
          last_name: 'Mendoza',
          phone: '+57 312 456 7890',
          address: 'Calle 100 #15-20, Bogotá',
          created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'c2222222-2222-2222-2222-222222222222',
          role: 'customer',
          first_name: 'Valeria',
          last_name: 'Gómez',
          phone: '+57 300 987 6543',
          address: 'Cra 43A #1-50, Medellín',
          created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'c3333333-3333-3333-3333-333333333333',
          role: 'customer',
          first_name: 'Esteban',
          last_name: 'Ríos',
          phone: '+57 315 222 3344',
          address: 'Av. Santander #55-12, Manizales',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'c4444444-4444-4444-4444-444444444444',
          role: 'customer',
          first_name: 'Mariana',
          last_name: 'López',
          phone: '+57 320 888 9900',
          address: 'Cl 70 #4-30, Cali',
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    }
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
      const [catRes, brandRes] = await Promise.all([
        this.supabase.from('categories').select('*'),
        this.supabase.from('brands').select('*')
      ]);

      if (!catRes.error && catRes.data?.length) {
        this.categories.set((catRes.data as any[]).map((c) => ({
          ...c,
          is_active: c.is_active ?? true
        })));
      } else if (this.categories().length === 0) {
        this.categories.set([
          { id: 'cat-gpu', name: 'Tarjetas Gráficas (GPU)', slug: 'gpus', parent_id: null, is_active: true },
          { id: 'cat-gpu-nvidia', name: 'NVIDIA GeForce RTX', slug: 'gpus-nvidia', parent_id: 'cat-gpu', is_active: true },
          { id: 'cat-gpu-amd', name: 'AMD Radeon RX', slug: 'gpus-amd', parent_id: 'cat-gpu', is_active: true },
          { id: 'cat-cpu', name: 'Procesadores (CPU)', slug: 'cpus', parent_id: null, is_active: true },
          { id: 'cat-cpu-intel', name: 'Intel Core & Ultra', slug: 'cpus-intel', parent_id: 'cat-cpu', is_active: true },
          { id: 'cat-cpu-amd', name: 'AMD Ryzen 7000/9000', slug: 'cpus-amd', parent_id: 'cat-cpu', is_active: true },
          { id: 'cat-ram', name: 'Memorias RAM', slug: 'ram', parent_id: null, is_active: true },
          { id: 'cat-ssd', name: 'Almacenamiento SSD', slug: 'storage', parent_id: null, is_active: true },
          { id: 'cat-mb', name: 'Placas Madre (Motherboards)', slug: 'motherboards', parent_id: null, is_active: true },
          { id: 'cat-psu', name: 'Fuentes de Poder (PSU)', slug: 'power-supplies', parent_id: null, is_active: true },
          { id: 'cat-cases', name: 'Gabinetes & Chasis', slug: 'cases', parent_id: null, is_active: true },
          { id: 'cat-bundles', name: 'Combos & Bundles DAS', slug: 'bundles', parent_id: null, is_active: true }
        ]);
      }

      if (!brandRes.error && brandRes.data?.length) {
        this.brands.set((brandRes.data as any[]).map((b) => ({
          ...b,
          is_active: b.is_active ?? true,
          category_ids: b.category_ids || (b.category_id ? [b.category_id] : [])
        })));
      } else if (this.brands().length === 0) {
        this.brands.set([
          { id: 'b-nvidia', name: 'NVIDIA', slug: 'nvidia', category_ids: ['cat-gpu', 'cat-gpu-nvidia'], is_active: true },
          { id: 'b-amd', name: 'AMD', slug: 'amd', category_ids: ['cat-gpu', 'cat-gpu-amd', 'cat-cpu', 'cat-cpu-amd'], is_active: true },
          { id: 'b-intel', name: 'Intel', slug: 'intel', category_ids: ['cat-cpu', 'cat-cpu-intel'], is_active: true },
          { id: 'b-corsair', name: 'Corsair', slug: 'corsair', category_ids: ['cat-ram', 'cat-psu', 'cat-cases'], is_active: true },
          { id: 'b-asus', name: 'ASUS ROG / TUF', slug: 'asus', category_ids: ['cat-gpu', 'cat-mb'], is_active: true },
          { id: 'b-msi', name: 'MSI Gaming', slug: 'msi', category_ids: ['cat-gpu', 'cat-mb'], is_active: true },
          { id: 'b-kingston', name: 'Kingston Fury', slug: 'kingston', category_ids: ['cat-ram', 'cat-ssd'], is_active: true },
          { id: 'b-samsung', name: 'Samsung', slug: 'samsung', category_ids: ['cat-ssd'], is_active: true }
        ]);
      }
    } catch {}
  }

  // --- Category CRUD ---
  async createCategory(cat: { name: string; slug?: string; parent_id?: string | null; is_active?: boolean }): Promise<DbCategory> {
    const slug = cat.slug || cat.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newCategory: DbCategory = {
      id: crypto.randomUUID(),
      name: cat.name,
      slug,
      parent_id: cat.parent_id || null,
      is_active: cat.is_active ?? true
    };

    try {
      const { data, error } = await (this.supabase.from('categories') as any).insert({
        id: newCategory.id,
        name: newCategory.name,
        slug: newCategory.slug,
        parent_id: newCategory.parent_id
      }).select().single();
      if (!error && data) {
        newCategory.id = data.id;
      }
    } catch (err) {
      console.warn('Error al guardar categoría en Supabase, guardando localmente:', err);
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
        await (this.supabase.from('categories') as any).update({
          name: updates.name,
          slug: updates.slug,
          parent_id: updates.parent_id
        }).eq('id', id);
      } catch (err) {
        console.warn('Error al actualizar categoría en Supabase:', err);
      }
    }
    return updatedCat;
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await (this.supabase.from('categories') as any).delete().eq('id', id);
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
      name: brand.name,
      slug,
      category_ids: brand.category_ids || [],
      category_id: brand.category_ids?.[0] || null,
      is_active: brand.is_active ?? true
    };

    try {
      const { data, error } = await (this.supabase.from('brands') as any).insert({
        id: newBrand.id,
        name: newBrand.name,
        slug: newBrand.slug
      }).select().single();
      if (!error && data) {
        newBrand.id = data.id;
      }
    } catch (err) {
      console.warn('Error al guardar marca en Supabase, guardando localmente:', err);
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
        await (this.supabase.from('brands') as any).update({
          name: updates.name,
          slug: updates.slug
        }).eq('id', id);
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
   * Returns only active brands linked to a given category ID (or all active brands if no category selected)
   */
  getBrandsForCategory(categoryId?: string | null): DbBrand[] {
    const activeBrands = this.brands().filter((b) => b.is_active !== false);
    if (!categoryId || categoryId === 'ALL') {
      return activeBrands;
    }

    // Also find parent category ID if categoryId is a subcategory
    const catObj = this.categories().find((c) => c.id === categoryId);
    const parentId = catObj?.parent_id;

    return activeBrands.filter((b) => {
      // If brand has no specific categories assigned, it is considered generic/available everywhere
      if (!b.category_ids || b.category_ids.length === 0) return true;
      return b.category_ids.includes(categoryId) || (parentId ? b.category_ids.includes(parentId) : false);
    });
  }

  // ====================================================================
  // 3. PRODUCTS & VARIANTS
  // ====================================================================
  async fetchProductsAndVariants(): Promise<void> {
    try {
      const { data: prodData, error: prodErr } = await (this.supabase.from('products') as any).select('*');
      const { data: varData, error: varErr } = await (this.supabase.from('product_variants') as any).select('*');

      if (!prodErr && !varErr && prodData && prodData.length > 0) {
        const productsList = prodData as DbProduct[];
        const variantsList = (varData || []) as DbProductVariant[];

        const fullProducts: AdminProductWithVariants[] = productsList.map((p) => {
          const variants = variantsList.filter((v) => v.product_id === p.id);
          const category = this.categories().find((c) => c.id === p.category_id);
          const brand = this.brands().find((b) => b.id === p.brand_id);
          return {
            ...p,
            category,
            brand,
            variants
          };
        });
        this.products.set(fullProducts);
        return;
      }
    } catch {}

    // Fallback Mock Products & Variants
    if (this.products().length === 0) {
      this.products.set([
        {
          id: 'p-rtx4090',
          category_id: 'cat-gpu',
          brand_id: 'b-nvidia',
          model: 'GeForce RTX 4090 Gaming OC 24GB',
          short_description: 'Máxima potencia para 4K y Renderizado AI',
          long_description: 'Arquitectura Ada Lovelace con 24GB GDDR6X, DLSS 3.5 y trazado de rayos de 3ra generación.',
          product_type: 'standalone',
          is_active: true,
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          category: { id: 'cat-gpu', name: 'Tarjetas Gráficas (GPU)', slug: 'gpus' },
          brand: { id: 'b-nvidia', name: 'NVIDIA RTX', slug: 'nvidia' },
          variants: [
            {
              id: 'v-rtx4090-blk',
              product_id: 'p-rtx4090',
              sku: 'GPU-NV-4090-24G-BLK',
              variant_name: 'Edición Black OC 24GB',
              price: 1899.99,
              stock: 8,
              attributes: { color: 'Negro', vram: '24GB', memoryType: 'GDDR6X' },
              is_bundle: false,
              created_at: new Date().toISOString()
            },
            {
              id: 'v-rtx4090-wht',
              product_id: 'p-rtx4090',
              sku: 'GPU-NV-4090-24G-WHT',
              variant_name: 'Edición White OC 24GB',
              price: 1949.99,
              stock: 2, // Low stock
              attributes: { color: 'Blanco', vram: '24GB', memoryType: 'GDDR6X' },
              is_bundle: false,
              created_at: new Date().toISOString()
            }
          ]
        },
        {
          id: 'p-rtx4070ts',
          category_id: 'cat-gpu',
          brand_id: 'b-asus',
          model: 'ASUS TUF Gaming GeForce RTX 4070 Ti Super 16GB',
          short_description: 'Rendimiento 1440p ultra y 4K equilibrado',
          long_description: 'Diseño militar con rodamientos dobles y disipación de calor masiva.',
          product_type: 'standalone',
          is_active: true,
          created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
          category: { id: 'cat-gpu', name: 'Tarjetas Gráficas (GPU)', slug: 'gpus' },
          brand: { id: 'b-asus', name: 'ASUS ROG / TUF', slug: 'asus' },
          variants: [
            {
              id: 'v-rtx4070ts-std',
              product_id: 'p-rtx4070ts',
              sku: 'GPU-ASUS-4070TIS-16G',
              variant_name: 'Standard OC 16GB',
              price: 899.99,
              stock: 14,
              attributes: { vram: '16GB', fans: 3 },
              is_bundle: false,
              created_at: new Date().toISOString()
            }
          ]
        },
        {
          id: 'p-ryzen7800x3d',
          category_id: 'cat-cpu',
          brand_id: 'b-amd',
          model: 'AMD Ryzen 7 7800X3D',
          short_description: 'El procesador rey indiscutible del Gaming',
          long_description: '8 núcleos, 16 hilos y 96MB de 3D V-Cache para los FPS más estables del mercado.',
          product_type: 'standalone',
          is_active: true,
          created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
          category: { id: 'cat-cpu', name: 'Procesadores (CPU)', slug: 'cpus' },
          brand: { id: 'b-amd', name: 'AMD Ryzen / Radeon', slug: 'amd' },
          variants: [
            {
              id: 'v-7800x3d-box',
              product_id: 'p-ryzen7800x3d',
              sku: 'CPU-AMD-7800X3D-BOX',
              variant_name: 'Boxed AM5 (Sin Cooler)',
              price: 449.00,
              stock: 19,
              attributes: { socket: 'AM5', cores: 8, threads: 16, tdp: '120W' },
              is_bundle: false,
              created_at: new Date().toISOString()
            }
          ]
        },
        {
          id: 'p-i914900k',
          category_id: 'cat-cpu',
          brand_id: 'b-intel',
          model: 'Intel Core i9-14900K',
          short_description: '24 núcleos para creadores y multitarea extrema',
          long_description: 'Frecuencia de hasta 6.0 GHz con Intel Thermal Velocity Boost.',
          product_type: 'standalone',
          is_active: true,
          created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
          category: { id: 'cat-cpu', name: 'Procesadores (CPU)', slug: 'cpus' },
          brand: { id: 'b-intel', name: 'Intel Core', slug: 'intel' },
          variants: [
            {
              id: 'v-14900k-std',
              product_id: 'p-i914900k',
              sku: 'CPU-INT-14900K-BOX',
              variant_name: 'Standard LGA1700',
              price: 549.99,
              stock: 4, // Low stock
              attributes: { socket: 'LGA1700', cores: 24, threads: 32 },
              is_bundle: false,
              created_at: new Date().toISOString()
            }
          ]
        },
        {
          id: 'p-bundle-streamer',
          category_id: 'cat-bundles',
          brand_id: 'b-asus',
          model: 'Combo DAS Master Streamer (Ryzen 7800X3D + RTX 4070TiS)',
          short_description: 'Kit de alto desempeño armado y probado',
          long_description: 'Incluye CPU Ryzen 7800X3D, GPU RTX 4070Ti Super, Placa B650 y 32GB RAM DDR5.',
          product_type: 'bundle',
          is_active: true,
          created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
          category: { id: 'cat-bundles', name: 'Combos & Bundles DAS', slug: 'bundles' },
          brand: { id: 'b-asus', name: 'ASUS ROG / TUF', slug: 'asus' },
          variants: [
            {
              id: 'v-bundle-streamer-01',
              product_id: 'p-bundle-streamer',
              sku: 'BDL-DAS-STREAMER-01',
              variant_name: 'DAS Master Streamer Pack',
              price: 1649.00,
              stock: 6,
              attributes: { warranty: '3 Años', assemblyIncluded: true },
              is_bundle: true,
              created_at: new Date().toISOString()
            }
          ]
        }
      ]);
    }
  }

  async updateVariantStock(variantId: string, newStock: number): Promise<void> {
    try {
      await (this.supabase.from('product_variants') as any).update({ stock: newStock }).eq('id', variantId);
    } catch {}

    this.products.update((prods) =>
      prods.map((p) => ({
        ...p,
        variants: p.variants.map((v) => (v.id === variantId ? { ...v, stock: newStock } : v))
      }))
    );
  }

  async updateVariantPrice(variantId: string, newPrice: number): Promise<void> {
    try {
      await (this.supabase.from('product_variants') as any).update({ price: newPrice }).eq('id', variantId);
    } catch {}

    this.products.update((prods) =>
      prods.map((p) => ({
        ...p,
        variants: p.variants.map((v) => (v.id === variantId ? { ...v, price: newPrice } : v))
      }))
    );
  }

  async createProductWithVariant(
    productData: {
      model: string;
      category_id: string;
      brand_id: string;
      short_description?: string;
      long_description?: string;
      product_type?: string;
    },
    variantData: {
      sku: string;
      variant_name: string;
      price: number;
      stock: number;
      attributes?: Record<string, any>;
      is_bundle?: boolean;
    }
  ): Promise<void> {
    const prodId = crypto.randomUUID();
    const varId = crypto.randomUUID();

    const newProd: DbProduct = {
      id: prodId,
      category_id: productData.category_id,
      brand_id: productData.brand_id,
      model: productData.model,
      short_description: productData.short_description || '',
      long_description: productData.long_description || '',
      product_type: productData.product_type || 'standalone',
      is_active: true,
      created_at: new Date().toISOString()
    };

    const newVar: DbProductVariant = {
      id: varId,
      product_id: prodId,
      sku: variantData.sku,
      variant_name: variantData.variant_name,
      price: Number(variantData.price),
      stock: Number(variantData.stock),
      attributes: variantData.attributes || {},
      is_bundle: !!variantData.is_bundle,
      created_at: new Date().toISOString()
    };

    try {
      await (this.supabase.from('products') as any).insert(newProd);
      await (this.supabase.from('product_variants') as any).insert(newVar);
    } catch {}

    const category = this.categories().find((c) => c.id === newProd.category_id);
    const brand = this.brands().find((b) => b.id === newProd.brand_id);

    const fullProd: AdminProductWithVariants = {
      ...newProd,
      category,
      brand,
      variants: [newVar]
    };

    this.products.update((prev) => [fullProd, ...prev]);
  }

  // ====================================================================
  // 4. SALES ORDERS & INVOICING / POS
  // ====================================================================
  async fetchSalesOrders(): Promise<void> {
    try {
      const { data: orders, error: oErr } = await (this.supabase.from('sales_orders') as any).select('*').order('created_at', { ascending: false });
      const { data: items, error: iErr } = await (this.supabase.from('sales_order_items') as any).select('*');

      if (!oErr && !iErr && orders && orders.length > 0) {
        const ordersList = orders as DbSalesOrder[];
        const itemsList = (items || []) as DbSalesOrderItem[];

        const fullOrders: AdminSalesOrderWithDetails[] = ordersList.map((o) => {
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

          return {
            ...o,
            customer,
            items: orderItems
          };
        });

        this.salesOrders.set(fullOrders);
        return;
      }
    } catch {}

    // Fallback Initial Sales Orders
    if (this.salesOrders().length === 0) {
      this.salesOrders.set([
        {
          id: 'ord-1001',
          customer_id: 'c1111111-1111-1111-1111-111111111111',
          status: 'delivered',
          subtotal: 1899.99,
          tax: 360.99,
          total: 2260.98,
          shipping_address: 'Calle 100 #15-20, Bogotá',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          customer: {
            id: 'c1111111-1111-1111-1111-111111111111',
            role: 'customer',
            first_name: 'Carlos',
            last_name: 'Mendoza',
            phone: '+57 312 456 7890',
            address: 'Calle 100 #15-20, Bogotá',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          items: [
            {
              id: 'oi-1',
              sales_order_id: 'ord-1001',
              variant_id: 'v-rtx4090-blk',
              unit_price: 1899.99,
              quantity: 1,
              variant: {
                id: 'v-rtx4090-blk',
                product_id: 'p-rtx4090',
                sku: 'GPU-NV-4090-24G-BLK',
                variant_name: 'Edición Black OC 24GB',
                price: 1899.99,
                stock: 8,
                attributes: {},
                is_bundle: false,
                created_at: ''
              }
            }
          ]
        },
        {
          id: 'ord-1002',
          customer_id: 'c2222222-2222-2222-2222-222222222222',
          status: 'processing',
          subtotal: 1348.99,
          tax: 256.31,
          total: 1605.30,
          shipping_address: 'Cra 43A #1-50, Medellín',
          created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          customer: {
            id: 'c2222222-2222-2222-2222-222222222222',
            role: 'customer',
            first_name: 'Valeria',
            last_name: 'Gómez',
            phone: '+57 300 987 6543',
            address: 'Cra 43A #1-50, Medellín',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          items: [
            {
              id: 'oi-2',
              sales_order_id: 'ord-1002',
              variant_id: 'v-rtx4070ts-std',
              unit_price: 899.99,
              quantity: 1
            },
            {
              id: 'oi-3',
              sales_order_id: 'ord-1002',
              variant_id: 'v-7800x3d-box',
              unit_price: 449.00,
              quantity: 1
            }
          ]
        },
        {
          id: 'ord-1003',
          customer_id: 'c3333333-3333-3333-3333-333333333333',
          status: 'pending',
          subtotal: 1649.00,
          tax: 313.31,
          total: 1962.31,
          shipping_address: 'Av. Santander #55-12, Manizales',
          created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
          customer: {
            id: 'c3333333-3333-3333-3333-333333333333',
            role: 'customer',
            first_name: 'Esteban',
            last_name: 'Ríos',
            phone: '+57 315 222 3344',
            address: 'Av. Santander #55-12, Manizales',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          items: [
            {
              id: 'oi-4',
              sales_order_id: 'ord-1003',
              variant_id: 'v-bundle-streamer-01',
              unit_price: 1649.00,
              quantity: 1
            }
          ]
        }
      ]);
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      await (this.supabase.from('sales_orders') as any).update({ status }).eq('id', orderId);
    } catch {}

    this.salesOrders.update((orders) =>
      orders.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
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
    const taxRate = payload.taxRate ?? 0.19; // 19% IVA standard
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
          // Deduct local stock
          this.updateVariantStock(it.variantId, Math.max(0, foundV.stock - it.quantity));
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

    this.salesOrders.update((prev) => [fullOrder, ...prev]);
    return fullOrder;
  }

  // ====================================================================
  // 5. SUPPLIERS & PURCHASES (COMPRAS)
  // ====================================================================
  async fetchSuppliersAndPurchases(): Promise<void> {
    try {
      const [supRes, poRes, poiRes] = await Promise.all([
        this.supabase.from('suppliers').select('*'),
        this.supabase.from('purchase_orders').select('*').order('purchased_at', { ascending: false }),
        this.supabase.from('purchase_order_items').select('*')
      ]);

      if (!supRes.error && supRes.data?.length) {
        this.suppliers.set(supRes.data as DbSupplier[]);
      }

      if (!poRes.error && poRes.data?.length) {
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
    } catch {}

    // Fallback Mock Suppliers & Purchases
    if (this.suppliers().length === 0) {
      this.suppliers.set([
        {
          id: 'sup-1',
          business_name: 'TechDistribuciones Global S.A.',
          contact_name: 'Andrés Morales',
          email: 'contacto@techdistribuciones.com',
          phone: '+57 311 000 1122',
          tax_id: '900.123.456-7',
          created_at: new Date(Date.now() - 60 * 86400000).toISOString()
        },
        {
          id: 'sup-2',
          business_name: 'Hardware América Importaciones',
          contact_name: 'Camila Salazar',
          email: 'ventas@hwamerica.com',
          phone: '+57 318 777 6655',
          tax_id: '901.888.999-1',
          created_at: new Date(Date.now() - 45 * 86400000).toISOString()
        }
      ]);
    }

    if (this.purchaseOrders().length === 0) {
      this.purchaseOrders.set([
        {
          id: 'po-501',
          supplier_id: 'sup-1',
          total_amount: 14200.00,
          status: 'received',
          purchased_at: new Date(Date.now() - 14 * 86400000).toISOString(),
          supplier: this.suppliers()[0],
          items: [
            {
              id: 'poi-1',
              purchase_order_id: 'po-501',
              variant_id: 'v-rtx4090-blk',
              quantity: 10,
              unit_cost: 1420.00
            }
          ]
        },
        {
          id: 'po-502',
          supplier_id: 'sup-2',
          total_amount: 6800.00,
          status: 'received',
          purchased_at: new Date(Date.now() - 6 * 86400000).toISOString(),
          supplier: this.suppliers()[1],
          items: [
            {
              id: 'poi-2',
              purchase_order_id: 'po-502',
              variant_id: 'v-7800x3d-box',
              quantity: 20,
              unit_cost: 340.00
            }
          ]
        }
      ]);
    }
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

      if (!leadsRes.error && leadsRes.data?.length) {
        this.leads.set(leadsRes.data as DbCrmLead[]);
      }
      if (!interRes.error && interRes.data?.length) {
        this.interactions.set(interRes.data as DbCrmInteraction[]);
      }
      if (!tickRes.error && tickRes.data?.length) {
        this.tickets.set(tickRes.data as DbCrmSupportTicket[]);
      }
    } catch {}

    // Fallback Initial Leads
    if (this.leads().length === 0) {
      this.leads.set([
        {
          id: 'lead-1',
          profile_id: 'c1111111-1111-1111-1111-111111111111',
          full_name: 'Carlos Mendoza (Estudio Animación 3D)',
          email: 'carlos.mendoza@anim3d.co',
          phone: '+57 312 456 7890',
          stage: 'quote_sent',
          estimated_budget: 5500.00,
          notes: 'Requiere cotización para 2 estaciones de trabajo con RTX 4090 y 64GB RAM.',
          assigned_to: 'adm_001',
          created_at: new Date(Date.now() - 4 * 86400000).toISOString()
        },
        {
          id: 'lead-2',
          profile_id: null,
          full_name: 'Santiago Echeverri',
          email: 'santi.echeverri@gamerz.io',
          phone: '+57 317 444 8899',
          stage: 'qualified',
          estimated_budget: 2200.00,
          notes: 'Interesado en ensamble con Ryzen 7800X3D para streaming en Twitch.',
          assigned_to: null,
          created_at: new Date(Date.now() - 2 * 86400000).toISOString()
        },
        {
          id: 'lead-3',
          profile_id: 'c2222222-2222-2222-2222-222222222222',
          full_name: 'Valeria Gómez',
          email: 'valeria.gomez@empresa.com',
          phone: '+57 300 987 6543',
          stage: 'closed_won',
          estimated_budget: 1600.00,
          notes: 'Compra confirmada y procesada vía web.',
          assigned_to: 'adm_001',
          created_at: new Date(Date.now() - 1 * 86400000).toISOString()
        },
        {
          id: 'lead-4',
          profile_id: null,
          full_name: 'TechLab Solutions SAS',
          email: 'compras@techlab.com',
          phone: '+57 310 555 1212',
          stage: 'prospect',
          estimated_budget: 8000.00,
          notes: 'Renovación de 5 equipos de desarrollo de software con procesadores i9.',
          assigned_to: null,
          created_at: new Date(Date.now() - 12 * 3600000).toISOString()
        }
      ]);
    }

    // Fallback Initial Interactions
    if (this.interactions().length === 0) {
      this.interactions.set([
        {
          id: 'int-1',
          lead_id: 'lead-1',
          profile_id: 'c1111111-1111-1111-1111-111111111111',
          agent_id: 'adm_001',
          channel: 'WhatsApp',
          summary: 'Se envió cotización formal PDF #DAS-COT-092 por $5,500 USD con tiempos de entrega garantizados.',
          interaction_date: new Date(Date.now() - 2 * 3600000).toISOString()
        },
        {
          id: 'int-2',
          lead_id: 'lead-2',
          profile_id: null,
          agent_id: 'adm_001',
          channel: 'Llamada telefónica',
          summary: 'Asesoría técnica sobre compatibilidad de memorias DDR5 con la placa ASUS TUF.',
          interaction_date: new Date(Date.now() - 24 * 3600000).toISOString()
        }
      ]);
    }

    // Fallback Initial Support Tickets
    if (this.tickets().length === 0) {
      this.tickets.set([
        {
          id: 't-101',
          customer_id: 'c1111111-1111-1111-1111-111111111111',
          sales_order_id: 'ord-1001',
          assigned_agent_id: 'adm_001',
          subject: 'Solicitud de guía de rastreo y factura electrónica DIAN',
          status: 'open',
          priority: 'medium',
          created_at: new Date(Date.now() - 6 * 3600000).toISOString()
        },
        {
          id: 't-102',
          customer_id: 'c2222222-2222-2222-2222-222222222222',
          sales_order_id: 'ord-1002',
          assigned_agent_id: 'adm_001',
          subject: 'Consulta de actualización de BIOS para compatibilidad Ryzen 7000',
          status: 'in_progress',
          priority: 'low',
          created_at: new Date(Date.now() - 18 * 3600000).toISOString()
        }
      ]);
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

