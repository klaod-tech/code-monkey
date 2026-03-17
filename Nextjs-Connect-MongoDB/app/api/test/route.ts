import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import User from '@/db/models/user'

/**
 * @description nickname 중복 확인 + 사용자 정보 표시
 * @searchParams nickname
 */
export async function GET(req: NextRequest) {
  await dbConnect()
  const nickname = req.nextUrl.searchParams.get('nickname')

  if (!nickname) {
    return NextResponse.json({ message: '닉네임이 지정되지 않았습니다.' }, { status: 400 })
  }

  const existingUser = await User.findOne({ nickname: nickname })

  if (existingUser) {
    // 사용자가 존재하는 경우, 그 정보를 모두 반환
    return NextResponse.json(
      {
        message: '이 닉네임은 이미 사용 중입니다.',
        user: {
          email: existingUser.email,
          nickname: existingUser.nickname,
          profile_image_url: existingUser.profile_image_url,
          user_type: existingUser.user_type,
          createdAt: existingUser.createdAt,
          updatedAt: existingUser.updatedAt,
        },
      },
      { status: 200 }
    )
  }

  // 사용자가 존재하지 않는 경우
  return NextResponse.json({ message: '사용 가능한 닉네임입니다.' }, { status: 200 })
}
