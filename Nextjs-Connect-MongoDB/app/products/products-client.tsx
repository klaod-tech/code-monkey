'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'

import { CHECKOUT_DRAFT_KEY, type CheckoutDraft } from '@/lib/checkout-draft'

import type { ProductItem } from './page'

type StoredCartItem = {
  id: string
  title: string
  subtitle: string
  imageUrl?: string
  quantity?: number
  unitPrice?: number
}

const CART_STORAGE_KEY = 'mypageCart'

function formatPrice(value: number) {
  return `${value.toLocaleString()}원`
}

function buildCartSubtitle(quantity: number, unitPrice: number) {
  return `장바구니 수량 ${quantity}개 / ${formatPrice(quantity * unitPrice)}`
}

function parseStoredCartItems(): StoredCartItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  const storedValue = localStorage.getItem(CART_STORAGE_KEY)

  if (!storedValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(storedValue) as StoredCartItem[]
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

function saveStoredCartItems(items: StoredCartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

async function updateServerStock(productId: string, delta: number) {
  const response = await fetch('/api/products/stock', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, delta }),
  })

  const data = (await response.json()) as { success?: boolean; stock?: number; message?: string }

  if (!response.ok || !data.success || typeof data.stock !== 'number') {
    throw new Error(data.message ?? '재고 변경에 실패했습니다.')
  }

  return data.stock
}

function extractQuantity(item: StoredCartItem) {
  if (typeof item.quantity === 'number' && Number.isFinite(item.quantity) && item.quantity > 0) {
    return item.quantity
  }

  const match = item.subtitle.match(/(\d+)/)
  return match ? Number(match[1]) : 1
}

function extractUnitPrice(item: StoredCartItem, quantity: number) {
  if (typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice) && item.unitPrice >= 0) {
    return item.unitPrice
  }

  const match = item.subtitle.match(/([\d,]+)(?!.*[\d,])/)

  if (!match) {
    return 0
  }

  const totalPrice = Number(match[1].replaceAll(',', ''))
  return quantity > 0 ? Math.floor(totalPrice / quantity) : totalPrice
}

function makeCheckoutDraft(source: CheckoutDraft['source'], items: CheckoutDraft['items']): CheckoutDraft {
  return {
    source,
    items,
    createdAt: new Date().toISOString(),
  }
}

