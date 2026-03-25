export type CheckoutDraftSource = 'single' | 'cart' | 'purchase'

export type CheckoutDraftItem = {
  productId: string
  title: string
  imageUrl: string
  quantity: number
  unitPrice: number
}

export type CheckoutDraft = {
  source: CheckoutDraftSource
  items: CheckoutDraftItem[]
  createdAt: string
}

export const CHECKOUT_DRAFT_KEY = 'checkoutDraft'
