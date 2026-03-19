import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/db/dbConnect'
import User from '@/db/models/user'
import { verifySecret } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = (await request.json()) as {
      username?: string
      password?: string
    }

    if (!username || !password) {
      return NextResponse.json({ success: false, message: '아이디와 비밀번호를 모두 입력해 주세요.' }, { status: 400 })
    }

    await dbConnect()

    const user = await User.findOne({ username: username.trim() })

    if (!user) {
      return NextResponse.json({ success: false, message: '존재하지 않는 아이디입니다.' }, { status: 404 })
    }

    const isPasswordValid = await verifySecret(password, user.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: '비밀번호가 올바르지 않습니다.' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: '로그인에 성공했습니다.',
      user: {
        username: user.username,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Login error:', error)

    return NextResponse.json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
