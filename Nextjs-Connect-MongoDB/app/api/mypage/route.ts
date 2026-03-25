import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/db/dbConnect'
import User from '@/db/models/user'

export const dynamic = 'force-dynamic'

type AddressInfo = {
  postalCode: string
  roadAddress: string
  detailAddress: string
}

type DeliveryAddress = AddressInfo & {
  id: string
  label: string
}

type PaymentCardInfo = {
  cardCompany: string
  cardHolder: string
  cardNumberLast4: string
  expiryMonth: string
  expiryYear: string
}

type UserProfile = {
  username: string
  name: string
  phone: string
  email: string
  address?: Partial<AddressInfo>
  deliveryAddresses?: Partial<DeliveryAddress>[]
  defaultDeliveryAddressId?: string
  paymentCard?: Partial<PaymentCardInfo>
}

const emptyAddress: AddressInfo = {
  postalCode: '',
  roadAddress: '',
  detailAddress: '',
}

function trimText(value?: string) {
  return value?.trim() ?? ''
}

function hasAddressValue(address?: Partial<AddressInfo>) {
  if (!address) {
    return false
  }

  return Boolean(trimText(address.postalCode) || trimText(address.roadAddress) || trimText(address.detailAddress))
}

function normalizeDeliveryAddresses(user?: UserProfile) {
  const normalized = user?.deliveryAddresses
    ?.map((address, index) => ({
      id: trimText(address.id) || `address-${Date.now()}-${index}`,
      label: trimText(address.label) || `배송지 ${index + 1}`,
      postalCode: trimText(address.postalCode),
      roadAddress: trimText(address.roadAddress),
      detailAddress: trimText(address.detailAddress),
    }))
    .filter((address) => hasAddressValue(address))

  if (normalized && normalized.length > 0) {
    return normalized.slice(0, 5)
  }

  if (!hasAddressValue(user?.address)) {
    return []
  }

  return [
    {
      id: `legacy-address-${Date.now()}`,
      label: '기본 배송지',
      postalCode: trimText(user?.address?.postalCode),
      roadAddress: trimText(user?.address?.roadAddress),
      detailAddress: trimText(user?.address?.detailAddress),
    },
  ]
}

function getDefaultDeliveryAddress(deliveryAddresses: DeliveryAddress[], defaultDeliveryAddressId?: string) {
  return (
    deliveryAddresses.find((address) => address.id === trimText(defaultDeliveryAddressId)) ??
    deliveryAddresses[0] ??
    null
  )
}

function buildUserResponse(user: UserProfile) {
  const deliveryAddresses = normalizeDeliveryAddresses(user)
  const defaultDeliveryAddress = getDefaultDeliveryAddress(deliveryAddresses, user.defaultDeliveryAddressId) ?? null

  return {
    username: user.username,
    name: user.name,
    phone: user.phone,
    email: user.email,
    address: defaultDeliveryAddress
      ? {
          postalCode: defaultDeliveryAddress.postalCode,
          roadAddress: defaultDeliveryAddress.roadAddress,
          detailAddress: defaultDeliveryAddress.detailAddress,
        }
      : {
          ...emptyAddress,
        },
    deliveryAddresses,
    defaultDeliveryAddressId: defaultDeliveryAddress?.id ?? '',
    paymentCard: {
      cardCompany: trimText(user.paymentCard?.cardCompany),
      cardHolder: trimText(user.paymentCard?.cardHolder),
      cardNumberLast4: trimText(user.paymentCard?.cardNumberLast4),
      expiryMonth: trimText(user.paymentCard?.expiryMonth),
      expiryYear: trimText(user.paymentCard?.expiryYear),
    },
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

    return NextResponse.json({ success: true, user: buildUserResponse(user) })
  } catch (error) {
    console.error('Mypage GET error:', error)
    return NextResponse.json(
      { success: false, message: '마이페이지 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string
      name?: string
      phone?: string
      deliveryAddresses?: Partial<DeliveryAddress>[]
      defaultDeliveryAddressId?: string
      paymentCard?: Partial<PaymentCardInfo>
    }

    if (!body.username?.trim()) {
      return NextResponse.json({ success: false, message: '사용자 아이디가 필요합니다.' }, { status: 400 })
    }

    const deliveryAddresses =
      body.deliveryAddresses
        ?.map((address, index) => ({
          id: trimText(address.id) || `address-${Date.now()}-${index}`,
          label: trimText(address.label) || `배송지 ${index + 1}`,
          postalCode: trimText(address.postalCode),
          roadAddress: trimText(address.roadAddress),
          detailAddress: trimText(address.detailAddress),
        }))
        .filter((address) => hasAddressValue(address)) ?? []

    if (deliveryAddresses.length > 5) {
      return NextResponse.json(
        { success: false, message: '배송지는 최대 5개까지 저장할 수 있습니다.' },
        { status: 400 }
      )
    }

    const defaultDeliveryAddress = getDefaultDeliveryAddress(deliveryAddresses, body.defaultDeliveryAddressId) ?? null

    await dbConnect()

    const updatedUser = (await User.findOneAndUpdate(
      { username: body.username.trim() },
      {
        $set: {
          name: trimText(body.name),
          phone: trimText(body.phone),
          address: defaultDeliveryAddress
            ? {
                postalCode: defaultDeliveryAddress.postalCode,
                roadAddress: defaultDeliveryAddress.roadAddress,
                detailAddress: defaultDeliveryAddress.detailAddress,
              }
            : {
                ...emptyAddress,
              },
          deliveryAddresses,
          defaultDeliveryAddressId: defaultDeliveryAddress?.id ?? '',
          paymentCard: {
            cardCompany: trimText(body.paymentCard?.cardCompany),
            cardHolder: trimText(body.paymentCard?.cardHolder),
            cardNumberLast4: trimText(body.paymentCard?.cardNumberLast4),
            expiryMonth: trimText(body.paymentCard?.expiryMonth),
            expiryYear: trimText(body.paymentCard?.expiryYear),
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
      message: '마이페이지 정보를 저장했습니다.',
      user: buildUserResponse(updatedUser),
    })
  } catch (error) {
    console.error('Mypage PATCH error:', error)
    return NextResponse.json({ success: false, message: '마이페이지 저장 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
