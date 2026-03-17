'use client'

import { useState } from 'react'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // ── 로그인 상태 ──
  const [loginId, setLoginId] = useState('')
  const [loginPw, setLoginPw] = useState('')

  // ── 회원가입 상태 ──
  const [regId, setRegId] = useState('')
  const [regPw, setRegPw] = useState('')
  const [regPwConfirm, setRegPwConfirm] = useState('')
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regOtp, setRegOtp] = useState('')

  const [pwError, setPwError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [serverOtp, setServerOtp] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')

  // ── 로그인 핸들러 ──
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`로그인 시도: ${loginId}`)
  }

  // ── 비밀번호 확인 ──
  const checkPassword = (value: string) => {
    setRegPwConfirm(value)
    if (regPw && value !== regPw) {
      setPwError('비밀번호가 일치하지 않습니다.')
    } else {
      setPwError('')
    }
  }

  // ── 이메일 인증번호 발송 ──
  const sendOtp = async () => {
    if (!regEmail) {
      setOtpMessage('이메일을 먼저 입력해 주세요.')
      return
    }
    setSendingOtp(true)
    setOtpMessage('')
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        setServerOtp(data.otp)
        setOtpSent(true)
        setOtpVerified(false)
        setOtpMessage(`${regEmail}로 인증번호를 발송했습니다.`)
      } else {
        setOtpMessage('발송에 실패했습니다. 다시 시도해 주세요.')
      }
    } catch {
      setOtpMessage('서버 오류가 발생했습니다.')
    } finally {
      setSendingOtp(false)
    }
  }

  // ── 인증번호 확인 ──
  const verifyOtp = () => {
    if (regOtp === serverOtp) {
      setOtpVerified(true)
      setOtpError('')
      setOtpMessage('이메일 인증이 완료되었습니다!')
    } else {
      setOtpError('인증번호가 올바르지 않습니다.')
      setOtpVerified(false)
    }
  }

  // ── 회원가입 제출 ──
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (regPw !== regPwConfirm) {
      setPwError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!otpVerified) {
      alert('이메일 인증을 완료해 주세요.')
      return
    }
    alert(`회원가입 완료!\n아이디: ${regId}\n이름: ${regName}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── 카드 컨테이너 ── */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* ── 상단 헤더 ── */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white text-center">
            <div className="text-4xl mb-2">🛒</div>
            <h1 className="text-2xl font-extrabold tracking-tight">프리미엄 식품 상점</h1>
            <p className="text-blue-100 text-sm mt-1">
              {mode === 'login' ? '로그인하여 쇼핑을 시작하세요' : '새 계정을 만들어 보세요'}
            </p>
          </div>

          {/* ── 탭 전환 ── */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                mode === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                mode === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* ════════════════════════════════════
              로그인 폼
          ════════════════════════════════════ */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">아이디</label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">비밀번호</label>
                <input
                  type="password"
                  value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-100 transition-all text-base mt-2"
              >
                로그인
              </button>
              <p className="text-center text-sm text-gray-400 pt-2">
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-blue-600 font-bold hover:underline"
                >
                  회원가입
                </button>
              </p>
            </form>
          )}

          {/* ════════════════════════════════════
              회원가입 폼
          ════════════════════════════════════ */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* 아이디 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">아이디</label>
                <input
                  type="text"
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  placeholder="사용할 아이디"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition"
                />
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">비밀번호</label>
                <input
                  type="password"
                  value={regPw}
                  onChange={(e) => {
                    setRegPw(e.target.value)
                    if (regPwConfirm && e.target.value !== regPwConfirm) {
                      setPwError('비밀번호가 일치하지 않습니다.')
                    } else {
                      setPwError('')
                    }
                  }}
                  placeholder="비밀번호"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition"
                />
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">비밀번호 확인</label>
                <input
                  type="password"
                  value={regPwConfirm}
                  onChange={(e) => checkPassword(e.target.value)}
                  placeholder="비밀번호 재입력"
                  required
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-gray-50 transition ${
                    pwError ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-blue-400'
                  }`}
                />
                {pwError && <p className="text-red-500 text-xs mt-1 font-medium">{pwError}</p>}
                {!pwError && regPwConfirm && regPw === regPwConfirm && (
                  <p className="text-green-500 text-xs mt-1 font-medium">✓ 비밀번호가 일치합니다.</p>
                )}
              </div>

              {/* 성함 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">성함</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="실명을 입력하세요"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition"
                />
              </div>

              {/* 연락처 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">연락처</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition"
                />
              </div>

              {/* 이메일 + 발송 버튼 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">이메일</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value)
                      setOtpSent(false)
                      setOtpVerified(false)
                      setOtpMessage('')
                    }}
                    placeholder="example@email.com"
                    required
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition"
                  />
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={sendingOtp}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                  >
                    {sendingOtp ? '발송 중...' : otpSent ? '재발송' : '인증번호 발송'}
                  </button>
                </div>
                {otpMessage && (
                  <p className={`text-xs mt-1.5 font-medium ${otpVerified ? 'text-green-500' : 'text-blue-500'}`}>
                    {otpMessage}
                  </p>
                )}
              </div>

              {/* 인증번호 입력창 (발송 후 표시) */}
              {otpSent && !otpVerified && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">인증번호 확인</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={regOtp}
                      onChange={(e) => {
                        setRegOtp(e.target.value)
                        setOtpError('')
                      }}
                      placeholder="6자리 인증번호 입력"
                      maxLength={6}
                      className={`flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-gray-50 transition tracking-widest font-mono ${
                        otpError ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-blue-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={verifyOtp}
                      className="shrink-0 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                    >
                      확인
                    </button>
                  </div>
                  {otpError && <p className="text-red-500 text-xs mt-1 font-medium">{otpError}</p>}
                </div>
              )}

              {/* 인증 완료 표시 */}
              {otpVerified && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span className="text-green-700 text-sm font-semibold">이메일 인증이 완료되었습니다.</span>
                </div>
              )}

              {/* 회원가입 버튼 */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-100 transition-all text-base mt-2"
              >
                회원가입
              </button>

              <p className="text-center text-sm text-gray-400 pb-2">
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-600 font-bold hover:underline"
                >
                  로그인
                </button>
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
