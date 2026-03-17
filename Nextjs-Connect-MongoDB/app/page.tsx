"use client";

import Image from "next/image";
import { useState } from "react";

// 데이터베이스 대신 임시로 사용할 상품 데이터 모음입니다.
const sampleProducts = [
  {
    _id: "1",
    name: "유기농 제주 감귤 5kg",
    price: 25000,
    imageUrl:
      "https://images.unsplash.com/photo-1611080626919-7cf5a9db69f4?w=500&q=80",
    origin: "대한민국 제주특별자치도",
    features: "제주 청정 지역에서 무농약으로 재배된 새콤달콤한 고당도 감귤입니다.",
  },
  {
    _id: "2",
    name: "프리미엄 횡성 한우 등심 500g",
    price: 85000,
    imageUrl:
      "https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=500&q=80",
    origin: "대한민국 강원도 횡성",
    features: "마블링이 뛰어나고 육즙이 풍부한 최고급 1++ 등급 횡성 한우입니다.",
  },
  {
    _id: "3",
    name: "무농약 고성 찰토마토 2kg",
    price: 18000,
    imageUrl:
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80",
    origin: "대한민국 강원도 고성",
    features: "과육이 단단하고 찰기가 뛰어나 생과로 먹기 좋은 신선한 토마토입니다.",
  },
  {
    _id: "4",
    name: "국산 햇양파 3kg",
    price: 9000,
    imageUrl:
      "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&q=80",
    origin: "대한민국 전라남도 무안",
    features: "속이 단단하고 맵지 않으며 달짝지근한 맛이 일품인 햇양파입니다.",
  },
  {
    _id: "5",
    name: "해남 절임배추 10kg",
    price: 32000,
    imageUrl:
      "https://images.unsplash.com/photo-1634509538477-8730b912c966?w=500&q=80",
    origin: "대한민국 전라남도 해남",
    features: "해풍을 맞고 자란 단단한 배추를 신안 천일염으로 알맞게 절였습니다.",
  },
  {
    _id: "6",
    name: "신선한 노르웨이 생연어 1kg",
    price: 45000,
    imageUrl:
      "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=500&q=80",
    origin: "노르웨이",
    features: "항공 직송으로 신선도를 유지한 프리미엄 슈페리어급 생연어입니다.",
  },
  {
    _id: "7",
    name: "유기농 아보카도 5입",
    price: 15000,
    imageUrl:
      "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80",
    origin: "멕시코",
    features:
      "버터처럼 부드러운 식감과 고소한 맛을 자랑하는 영양 만점 아보카도입니다.",
  },
  {
    _id: "8",
    name: "고당도 성주 참외 2kg",
    price: 22000,
    imageUrl:
      "https://images.unsplash.com/photo-1601493699865-c38aae11d2e0?w=500&q=80",
    origin: "대한민국 경상북도 성주",
    features: "아삭한 식감과 꿀처럼 달콤한 과육이 꽉 찬 최상급 참외입니다.",
  },
  {
    _id: "9",
    name: "순창 발효 고추장 1kg",
    price: 28000,
    imageUrl:
      "https://images.unsplash.com/photo-1600850056064-a8f379df4939?w=500&q=80",
    origin: "대한민국 전라북도 순창",
    features:
      "100% 국산 고춧가루와 메주로 전통 방식을 살려 깊은 맛을 낸 고추장입니다.",
  },
  {
    _id: "10",
    name: "보성 녹차잎 100g",
    price: 35000,
    imageUrl:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80",
    origin: "대한민국 전라남도 보성",
    features:
      "첫물차(우전)만을 정성껏 채엽하여 은은하고 깊은 향을 머금은 프리미엄 녹차입니다.",
  },
];

// 장바구니 아이템의 타입 정의
interface CartItem {
  id: string;
  quantity: number;
}

