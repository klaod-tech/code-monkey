import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/db/dbConnect'
import EmailVerification from '@/db/models/EmailVerification'
import { generateVerificationCode, hashSecret } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/mailer'

function isSmtpDevMock() {
  return process.env.NODE_ENV === 'development' && process.env.SMTP_DEV_MOCK === 'true'
}

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

    const devMock = isSmtpDevMock()

    if (devMock) {
      console.info(`[SMTP_DEV_MOCK] 인증번호 ${normalizedEmail}: ${code}`)
    } else {
      await sendVerificationEmail(normalizedEmail, code)
    }

    return NextResponse.json({
      success: true,
      message: devMock
        ? '개발 모드(SMTP_DEV_MOCK): 메일은 보내지 않습니다. devCode 또는 서버 로그를 확인하세요.'
        : '인증번호를 이메일로 발송했습니다. 메일함을 확인해 주세요.',
      ...(devMock ? { devCode: code } : {}),
    })
  } catch (error) {
    console.error('Send verification code error:', error)

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error && error.message.includes('SMTP')
            ? 'SMTP 설정이 없어 이메일 발송에 실패했습니다. .env.local에 Gmail/Naver를 채우거나, 로컬 개발 시 SMTP_DEV_MOCK=true 를 설정하세요.'
            : '인증번호 발송 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
