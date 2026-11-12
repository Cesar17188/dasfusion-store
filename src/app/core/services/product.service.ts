import { Injectable, signal, computed, inject } from '@angular/core';
import { Product, ProductFilter } from '../models/product.model';
import { SupabaseService } from './supabase.service';
import { DbProduct, DbCategory, DbBrand } from '../models/supabase.model';
import { TaxService } from './tax.service';

const NEW_PROMO_STORAGE_KEY = 'das_new_products_promo_ids_v1';
const NEW_PROMO_CUSTOMIZED_KEY = 'das_new_products_promo_customized_v1';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly taxService = inject(TaxService);
  private readonly productsSignal = signal<Product[]>([]);
  private readonly categoriesSignal = signal<string[]>([]);
  private readonly brandsSignal = signal<string[]>([]);
  private readonly rawCategoriesSignal = signal<DbCategory[]>([]);
  private readonly rawBrandsSignal = signal<DbBrand[]>([]);
  readonly dbCategories = this.rawCategoriesSignal.asReadonly();
  readonly dbBrands = this.rawBrandsSignal.asReadonly();
  readonly isLoading = signal<boolean>(true);

  /**
   * IDs of products selected by the administrator to appear in the
   * "Franja de Productos Nuevos" below the promotional banner carousel.
   */
  readonly newPromoProductIds = signal<string[]>(this.loadNewPromoIdsFromStorage());

  // Store only displays products where isActive !== false, with isNew synced to newPromoProductIds
  readonly products = computed<Product[]>(() => {
    const newIds = new Set(this.newPromoProductIds());
    return this.productsSignal()
      .filter((p) => p.isActive !== false)
      .map((p): Product => ({
        ...p,
        isNew: newIds.has(p.id)
      }));
  });

  /**
   * Ordered list of active products selected for the "Productos Nuevos" strip
   */
  readonly newPromoProducts = computed<Product[]>(() => {
    const activeMap = new Map<string, Product>(this.products().map((p) => [p.id, p]));
    const result: Product[] = [];
    for (const id of this.newPromoProductIds()) {
      const found = activeMap.get(id);
      if (found) {
        result.push(found);
      }
    }
    return result;
  });

  readonly categories = computed(() => {
    const fromProducts = this.products().map((p) => p.category);
    const fromDb = this.categoriesSignal();
    return Array.from(new Set([...fromDb, ...fromProducts])).filter(Boolean);
  });

  readonly brands = computed(() => {
    const fromProducts = this.products().map((p) => p.brand);
    const fromDb = this.brandsSignal();
    return Array.from(new Set([...fromDb, ...fromProducts])).filter(Boolean).sort();
  });

  constructor() {
    this.loadProductsFromDatabase();
  }

  async loadProductsFromDatabase(): Promise<void> {
    this.isLoading.set(true);
    try {
      let [prodRes, varRes, catRes, brandRes] = await Promise.all([
        (this.supabaseService.publicFrom('products') as any).select('*').order('created_at', { ascending: false }),
        (this.supabaseService.publicFrom('product_variants') as any).select('*'),
        (this.supabaseService.publicFrom('categories') as any).select('*').order('name'),
        (this.supabaseService.publicFrom('brands') as any).select('*').order('name')
      ]);

      // Si por alguna política RLS específica requiere el cliente autenticado, reintentar con this.supabaseService.from
      if (prodRes.error || !prodRes.data) {
        [prodRes, varRes, catRes, brandRes] = await Promise.all([
          (this.supabaseService.from('products') as any).select('*').order('created_at', { ascending: false }),
          (this.supabaseService.from('product_variants') as any).select('*'),
          (this.supabaseService.from('categories') as any).select('*').order('name'),
          (this.supabaseService.from('brands') as any).select('*').order('name')
        ]);
      }

      const catData = (catRes.data || []) as any[];
      const brandData = (brandRes.data || []) as any[];
      const prodData = (prodRes.data || []) as DbProduct[];
      const varData = (varRes.data || []) as any[];

      // Keep full relational category and brand data
      this.rawCategoriesSignal.set(catData.filter((c) => c.is_active !== false));
      this.rawBrandsSignal.set(
        brandData.filter((b) => b.is_active !== false).map((b) => ({
          ...b,
          category_ids: b.category_ids || (b.category_id ? [b.category_id] : [])
        }))
      );

      // Populate DB categories and brands
      this.categoriesSignal.set(
        catData.filter((c) => c.is_active !== false).map((c) => c.name)
      );
      this.brandsSignal.set(
        brandData.filter((b) => b.is_active !== false).map((b) => b.name)
      );

      if (!prodRes.error && Array.isArray(prodData)) {
        const mapped: Product[] = prodData.map((dbP) => {
          const cat = catData.find((c) => c.id === dbP.category_id);
          const brand = brandData.find((b) => b.id === dbP.brand_id);
          const vars = varData
            .filter((v) => v.product_id === dbP.id)
            .map((v) => {
              const stockPhys = v.attributes?.['stock_physical'] !== undefined
                ? Number(v.attributes['stock_physical'])
                : (Number(v.stock) || 0);
              const stockVirt = v.attributes?.['stock_virtual'] !== undefined
                ? Number(v.attributes['stock_virtual'])
                : 0;
              const totalStock = stockPhys + stockVirt;

              const compareAtRaw = v.attributes?.['compare_at_price'] !== undefined
                ? (v.attributes['compare_at_price'] !== null ? Number(v.attributes['compare_at_price']) : undefined)
                : (v.compare_at_price !== undefined && v.compare_at_price !== null ? Number(v.compare_at_price) : undefined);

              const rawDiscountPct = v.attributes?.['discount_percent'] !== undefined
                ? (v.attributes['discount_percent'] !== null ? Number(v.attributes['discount_percent']) : undefined)
                : (v.discount_percent !== undefined && v.discount_percent !== null ? Number(v.discount_percent) : undefined);

              // Discount is valid only if greater than 0% and compareAtPrice > price
              const hasOffer = (rawDiscountPct !== undefined ? rawDiscountPct > 0 : true) &&
                               (compareAtRaw !== undefined && compareAtRaw > Number(v.price));

              const compareAt = hasOffer ? compareAtRaw : undefined;
              const discountPct = (rawDiscountPct !== undefined && rawDiscountPct > 0)
                ? rawDiscountPct
                : (compareAt && compareAt > Number(v.price) ? Math.round(((compareAt - Number(v.price)) / compareAt) * 100) : undefined);

              return {
                id: v.id,
                name: v.variant_name,
                sku: v.sku,
                price: Number(v.price) || 0,
                compareAtPrice: compareAt,
                discountPercentage: (discountPct !== undefined && discountPct > 0) ? discountPct : undefined,
                stock: totalStock,
                stock_physical: stockPhys,
                stock_virtual: stockVirt,
                attributes: v.attributes || {}
              };
            });

          const minPrice = vars.length > 0 ? Math.min(...vars.map((v) => v.price)) : 0;
          const minVar = vars.find((v) => v.price === minPrice);
          const prodCompareAt = (minVar?.compareAtPrice && minVar.compareAtPrice > minPrice)
            ? minVar.compareAtPrice
            : undefined;
          const prodDiscount = (minVar?.discountPercentage && minVar.discountPercentage > 0)
            ? minVar.discountPercentage
            : (prodCompareAt && prodCompareAt > minPrice ? Math.round(((prodCompareAt - minPrice) / prodCompareAt) * 100) : undefined);
          const totalStock = vars.reduce((acc: number, v) => acc + v.stock, 0);
          const totalPhys = vars.reduce((acc: number, v) => acc + (v.stock_physical || 0), 0);
          const totalVirt = vars.reduce((acc: number, v) => acc + (v.stock_virtual || 0), 0);

          const modelName = (dbP.model || 'Producto').trim();
          return {
            id: dbP.id,
            name: modelName,
            slug: modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || dbP.id,
            brand: brand?.name || 'Genérico',
            category: cat?.name || 'General',
            subCategory: cat?.parent_id ? cat.name : undefined,
            description: dbP.long_description || dbP.short_description || '',
            shortDescription: dbP.short_description || '',
            price: minPrice,
            compareAtPrice: prodCompareAt,
            discountPercentage: prodDiscount,
            images: Array.isArray(dbP.images) && dbP.images.length > 0 ? dbP.images : ['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80'],
            stock: totalStock,
            stock_physical: totalPhys,
            stock_virtual: totalVirt,
            rating: 5.0,
            reviewCount: 0,
            isFeatured: true,
            isNew: true,
            specifications: Array.isArray(dbP.specifications) ? dbP.specifications : [],
            variants: vars,
            tags: [cat?.name, brand?.name, dbP.model].filter(Boolean) as string[],
            isActive: dbP.is_active !== false
          };
        });

        // Set strictly the database products, without hardcoded mocks
        this.productsSignal.set(mapped);

        // Synchronize "Productos Nuevos" selection from DB variant attributes or localStorage
        const dbExplicitFlags = varData.some(
          (v) => v.attributes?.['is_new_promo'] === true || v.attributes?.['is_new_promo'] === false
        );

        if (dbExplicitFlags) {
          const selectedEntries: Array<{ productId: string; order: number }> = [];
          const seenProdIds = new Set<string>();
          for (const v of varData) {
            if (v.attributes?.['is_new_promo'] === true && v.product_id && !seenProdIds.has(v.product_id)) {
              seenProdIds.add(v.product_id);
              selectedEntries.push({
                productId: v.product_id,
                order: typeof v.attributes?.['new_promo_order'] === 'number' ? v.attributes['new_promo_order'] : 9999
              });
            }
          }
          selectedEntries.sort((a, b) => a.order - b.order);
          const dbIds = selectedEntries.map((e) => e.productId);
          this.newPromoProductIds.set(dbIds);
          this.saveNewPromoIdsToStorage(dbIds, true);
        } else if (!this.hasCustomNewPromoInStorage()) {
          // Default initial selection: up to 4 most recent active products so the strip is populated out of the box
          const defaultIds = mapped
            .filter((p) => p.isActive !== false)
            .slice(0, 4)
            .map((p) => p.id);
          this.newPromoProductIds.set(defaultIds);
          this.saveNewPromoIdsToStorage(defaultIds, false);
        } else {
          // Filter stored IDs to ensure they still exist in mapped products
          const validIds = new Set(mapped.map((p) => p.id));
          const cleaned = this.newPromoProductIds().filter((id) => validIds.has(id));
          this.newPromoProductIds.set(cleaned);
        }
      } else {
        this.productsSignal.set([]);
      }
    } catch (err) {
      console.error('Error al cargar productos desde Supabase:', err);
      this.productsSignal.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private loadNewPromoIdsFromStorage(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(NEW_PROMO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((id) => typeof id === 'string');
        }
      }
    } catch {}
    return [];
  }

  private hasCustomNewPromoInStorage(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(NEW_PROMO_CUSTOMIZED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private saveNewPromoIdsToStorage(ids: string[], customized = true): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(NEW_PROMO_STORAGE_KEY, JSON.stringify(ids));
      localStorage.setItem(NEW_PROMO_CUSTOMIZED_KEY, customized ? 'true' : 'false');
    } catch {}
  }

  isProductInNewStrip(productId: string): boolean {
    return this.newPromoProductIds().includes(productId);
  }

  async toggleProductInNewStrip(productId: string, forceState?: boolean): Promise<boolean> {
    const current = this.newPromoProductIds();
    const exists = current.includes(productId);
    const shouldInclude = forceState !== undefined ? forceState : !exists;

    let updated: string[];
    if (shouldInclude && !exists) {
      updated = [...current, productId];
    } else if (!shouldInclude && exists) {
      updated = current.filter((id) => id !== productId);
    } else {
      updated = [...current];
    }

    this.newPromoProductIds.set(updated);
    this.saveNewPromoIdsToStorage(updated, true);
    await this.persistProductNewPromoFlagInDb(productId, shouldInclude, updated.indexOf(productId) + 1);
    return shouldInclude;
  }

  async moveProductInNewStrip(productId: string, direction: 'left' | 'right'): Promise<void> {
    const current = [...this.newPromoProductIds()];
    const idx = current.indexOf(productId);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= current.length) return;

    const [removed] = current.splice(idx, 1);
    current.splice(targetIdx, 0, removed);

    this.newPromoProductIds.set(current);
    this.saveNewPromoIdsToStorage(current, true);

    await Promise.allSettled(
      current.map((id, i) => this.persistProductNewPromoFlagInDb(id, true, i + 1))
    );
  }

  async clearNewStripProducts(): Promise<void> {
    const previous = [...this.newPromoProductIds()];
    this.newPromoProductIds.set([]);
    this.saveNewPromoIdsToStorage([], true);
    await Promise.allSettled(
      previous.map((id) => this.persistProductNewPromoFlagInDb(id, false, null))
    );
  }

  async restoreDefaultNewStripProducts(count = 4): Promise<void> {
    const previous = [...this.newPromoProductIds()];
    const defaultIds = this.productsSignal()
      .filter((p) => p.isActive !== false)
      .slice(0, count)
      .map((p) => p.id);

    this.newPromoProductIds.set(defaultIds);
    this.saveNewPromoIdsToStorage(defaultIds, true);

    const toDisable = previous.filter((id) => !defaultIds.includes(id));
    await Promise.allSettled([
      ...toDisable.map((id) => this.persistProductNewPromoFlagInDb(id, false, null)),
      ...defaultIds.map((id, idx) => this.persistProductNewPromoFlagInDb(id, true, idx + 1))
    ]);
  }

  private async persistProductNewPromoFlagInDb(
    productId: string,
    isNewPromo: boolean,
    order: number | null
  ): Promise<void> {
    const prod = this.productsSignal().find((p) => p.id === productId);
    const variants = prod?.variants || [];

    // Update in-memory variant attributes as well
    this.productsSignal.update((list) =>
      list.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          isNew: isNewPromo,
          variants: (p.variants || []).map((v) => ({
            ...v,
            attributes: {
              ...(v.attributes || {}),
              is_new_promo: isNewPromo,
              new_promo_order: order
            }
          }))
        };
      })
    );

    try {
      for (const v of variants) {
        const nextAttrs = {
          ...(v.attributes || {}),
          is_new_promo: isNewPromo,
          new_promo_order: order
        };
        await (this.supabaseService.from('product_variants') as any)
          .update({ attributes: nextAttrs })
          .eq('id', v.id);
      }
    } catch {}
  }

  /**
   * Instantly toggles the product visibility in the storefront signal
   */
  setProductActive(productId: string, isActive: boolean): void {
    this.productsSignal.update((list) =>
      list.map((p) => {
        if (p.id === productId) {
          return { ...p, isActive };
        }
        return p;
      })
    );
  }

  /**
   * Instantly removes deleted products from the storefront signal
   */
  removeProducts(productIds: string[]): void {
    if (!productIds || productIds.length === 0) return;
    const idSet = new Set(productIds);
    this.productsSignal.update((list) => list.filter((p) => !idSet.has(p.id)));
  }

  /**
   * Instantly updates a variant's stock and recalculates its parent product's total stock in the storefront signal
   */
  updateVariantStockInStore(variantId: string, stockPhysical: number, stockVirtual = 0): void {
    const phys = Math.max(0, Number(stockPhysical) || 0);
    const virt = Math.max(0, Number(stockVirtual) || 0);
    const totalVarStock = phys + virt;

    this.productsSignal.update((list) =>
      list.map((p) => {
        if (!p.variants || !p.variants.some((v) => v.id === variantId)) {
          return p;
        }
        const updatedVariants = p.variants.map((v) =>
          v.id === variantId
            ? {
                ...v,
                stock: totalVarStock,
                stock_physical: phys,
                stock_virtual: virt,
                attributes: {
                  ...(v.attributes || {}),
                  stock_physical: phys,
                  stock_virtual: virt
                }
              }
            : v
        );
        const totalStock = updatedVariants.reduce((acc, v) => acc + v.stock, 0);
        const totalPhys = updatedVariants.reduce((acc, v) => acc + (v.stock_physical || 0), 0);
        const totalVirt = updatedVariants.reduce((acc, v) => acc + (v.stock_virtual || 0), 0);

        return {
          ...p,
          variants: updatedVariants,
          stock: totalStock,
          stock_physical: totalPhys,
          stock_virtual: totalVirt
        };
      })
    );
  }

  /**
   * Returns only brands that belong to the selected category.
   * If no category is chosen, returns all available brands in the store.
   * If a category is chosen, returns ONLY brands assigned to that category (or its taxonomy branch)
   * in the database, plus brands of products currently in that category.
   * Never falls back to returning all store brands when a category is specified.
   */
  getBrandsByCategory(category?: string): string[] {
    if (!category) {
      return this.brands();
    }

    const catNormalized = category.toLowerCase().trim();
    const categories = this.rawCategoriesSignal();
    const brands = this.rawBrandsSignal();

    // 1. Locate category in taxonomy
    const targetCat = categories.find(
      (c) => c.name.toLowerCase() === catNormalized || c.slug?.toLowerCase() === catNormalized || c.id === category
    );

    // Collect related category IDs (target, parent, and child subcategories)
    const relatedCatIds = new Set<string>();
    if (targetCat) {
      relatedCatIds.add(targetCat.id);
      if (targetCat.parent_id) {
        relatedCatIds.add(targetCat.parent_id);
        for (const c of categories) {
          if (c.parent_id === targetCat.parent_id) {
            relatedCatIds.add(c.id);
          }
        }
      } else {
        for (const c of categories) {
          if (c.parent_id === targetCat.id) {
            relatedCatIds.add(c.id);
          }
        }
      }
    }

    // 2. Brands registered in DB taxonomy for this category
    const dbBrands = brands
      .filter((b) => b.is_active !== false)
      .filter((b) => {
        const catIds = Array.isArray(b.category_ids) && b.category_ids.length > 0
          ? b.category_ids
          : (b.category_id ? [b.category_id] : []);
        return catIds.some((id) => relatedCatIds.has(id));
      })
      .map((b) => b.name);

    // 3. Brands of products currently in this category
    const productBrands = this.products()
      .filter((p) => {
        if (p.category.toLowerCase() === catNormalized) return true;
        if (p.subCategory && p.subCategory.toLowerCase() === catNormalized) return true;
        if (targetCat) {
          const pCat = categories.find((c) => c.name.toLowerCase() === p.category.toLowerCase());
          if (pCat && relatedCatIds.has(pCat.id)) return true;
        }
        return false;
      })
      .map((p) => p.brand);

    // Strictly union matching brands for this category
    return Array.from(new Set([...dbBrands, ...productBrands])).filter(Boolean).sort();
  }

  getProductBySlug(slug: string): Product | undefined {
    return this.products().find((p) => p.slug === slug);
  }

  getProductById(id: string): Product | undefined {
    return this.products().find((p) => p.id === id);
  }

  getRelatedProducts(product: Product, limit = 3): Product[] {
    return this.products()
      .filter((p) => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
      .slice(0, limit);
  }

  filterProducts(filter: ProductFilter, searchQuery = ''): Product[] {
    const query = searchQuery.toLowerCase().trim();
    const categories = this.rawCategoriesSignal();

    let relatedCatNames: Set<string> | null = null;
    if (filter.category) {
      const catNormalized = filter.category.toLowerCase().trim();
      const targetCat = categories.find(
        (c) => c.name.toLowerCase() === catNormalized || c.slug?.toLowerCase() === catNormalized || c.id === filter.category
      );
      if (targetCat) {
        relatedCatNames = new Set<string>();
        relatedCatNames.add(targetCat.name.toLowerCase());
        if (targetCat.parent_id) {
          const parent = categories.find((c) => c.id === targetCat.parent_id);
          if (parent) relatedCatNames.add(parent.name.toLowerCase());
        } else {
          for (const c of categories) {
            if (c.parent_id === targetCat.id) {
              relatedCatNames.add(c.name.toLowerCase());
            }
          }
        }
      }
    }

    return this.products()
      .filter((product) => {
        if (filter.category) {
          const pCat = product.category.toLowerCase();
          const pSubCat = product.subCategory?.toLowerCase();
          const target = filter.category.toLowerCase();
          const matchesDirect = pCat === target || pSubCat === target;
          const matchesHierarchy = relatedCatNames ? (relatedCatNames.has(pCat) || (!!pSubCat && relatedCatNames.has(pSubCat))) : false;
          if (!matchesDirect && !matchesHierarchy) return false;
        }
        if (filter.brand && filter.brand.length > 0 && !filter.brand.includes(product.brand)) return false;
        const priceWithTax = this.taxService.calculatePriceWithTax(product.price);
        if (filter.minPrice !== undefined && priceWithTax < filter.minPrice) return false;
        if (filter.maxPrice !== undefined && priceWithTax > filter.maxPrice) return false;
        if (filter.inStock && product.stock <= 0) return false;
        if (query) {
          const inName = product.name.toLowerCase().includes(query);
          const inBrand = product.brand.toLowerCase().includes(query);
          const inCategory = product.category.toLowerCase().includes(query);
          const inTags = product.tags?.some((t) => t.toLowerCase().includes(query));
          if (!inName && !inBrand && !inCategory && !inTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filter.sortBy === 'price-asc') return a.price - b.price;
        if (filter.sortBy === 'price-desc') return b.price - a.price;
        if (filter.sortBy === 'rating') return b.rating - a.rating;
        return 0;
      });
  }
}
