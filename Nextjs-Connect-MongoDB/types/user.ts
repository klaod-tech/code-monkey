export interface User {
  username: string
  passwordHash: string
  name: string
  phone: string
  email: string
  emailVerified: boolean
  address: {
    postalCode: string
    roadAddress: string
    detailAddress: string
  }
  paymentCard: {
    cardCompany: string
    cardHolder: string
    cardNumberLast4: string
    expiryMonth: string
    expiryYear: string
  }
  nickname: string
  profile_image_url: string
  user_type: string
  createdAt: Date
  updatedAt: Date
}
