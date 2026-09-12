// ==========================================
// CUSTOM TYPES / ENUMS (SUPABASE)
// ==========================================

export type UserRole = 'customer' | 'admin' | 'sales_agent' | 'support_agent';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type LeadStage = 'prospect' | 'qualified' | 'quote_sent' | 'closed_won' | 'closed_lost';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// ==========================================
// SUPABASE DATABASE TABLES INTERFACES
// ==========================================

/**
 * Table: `profiles`
 */
export interface DbProfile {
  id: string; // uuid, Primary
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string | null;
  address?: string | null;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

/**
 * Table: `categories`
 */
export interface DbCategory {
  id: string; // uuid, Primary
  name: string;
  slug: string; // Unique
  parent_id?: string | null; // uuid, Nullable
}

/**
 * Table: `brands`
 */
export interface DbBrand {
  id: string; // uuid, Primary
  name: string;
  slug: string; // Unique
}

/**
 * Table: `products`
 */
export interface DbProduct {
  id: string; // uuid, Primary
  category_id: string; // uuid -> categories.id
  brand_id: string; // uuid -> brands.id
  model: string;
  short_description?: string | null;
  long_description?: string | null;
  product_type: string;
  is_active: boolean;
  created_at: string; // timestamptz
}

/**
 * Table: `product_variants`
 */
export interface DbProductVariant {
  id: string; // uuid, Primary
  product_id: string; // uuid -> products.id
  sku: string; // Unique
  variant_name: string;
  price: number; // numeric
  stock: number; // int4
  attributes: Record<string, any>; // jsonb
  is_bundle: boolean;
  created_at: string; // timestamptz
}

/**
 * Table: `product_bundle_items`
 */
export interface DbProductBundleItem {
  id: string; // uuid, Primary
  parent_variant_id: string; // uuid -> product_variants.id
  child_variant_id: string; // uuid -> product_variants.id
  quantity: number; // int4
}

/**
 * Table: `suppliers`
 */
export interface DbSupplier {
  id: string; // uuid, Primary
  business_name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  tax_id?: string | null; // Unique
  created_at: string; // timestamptz
}

/**
 * Table: `purchase_orders`
 */
export interface DbPurchaseOrder {
  id: string; // uuid, Primary
  supplier_id: string; // uuid -> suppliers.id
  total_amount: number; // numeric
  status: string;
  purchased_at: string; // timestamptz
}

/**
 * Table: `purchase_order_items`
 */
export interface DbPurchaseOrderItem {
  id: string; // uuid, Primary
  purchase_order_id: string; // uuid -> purchase_orders.id
  variant_id: string; // uuid -> product_variants.id
  quantity: number; // int4
  unit_cost: number; // numeric
}

/**
 * Table: `sales_orders`
 */
export interface DbSalesOrder {
  id: string; // uuid, Primary
  customer_id: string; // uuid -> profiles.id
  status: OrderStatus;
  subtotal: number; // numeric
  tax: number; // numeric
  total: number; // numeric
  shipping_address: string;
  created_at: string; // timestamptz
}

/**
 * Table: `sales_order_items`
 */
export interface DbSalesOrderItem {
  id: string; // uuid, Primary
  sales_order_id: string; // uuid -> sales_orders.id
  variant_id: string; // uuid -> product_variants.id
  unit_price: number; // numeric
  quantity: number; // int4
}

/**
 * Table: `crm_leads`
 */
export interface DbCrmLead {
  id: string; // uuid, Primary
  profile_id?: string | null; // uuid, Nullable
  full_name: string;
  email: string;
  phone?: string | null;
  stage: LeadStage;
  estimated_budget?: number | null; // numeric
  notes?: string | null;
  assigned_to?: string | null; // uuid, Nullable
  created_at: string; // timestamptz
}

/**
 * Table: `crm_interactions`
 */
export interface DbCrmInteraction {
  id: string; // uuid, Primary
  lead_id?: string | null; // uuid, Nullable
  profile_id?: string | null; // uuid, Nullable
  agent_id: string; // uuid
  channel: string;
  summary: string;
  interaction_date: string; // timestamptz
}

/**
 * Table: `crm_support_tickets`
 */
export interface DbCrmSupportTicket {
  id: string; // uuid, Primary
  customer_id: string; // uuid -> profiles.id
  sales_order_id?: string | null; // uuid, Nullable
  assigned_agent_id?: string | null; // uuid, Nullable
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string; // timestamptz
}

// ==========================================
// SUPABASE CLIENT GENERIC DATABASE SCHEMA TYPE
// ==========================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: DbProfile;
        Insert: Partial<Omit<DbProfile, 'id' | 'created_at' | 'updated_at'>> & { id: string; role: UserRole; first_name: string; last_name: string };
        Update: Partial<DbProfile>;
      };
      categories: {
        Row: DbCategory;
        Insert: Omit<DbCategory, 'id'> & { id?: string };
        Update: Partial<DbCategory>;
      };
      brands: {
        Row: DbBrand;
        Insert: Omit<DbBrand, 'id'> & { id?: string };
        Update: Partial<DbBrand>;
      };
      products: {
        Row: DbProduct;
        Insert: Omit<DbProduct, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<DbProduct>;
      };
      product_variants: {
        Row: DbProductVariant;
        Insert: Omit<DbProductVariant, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<DbProductVariant>;
      };
      product_bundle_items: {
        Row: DbProductBundleItem;
        Insert: Omit<DbProductBundleItem, 'id'> & { id?: string };
        Update: Partial<DbProductBundleItem>;
      };
      suppliers: {
        Row: DbSupplier;
        Insert: Omit<DbSupplier, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<DbSupplier>;
      };
      purchase_orders: {
        Row: DbPurchaseOrder;
        Insert: Omit<DbPurchaseOrder, 'id'> & { id?: string };
        Update: Partial<DbPurchaseOrder>;
      };
      purchase_order_items: {
        Row: DbPurchaseOrderItem;
        Insert: Omit<DbPurchaseOrderItem, 'id'> & { id?: string };
        Update: Partial<DbPurchaseOrderItem>;
      };
      sales_orders: {
        Row: DbSalesOrder;
        Insert: Omit<DbSalesOrder, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<DbSalesOrder>;
      };
      sales_order_items: {
        Row: DbSalesOrderItem;
        Insert: Omit<DbSalesOrderItem, 'id'> & { id?: string };
        Update: Partial<DbSalesOrderItem>;
      };
      crm_leads: {
        Row: DbCrmLead;
        Insert: Omit<DbCrmLead, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<DbCrmLead>;
      };
      crm_interactions: {
        Row: DbCrmInteraction;
        Insert: Omit<DbCrmInteraction, 'id'> & { id?: string };
        Update: Partial<DbCrmInteraction>;
      };
      crm_support_tickets: {
        Row: DbCrmSupportTicket;
        Insert: Omit<DbCrmSupportTicket, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<DbCrmSupportTicket>;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      lead_stage: LeadStage;
      ticket_priority: TicketPriority;
      ticket_status: TicketStatus;
    };
  };
}
