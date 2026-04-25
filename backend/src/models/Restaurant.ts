import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem {
  _id?: mongoose.Types.ObjectId;
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  rating: number;
  spicy: number;
  vegetarian: boolean;
  inStock: boolean;
}

export interface IRestaurant extends Document {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  deliveryTime: number;
  deliveryFee: number;
  priceForTwo: number;
  cuisines: string[];
  status: 'Open' | 'Closed';
  reviewCount: number;
  discount?: string;
  menu: IMenuItem[];
}

const menuItemSchema = new Schema<IMenuItem>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  category: { type: String, required: true },
  rating: { type: Number, default: 4.0 },
  spicy: { type: Number, default: 0 },
  vegetarian: { type: Boolean, default: false },
  inStock: { type: Boolean, default: true }
});

const restaurantSchema = new Schema<IRestaurant>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  rating: { type: Number, required: true },
  deliveryTime: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  priceForTwo: { type: Number, default: 500 },
  cuisines: [{ type: String }],
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  reviewCount: { type: Number, default: 0 },
  discount: { type: String },
  menu: [menuItemSchema]
}, { timestamps: true });

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', restaurantSchema);
