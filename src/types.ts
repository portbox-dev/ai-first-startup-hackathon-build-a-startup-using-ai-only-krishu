export type SpiceLevel = 0 | 1 | 2 | 3;

export type DietaryType = 'vegetarian' | 'vegan' | 'non-vegetarian';

export interface Dish {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image?: string;
  isAvailable: boolean;
  dietaryType: DietaryType;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: SpiceLevel;
  tags: string[];
  prepTime: string;
  calories?: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  cuisine: string;
  address: string;
  city: string;
  rating: number;
  reviewsCount: number;
  openingHours: string;
  tableCount: number;
  wifiSsid: string;
  wifiPass: string;
  currencySymbol: string;
  slug?: string;
  ownerId?: string;
  id?: string;
}

export type ActiveView = 'landing' | 'dashboard' | 'customer-menu';

export type DashboardTab = 'overview' | 'menu' | 'insights' | 'ai-creator' | 'qr-code' | 'analytics' | 'settings' | 'cloud-saas';
