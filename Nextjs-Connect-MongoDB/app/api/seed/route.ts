import { NextResponse } from 'next/server'
import dbConnect from '../../../db/dbConnect'
import Product from '../../../db/models/Product'

export const dynamic = 'force-dynamic'

const sampleProducts = [
  {
    name: '유기농 제주 감귤 5kg',
    price: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1611080626919-7cf5a9db69f4?w=500&q=80',
    origin: '대한민국 제주특별자치도',
    features: '제주 청정 지역에서 무농약으로 재배된 새콤달콤한 고당도 감귤입니다.',
  },
  {
    name: '프리미엄 횡성 한우 등심 500g',
    price: 85000,
    imageUrl: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=500&q=80',
    origin: '대한민국 강원도 횡성',
    features: '마블링이 뛰어나고 육즙이 풍부한 최고급 1++ 등급 횡성 한우입니다.',
  },
  {
    name: '무농약 고성 찰토마토 2kg',
    price: 18000,
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80',
    origin: '대한민국 강원도 고성',
    features: '과육이 단단하고 찰기가 뛰어나 생과로 먹기 좋은 신선한 토마토입니다.',
  },
  {
    name: '국산 햇양파 3kg',
    price: 9000,
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&q=80',
    origin: '대한민국 전라남도 무안',
    features: '속이 단단하고 맵지 않으며 달짝지근한 맛이 일품인 햇양파입니다.',
  },
  {
    name: '해남 절임배추 10kg',
    price: 32000,
    imageUrl: 'https://images.unsplash.com/photo-1634509538477-8730b912c966?w=500&q=80',
    origin: '대한민국 전라남도 해남',
    features: '해풍을 맞고 자란 단단한 배추를 신안 천일염으로 알맞게 절였습니다.',
  },
  {
    name: '신선한 노르웨이 생연어 1kg',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=500&q=80',
    origin: '노르웨이',
    features: '항공 직송으로 신선도를 유지한 프리미엄 슈페리어급 생연어입니다.',
  },
  {
    name: '유기농 아보카도 5입',
    price: 15000,
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80',
    origin: '멕시코',
    features: '버터처럼 부드러운 식감과 고소한 맛을 자랑하는 영양 만점 아보카도입니다.',
  },
  {
    name: '고당도 성주 참외 2kg',
    price: 22000,
    imageUrl: 'https://images.unsplash.com/photo-1601493699865-c38aae11d2e0?w=500&q=80',
    origin: '대한민국 경상북도 성주',
    features: '아삭한 식감과 꿀처럼 달콤한 과육이 꽉 찬 최상급 참외입니다.',
  },
  {
    name: '순창 발효 고추장 1kg',
    price: 28000,
    imageUrl: 'https://images.unsplash.com/photo-1600850056064-a8f379df4939?w=500&q=80',
    origin: '대한민국 전라북도 순창',
    features: '100% 국산 고춧가루와 메주로 전통 방식을 살려 깊은 맛을 낸 고추장입니다.',
  },
  {
    name: '보성 녹차잎 100g',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80',
    origin: '대한민국 전라남도 보성',
    features: '첫물차(우전)만을 정성껏 채엽하여 은은하고 깊은 향을 머금은 프리미엄 녹차입니다.',
  },
]

export async function GET() {
  await dbConnect()

  try {
    // 기존 데이터 초기화
    await Product.deleteMany({})

    // 원산지와 특징이 포함된 새 샘플 데이터 삽입
    const products = await Product.insertMany(sampleProducts)

    return NextResponse.json(
      { message: '10개의 샘플 데이터가 성공적으로 추가되었습니다!', count: products.length },
      { status: 201 }
    )
  } catch (error) {
    console.error('Data Seeding Error:', error)
    return NextResponse.json({ message: '샘플 데이터 추가 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