export default function Home() {
  // 장바구니에 담긴 상품들의 ID와 수량을 관리하는 상태
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // 체크박스 선택: 구매할 상품들의 ID만 기록하는 상태 (기본적으로 모두 선택되도록 구성)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 우측에 나타나는 모달창 상태
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 선택된 상품 상세 정보 모달창 상태 (null이면 닫힘 상태)
  const [selectedProduct, setSelectedProduct] = useState<typeof sampleProducts[0] | null>(null);

  // 모달 내에서 선택하는 수량 (모달을 열 때마다 1로 초기화)
  const [modalQty, setModalQty] = useState(1);

  // 모달 열기: 수량 1로 초기화 후 열기
  const openProductModal = (product: typeof sampleProducts[0]) => {
    setModalQty(1);
    setSelectedProduct(product);
  };

  // 모달에서 선택한 수량만큼 장바구니에 추가
  const addToCartWithQty = (id: string) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, quantity: item.quantity + modalQty } : item);
      }
      setSelectedIds(s => [...s, id]);
      return [...prev, { id, quantity: modalQty }];
    });
  };

  // 바로 구매하기 클릭 시 하단 바에 표시할 가격 (0이면 표시 안함)
  const [directBuyTotal, setDirectBuyTotal] = useState(0);

  // 장바구니에 상품을 1개 추가하거나 없으면 새로 넣는 함수
  const addToCart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 전체 클릭 이벤트 발생 방지
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === id);
      if (existingItem) {
        // 이미 장바구니에 있으면 수량만 1 증가
        return prevItems.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // 처음 담는 상품이면 수량 1과 함께 장바구니 담고 바로 구매 목록에 체크해줌
      setSelectedIds(prev => [...prev, id]);
      return [...prevItems, { id, quantity: 1 }];
    });
  };

  // 장바구니에서 상품 1개를 빼는 함수 (마이너스 기능)
  const removeFromCart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === id);
      if (existingItem && existingItem.quantity > 1) {
        // 수량이 2개 이상이면 1 감소
        return prevItems.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      
      // 장바구니에서 완전히 사라지면 체크 해제도 같이 진행
      setSelectedIds((prev) => prev.filter(selectedId => selectedId !== id));
      return prevItems.filter((item) => item.id !== id);
    });
  };
  
  // 장바구니에서 특정 상품을 아예 삭제하는 함수(휴지통)
  const removeCompletely = (id: string) => {
    setSelectedIds((prev) => prev.filter(selectedId => selectedId !== id));
    setCartItems((prev) => prev.filter(item => item.id !== id));
  }
  
  // 개별 상품 체크박스 토글
  const toggleSelection = (id: string) => {
      setSelectedIds(prev => 
          prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
      );
  }

  // 전체 선택/해제 토글 박스 클릭 시 처리
  const toggleAll = () => {
      if (selectedIds.length === cartItems.length) {
          // 이미 전체 선택 된 상태면 모두 해제
          setSelectedIds([]);
      } else {
          // 아니면 모두 선택
          setSelectedIds(cartItems.map(item => item.id));
      }
  }

  // ★ 선택된 상품들만의 총액 계산 ★
  const totalSelectedPrice = cartItems.reduce((sum, cartItem) => {
    // 체크가 안 되어 있으면 0원으로 계산 제외
    if (!selectedIds.includes(cartItem.id)) return sum;
    
    const product = sampleProducts.find((p) => p._id === cartItem.id);
    return sum + (product?.price || 0) * cartItem.quantity;
  }, 0);

  // 장바구니에 있는 담겨있는 전체 아이템 '종류(카드수)'가 아니라, 전체 '수량'
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // '선택된' 상품의 수량 총합 
  const totalSelectedCount = cartItems.reduce((sum, item) => {
      if (!selectedIds.includes(item.id)) return sum;
      return sum + item.quantity;
  }, 0);

  return (
    <main className="min-h-screen p-8 bg-gray-50 flex flex-col items-center relative pb-32">
      <div className="flex justify-between items-center w-full max-w-7xl mb-10">
        <h1 className="text-4xl font-bold text-gray-800">프리미엄 식품 상점</h1>

        {/* 장바구니 버튼 (상단 요약) */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative bg-white text-gray-800 p-3 rounded-full shadow-md hover:shadow-lg transition-shadow border border-gray-100 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          {totalItemCount > 0 && (
             <span className="font-bold text-blue-600 px-1">총 {totalItemCount}개 담김</span>
          )}
        </button>
      </div>

      {/* 상품 목록 격자 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl w-full">
        {sampleProducts.map((product) => {
          // 이 상품이 장바구니에 있는지 찾고 수량 파악
          const cartInfo = cartItems.find((item) => item.id === product._id);
          const quantity = cartInfo?.quantity || 0;
          const isSelected = quantity > 0;

          return (
            <div
              key={product._id}
              onClick={() => openProductModal(product)} // 카드 클릭 시 상세 모달 열기
              className={`bg-white rounded-xl overflow-hidden transition-all duration-300 relative group
                ${
                  isSelected
                    ? "ring-4 ring-blue-500 shadow-xl scale-[1.02]"
                    : "shadow-md hover:shadow-xl border border-transparent cursor-pointer"
                }
              `}
            >

              <div className="h-48 overflow-hidden relative">
                {/* 오버레이 효과 (상세보기 안내) */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 z-10 flex items-center justify-center pointer-events-none">
                     <span className="text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 px-4 py-2 rounded-full backdrop-blur-sm">상세보기</span>
                </div>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    isSelected ? "scale-110 opacity-90" : "group-hover:scale-105 scale-100"
                  }`}
                />
              </div>
              <div className="p-5 flex flex-col justify-between h-[250px]">
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-1">
                    {product.origin}
                  </p>
                  <h3
                    className="text-xl font-bold text-gray-900 mb-2 truncate"
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-snug">
                    {product.features}
                  </p>
                </div>
                
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-extrabold text-blue-600">
                    {product.price.toLocaleString()}{" "}
                    <span className="text-base font-medium text-gray-500">
                      원
                    </span>
                  </p>

                  {/* 수량 조절 버튼 영역 */}
                  {isSelected ? (
                      <div className="flex items-center gap-3 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => removeFromCart(product._id, e)} className="w-8 h-8 rounded-full bg-white text-blue-600 font-bold border border-blue-200 hover:bg-blue-100 shadow-sm flex items-center justify-center">-</button>
                          <span className="font-bold text-gray-800 text-lg w-4 text-center">{quantity}</span>
                          <button onClick={(e) => addToCart(product._id, e)} className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm flex items-center justify-center">+</button>
                      </div>
                  ) : (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setDirectBuyTotal(product.price);
                             }}
                             className="text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                          >
                            구매하기
                          </button>
                          <button 
                             onClick={(e) => addToCart(product._id, e)} 
                             className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors border border-blue-100"
                          >
                            담기
                          </button>
                      </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 장바구니 오버레이 바(모달) */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity"
            onClick={() => setIsCartOpen(false)}
          ></div>
          <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
            {/* 장바구니 헤더 */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800">장바구니 확인</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-400 hover:text-gray-800 transition-colors p-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 전체 선택 바 */}
            {cartItems.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 font-semibold select-none text-sm hover:text-blue-600 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.length === cartItems.length && cartItems.length > 0} 
                            onChange={toggleAll}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        전체선택 ({selectedIds.length}/{cartItems.length})
                    </label>
                </div>
            )}

            {/* 장바구니 상품 목록 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                    className="w-24 h-24 mb-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                    />
                  </svg>
                  <p className="text-lg">장바구니가 비어 있습니다.</p>
                </div>
              ) : (
                cartItems.map((cartItem) => {
                  const product = sampleProducts.find((p) => p._id === cartItem.id)!;
                  const itemIsChecked = selectedIds.includes(cartItem.id);

                  return (
                    // 체크되지 않았으면 살짝 흐릿하게(반투명) 처리
                    <div
                      key={cartItem.id}
                      className={`flex gap-4 items-center p-4 rounded-xl border border-gray-200 transition-all ${
                          itemIsChecked ? 'bg-white shadow-sm ring-1 ring-blue-500' : 'bg-gray-50 opacity-60'
                      }`}
                    >
                      {/* 개별 선택 체크박스 */}
                      <input 
                         type="checkbox" 
                         checked={itemIsChecked} 
                         onChange={() => toggleSelection(cartItem.id)}
                         className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                      />

                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        onClick={() => setSelectedProduct(product)}
                        className="w-20 h-20 object-cover rounded-md shadow-sm border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                        title="상세보기"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
                        <h4
                          onClick={() => setSelectedProduct(product)}
                          className="text-sm font-semibold text-gray-800 truncate cursor-pointer hover:text-blue-600 hover:underline"
                          title="상세보기"
                        >
                          {product.name}
                        </h4>
                        
                        <div className="flex items-center justify-between">
                            <p className="text-blue-600 font-bold">
                            {(product.price * cartItem.quantity).toLocaleString()}원
                            </p>
                            
                            {/* 모달창 안 조절 버튼 */}
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm opacity-100">
                                <button onClick={(e) => removeFromCart(cartItem.id, e)} className="text-gray-500 hover:text-blue-600 w-6 font-bold">-</button>
                                <span className="font-bold text-sm w-4 text-center text-gray-800">{cartItem.quantity}</span>
                                <button onClick={(e) => addToCart(cartItem.id, e)} className="text-gray-500 hover:text-blue-600 w-6 font-bold">+</button>
                            </div>
                        </div>

                      </div>
                      {/* 개별 완전 삭제(휴지통) 버튼 */}
                      <button
                        onClick={() => removeCompletely(cartItem.id)}
                        className="text-red-400 hover:text-red-600 p-2 ml-1"
                        title="삭제"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* 결제 영역 (하단 고정) */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-6 bg-white shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-600 font-medium">체크된 항목 결제금액</span>
                  <span className="text-2xl font-extrabold text-blue-600">
                    {totalSelectedPrice.toLocaleString()}원
                  </span>
                </div>
                {/* 0개 선택일 때는 버튼을 비활성화(회색) 되도록 처리 */}
                <button 
                  disabled={selectedIds.length === 0}
                  className={`w-full font-bold py-4 rounded-xl shadow-lg transition-colors text-lg flex items-center justify-center gap-2
                      ${selectedIds.length === 0 
                          ? 'bg-gray-300 text-white cursor-not-allowed shadow-none' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'}
                  `}>
                  {totalSelectedCount}개 상품 구매하기
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* 화면 하단 고정 상점 합계 바 */}
      {directBuyTotal > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-30 transition-transform duration-500">
          <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-500 mb-1">상점 합계</span>
              <span className="text-3xl font-extrabold text-gray-900">
                {directBuyTotal.toLocaleString()} <span className="text-lg font-medium text-gray-500">원</span>
              </span>
            </div>
            <button
              onClick={() => setDirectBuyTotal(0)}
              className="text-gray-400 hover:text-gray-700 transition-colors text-sm"
              title="수묵"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 상품 상세 정보 모달 */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          {/* 배경 오버레이 */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedProduct(null)}
          ></div>
          
          {/* 모달 컨텐츠 창 */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all max-h-[85vh]">
            
            {/* 상단 헤더 & 사진 영역 */}
            <div className="p-6 pb-4 border-b border-gray-50 bg-white">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-8">
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md mb-2 inline-block">
                    {selectedProduct.origin}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {selectedProduct.name}
                  </h2>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="bg-gray-100 rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 축소된 사진 영역 */}
              <div className="w-full h-48 relative rounded-2xl overflow-hidden shadow-inner bg-gray-100">
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 중간 설명 영역 */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-black text-blue-600">
                  {selectedProduct.price.toLocaleString()}
                </span>
                <span className="text-lg font-bold text-gray-400">원</span>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">상품 상세 특징</h3>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {selectedProduct.features}
                </p>
              </div>

              {/* 수량 선택 UI */}
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
                <span className="text-sm font-bold text-gray-500">수량 선택</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setModalQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >-</button>
                  <span className="font-black text-gray-900 text-xl w-6 text-center">{modalQty}</span>
                  <button
                    onClick={() => setModalQty(q => q + 1)}
                    className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center justify-center transition-colors shadow-sm"
                  >+</button>
                </div>
                <span className="text-sm font-bold text-blue-600">
                  {(selectedProduct.price * modalQty).toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 하단 전체 너비 액션 영역 */}
            <div className="p-5 bg-white border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    addToCartWithQty(selectedProduct._id);
                    setSelectedProduct(null);
                    setIsCartOpen(true);
                  }}
                  className="flex-1 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-5 rounded-2xl transition-all flex justify-center items-center"
                >
                  담기
                </button>
                <button
                  onClick={() => {
                    setDirectBuyTotal(selectedProduct.price * modalQty);
                    setSelectedProduct(null);
                  }}
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-200 transition-all flex justify-center items-center text-lg"
                >
                  구매하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
