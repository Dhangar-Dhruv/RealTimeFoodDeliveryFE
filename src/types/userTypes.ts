export type TUserProfile = {
  name: string;
  email: string;
  phone: string;
};

export type TDeliveryStatus = 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered';

export type TOrderItem = {
  itemId: string;
  itemName: string;
  price: number;
  qty: number;
};

export type TOrder = {
  orderId: string;
  items: TOrderItem[];
  subtotal: number;
  surge: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  address: {
    street: string;
    city: string;
    zip: string;
  };
  paymentMethod: string;
  status: TDeliveryStatus;
  restaurantName: string;
  placedAt: string;          // ISO timestamp
  estimatedDelivery: string; // ISO timestamp
  deliveryPerson: {
    name: string;
    phone: string;
  };
};

export type TRestaurant = {
  name: string;
  cuisines: string[];
  rating: number;
  deliveryFee: number;
  status: 'Open' | 'Closed';
  deliveryTime: number;
  reviewCount: number;
  imageUrl: string;
};
