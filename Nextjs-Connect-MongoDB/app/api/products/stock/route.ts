import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/db/dbConnect'
import Product from '@/db/models/Product'

export const dynamic = 'force-dynamic'

type StockBody = {
  productId?: string
  delta?: number
}

export async function PATCH(request: NextRequest) {
  await dbConnect()

  try {
    const body = (await request.json()) as StockBody
    const productId = body.productId?.trim()
    const delta = Number(body.delta)

    if (!productId || !Number.isFinite(delta) || delta === 0) {
      return NextResponse.json({ success: false, message: '유효한 재고 변경 값이 필요합니다.' }, { status: 400 })
    }

    const quantity = Math.abs(delta)

    const product =
      delta < 0
        ? await Product.findOneAndUpdate(
            { _id: productId, stock: { $gte: quantity } },
            { $inc: { stock: delta } },
            { new: true }
          )
        : await Product.findByIdAndUpdate(productId, { $inc: { stock: delta } }, { new: true })

    if (!product) {
      return NextResponse.json(
        { success: false, message: delta < 0 ? '재고가 부족합니다.' : '상품을 찾을 수 없습니다.' },
        { status: delta < 0 ? 409 : 404 }
      )
    }

    return NextResponse.json({ success: true, stock: product.stock })
  } catch (error) {
    console.error('Stock update error:', error)
    return NextResponse.json({ success: false, message: '재고 변경 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
