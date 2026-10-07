import { Injectable, signal, computed, inject } from '@angular/core';
import { Product, ProductFilter } from '../models/product.model';
import { SupabaseService } from './supabase.service';
import { DbProduct } from '../models/supabase.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly productsSignal = signal<Product[]>([]);
  private readonly categoriesSignal = signal<string[]>([]);
  private readonly brandsSignal = signal<string[]>([]);
  readonly isLoading = signal<boolean>(true);

  // Store only displays products where isActive !== false
  readonly products = computed(() => {
    return this.productsSignal().filter((p) => p.isActive !== false);
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
      const [prodRes, varRes, catRes, brandRes] = await Promise.all([
        (this.supabaseService.from('products') as any).select('*').order('created_at', { ascending: false }),
        (this.supabaseService.from('product_variants') as any).select('*'),
        (this.supabaseService.from('categories') as any).select('*').order('name'),
        (this.supabaseService.from('brands') as any).select('*').order('name')
      ]);

      const catData = (catRes.data || []) as any[];
      const brandData = (brandRes.data || []) as any[];
      const prodData = (prodRes.data || []) as DbProduct[];
      const varData = (varRes.data || []) as any[];

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

              return {
                id: v.id,
                name: v.variant_name,
                sku: v.sku,
                price: Number(v.price) || 0,
                stock: totalStock,
                stock_physical: stockPhys,
                stock_virtual: stockVirt,
                attributes: v.attributes || {}
              };
            });

          const minPrice = vars.length > 0 ? Math.min(...vars.map((v) => v.price)) : 0;
          const totalStock = vars.reduce((acc: number, v) => acc + v.stock, 0);
          const totalPhys = vars.reduce((acc: number, v) => acc + (v.stock_physical || 0), 0);
          const totalVirt = vars.reduce((acc: number, v) => acc + (v.stock_virtual || 0), 0);

          return {
            id: dbP.id,
            name: dbP.model,
            slug: dbP.model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || dbP.id,
            brand: brand?.name || 'Genérico',
            category: cat?.name || 'General',
            subCategory: cat?.parent_id ? cat.name : undefined,
            description: dbP.long_description || dbP.short_description || '',
            shortDescription: dbP.short_description || '',
            price: minPrice,
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

  getBrandsByCategory(category?: string): string[] {
    if (!category) {
      return this.brands();
    }
    const matchingProducts = this.products().filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
    const productBrands = matchingProducts.map((p) => p.brand);
    if (productBrands.length > 0) {
      return Array.from(new Set(productBrands)).sort();
    }
    return this.brands();
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

    return this.products()
      .filter((product) => {
        if (filter.category && product.category.toLowerCase() !== filter.category.toLowerCase()) return false;
        if (filter.brand && filter.brand.length > 0 && !filter.brand.includes(product.brand)) return false;
        if (filter.minPrice !== undefined && product.price < filter.minPrice) return false;
        if (filter.maxPrice !== undefined && product.price > filter.maxPrice) return false;
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
