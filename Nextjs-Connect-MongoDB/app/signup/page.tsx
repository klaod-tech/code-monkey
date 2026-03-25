'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState, useTransition } from 'react'

type ApiResponse = {
  success?: boolean
  message: string
  user?: {
    username: string
    name: string
    email: string
    phone: string
  }
}

type SignUpForm = {
  username: string
  password: string
  passwordConfirm: string
  name: string
  phone: string
  email: string
  verificationCode: string
}

const initialForm: SignUpForm = {
  username: '',
  password: '',
  passwordConfirm: '',
  name: '',
  phone: '',
  email: '',
  verificationCode: '',
}

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState<SignUpForm>(initialForm)
  const [sendResult, setSendResult] = useState<ApiResponse | null>(null)
  const [verifyResult, setVerifyResult] = useState<ApiResponse | null>(null)
  const [signupResult, setSignupResult] = useState<ApiResponse | null>(null)
  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [isSending, startSending] = useTransition()
  const [isVerifying, startVerifying] = useTransition()
  const [isSubmitting, startSubmitting] = useTransition()

  const isPasswordMatched = useMemo(() => {
    if (!form.passwordConfirm) {
      return false
    }

    return form.password === form.passwordConfirm
  }, [form.password, form.passwordConfirm])

  const updateField = (field: keyof SignUpForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))

    if (field === 'email' && verifiedEmail && verifiedEmail !== value) {
      setVerifiedEmail('')
      setVerifyResult(null)
    }
  }

  const handleSendCode = () => {
    if (!form.email) {
      setSendResult({ success: false, message: '이메일을 먼저 입력해 주세요.' })
      return
    }

    startSending(async () => {
      setSendResult(null)
      setVerifyResult(null)
      setVerifiedEmail('')

      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: form.email }),
      })

      const data = (await response.json()) as ApiResponse
      setSendResult(data)
    })
  }

  const handleVerifyCode = () => {
    if (!form.email || !form.verificationCode) {
      setVerifyResult({ success: false, message: '이메일과 인증번호를 모두 입력해 주세요.' })
      return
    }

    startVerifying(async () => {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          code: form.verificationCode,
        }),
      })

      const data = (await response.json()) as ApiResponse
      setVerifyResult(data)

      if (data.success) {
        setVerifiedEmail(form.email)
      }
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isPasswordMatched) {
      setSignupResult({ success: false, message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' })
      return
    }

    if (verifiedEmail !== form.email) {
      setSignupResult({ success: false, message: '이메일 인증을 완료한 뒤 회원가입을 진행해 주세요.' })
      return
    }

    startSubmitting(async () => {
      setSignupResult(null)

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = (await response.json()) as ApiResponse
      setSignupResult(data)

      if (data.success) {
        setForm(initialForm)
        setVerifiedEmail('')
        setSendResult(null)
        setVerifyResult(null)
        if (data.user) {
          localStorage.setItem('currentUser', JSON.stringify(data.user))
        }
        router.push('/products')
      }
    })
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff7ed_0%,#eff6ff_55%,#ecfeff_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">Sign Up</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">회원가입</h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            로그인으로 돌아가기
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-[0_25px_70px_rgba(15,23,42,0.2)]">
            <p className="inline-flex rounded-full border border-white/20 px-4 py-1 text-sm text-amber-200">
              Create Account
            </p>
            <h2 className="mt-6 text-3xl font-black leading-tight">
              회원 정보를 입력하고 이메일 인증까지 완료해 주세요.
            </h2>
            <div className="mt-8 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">1. 기본 정보 입력</p>
                <p className="mt-2">아이디, 비밀번호, 성함, 연락처, 이메일을 입력합니다.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">2. 이메일 인증번호 발송</p>
                <p className="mt-2">이메일 확인 버튼을 누르면 인증번호가 메일로 발송됩니다.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">3. 인증번호 확인 후 가입</p>
                <p className="mt-2">인증번호와 비밀번호 확인이 모두 완료되어야 가입할 수 있습니다.</p>
              </div>
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_25px_70px_rgba(148,163,184,0.25)] backdrop-blur md:p-8"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">아이디</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={(event) => updateField('username', event.target.value)}
                  placeholder="로그인에 사용할 아이디"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">성함</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="이름을 입력해 주세요"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">비밀번호</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="비밀번호를 입력해 주세요"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">비밀번호 확인</span>
                <input
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(event) => updateField('passwordConfirm', event.target.value)}
                  placeholder="비밀번호를 다시 입력해 주세요"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                  required
                />
                {form.passwordConfirm ? (
                  <p className={`mt-2 text-xs font-medium ${isPasswordMatched ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPasswordMatched ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                  </p>
                ) : null}
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">연락처</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="연락처를 입력해 주세요"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                  required
                />
              </label>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-lg font-black text-slate-900">이메일 인증</p>
              <p className="mt-1 text-sm text-slate-500">이메일 입력 후 확인 버튼을 눌러 인증번호를 발송해 주세요.</p>

              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">이메일</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="example@email.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    required
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSending}
                  className="mt-7 h-[52px] rounded-2xl bg-amber-500 px-5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
                >
                  {isSending ? '발송 중...' : '이메일 확인'}
                </button>
              </div>

              {sendResult ? (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                    sendResult.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  {sendResult.message}
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">이메일 확인 칸</span>
                  <input
                    type="text"
                    value={form.verificationCode}
                    onChange={(event) => updateField('verificationCode', event.target.value)}
                    placeholder="이메일로 받은 인증번호 입력"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    required
                  />
                </label>

                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isVerifying}
                  className="mt-7 h-[52px] rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {isVerifying ? '확인 중...' : '인증번호 확인'}
                </button>
              </div>

              {verifyResult ? (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                    verifyResult.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  {verifyResult.message}
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-8 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? '회원가입 처리 중...' : '회원가입 완료'}
            </button>

            {signupResult ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  signupResult.success
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {signupResult.message}
              </div>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  )
}
