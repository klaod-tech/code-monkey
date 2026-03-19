'use client'

import Link from 'next/link'

export default function LegacySignupNotice() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm">
      <h2 className="text-2xl font-black">회원가입 화면이 새 경로로 이동했습니다.</h2>
      <p className="mt-3 text-sm text-slate-600">
        최신 회원가입 화면은 이메일 인증 기능이 포함된 <code>/signup</code> 페이지에서 사용할 수 있습니다.
      </p>
      <Link
        href="/signup"
        className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
      >
        새 회원가입 페이지 열기
      </Link>
    </div>
  )
}
