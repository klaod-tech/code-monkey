import nodemailer from 'nodemailer'

type MailProvider = 'gmail' | 'naver'

type ProviderConfig = {
  host: string
  port: number
  user: string
  pass: string
  from: string
  secure: boolean
  provider: MailProvider
}

function getProvider(): MailProvider {
  const provider = process.env.SMTP_PROVIDER?.trim().toLowerCase()

  if (provider === 'gmail' || provider === 'naver') {
    return provider
  }

  throw new Error('SMTP_PROVIDER must be set to "gmail" or "naver".')
}

function getProviderConfig(): ProviderConfig {
  const provider = getProvider()

  if (provider === 'gmail') {
    const host = process.env.GMAIL_SMTP_HOST ?? 'smtp.gmail.com'
    const port = Number(process.env.GMAIL_SMTP_PORT ?? '587')
    const user = process.env.GMAIL_SMTP_USER
    const pass = process.env.GMAIL_SMTP_PASS
    const from = process.env.GMAIL_SMTP_FROM ?? user

    if (!user || !pass || !from) {
      throw new Error(
        'Gmail SMTP settings are missing. Please set GMAIL_SMTP_USER, GMAIL_SMTP_PASS, and optionally GMAIL_SMTP_FROM.'
      )
    }

    return {
      provider,
      host,
      port,
      user,
      pass,
      from,
      secure: port === 465,
    }
  }

  const host = process.env.NAVER_SMTP_HOST ?? 'smtp.naver.com'
  const port = Number(process.env.NAVER_SMTP_PORT ?? '587')
  const user = process.env.NAVER_SMTP_USER
  const pass = process.env.NAVER_SMTP_PASS
  const from = process.env.NAVER_SMTP_FROM ?? user

  if (!user || !pass || !from) {
    throw new Error(
      'Naver SMTP settings are missing. Please set NAVER_SMTP_USER, NAVER_SMTP_PASS, and optionally NAVER_SMTP_FROM.'
    )
  }

  return {
    provider,
    host,
    port,
    user,
    pass,
    from,
    secure: port === 465,
  }
}

function getTransport() {
  const config = getProviderConfig()

  return {
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    }),
    from: config.from,
    provider: config.provider,
  }
}

export async function sendVerificationEmail(email: string, code: string) {
  const { transporter, from, provider } = getTransport()

  await transporter.sendMail({
    from,
    to: email,
    subject: '[회원가입] 이메일 인증번호 안내',
    text: `회원가입 인증번호는 ${code} 입니다. 10분 내에 입력해 주세요.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">이메일 인증번호 안내</h2>
        <p style="margin-bottom: 16px;">회원가입을 완료하려면 아래 인증번호를 입력해 주세요.</p>
        <div style="display:inline-block;padding:14px 22px;border-radius:14px;background:#f8fafc;border:1px solid #cbd5e1;font-size:28px;font-weight:700;letter-spacing:0.2em;">
          ${code}
        </div>
        <p style="margin-top: 16px;">인증번호는 10분 동안 유효합니다.</p>
        <p style="margin-top: 16px; color: #64748b; font-size: 13px;">발송 서버: ${provider}</p>
      </div>
    `,
  })
}
