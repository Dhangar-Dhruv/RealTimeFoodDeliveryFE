export type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  rating: number;
  spicy: number;
  vegetarian: boolean;
  inStock: boolean;
};

export type Coupon = {
  code: string;
  discountPercent: number;
  minAmount: number;
  validCuisines: string[];
};

export type cartItem = {
  itemId: string;
  itemName: string;
  price: number;
  qty: number;
};

export type Tcart = {
  items: cartItem[];
  createdAt: Date;
};

export type TcartTotal = {
  subtotal: number;
  surge: number;
  tax: number;
  deliveryFee: number;
  total: number;
  cartQty: number;
};

export type TAdd = {
  street: string;
  city: string;
  zip: string;
};

export type TPay = 'cash' | 'card' | 'wallet';

// Re-export new types
export type { TUserProfile, TOrder, TOrderItem, TDeliveryStatus, TRestaurant } from './userTypes';
