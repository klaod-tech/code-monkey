'use client'

import { Gaitwise } from '@/public/svg'
import Image from 'next/image'
import { useState } from 'react'
import styled from 'styled-components'

export default function ForgetPassword() {
  const [email, setEmail] = useState('')

  const handleSendCode = async () => {
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      alert('確認コードが送信されました')
    } else {
      alert('コードの送信に失敗しました')
    }
  }

  return (
    <ForgetPasswordBox>
      <Image src={Gaitwise} alt="logo" width={100} height={100} layout="responsive" />
      <Title>비밀번호를 잊어버리셨나요?</Title>
      <Subtitle>이메일 주소를 입력해 주세요. 확인 코드를 보내드립니다.</Subtitle>

      <InputField type="email" placeholder="이메일 입력" value={email} onChange={(e) => setEmail(e.target.value)} />

      <SendCodeButton onClick={handleSendCode}>Send code</SendCodeButton>
    </ForgetPasswordBox>
  )
}

const ForgetPasswordBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 350px;
`

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
`

const InputField = styled.input`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #f9f9f9;
`

const SendCodeButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #2d3748;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background-color: #1a202c;
  }
`
