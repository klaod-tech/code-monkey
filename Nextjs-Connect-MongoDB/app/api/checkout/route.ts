import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/db/dbConnect'
import Product from '@/db/models/Product'
import User from '@/db/models/user'

export const dynamic = 'force-dynamic'

type CheckoutItem = {
  productId?: string
  title?: string
  quantity?: number
  unitPrice?: number
}

type CheckoutBody = {
  username?: string
  recipientName?: string
  recipientPhone?: string
  recipientAddress?: string
  message?: string
  items?: CheckoutItem[]
}

type OrderHistoryItem = {
  id: string
  title: string
  subtitle: string
  createdAt?: string
}

type UserWithOrders = {
  orderHistory?: OrderHistoryItem[]
}

function trimText(value?: string) {
  return value?.trim() ?? ''
}

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`
}

function formatOrderTimestamp(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).format(new Date(value))
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutBody
    const username = trimText(body.username)
    const recipientName = trimText(body.recipientName)
    const recipientPhone = trimText(body.recipientPhone)
    const recipientAddress = trimText(body.recipientAddress)
    const message = trimText(body.message)

    const items = (body.items ?? [])
      .map((item) => ({
        productId: trimText(item.productId),
        title: trimText(item.title),
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.unitPrice ?? 0),
      }))
      .filter((item) => item.productId && item.title && item.quantity > 0 && Number.isFinite(item.unitPrice))

    if (!username || !recipientName || !recipientPhone || !recipientAddress || items.length === 0) {
      return NextResponse.json({ success: false, message: '구매 정보가 충분하지 않습니다.' }, { status: 400 })
    }

    await dbConnect()

    const updatedStocks: Array<{ productId: string; quantity: number }> = []

    for (const item of items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      )

      if (!updatedProduct) {
        if (updatedStocks.length > 0) {
          await Promise.all(
            updatedStocks.map((stockItem) =>
              Product.findByIdAndUpdate(stockItem.productId, { $inc: { stock: stockItem.quantity } })
            )
          )
        }

        return NextResponse.json({ success: false, message: `${item.title} 재고가 부족합니다.` }, { status: 409 })
      }

      updatedStocks.push({ productId: item.productId, quantity: item.quantity })
    }

    const orderedAt = new Date().toISOString()
    const newOrders = items.map((item, index) => ({
      id: `${item.productId}-${Date.now()}-${index}`,
      title: item.title,
      subtitle: `${formatOrderTimestamp(orderedAt)} / 수량 ${item.quantity}개 / ${formatPrice(
        item.unitPrice * item.quantity
      )}`,
      createdAt: orderedAt,
    }))

    const updatedUser = (await User.findOneAndUpdate(
      { username },
      {
        $push: {
          orderHistory: {
            $each: newOrders,
            $position: 0,
          },
        },
      },
      { new: true }
    ).lean()) as UserWithOrders | null

    if (!updatedUser) {
      await Promise.all(
        updatedStocks.map((stockItem) =>
          Product.findByIdAndUpdate(stockItem.productId, { $inc: { stock: stockItem.quantity } })
        )
      )

      return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `${recipientName}님 주문이 완료되었습니다.`,
      orders: Array.isArray(updatedUser.orderHistory) ? updatedUser.orderHistory : newOrders,
      recipient: {
        name: recipientName,
        phone: recipientPhone,
        address: recipientAddress,
        message,
      },
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ success: false, message: '최종 구매 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
