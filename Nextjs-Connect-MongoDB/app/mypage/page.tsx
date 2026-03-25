'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'

type StoredUser = {
  username: string
  name: string
  email: string
  phone: string
}

type SummaryItem = {
  id: string
  title: string
  subtitle: string
}

type CartItem = {
  id: string
  title: string
  quantity: number
  unitPrice: number
}

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

type MyPageUser = {
  username: string
  name: string
  phone: string
  email: string
  address?: Partial<AddressInfo>
  deliveryAddresses?: Partial<DeliveryAddress>[]
  defaultDeliveryAddressId?: string
  paymentCard?: Partial<PaymentCardInfo>
}

type MyPageResponse = {
  success?: boolean
  message?: string
  user?: MyPageUser
}

type EditableField = 'name' | 'phone' | 'email' | 'deliveryAddresses' | 'paymentCard' | null

const MYPAGE_PROFILE_KEY = 'mypageProfile'

const emptyAddress: AddressInfo = {
  postalCode: '',
  roadAddress: '',
  detailAddress: '',
}

const emptyPaymentCard: PaymentCardInfo = {
  cardCompany: '',
  cardHolder: '',
  cardNumberLast4: '',
  expiryMonth: '',
  expiryYear: '',
}

function createAddressId() {
  return `address-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function trimText(value?: string) {
  return value?.trim() ?? ''
}

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`
}

function formatAddress(address?: Partial<AddressInfo>) {
  return [address?.postalCode, address?.roadAddress, address?.detailAddress].filter(Boolean).join(' ')
}

function hasAddressValue(address?: Partial<AddressInfo>) {
  if (!address) {
    return false
  }

  return Boolean(trimText(address.postalCode) || trimText(address.roadAddress) || trimText(address.detailAddress))
}

function readStoredItems<T>(key: string): T[] {
  if (typeof window === 'undefined') {
    return []
  }

  const storedValue = localStorage.getItem(key)

  if (!storedValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(storedValue) as T[]
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

function writeStoredItems<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items))
}

async function updateServerStock(productId: string, delta: number) {
  const response = await fetch('/api/products/stock', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, delta }),
  })

  const data = (await response.json()) as { success?: boolean; stock?: number; message?: string }

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? '재고 변경에 실패했습니다.')
  }
}

function parseCartItem(item: SummaryItem): CartItem {
  const quantityMatch = item.subtitle.match(/(\d+)/)
  const priceMatch = item.subtitle.match(/([\d,]+)(?!.*[\d,])/)

  return {
    id: item.id,
    title: item.title,
    quantity: quantityMatch ? Number(quantityMatch[1]) : 1,
    unitPrice: priceMatch ? Number(priceMatch[1].replaceAll(',', '')) : 0,
  }
}

function toSummaryItem(item: CartItem): SummaryItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: `장바구니 수량 ${item.quantity}개 / ${formatPrice(item.unitPrice * item.quantity)}`,
  }
}

function normalizeDeliveryAddresses(user?: MyPageUser): DeliveryAddress[] {
  const normalized =
    user?.deliveryAddresses
      ?.map((address, index) => ({
        id: trimText(address.id) || createAddressId(),
        label: trimText(address.label) || `배송지 ${index + 1}`,
        postalCode: trimText(address.postalCode),
        roadAddress: trimText(address.roadAddress),
        detailAddress: trimText(address.detailAddress),
      }))
      .filter((address) => hasAddressValue(address)) ?? []

  if (normalized.length > 0) {
    return normalized.slice(0, 5)
  }

  if (!hasAddressValue(user?.address)) {
    return []
  }

  return [
    {
      id: createAddressId(),
      label: '기본 배송지',
      postalCode: trimText(user?.address?.postalCode),
      roadAddress: trimText(user?.address?.roadAddress),
      detailAddress: trimText(user?.address?.detailAddress),
    },
  ]
}

function getDefaultDeliveryAddress(deliveryAddresses: DeliveryAddress[], defaultId: string) {
  return deliveryAddresses.find((address) => address.id === defaultId) ?? deliveryAddresses[0] ?? null
}

