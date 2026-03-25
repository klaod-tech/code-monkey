import dbConnect from '@/db/dbConnect'
import Product from '@/db/models/Product'

import ProductsClient from './products-client'

export const dynamic = 'force-dynamic'

export type ProductItem = {
  _id: string
  name: string
  price: number
  imageUrl: string
  origin: string
  features: string
  stock: number
}

async function getProducts() {
  await dbConnect()
  await Product.collection.updateMany(
    {
      $or: [{ stock: { $exists: false } }, { stock: null }],
    },
    { $set: { stock: 100 } }
  )

  const products = await Product.find().sort({ createdAt: -1 }).lean<ProductItem[]>()
  return products.map((product) => ({
    ...product,
    _id: String(product._id),
    stock: typeof product.stock === 'number' && Number.isFinite(product.stock) ? product.stock : 100,
  }))
}

export default async function ProductsPage() {
  const products = await getProducts()

  return <ProductsClient products={products} />
}
