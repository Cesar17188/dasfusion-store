export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  stock_physical?: number;
  stock_virtual?: number;
  attributes: Record<string, any>; // e.g. { color: 'Black', storage: '1TB' }
}

export interface ProductBundleItem {
  productId: string;
  name: string;
  discountPercentage?: number;
  quantity: number;
}

export interface ProductBundle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  items: ProductBundleItem[];
}

export interface ProductSpecification {
  category: string;
  specs: Record<string, string>;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  subCategory?: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  stock: number;
  stock_physical?: number;
  stock_virtual?: number;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isNew?: boolean;
  specifications: ProductSpecification[];
  variants?: ProductVariant[];
  bundles?: ProductBundle[];
  tags: string[];
  isActive?: boolean;
}

export interface ProductFilter {
  category?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  searchQuery?: string;
  page?: number;
  limit?: number;
}