function sanitizeDeliveryAddresses(deliveryAddresses: DeliveryAddress[]) {
  return deliveryAddresses
    .map((address, index) => ({
      id: trimText(address.id) || createAddressId(),
      label: trimText(address.label) || `배송지 ${index + 1}`,
      postalCode: trimText(address.postalCode),
      roadAddress: trimText(address.roadAddress),
      detailAddress: trimText(address.detailAddress),
    }))
    .filter((address) => hasAddressValue(address))
    .slice(0, 5)
}

function normalizeUser(user?: MyPageUser) {
  const deliveryAddresses = normalizeDeliveryAddresses(user)
  const defaultDeliveryAddressId =
    trimText(user?.defaultDeliveryAddressId) &&
    deliveryAddresses.some((address) => address.id === trimText(user?.defaultDeliveryAddressId))
      ? trimText(user?.defaultDeliveryAddressId)
      : (deliveryAddresses[0]?.id ?? '')

  const defaultAddress = getDefaultDeliveryAddress(deliveryAddresses, defaultDeliveryAddressId)

  return {
    username: trimText(user?.username),
    name: trimText(user?.name),
    phone: trimText(user?.phone),
    email: trimText(user?.email),
    deliveryAddresses,
    defaultDeliveryAddressId,
    address: defaultAddress
      ? {
          postalCode: defaultAddress.postalCode,
          roadAddress: defaultAddress.roadAddress,
          detailAddress: defaultAddress.detailAddress,
        }
      : { ...emptyAddress },
    paymentCard: {
      ...emptyPaymentCard,
      cardCompany: trimText(user?.paymentCard?.cardCompany),
      cardHolder: trimText(user?.paymentCard?.cardHolder),
      cardNumberLast4: trimText(user?.paymentCard?.cardNumberLast4),
      expiryMonth: trimText(user?.paymentCard?.expiryMonth),
      expiryYear: trimText(user?.paymentCard?.expiryYear),
    },
  }
}

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState(normalizeUser())
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [editingField, setEditingField] = useState<EditableField>(null)
  const [orderHistory, setOrderHistory] = useState<SummaryItem[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')

    if (!storedUser) {
      setMessage('로그인 정보가 없습니다. 먼저 로그인해 주세요.')
      setIsLoading(false)
      return
    }

    const parsedUser = JSON.parse(storedUser) as StoredUser
    setUser((prev) => ({
      ...prev,
      username: parsedUser.username,
      name: parsedUser.name,
      phone: parsedUser.phone,
      email: parsedUser.email,
    }))

    const storedProfile = localStorage.getItem(MYPAGE_PROFILE_KEY)
    if (storedProfile) {
      try {
        setUser(JSON.parse(storedProfile) as ReturnType<typeof normalizeUser>)
      } catch {
        localStorage.removeItem(MYPAGE_PROFILE_KEY)
      }
    }

    setOrderHistory(readStoredItems<SummaryItem>('mypageOrders'))
    setCartItems(readStoredItems<SummaryItem>('mypageCart').map(parseCartItem))

    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/mypage?username=${parsedUser.username}`)
        const data = (await response.json()) as MyPageResponse

        if (data.success && data.user) {
          const normalizedUser = normalizeUser(data.user)
          setUser(normalizedUser)
          localStorage.setItem(MYPAGE_PROFILE_KEY, JSON.stringify(normalizedUser))
        }

        const ordersResponse = await fetch(`/api/mypage/orders?username=${parsedUser.username}`)
        const ordersData = (await ordersResponse.json()) as { success?: boolean; orders?: SummaryItem[] }

        if (ordersData.success && Array.isArray(ordersData.orders)) {
          setOrderHistory(ordersData.orders)
          writeStoredItems('mypageOrders', ordersData.orders)
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadProfile()
  }, [])

  useEffect(() => {
    if (!message) {
      return
    }

    const timer = window.setTimeout(() => setMessage(''), 1400)
    return () => window.clearTimeout(timer)
  }, [message])

  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cartItems])

  const syncCartItems = (nextItems: CartItem[]) => {
    setCartItems(nextItems)
    writeStoredItems('mypageCart', nextItems.map(toSummaryItem))
  }

  const updateCartQuantity = async (itemId: string, nextQuantity: number) => {
    const currentItem = cartItems.find((item) => item.id === itemId)

    if (!currentItem) {
      return
    }

    const delta = nextQuantity - currentItem.quantity

    if (nextQuantity < 1) {
      try {
        await updateServerStock(itemId, currentItem.quantity)
        const nextItems = cartItems.filter((item) => item.id !== itemId)
        syncCartItems(nextItems)
        setMessage('장바구니 상품을 삭제했습니다.')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '재고 변경에 실패했습니다.')
      }
      return
    }

    try {
      await updateServerStock(itemId, -delta)
      syncCartItems(cartItems.map((item) => (item.id === itemId ? { ...item, quantity: nextQuantity } : item)))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '재고 변경에 실패했습니다.')
    }
  }

  const removeOrderItem = (orderId: string) =>
    startTransition(async () => {
      const storedUser = localStorage.getItem('currentUser')
      const parsedUser = storedUser ? (JSON.parse(storedUser) as StoredUser) : null
      const nextOrders = orderHistory.filter((item) => item.id !== orderId)

      setOrderHistory(nextOrders)
      writeStoredItems('mypageOrders', nextOrders)

      if (parsedUser?.username) {
        const response = await fetch('/api/mypage/orders', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: parsedUser.username, orderId }),
        })

        if (!response.ok) {
          setOrderHistory(orderHistory)
          writeStoredItems('mypageOrders', orderHistory)
          setMessage('二쇰Ц ?댁뿭 ???뚯냼?섎뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.')
          return
        }
      }

      setMessage('주문 내역을 삭제했습니다.')
    })

  const addDeliveryAddress = () =>
    setUser((prev) => {
      if (prev.deliveryAddresses.length >= 5) {
        return prev
      }

      const nextAddress = {
        id: createAddressId(),
        label: `배송지 ${prev.deliveryAddresses.length + 1}`,
        ...emptyAddress,
      }

      const deliveryAddresses = [...prev.deliveryAddresses, nextAddress]
      const defaultDeliveryAddressId = prev.defaultDeliveryAddressId || nextAddress.id

      return {
        ...prev,
        deliveryAddresses,
        defaultDeliveryAddressId,
      }
    })

  const updateDeliveryAddress = (addressId: string, patch: Partial<DeliveryAddress>) =>
    setUser((prev) => ({
      ...prev,
      deliveryAddresses: prev.deliveryAddresses.map((address) =>
        address.id === addressId ? { ...address, ...patch } : address
      ),
    }))

  const removeDeliveryAddress = (addressId: string) =>
    setUser((prev) => {
      const deliveryAddresses = prev.deliveryAddresses.filter((address) => address.id !== addressId)
      const defaultDeliveryAddressId =
        prev.defaultDeliveryAddressId === addressId ? (deliveryAddresses[0]?.id ?? '') : prev.defaultDeliveryAddressId

      return {
        ...prev,
        deliveryAddresses,
        defaultDeliveryAddressId,
      }
    })

  const handleSave = () =>
    startTransition(async () => {
      const deliveryAddresses = sanitizeDeliveryAddresses(user.deliveryAddresses)
      const defaultDeliveryAddressId =
        user.defaultDeliveryAddressId &&
        deliveryAddresses.some((address) => address.id === user.defaultDeliveryAddressId)
          ? user.defaultDeliveryAddressId
          : (deliveryAddresses[0]?.id ?? '')
      const defaultAddress = getDefaultDeliveryAddress(deliveryAddresses, defaultDeliveryAddressId)

      const payload = {
        username: user.username,
        name: user.name,
        phone: user.phone,
        deliveryAddresses,
        defaultDeliveryAddressId,
        address: defaultAddress
          ? {
              postalCode: defaultAddress.postalCode,
              roadAddress: defaultAddress.roadAddress,
              detailAddress: defaultAddress.detailAddress,
            }
          : { ...emptyAddress },
        paymentCard: user.paymentCard,
      }

      const response = await fetch('/api/mypage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as MyPageResponse

      if (data.success && data.user) {
        const normalizedUser = normalizeUser(data.user)
        setUser(normalizedUser)
        localStorage.setItem(MYPAGE_PROFILE_KEY, JSON.stringify(normalizedUser))
        localStorage.setItem(
          'currentUser',
          JSON.stringify({
            username: normalizedUser.username,
            name: normalizedUser.name,
            email: normalizedUser.email,
            phone: normalizedUser.phone,
          })
        )
        setEditingField(null)
        setMessage('마이페이지 정보를 저장했습니다.')
      } else {
        setMessage(data.message ?? '저장에 실패했습니다.')
      }
    })

  const defaultAddress = getDefaultDeliveryAddress(user.deliveryAddresses, user.defaultDeliveryAddressId)
  const addressSummary = defaultAddress
    ? `${defaultAddress.label} / ${formatAddress(defaultAddress)}`
    : '등록된 주소가 없습니다.'
  const cardSummary = user.paymentCard.cardCompany
    ? `${user.paymentCard.cardCompany} / ${user.paymentCard.cardHolder || '명의자 미등록'} / **** ${user.paymentCard.cardNumberLast4 || '----'}`
    : '등록된 카드가 없습니다.'

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-900">
        <p className="text-lg font-semibold">마이페이지를 불러오고 있습니다...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 pb-28 pt-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          type="button"
          onClick={() => router.push('/products')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-slate-600 transition hover:bg-slate-50"
          aria-label="상품 페이지로 이동"
        >
          X
        </button>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-white p-7 shadow-[0_20px_50px_rgba(148,163,184,0.12)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Orders</p>
                <h2 className="mt-3 text-2xl font-black text-slate-900">주문 내역</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                {orderHistory.length}건
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {orderHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                  현재 저장된 주문 내역이 없습니다.
                </div>
              ) : (
                orderHistory.map((orderItem) => (
                  <div key={orderItem.id} className="rounded-2xl border border-slate-200 px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{orderItem.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{orderItem.subtitle}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOrderItem(orderItem.id)}
                        disabled={isPending}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[2rem] bg-white p-7 shadow-[0_20px_50px_rgba(148,163,184,0.12)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Cart</p>
                <h2 className="mt-3 text-2xl font-black text-slate-900">장바구니</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                {cartItems.length}건
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {cartItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                  현재 저장된 장바구니 상품이 없습니다.
                </div>
              ) : (
                cartItems.map((cartItem) => (
                  <div key={cartItem.id} className="rounded-2xl border border-slate-200 px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-slate-900">{cartItem.title}</p>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => updateCartQuantity(cartItem.id, cartItem.quantity - 1)}>
                          -
                        </button>
                        <span>{cartItem.quantity}</span>
                        <button type="button" onClick={() => updateCartQuantity(cartItem.id, cartItem.quantity + 1)}>
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] bg-white p-7 shadow-[0_20px_50px_rgba(148,163,184,0.12)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Profile</p>
              <h2 className="mt-3 text-2xl font-black text-slate-900">등록 정보</h2>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              {isPending ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>

          <div className="mt-6 divide-y divide-slate-100 rounded-[1.5rem] border border-slate-100">
            {[
              { key: 'name' as const, label: '이름', value: user.name || '등록된 이름이 없습니다.' },
              { key: 'phone' as const, label: '연락처', value: user.phone || '등록된 연락처가 없습니다.' },
              { key: 'email' as const, label: '이메일', value: user.email || '등록된 이메일이 없습니다.' },
              { key: 'deliveryAddresses' as const, label: '배송지', value: addressSummary },
              { key: 'paymentCard' as const, label: '결제 카드', value: cardSummary },
            ].map((row) => (
              <div key={row.key} className="px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-500">{row.label}</p>
                    <p className="mt-1 break-words text-base font-semibold text-slate-900">{row.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingField((prev) => (prev === row.key ? null : row.key))}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    {editingField === row.key ? '닫기' : '수정'}
                  </button>
                </div>

                {editingField === 'name' && row.key === 'name' ? (
                  <input
                    type="text"
                    value={user.name}
                    onChange={(event) => setUser((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  />
                ) : null}

                {editingField === 'phone' && row.key === 'phone' ? (
                  <input
                    type="text"
                    value={user.phone}
                    onChange={(event) => setUser((prev) => ({ ...prev, phone: event.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  />
                ) : null}

                {editingField === 'email' && row.key === 'email' ? (
                  <p className="mt-3 text-sm text-slate-500">이메일은 회원가입 정보 기준으로 표시됩니다.</p>
                ) : null}

                {editingField === 'deliveryAddresses' && row.key === 'deliveryAddresses' ? (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm text-slate-500">
                        최대 5개까지 저장할 수 있고, 기본 배송지 1개를 고정할 수 있습니다.
                      </p>
                      <button
                        type="button"
                        onClick={addDeliveryAddress}
                        disabled={user.deliveryAddresses.length >= 5}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                      >
                        배송지 추가
                      </button>
                    </div>

                    {user.deliveryAddresses.map((address, index) => {
                      const isDefault = user.defaultDeliveryAddressId === address.id
                      return (
                        <div key={address.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {address.label || `배송지 ${index + 1}`}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {isDefault ? '현재 기본 배송지입니다.' : '기본 배송지로 지정할 수 있습니다.'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setUser((prev) => ({ ...prev, defaultDeliveryAddressId: address.id }))}
                                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                              >
                                {isDefault ? '기본 배송지' : '기본 배송지 설정'}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeDeliveryAddress(address.id)}
                                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600"
                              >
                                삭제
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3">
                            <input
                              type="text"
                              value={address.label}
                              placeholder="배송지 이름"
                              onChange={(event) => updateDeliveryAddress(address.id, { label: event.target.value })}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <input
                              type="text"
                              value={address.postalCode}
                              placeholder="우편번호"
                              onChange={(event) =>
                                updateDeliveryAddress(address.id, { postalCode: event.target.value })
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <input
                              type="text"
                              value={address.roadAddress}
                              placeholder="기본 주소"
                              onChange={(event) =>
                                updateDeliveryAddress(address.id, { roadAddress: event.target.value })
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <input
                              type="text"
                              value={address.detailAddress}
                              placeholder="상세 주소"
                              onChange={(event) =>
                                updateDeliveryAddress(address.id, { detailAddress: event.target.value })
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                          </div>
                        </div>
                      )
                    })}

                    {Array.from({ length: Math.max(0, 5 - user.deliveryAddresses.length) }).map((_, index) => (
                      <button
                        key={`slot-${index}`}
                        type="button"
                        onClick={addDeliveryAddress}
                        className="flex min-h-[124px] w-full flex-col items-start justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-5 text-left"
                      >
                        <p className="text-sm font-semibold text-slate-800">추가 배송지 공간</p>
                        <p className="mt-2 text-sm text-slate-500">
                          배송지 {user.deliveryAddresses.length + index + 1}을(를) 여기에 저장할 수 있습니다.
                        </p>
                      </button>
                    ))}
                  </div>
                ) : null}

                {editingField === 'paymentCard' && row.key === 'paymentCard' ? (
                  <div className="mt-3 grid gap-3">
                    <input
                      type="text"
                      value={user.paymentCard.cardCompany}
                      placeholder="카드사"
                      onChange={(event) =>
                        setUser((prev) => ({
                          ...prev,
                          paymentCard: { ...prev.paymentCard, cardCompany: event.target.value },
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    />
                    <input
                      type="text"
                      value={user.paymentCard.cardHolder}
                      placeholder="카드 명의자"
                      onChange={(event) =>
                        setUser((prev) => ({
                          ...prev,
                          paymentCard: { ...prev.paymentCard, cardHolder: event.target.value },
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={user.paymentCard.cardNumberLast4}
                        placeholder="카드 뒤 4자리"
                        onChange={(event) =>
                          setUser((prev) => ({
                            ...prev,
                            paymentCard: {
                              ...prev.paymentCard,
                              cardNumberLast4: event.target.value.replace(/\D/g, ''),
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      />
                      <input
                        type="text"
                        value={`${user.paymentCard.expiryMonth}${user.paymentCard.expiryYear}`}
                        placeholder="만료 MMYY"
                        onChange={(event) => {
                          const sanitizedValue = event.target.value.replace(/\D/g, '').slice(0, 4)
                          setUser((prev) => ({
                            ...prev,
                            paymentCard: {
                              ...prev.paymentCard,
                              expiryMonth: sanitizedValue.slice(0, 2),
                              expiryYear: sanitizedValue.slice(2, 4),
                            },
                          }))
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Cart Total</p>
          <div className="rounded-[1rem] bg-slate-950 px-5 py-2 text-white">
            <p className="text-2xl font-black">{formatPrice(cartTotal)}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
