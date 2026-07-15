'use client';

import React, { useState } from 'react';
import { BadgeTitle } from '../types';
import { ShoppingBag, Sparkles, Check, AlertCircle, Award, ArrowRight } from 'lucide-react';

interface StoreProduct {
  id: string;
  name: string;
  brand: string;
  pointPrice: number;
  icon: string; // 컵, 빵 등의 이모지
}

interface StoreProps {
  totalSaved: number;
  badges: BadgeTitle[];
  spentPoints: number;
  onBuyCoupon: (productName: string, points: number) => void;
}

export default function Store({
  totalSaved,
  badges,
  spentPoints,
  onBuyCoupon,
}: StoreProps) {
  // 포인트 공식: (절약한 식비의 10%) + (잠금 해제된 칭호 배지 당 500P)
  const unlockedBadgeCount = badges.filter((b) => b.isUnlocked).length;
  const earnedPoints = Math.round(totalSaved * 0.1) + unlockedBadgeCount * 500;
  const currentPoints = Math.max(0, earnedPoints - spentPoints);

  // 상점 기프티콘 상품 목록
  const products: StoreProduct[] = [
    { id: 'prod_1', name: '스타벅스 아메리카노 T', brand: '스타벅스', pointPrice: 1500, icon: '☕' },
    { id: 'prod_2', name: 'CU 모바일 금액권 3천원권', brand: 'CU 편의점', pointPrice: 1000, icon: '🏪' },
    { id: 'prod_3', name: '배달의민족 5천원 할인쿠폰', brand: '배달의민족', pointPrice: 2500, icon: '🛵' },
    { id: 'prod_4', name: '이마트 식자재 1만원 할인권', brand: '이마트', pointPrice: 4500, icon: '🥬' },
    { id: 'prod_5', name: '투썸플레이스 조각케이크', brand: '투썸플레이스', pointPrice: 2000, icon: '🍰' },
    { id: 'prod_6', name: 'GS25 5천원 금액권', brand: 'GS25', pointPrice: 1800, icon: '🏪' },
  ];

  const handlePurchase = (product: StoreProduct) => {
    if (currentPoints < product.pointPrice) {
      alert('포인트가 부족합니다! 식비를 아끼거나 타이틀을 획득해 포인트를 더 모아보세요. 😊');
      return;
    }
    onBuyCoupon(product.name, product.pointPrice);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 px-4 pt-4 bg-[#FCFDFD] animate-fade-in">
      
      {/* 1. 보유 포인트 대시보드 카드 */}
      <div className="bg-gradient-to-br from-brand-green to-brand-green-hover p-5 rounded-2xl text-white shadow-md mb-6 relative overflow-hidden">
        {/* 장식용 은은한 구체 백그라운드 */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10"></div>
        <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-white/10"></div>

        <div className="flex items-center gap-1.5 opacity-90 text-[10px] font-bold tracking-wider uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5 text-brand-green-light" />
          Yori Jori Eco Points
        </div>
        
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black">{currentPoints.toLocaleString()} P</span>
          <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-lg font-bold">
            누적 적립: {earnedPoints.toLocaleString()}P
          </span>
        </div>

        <div className="mt-4.5 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-[10px] text-brand-green-light font-medium">
          <div>🥦 냉파 식비 10% 적립: +{Math.round(totalSaved * 0.1).toLocaleString()}P</div>
          <div>🏆 타이틀 ({unlockedBadgeCount}개) 보너스: +{(unlockedBadgeCount * 500).toLocaleString()}P</div>
        </div>
      </div>

      {/* 2. 포인트 적립 미션 보드 */}
      <div className="bg-white p-4.5 rounded-2xl border border-brand-grey shadow-sm mb-6">
        <h3 className="text-xs font-bold text-gray-400 tracking-wider mb-3 flex items-center gap-1">
          <Award className="w-4 h-4 text-brand-green" />
          포인트 획득 꿀팁 미션
        </h3>
        
        <div className="flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-grey/50">
            <div>
              <div className="font-extrabold text-gray-700">식자재 남김없이 구출하기 🌿</div>
              <p className="text-[10px] text-gray-400 mt-0.5">상해서 버린 음식 0개 유지 시 보너스 포인트 지급</p>
            </div>
            <span className="font-bold text-brand-green text-[10px] bg-brand-green-light px-2 py-0.5 rounded">
              +500 P
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-grey/50">
            <div>
              <div className="font-extrabold text-gray-700">임박 식품 AI 레시피 조리 🧪</div>
              <p className="text-[10px] text-gray-400 mt-0.5">소비기한 임박 식재료 요리 3회 완료 시 보너스</p>
            </div>
            <span className="font-bold text-brand-green text-[10px] bg-brand-green-light px-2 py-0.5 rounded">
              +500 P
            </span>
          </div>
        </div>
      </div>

      {/* 3. 모바일 교환권 상품 목록 */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3.5 px-1 flex items-center gap-1.5">
          <ShoppingBag className="w-4.5 h-4.5 text-brand-green" />
          모바일 상품권 교환소
        </h3>

        <div className="grid grid-cols-2 gap-3.5">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white p-4 rounded-xl border border-brand-grey shadow-sm flex flex-col justify-between hover:border-brand-green/20 transition-all text-left"
            >
              <div>
                <span className="text-[26px] mb-2.5 block">{product.icon}</span>
                <span className="text-[9px] text-gray-400 font-extrabold">{product.brand}</span>
                <h4 className="text-xs font-extrabold text-gray-800 line-clamp-2 leading-relaxed mt-0.5">
                  {product.name}
                </h4>
              </div>

              <div className="mt-4 pt-2.5 border-t border-brand-grey flex flex-col gap-2">
                <span className="text-xs font-black text-brand-green">
                  {product.pointPrice.toLocaleString()} P
                </span>
                <button
                  onClick={() => handlePurchase(product)}
                  className="w-full bg-brand-green hover:bg-brand-green-hover text-white text-[10px] font-black py-2 rounded-lg transition-colors text-center"
                >
                  교환하기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
