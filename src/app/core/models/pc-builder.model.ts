import { Product } from './product.model';

export type ComponentCategory =
  | 'cpu'
  | 'cooler'
  | 'motherboard'
  | 'ram'
  | 'gpu'
  | 'storage'
  | 'power_supply'
  | 'case'
  | 'fans'
  | 'operating_system';

export interface ComponentStep {
  id: ComponentCategory;
  name: string;
  description: string;
  required: boolean;
  order: number;
  iconName: string;
}

export interface SelectedComponent {
  stepId: ComponentCategory;
  product: Product;
  quantity: number;
}

export interface CompatibilityCheck {
  isCompatible: boolean;
  issues: string[];
  estimatedWattage: number;
}

export interface PCConfiguration {
  id?: string;
  name: string;
  components: Record<ComponentCategory, SelectedComponent | null>;
  totalPrice: number;
  estimatedWattage: number;
  notes?: string;
}
