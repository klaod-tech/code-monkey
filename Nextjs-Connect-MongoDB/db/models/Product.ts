import mongoose, { Document, Model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  imageUrl: string;
  origin: string;
  features: string;
}

const ProductSchema = new mongoose.Schema<IProduct>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    origin: { type: String, required: true },
    features: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
