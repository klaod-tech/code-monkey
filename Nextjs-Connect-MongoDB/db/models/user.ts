import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    emailVerified: { type: Boolean, default: false },
    nickname: { type: String, default: '' },
    profile_image_url: { type: String, default: '' },
    user_type: { type: String, default: 'member' },
  },
  {
    timestamps: true,
    collection: 'user',
  }
)

UserSchema.index({ username: 1 }, { unique: true })
UserSchema.index({ email: 1 }, { unique: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)

export default User
