import mongoose from 'mongoose'

const EmailVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    verifiedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'email_verification',
  }
)

EmailVerificationSchema.index({ email: 1 }, { unique: true })

const EmailVerification =
  mongoose.models.EmailVerification || mongoose.model('EmailVerification', EmailVerificationSchema)

export default EmailVerification