export default function ProductsClient({ products }: { products: ProductItem[] }) {
  const router = useRouter()
  const [productsState, setProductsState] = useState(products)
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)
  const [cartItems, setCartItems] = useState<StoredCartItem[]>([])
  const [checkedProductIds, setCheckedProductIds] = useState<string[]>([])
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({})
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setProductsState(products)
  }, [products])

  useEffect(() => {
    localStorage.removeItem('purchaseItems')

    const nextCartItems = parseStoredCartItems()
      .map((item) => {
        const quantity = extractQuantity(item)
        const unitPrice = extractUnitPrice(item, quantity)
        const matchedProduct =
          products.find((product) => product._id === item.id) ?? products.find((product) => product.name === item.title)

        return {
          id: matchedProduct?._id ?? item.id,
          title: matchedProduct?.name ?? item.title,
          subtitle: buildCartSubtitle(quantity, matchedProduct?.price ?? unitPrice),
          imageUrl: matchedProduct?.imageUrl ?? item.imageUrl ?? '',
          quantity,
          unitPrice: matchedProduct?.price ?? unitPrice,
        }
      })
      .filter((item) => item.title)

    setCartItems(nextCartItems)
    saveStoredCartItems(nextCartItems)
    setCheckedProductIds(nextCartItems.map((item) => item.id))
  }, [products])

  useEffect(() => {
    if (!message) {
      return
    }

    const timer = window.setTimeout(() => setMessage(''), 1200)
    return () => window.clearTimeout(timer)
  }, [message])

  const filteredProducts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()

    if (!keyword) {
      return productsState
    }

    return productsState.filter((product) =>
      [product.name, product.origin, product.features].some((value) => value.toLowerCase().includes(keyword))
    )
  }, [productsState, searchQuery])

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + extractQuantity(item), 0), [cartItems])

  const checkedCartItems = useMemo(
    () => cartItems.filter((item) => checkedProductIds.includes(item.id)),
    [cartItems, checkedProductIds]
  )

  const checkedCartTotal = useMemo(
    () =>
      checkedCartItems.reduce(
        (sum, item) => sum + extractQuantity(item) * extractUnitPrice(item, extractQuantity(item)),
        0
      ),
    [checkedCartItems]
  )

  const updateLocalCart = (nextItems: StoredCartItem[]) => {
    setCartItems(nextItems)
    saveStoredCartItems(nextItems)
    setCheckedProductIds((prev) => prev.filter((id) => nextItems.some((item) => item.id === id)))
  }

  const syncProductStock = (productId: string, nextStock: number) => {
    setProductsState((prev) =>
      prev.map((item) => (item._id === productId ? { ...item, stock: Math.max(0, nextStock) } : item))
    )
    setSelectedProduct((prev) => (prev && prev._id === productId ? { ...prev, stock: Math.max(0, nextStock) } : prev))
  }

  const updateProductQuantity = (productId: string, delta: number) => {
    setProductQuantities((prev) => {
      const product = productsState.find((item) => item._id === productId)
      const currentQuantity = prev[productId] ?? 1
      const nextQuantity = Math.max(1, Math.min((product?.stock ?? 1) || 1, currentQuantity + delta))

      return {
        ...prev,
        [productId]: nextQuantity,
      }
    })
  }

  const getProductQuantity = (productId: string) => productQuantities[productId] ?? 1

  const toggleCheckedProduct = (productId: string) => {
    setCheckedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const addToCart = async (product: ProductItem) => {
    const quantity = getProductQuantity(product._id)

    if (product.stock < quantity) {
      setMessage('재고가 부족합니다.')
      return
    }

    const existingItem = cartItems.find((item) => item.id === product._id)
    const nextQuantity = (existingItem ? extractQuantity(existingItem) : 0) + quantity

    if (quantity > product.stock) {
      setMessage('재고를 초과해서 장바구니에 담을 수 없습니다.')
      return
    }

    const nextItems = existingItem
      ? cartItems.map((item) =>
          item.id === product._id
            ? {
                ...item,
                quantity: nextQuantity,
                subtitle: buildCartSubtitle(nextQuantity, product.price),
                unitPrice: product.price,
                imageUrl: product.imageUrl,
              }
            : item
        )
      : [
          {
            id: product._id,
            title: product.name,
            subtitle: buildCartSubtitle(quantity, product.price),
            imageUrl: product.imageUrl,
            quantity,
            unitPrice: product.price,
          },
          ...cartItems,
        ]

    try {
      const nextStock = await updateServerStock(product._id, -quantity)
      updateLocalCart(nextItems)
      syncProductStock(product._id, nextStock)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '재고 변경에 실패했습니다.')
      return
    }
    setCheckedProductIds((prev) => (prev.includes(product._id) ? prev : [...prev, product._id]))
    setIsCartOpen(true)
    setMessage('장바구니에 담았습니다.')
  }

  const updateCartQuantity = async (productId: string, delta: number) => {
    const cartItem = cartItems.find((item) => item.id === productId)
    const product = productsState.find((item) => item._id === productId)

    if (!cartItem || !product) {
      return
    }

    const currentQuantity = extractQuantity(cartItem)
    const nextQuantity = currentQuantity + delta

    if (nextQuantity <= 0) {
      try {
        const nextStock = await updateServerStock(productId, currentQuantity)
        updateLocalCart(cartItems.filter((item) => item.id !== productId))
        syncProductStock(productId, nextStock)
        setMessage('장바구니 상품을 삭제했습니다.')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '재고 변경에 실패했습니다.')
      }
      return
    }

    if (delta > 0 && delta > product.stock) {
      setMessage('현재 재고보다 많은 수량으로 변경할 수 없습니다.')
      return
    }

    try {
      const nextStock = await updateServerStock(productId, -delta)
      updateLocalCart(
        cartItems.map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: nextQuantity,
                subtitle: buildCartSubtitle(nextQuantity, product.price),
                unitPrice: product.price,
              }
            : item
        )
      )
      syncProductStock(productId, nextStock)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '재고 변경에 실패했습니다.')
    }
  }

  const removeCartItem = async (productId: string) => {
    const cartItem = cartItems.find((item) => item.id === productId)
    const restoreQuantity = cartItem ? extractQuantity(cartItem) : 0

    if (!cartItem || restoreQuantity <= 0) {
      return
    }

    try {
      const nextStock = await updateServerStock(productId, restoreQuantity)
      updateLocalCart(cartItems.filter((item) => item.id !== productId))
      syncProductStock(productId, nextStock)
      setMessage('장바구니 상품을 삭제했습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '재고 변경에 실패했습니다.')
    }
  }

  const openCheckoutWithItems = (draft: CheckoutDraft) => {
    localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft))
    router.push('/checkout')
  }

  const goToSingleCheckout = (product: ProductItem) => {
    const quantity = getProductQuantity(product._id)

    if (product.stock < quantity) {
      setMessage('재고가 부족합니다.')
      return
    }

    openCheckoutWithItems(
      makeCheckoutDraft('single', [
        {
          productId: product._id,
          title: product.name,
          imageUrl: product.imageUrl,
          quantity,
          unitPrice: product.price,
        },
      ])
    )
  }

  const goToCartCheckout = () => {
    if (checkedCartItems.length === 0) {
      setMessage('체크한 장바구니 상품이 없습니다.')
      return
    }

    openCheckoutWithItems(
      makeCheckoutDraft(
        'cart',
        checkedCartItems.map((item) => ({
          productId: item.id,
          title: item.title,
          imageUrl: item.imageUrl ?? '',
          quantity: extractQuantity(item),
          unitPrice: extractUnitPrice(item, extractQuantity(item)),
        }))
      )
    )
  }

  const loadSampleProducts = () =>
    startTransition(async () => {
      const response = await fetch('/api/seed')
      const data = (await response.json()) as { message?: string }

      setMessage(data.message ?? '샘플 상품을 불러왔습니다.')
      router.refresh()
    })

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-20 bg-slate-950 px-8 py-6 text-white">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex rounded-full border border-slate-700 px-5 py-2 text-xl font-semibold text-amber-300">
              Products
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/mypage"
                className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                마이페이지
              </Link>
              <button
                type="button"
                onClick={() => setIsCartOpen((prev) => !prev)}
                className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                장바구니 {cartCount}개
              </button>
              <Link
                href="/"
                className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                로그인 화면
              </Link>
              <button
                type="button"
                onClick={loadSampleProducts}
                disabled={isPending}
                className="rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-amber-200"
              >
                샘플 상품 불러오기
              </button>
            </div>
          </div>

          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="상품 이름, 원산지, 특징으로 검색"
            className="h-14 w-full rounded-full border border-slate-800 bg-slate-900 px-6 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-slate-600"
          />
        </div>
      </header>

      <section className="min-w-0 px-0 py-0">
        {filteredProducts.length === 0 ? (
          <div className="px-8 py-10 text-lg font-semibold text-slate-500">상품을 찾을 수 없습니다.</div>
        ) : (
          <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredProducts.map((product) => {
              const currentQuantity = getProductQuantity(product._id)
              const isSoldOut = product.stock <= 0

              return (
                <article key={product._id} className="bg-white">
                  <button
                    type="button"
                    onClick={() => !isSoldOut && setSelectedProduct(product)}
                    className="block w-full text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.imageUrl} alt={product.name} className="h-[220px] w-full object-cover" />
                  </button>

                  <div className="space-y-4 px-5 py-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">{product.origin}</p>
                    <div className="space-y-2">
                      <p className="text-2xl font-black leading-tight text-slate-950">{product.name}</p>
                      <p className="text-base leading-7 text-slate-600">{product.features}</p>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <p className="text-3xl font-black text-slate-950">{formatPrice(product.price)}</p>
                      <p className={`text-lg font-bold ${isSoldOut ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {isSoldOut ? '품절' : `재고 ${product.stock}개`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={isSoldOut}
                        className="rounded-full border border-amber-300 px-5 py-3 text-base font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                      >
                        장바구니 담기
                      </button>
                      <button
                        type="button"
                        onClick={() => goToSingleCheckout(product)}
                        disabled={isSoldOut}
                        className="rounded-full bg-slate-950 px-5 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        구매하기
                      </button>
                      <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white">
                        <button
                          type="button"
                          onClick={() => updateProductQuantity(product._id, -1)}
                          disabled={isSoldOut}
                          className="px-4 py-3 text-base font-bold text-slate-600 transition hover:bg-slate-50 disabled:text-slate-300"
                        >
                          -
                        </button>
                        <span className="min-w-[52px] px-3 text-center text-base font-semibold text-slate-950">
                          {currentQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateProductQuantity(product._id, 1)}
                          disabled={isSoldOut || currentQuantity >= product.stock}
                          className="px-4 py-3 text-base font-bold text-slate-600 transition hover:bg-slate-50 disabled:text-slate-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {isCartOpen ? (
        <aside className="fixed right-0 top-[122px] z-30 h-[calc(100vh-122px)] w-[360px] border-l border-slate-200 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.12)]">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Cart</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">장바구니</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                닫기
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
              {cartItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                  장바구니에 담긴 상품이 없습니다.
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-200 px-5 py-5">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCheckedProduct(item.id)}
                        className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full text-lg font-black transition ${
                          checkedProductIds.includes(item.id)
                            ? 'bg-emerald-500 text-white'
                            : 'border border-slate-200 bg-white text-transparent'
                        }`}
                      >
                        ✓
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-xl font-black text-slate-950">{item.title}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-3">
                      <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className="min-w-[3rem] px-3 text-center text-sm font-semibold text-slate-950">
                          {extractQuantity(item)}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.id)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <div className="rounded-[1.75rem] bg-slate-950 px-5 py-5 text-white">
                <p className="text-sm text-slate-300">체크한 상품 금액</p>
                <p className="mt-2 text-4xl font-black">{formatPrice(checkedCartTotal)}</p>
              </div>
              <button
                type="button"
                onClick={goToCartCheckout}
                disabled={checkedCartItems.length === 0}
                className="mt-4 w-full rounded-[1.5rem] bg-amber-400 px-5 py-4 text-xl font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                구매하기
              </button>
            </div>
          </div>
        </aside>
      ) : null}

      {selectedProduct ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-[320px] w-full object-cover" />
            <div className="space-y-5 px-7 py-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                    {selectedProduct.origin}
                  </p>
                  <h3 className="mt-3 text-3xl font-black text-slate-950">{selectedProduct.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  닫기
                </button>
              </div>
              <p className="text-lg leading-8 text-slate-600">{selectedProduct.features}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-500">제품명</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{selectedProduct.name}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-500">가격</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{formatPrice(selectedProduct.price)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-500">재고</p>
                  <p
                    className={`mt-2 text-lg font-black ${selectedProduct.stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}
                  >
                    {selectedProduct.stock > 0 ? `${selectedProduct.stock}개` : '품절'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => addToCart(selectedProduct)}
                  disabled={selectedProduct.stock <= 0}
                  className="rounded-full border border-amber-300 px-6 py-3 text-base font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                >
                  장바구니 담기
                </button>
                <button
                  type="button"
                  onClick={() => goToSingleCheckout(selectedProduct)}
                  disabled={selectedProduct.stock <= 0}
                  className="rounded-full bg-slate-950 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  구매하기
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
