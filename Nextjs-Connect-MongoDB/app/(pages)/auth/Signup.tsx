'use client'

import { Gaitwise } from '@/public/svg'
import Image from 'next/image'
import { useState } from 'react'
import styled from 'styled-components'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('analyst')

  const handleSignUp = async () => {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, role }),
    })

    if (res.ok) {
      alert('アカウント作成成功')
    } else {
      alert('アカウント作成失敗')
    }
  }

  return (
    <SignUpBox>
      <Image src={Gaitwise} alt="logo" width={100} height={100} layout="responsive" />
      <Title>Create Account</Title>
      <Subtitle>Doctor must authenticate after Login</Subtitle>

      <RoleSelect>
        <label>
          <input
            type="radio"
            name="role"
            value="analyst"
            checked={role === 'analyst'}
            onChange={(e) => setRole(e.target.value)}
          />
          Analysts
        </label>
        <label>
          <input
            type="radio"
            name="role"
            value="doctor"
            checked={role === 'doctor'}
            onChange={(e) => setRole(e.target.value)}
          />
          Doctor
        </label>
      </RoleSelect>

      <InputField type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} />
      <InputField type="email" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <InputField
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <SignUpButton onClick={handleSignUp}>Sign Up</SignUpButton>

      <Links>
        <a href="/auth?type=login">Already have an account? Sign In</a>
      </Links>
    </SignUpBox>
  )
}

const SignUpBox = styled.div`
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

const RoleSelect = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;

  label {
    margin: 0 1rem;
    font-size: 1rem;
  }
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

const SignUpButton = styled.button`
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

const Links = styled.div`
  margin-top: 1rem;

  a {
    color: #3182ce;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`
