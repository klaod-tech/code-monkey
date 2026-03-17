'use client'
import React, { useState } from 'react'
import styled from 'styled-components'
import axios from 'axios'
import { User } from '@/types/user'

export default function Page() {
  const [nickname, setNickname] = useState('') // 닉네임 상태
  const [result, setResult] = useState('') // 결과 메시지 상태
  const [userData, setUserData] = useState<User | null>(null) // 가져온 사용자 데이터

  // API 호출 함수
  const checkNickname = async () => {
    if (!nickname) {
      setResult('닉네임을 입력해주세요.')
      setUserData(null) // 사용자 데이터 초기화
      return
    }

    try {
      const res = await axios.get(`/api/test?nickname=${nickname}`)

      const data = res.data
      if (res.status === 200) {
        setResult(data.message) // API로부터의 메시지 설정
        setUserData(data.user || null) // user 데이터가 존재하면 설정
      } else {
        setResult('닉네임 확인에 실패했습니다.')
        setUserData(null) // 사용자 데이터 초기화
      }
    } catch {
      setResult('오류가 발생했습니다.')
      setUserData(null) // 사용자 데이터 초기화
    }
  }

  return (
    <Container>
      <Title>닉네임 중복 확인</Title>
      <Input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임을 입력" />
      <Button onClick={checkNickname}>확인</Button>
      {result && <Result>{result}</Result>}

      {/* 사용자 데이터가 있을 때 표시 */}
      {userData && (
        <UserDataContainer>
          <h2>사용자 데이터</h2>
          <UserDataField>이메일: {userData.email}</UserDataField>
          <UserDataField>닉네임: {userData.nickname}</UserDataField>
          <UserDataField>프로필 이미지 URL: {userData.profile_image_url}</UserDataField>
          <UserDataField>사용자 유형: {userData.user_type}</UserDataField>
          <UserDataField>생성 날짜: {new Date(userData.createdAt).toLocaleString()}</UserDataField>
          <UserDataField>업데이트 날짜: {new Date(userData.updatedAt).toLocaleString()}</UserDataField>
        </UserDataContainer>
      )}
    </Container>
  )
}

// styled-components로 스타일 정의
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f0f4f8;
  padding: 20px;
  border-radius: 10px;
  max-width: 500px;
  margin: 40px auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`

const Title = styled.h1`
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
`

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  width: 100%;
  max-width: 300px;
  border: 2px solid #ccc;
  border-radius: 5px;
  margin-bottom: 20px;
  &:focus {
    border-color: #0070f3;
    outline: none;
  }
`

const Button = styled.button`
  background-color: #0070f3;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  &:hover {
    background-color: #005bb5;
  }
`

const Result = styled.p`
  font-size: 16px;
  color: ${(props) => (props.children === '사용 가능한 닉네임입니다.' ? 'green' : 'red')};
  margin-top: 20px;
`

const UserDataContainer = styled.div`
  margin-top: 30px;
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`

const UserDataField = styled.p`
  font-size: 14px;
  color: #555;
  margin-bottom: 10px;
`
