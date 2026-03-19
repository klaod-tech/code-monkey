export interface User {
  username: string
  passwordHash: string
  name: string
  phone: string
  email: string
  emailVerified: boolean
  nickname: string
  profile_image_url: string
  user_type: string
  createdAt: Date
  updatedAt: Date
}
