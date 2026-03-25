import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/db/dbConnect'
import EmailVerification from '@/db/models/EmailVerification'
import User from '@/db/models/user'
import { hashSecret } from '@/lib/auth'

type SignupPayload = {
  username?: string
  password?: string
  passwordConfirm?: string
  name?: string
  phone?: string
  email?: string
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, passwordConfirm, name, phone, email } = (await request.json()) as SignupPayload

    if (!username || !password || !passwordConfirm || !name || !phone || !email) {
      return NextResponse.json({ success: false, message: '모든 항목을 입력해 주세요.' }, { status: 400 })
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { success: false, message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    await dbConnect()

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedUsername = username.trim()
    const verification = await EmailVerification.findOne({ email: normalizedEmail })

    if (!verification?.verifiedAt) {
      return NextResponse.json({ success: false, message: '이메일 인증이 완료되지 않았습니다.' }, { status: 400 })
    }

    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    })

    if (existingUser) {
      return NextResponse.json({ success: false, message: '이미 사용 중인 아이디 또는 이메일입니다.' }, { status: 409 })
    }

    const passwordHash = await hashSecret(password)

    await User.create({
      username: normalizedUsername,
      passwordHash,
      name: name.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      emailVerified: true,
      nickname: normalizedUsername,
      user_type: 'member',
    })

    await EmailVerification.deleteOne({ email: normalizedEmail })

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        username: normalizedUsername,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
      },
    })
  } catch (error) {
    console.error('Signup error:', error)

    return NextResponse.json({ success: false, message: '회원가입 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
