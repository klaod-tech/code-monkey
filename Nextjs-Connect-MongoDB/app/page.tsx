'use client'

import Link from 'next/link'
import { FormEvent, useState, useTransition } from 'react'

type LoginResult = {
  success?: boolean
  message: string
  user?: {
    username: string
    name: string
    email: string
  }
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<LoginResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      setResult(null)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = (await response.json()) as LoginResult
      setResult(data)
    })
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff2d8_0%,#f7fafc_35%,#dbeafe_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between bg-slate-950 px-8 py-10 text-white md:px-12 md:py-12">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-white/20 px-4 py-1 text-sm text-amber-200">
                Member Access
              </p>
              <h1 className="max-w-md text-4xl font-black leading-tight md:text-5xl">서비스 이용을 위한 로그인 화면</h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300 md:text-base">
                아이디와 비밀번호로 로그인하고, 처음 방문한 사용자는 아래 회원가입으로 바로 이동할 수 있습니다.
              </p>
            </div>

            <div className="mt-10 grid gap-4 text-sm text-slate-200 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold">간단한 로그인</p>
                <p className="mt-2 text-slate-300">아이디와 비밀번호만 입력하면 됩니다.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold">이메일 인증</p>
                <p className="mt-2 text-slate-300">회원가입 시 인증번호 확인을 거칩니다.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold">즉시 가입 이동</p>
                <p className="mt-2 text-slate-300">로그인 아래 회원가입 링크가 연결됩니다.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center px-6 py-10 md:px-10">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Login</p>
                <h2 className="mt-3 text-3xl font-black text-slate-900">로그인</h2>
                <p className="mt-2 text-sm text-slate-500">등록된 회원 정보로 바로 접속할 수 있습니다.</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">아이디</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="아이디를 입력해 주세요"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">비밀번호</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="비밀번호를 입력해 주세요"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isPending ? '로그인 중...' : '로그인'}
                </button>
              </form>

              {result ? (
                <div
                  className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                    result.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  <p>{result.message}</p>
                  {result.success && result.user ? (
                    <p className="mt-2 text-xs text-emerald-600">
                      {result.user.name} ({result.user.username}) / {result.user.email}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">회원이 아니신가요?</p>
                <Link
                  href="/signup"
                  className="mt-2 inline-flex text-sm font-semibold text-amber-700 underline underline-offset-4"
                >
                  회원가입 하러 가기
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
