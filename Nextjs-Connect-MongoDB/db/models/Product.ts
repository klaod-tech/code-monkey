import mongoose, { Document, Model } from 'mongoose'

export interface IProduct extends Document {
  name: string
  price: number
  imageUrl: string
  origin: string
  features: string
  stock: number
}

const ProductSchema = new mongoose.Schema<IProduct>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    origin: { type: String, required: true },
    features: { type: String, required: true },
    stock: { type: Number, required: true, default: 100, min: 0 },
  },
  {
    timestamps: true,
  }
)

const existingProductModel = mongoose.models.Product as Model<IProduct> | undefined

if (existingProductModel && !existingProductModel.schema.path('stock')) {
  existingProductModel.schema.add({
    stock: { type: Number, required: true, default: 100, min: 0 },
  })
}

const Product: Model<IProduct> = existingProductModel || mongoose.model<IProduct>('Product', ProductSchema)

export default Product
