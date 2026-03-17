// db\models\user.ts
import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, default: '' },
    nickname: { type: String, default: '' },
    profile_image_url: { type: String, default: '' },
    user_type: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'user',
  }
)

const User = mongoose.models.User || mongoose.model('User', UserSchema)

export default User
