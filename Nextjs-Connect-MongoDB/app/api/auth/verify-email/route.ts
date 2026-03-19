import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/db/dbConnect'
import EmailVerification from '@/db/models/EmailVerification'
import { verifySecret } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = (await request.json()) as { email?: string; code?: string }

    if (!email || !code) {
      return NextResponse.json({ success: false, message: '이메일과 인증번호를 모두 입력해 주세요.' }, { status: 400 })
    }

    await dbConnect()

    const normalizedEmail = email.trim().toLowerCase()
    const verification = await EmailVerification.findOne({ email: normalizedEmail })

    if (!verification) {
      return NextResponse.json({ success: false, message: '인증 요청을 먼저 진행해 주세요.' }, { status: 404 })
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: '인증번호가 만료되었습니다. 다시 발송해 주세요.' },
        { status: 400 }
      )
    }

    const isValidCode = await verifySecret(code, verification.codeHash)

    if (!isValidCode) {
      return NextResponse.json({ success: false, message: '인증번호가 올바르지 않습니다.' }, { status: 400 })
    }

    verification.verifiedAt = new Date()
    await verification.save()

    return NextResponse.json({ success: true, message: '이메일 인증이 완료되었습니다.' })
  } catch (error) {
    console.error('Verify email error:', error)

    return NextResponse.json({ success: false, message: '이메일 인증 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
