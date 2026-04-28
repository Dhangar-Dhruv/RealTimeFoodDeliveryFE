import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  restaurantId: string;
  restaurantName: string;
  items: {
    menuItemId: string;
    name: string;
    price: number;
    qty: number;
  }[];
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
  status: 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered';
  estimatedDelivery: Date;
}

const orderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: String, required: true },
  restaurantName: { type: String, required: true },
  items: [{
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  surge: { type: Number, default: 0 },
  tax: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  address: {
    street: String,
    city: String,
    zip: String
  },
  paymentMethod: { type: String, required: true },
  status: { type: String, enum: ['confirmed', 'preparing', 'out-for-delivery', 'delivered'], default: 'confirmed' },
  estimatedDelivery: { type: Date, required: true }
}, { timestamps: true });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
