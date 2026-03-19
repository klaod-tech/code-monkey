import Link from 'next/link'

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Auth</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">인증 페이지 안내</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          로그인은 메인 페이지에서, 회원가입은 전용 회원가입 페이지에서 진행할 수 있도록 정리했습니다.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            로그인으로 이동
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            회원가입으로 이동
          </Link>
        </div>
      </div>
    </main>
  )
}
