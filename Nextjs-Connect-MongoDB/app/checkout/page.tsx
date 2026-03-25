'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'

import { CHECKOUT_DRAFT_KEY, type CheckoutDraft, type CheckoutDraftItem } from '@/lib/checkout-draft'

type StoredUser = {
  username: string
  name: string
  email: string
  phone: string
}

type DeliveryAddress = {
  id: string
  label: string
  postalCode: string
  roadAddress: string
  detailAddress: string
}

type MyPageResponse = {
  success?: boolean
  user?: {
    deliveryAddresses?: DeliveryAddress[]
    defaultDeliveryAddressId?: string
    address?: {
      postalCode?: string
      roadAddress?: string
      detailAddress?: string
    }
  }
}

function readDraft() {
  if (typeof window === 'undefined') {
    return null
  }

  const storedValue = localStorage.getItem(CHECKOUT_DRAFT_KEY)

  if (!storedValue) {
    return null
  }

  try {
    return JSON.parse(storedValue) as CheckoutDraft
  } catch {
    return null
  }
}

function readStoredItems<T>(key: string) {
  if (typeof window === 'undefined') {
    return [] as T[]
  }

  const storedValue = localStorage.getItem(key)

  if (!storedValue) {
    return [] as T[]
  }

  try {
    const parsedValue = JSON.parse(storedValue) as T[]
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return [] as T[]
  }
}

function writeStoredItems<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items))
}

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`
}

function formatAddress(address?: { postalCode?: string; roadAddress?: string; detailAddress?: string }) {
  return [address?.postalCode, address?.roadAddress, address?.detailAddress].filter(Boolean).join(' ')
}

export default function CheckoutPage() {
  const router = useRouter()
  const [draft, setDraft] = useState<CheckoutDraft | null>(null)
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null)
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [deliveryMessage, setDeliveryMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const nextDraft = readDraft()
    const storedUserValue = localStorage.getItem('currentUser')
    const parsedUser = storedUserValue ? (JSON.parse(storedUserValue) as StoredUser) : null

    setDraft(nextDraft)
    setCurrentUser(parsedUser)

    if (parsedUser) {
      setRecipientName(parsedUser.name ?? '')
      setRecipientPhone(parsedUser.phone ?? '')
    }

    const loadAddress = async () => {
      if (!parsedUser?.username) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/mypage?username=${parsedUser.username}`)
        const data = (await response.json()) as MyPageResponse

        if (data.success && data.user) {
          const defaultAddress =
            data.user.deliveryAddresses?.find((address) => address.id === data.user?.defaultDeliveryAddressId) ??
            data.user.deliveryAddresses?.[0] ??
            data.user.address

          setRecipientAddress(formatAddress(defaultAddress))
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadAddress()
  }, [])

  const totalPrice = useMemo(
    () => (draft?.items ?? []).reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [draft]
  )

  const finalizePurchase = () =>
    startTransition(async () => {
      if (!draft || draft.items.length === 0) {
        setStatusMessage('구매할 상품이 없습니다.')
        return
      }

      if (!currentUser?.username || !recipientName.trim() || !recipientPhone.trim() || !recipientAddress.trim()) {
        setStatusMessage('수령인 정보와 주소를 입력해 주세요.')
        return
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          recipientName,
          recipientPhone,
          recipientAddress,
          message: deliveryMessage,
          items: draft.items.map((item) => ({
            productId: item.productId,
            title: item.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      })

      const data = (await response.json()) as {
        success?: boolean
        message?: string
        orders?: Array<{ id: string; title: string; subtitle: string }>
      }

      if (!response.ok || !data.success) {
        setStatusMessage(data.message ?? '최종 구매에 실패했습니다.')
        return
      }

      if (Array.isArray(data.orders)) {
        writeStoredItems('mypageOrders', data.orders)
      }

      if (draft.source === 'cart') {
        const cartItems = readStoredItems<{ id: string }>('mypageCart')
        const purchasedIds = new Set(draft.items.map((item) => item.productId))

        writeStoredItems(
          'mypageCart',
          cartItems.filter((item) => !purchasedIds.has(item.id))
        )
      }

      localStorage.removeItem(CHECKOUT_DRAFT_KEY)
      setStatusMessage('')
      setShowSuccessOverlay(true)

      window.setTimeout(() => {
        router.push('/mypage')
      }, 1000)
    })

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-900">
        <p className="text-lg font-semibold">구매 정보를 불러오고 있습니다...</p>
      </main>
    )
  }

  if (!draft || draft.items.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 text-slate-900">
        <div className="w-full max-w-2xl rounded-[2rem] bg-white p-10 text-center shadow-[0_20px_50px_rgba(148,163,184,0.12)]">
          <h1 className="text-3xl font-black">구매 페이지</h1>
          <p className="mt-4 text-slate-500">현재 진행 중인 구매 상품이 없습니다.</p>
          <Link
            href="/products"
            className="mt-8 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white"
          >
            상품 페이지로 돌아가기
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-900">
      {showSuccessOverlay ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4">
          <div className="rounded-[1.75rem] bg-white px-10 py-8 text-center shadow-[0_25px_80px_rgba(15,23,42,0.22)]">
            <p className="text-3xl font-black text-slate-950">구매가 완료되었습니다</p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">구매 페이지</h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600"
          >
            이전으로
          </button>
        </div>

        {statusMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[2rem] bg-white p-7 shadow-[0_20px_50px_rgba(148,163,184,0.12)]">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Order Items</p>
            <h2 className="mt-3 text-2xl font-black">구매 상품</h2>

            <div className="mt-6 space-y-4">
              {draft.items.map((item: CheckoutDraftItem) => (
                <div
                  key={`${item.productId}-${item.quantity}`}
                  className="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-[120px_1fr]"
                >
                  <div className="overflow-hidden rounded-2xl bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.title} className="h-28 w-full object-cover" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-black">{item.title}</p>
                    <p className="text-sm text-slate-500">수량 {item.quantity}개</p>
                    <p className="text-sm text-slate-500">개별 금액 {formatPrice(item.unitPrice)}</p>
                    <p className="text-lg font-bold text-slate-900">
                      합계 {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] bg-white p-7 shadow-[0_20px_50px_rgba(148,163,184,0.12)]">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Delivery</p>
            <h2 className="mt-3 text-2xl font-black">수령 정보</h2>

            <div className="mt-6 space-y-3">
              <input
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
                placeholder="수령인 성함"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
              <input
                value={recipientPhone}
                onChange={(event) => setRecipientPhone(event.target.value)}
                placeholder="연락처"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
              <textarea
                value={recipientAddress}
                onChange={(event) => setRecipientAddress(event.target.value)}
                placeholder="주소"
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
              <textarea
                value={deliveryMessage}
                onChange={(event) => setDeliveryMessage(event.target.value)}
                placeholder="메시지 입력"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-950 px-5 py-4 text-white">
              <p className="text-sm text-slate-300">총 결제 금액</p>
              <p className="mt-2 text-3xl font-black">{formatPrice(totalPrice)}</p>
            </div>

            <button
              type="button"
              onClick={finalizePurchase}
              disabled={isPending || showSuccessOverlay}
              className="mt-6 w-full rounded-[1.25rem] bg-amber-400 px-5 py-4 text-base font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              최종 구매
            </button>
          </article>
        </section>
      </div>
    </main>
  )
}
