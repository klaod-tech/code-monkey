import mongoose from 'mongoose'

const deliveryAddressSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, default: '', trim: true },
    postalCode: { type: String, default: '' },
    roadAddress: { type: String, default: '' },
    detailAddress: { type: String, default: '' },
  },
  { _id: false }
)

const paymentCardSchema = new mongoose.Schema(
  {
    cardCompany: { type: String, default: '' },
    cardHolder: { type: String, default: '' },
    cardNumberLast4: { type: String, default: '' },
    expiryMonth: { type: String, default: '' },
    expiryYear: { type: String, default: '' },
  },
  { _id: false }
)

const orderHistoryItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, default: '', trim: true },
    subtitle: { type: String, default: '', trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const baseUserFields = {
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  emailVerified: { type: Boolean, default: false },
  address: {
    postalCode: { type: String, default: '' },
    roadAddress: { type: String, default: '' },
    detailAddress: { type: String, default: '' },
  },
  deliveryAddresses: { type: [deliveryAddressSchema], default: [] },
  defaultDeliveryAddressId: { type: String, default: '' },
  orderHistory: { type: [orderHistoryItemSchema], default: [] },
  paymentCard: { type: paymentCardSchema, default: () => ({}) },
  nickname: { type: String, default: '' },
  profile_image_url: { type: String, default: '' },
  user_type: { type: String, default: 'member' },
}

const UserSchema = new mongoose.Schema(baseUserFields, {
  timestamps: true,
  collection: 'user',
})

UserSchema.index({ username: 1 }, { unique: true })
UserSchema.index({ email: 1 }, { unique: true })

const existingUserModel = mongoose.models.User as mongoose.Model<any> | undefined

if (existingUserModel) {
  if (!existingUserModel.schema.path('deliveryAddresses')) {
    existingUserModel.schema.add({ deliveryAddresses: baseUserFields.deliveryAddresses })
  }

  if (!existingUserModel.schema.path('defaultDeliveryAddressId')) {
    existingUserModel.schema.add({ defaultDeliveryAddressId: baseUserFields.defaultDeliveryAddressId })
  }

  if (!existingUserModel.schema.path('orderHistory')) {
    existingUserModel.schema.add({ orderHistory: baseUserFields.orderHistory })
  }
}

const User: mongoose.Model<any> = existingUserModel ?? mongoose.model<any>('User', UserSchema)

export default User
