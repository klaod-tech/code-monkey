import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/db/dbConnect'
import EmailVerification from '@/db/models/EmailVerification'
import { generateVerificationCode, hashSecret } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/mailer'

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email?: string }

    if (!email) {
      return NextResponse.json({ success: false, message: '이메일을 입력해 주세요.' }, { status: 400 })
    }

    await dbConnect()

    const normalizedEmail = email.trim().toLowerCase()
    const code = generateVerificationCode()
    const codeHash = await hashSecret(code)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await EmailVerification.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        codeHash,
        expiresAt,
        verifiedAt: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    await sendVerificationEmail(normalizedEmail, code)

    return NextResponse.json({
      success: true,
      message: '인증번호를 이메일로 발송했습니다. 메일함을 확인해 주세요.',
    })
  } catch (error) {
    console.error('Send verification code error:', error)

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message.includes('SMTP')
            ? 'SMTP 설정이 없어 이메일 발송에 실패했습니다. SMTP 환경변수를 먼저 설정해 주세요.'
            : '인증번호 발송 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
