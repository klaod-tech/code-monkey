import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/db/dbConnect'
import User from '@/db/models/user'

export const dynamic = 'force-dynamic'

type OrderHistoryItem = {
  id: string
  title: string
  subtitle: string
  createdAt?: string
}

type UserProfile = {
  username: string
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

function normalizeOrderSubtitle(order: Partial<OrderHistoryItem>) {
  const rawSubtitle = trimText(order.subtitle)
  const rawCreatedAt = trimText(order.createdAt)

  const numberMatches = rawSubtitle.match(/[\d,]+/g) ?? []
  const quantity =
    numberMatches.length >= 2 ? numberMatches[numberMatches.length - 2].replaceAll(',', '') : (numberMatches[0] ?? '')
  const priceRaw = numberMatches[numberMatches.length - 1] ?? ''
  const price = priceRaw ? Number(priceRaw.replaceAll(',', '')) : 0

  const formattedTime = rawCreatedAt ? formatOrderTimestamp(rawCreatedAt) : ''

  if (quantity && price > 0 && formattedTime) {
    return `${formattedTime} / 수량 ${quantity}개 / ${formatPrice(price)}`
  }

  if (quantity && price > 0) {
    return `수량 ${quantity}개 / ${formatPrice(price)}`
  }

  return rawSubtitle.replaceAll('?', '').trim()
}

function normalizeOrder(order: Partial<OrderHistoryItem>, index = 0): OrderHistoryItem | null {
  const id = trimText(order.id) || `order-${Date.now()}-${index}`
  const title = trimText(order.title)
  const subtitle = normalizeOrderSubtitle(order)

  if (!title || !subtitle) {
    return null
  }

  return {
    id,
    title,
    subtitle,
    createdAt: order.createdAt ?? new Date().toISOString(),
  }
}

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username')?.trim()

    if (!username) {
      return NextResponse.json({ success: false, message: '사용자 아이디가 필요합니다.' }, { status: 400 })
    }

    await dbConnect()

    const user = (await User.findOne({ username }).lean()) as UserProfile | null

    if (!user) {
      return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    const orders = Array.isArray(user.orderHistory)
      ? user.orderHistory.map((order, index) => normalizeOrder(order, index)).filter(Boolean)
      : []

    return NextResponse.json({
      success: true,
      orders,
    })
  } catch (error) {
    console.error('Mypage orders GET error:', error)
    return NextResponse.json(
      { success: false, message: '주문 내역을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string
      orders?: Partial<OrderHistoryItem>[]
    }

    if (!body.username?.trim()) {
      return NextResponse.json({ success: false, message: '사용자 아이디가 필요합니다.' }, { status: 400 })
    }

    const orders = (body.orders ?? [])
      .map((order, index) => normalizeOrder(order, index))
      .filter(Boolean) as OrderHistoryItem[]

    if (orders.length === 0) {
      return NextResponse.json({ success: false, message: '추가할 주문 내역이 없습니다.' }, { status: 400 })
    }

    await dbConnect()

    const updatedUser = (await User.findOneAndUpdate(
      { username: body.username.trim() },
      {
        $push: {
          orderHistory: {
            $each: orders,
            $position: 0,
          },
        },
      },
      { new: true }
    ).lean()) as UserProfile | null

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      orders: Array.isArray(updatedUser.orderHistory) ? updatedUser.orderHistory : [],
    })
  } catch (error) {
    console.error('Mypage orders POST error:', error)
    return NextResponse.json({ success: false, message: '주문 내역 저장 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string
      orderId?: string
    }

    if (!body.username?.trim() || !body.orderId?.trim()) {
      return NextResponse.json({ success: false, message: '사용자 아이디와 주문 번호가 필요합니다.' }, { status: 400 })
    }

    await dbConnect()

    const updatedUser = (await User.findOneAndUpdate(
      { username: body.username.trim() },
      {
        $pull: {
          orderHistory: {
            id: body.orderId.trim(),
          },
        },
      },
      { new: true }
    ).lean()) as UserProfile | null

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      orders: Array.isArray(updatedUser.orderHistory) ? updatedUser.orderHistory : [],
    })
  } catch (error) {
    console.error('Mypage orders DELETE error:', error)
    return NextResponse.json({ success: false, message: '주문 내역 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
