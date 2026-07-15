'use client';

import React, { useState } from 'react';
import { Recipe, BadgeTitle } from '../types';
import { Award, BookOpen, CreditCard, Settings, ChevronRight, Bookmark, X, Users, AlertCircle } from 'lucide-react';

interface MyPageProps {
  nickname: string;
  familyCount: number;
  savedRecipes: Recipe[];
  badges: BadgeTitle[];
  subscription: 'free' | 'pro';
  onUpdateProfile: (nickname: string, familyCount: number) => void;
  onUnsaveRecipe: (id: string) => void;
  onUpgradeSubscription: (plan: 'free' | 'pro') => void;
  purchasedCoupons?: string[];
  onNavigateToCheckout: () => void;
  onLogout?: () => void; // 로그아웃 콜백 추가
}

export default function MyPage({
  nickname,
  familyCount,
  savedRecipes,
  badges,
  subscription,
  onUpdateProfile,
  onUnsaveRecipe,
  onUpgradeSubscription,
  purchasedCoupons = [],
  onNavigateToCheckout,
  onLogout, // 로그아웃 바인딩
}: MyPageProps) {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editNickname, setEditNickname] = useState(nickname);
  const [editFamilyCount, setEditFamilyCount] = useState(familyCount);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  // 프로필 업데이트 적용
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(editNickname, editFamilyCount);
    setShowEditProfile(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-36 px-4 pt-4 bg-[#FCFDFD]">
      {/* 1. 프로필 영역 */}
      <div className="bg-white p-5 rounded-2xl border border-brand-grey shadow-sm mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-green-light flex items-center justify-center text-brand-green text-xl font-bold">
            {nickname.substring(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-gray-800">{nickname}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-green text-white rounded-full">
                {subscription === 'pro' ? 'PRO 멤버십' : '일반'}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1 font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              가구 설정: {familyCount}인 가구
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setEditNickname(nickname);
            setEditFamilyCount(familyCount);
            setShowEditProfile(true);
          }}
          className="text-xs font-bold text-gray-400 hover:text-brand-green border border-gray-200 px-3 py-1.5 rounded-lg hover:border-brand-green/30 transition-all"
        >
          편집
        </button>
      </div>

      {/* 1.5. 내 모바일 기프티콘 쿠폰함 */}
      {purchasedCoupons.length > 0 && (
        <div className="bg-white p-4.5 rounded-2xl border border-brand-grey shadow-sm mb-6 animate-fade-in">
          <h4 className="text-xs font-bold text-gray-400 tracking-wider mb-3">🎁 내 기프티콘 보관함</h4>
          <div className="flex flex-col gap-2">
            {purchasedCoupons.map((coupon, idx) => (
              <div key={idx} className="bg-brand-green-light/50 p-3 rounded-xl flex items-center justify-between text-xs border border-brand-green/10">
                <span className="font-extrabold text-gray-800">{coupon}</span>
                <span className="text-[9px] bg-brand-green text-white font-extrabold px-2 py-0.5 rounded-md">
                  사용가능
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. 저장한 레시피 보관함 (추가된 핵심 기능) */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5 px-1">
          <BookOpen className="w-4.5 h-4.5 text-brand-green" />
          저장한 구출 레시피 ({savedRecipes.length})
        </h3>
        
        {savedRecipes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5">
            {savedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className="bg-white p-3.5 rounded-xl border border-brand-grey shadow-sm hover:border-brand-green/20 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="text-xs font-extrabold text-gray-800 line-clamp-2 leading-relaxed">
                      {recipe.name}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnsaveRecipe(recipe.id);
                      }}
                      className="text-brand-green hover:text-gray-300 transition-colors"
                    >
                      <Bookmark className="w-4.5 h-4.5 fill-current" />
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1.5 line-clamp-1">
                    재료: {recipe.ingredients.join(', ')}
                  </div>
                </div>
                <div className="text-[10px] text-brand-green font-extrabold mt-3.5 pt-2 border-t border-brand-grey flex items-center justify-between">
                  <span>식비 절약액</span>
                  <span>+{recipe.savingsAmount.toLocaleString()}원</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-brand-grey/50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-xs">
            저장해 놓은 레시피가 없습니다. AI 추천 요리에서 북마크를 눌러보세요! 🥦
          </div>
        )}
      </div>

      {/* 3. 요금제 및 구독 관리 */}
      <div className="bg-white rounded-2xl border border-brand-grey shadow-sm mb-6 overflow-hidden">
        <div className="p-4 border-b border-brand-grey flex items-center justify-between">
          <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <CreditCard className="w-4.5 h-4.5 text-brand-green" />
            멤버십 및 요금제
          </span>
          <button
            onClick={onNavigateToCheckout}
            className="text-xs font-extrabold text-brand-green hover:underline"
          >
            요금제 관리
          </button>
        </div>
        <div className="p-4 bg-brand-grey/20 flex justify-between items-center text-xs">
          <div>
            <div className="font-extrabold text-gray-700">
              {subscription === 'pro' ? '요리조리 프로 멤버십 구독 중' : '일반(Free) 요금제 이용 중'}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              {subscription === 'pro' ? '월 2,900원 결제 (다음 결제일: 2026-08-14)' : '냉장고 1개 관리 한도'}
            </div>
          </div>
          {subscription === 'free' && (
            <button
              onClick={onNavigateToCheckout}
              className="bg-brand-green hover:bg-brand-green-hover text-white text-[10px] font-extrabold py-2 px-3.5 rounded-lg shadow-sm"
            >
              PRO 업그레이드
            </button>
          )}
        </div>
      </div>

      {/* 4. 기타 설정 및 약관 */}
      <div className="bg-white rounded-2xl border border-brand-grey shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-brand-grey">
          <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <Settings className="w-4.5 h-4.5 text-brand-green" />
            일반 설정
          </span>
        </div>
        <div className="flex flex-col text-xs text-gray-600">
          <div className="p-4 flex justify-between items-center border-b border-brand-grey">
            <span>알림 수신 시간대</span>
            <span className="font-bold text-brand-green">매일 오전 09:00</span>
          </div>
          <button
            onClick={() => setShowTerms(true)}
            className="p-4 text-left flex justify-between items-center hover:bg-brand-grey/30 border-b border-brand-grey"
          >
            <span>요리조리 이용약관 및 정책</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <div className="p-4 flex justify-between items-center text-gray-400">
            <span>앱 버전</span>
            <span>v1.0.0 (MVP)</span>
          </div>
        </div>
      </div>

      {/* 5. 로그아웃 버튼 대형 배치 */}
      <button
        onClick={onLogout}
        className="w-full bg-white hover:bg-red-50 text-red-500 border border-red-100 hover:border-red-200 text-xs font-black py-4 rounded-2xl shadow-xs transition-colors mt-6 flex items-center justify-center gap-1.5 active:scale-98"
      >
        <span>🚪 로그아웃하기</span>
      </button>
      <div className="h-8 flex-shrink-0" />

      {/* 모달 1. 프로필 수정 */}
      {showEditProfile && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative animate-fade-in shadow-xl">
            <button
              onClick={() => setShowEditProfile(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-brand-grey"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-bold text-gray-800 mb-4">프로필 편집</h4>
            <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">닉네임</label>
                <input
                  type="text"
                  required
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full bg-brand-grey py-3 px-4 rounded-xl text-sm outline-none text-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">가구원 수 (추천 알고리즘용)</label>
                <select
                  value={editFamilyCount}
                  onChange={(e) => setEditFamilyCount(parseInt(e.target.value))}
                  className="w-full bg-brand-grey py-3 px-4 rounded-xl text-sm outline-none text-gray-800 appearance-none"
                >
                  <option value={1}>1인 가구 (자취)</option>
                  <option value={2}>2인 가구</option>
                  <option value={3}>3인 가구 이상</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-3 rounded-xl mt-2 transition-colors"
              >
                저장하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 모달 2. 레시피 상세보기 모달 */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative animate-fade-in shadow-xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRecipe(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-brand-grey"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-extrabold text-gray-800 mb-1">{selectedRecipe.name}</h4>
            <div className="text-[10px] text-brand-green font-bold bg-brand-green-light px-2 py-0.5 rounded inline-block">
              절약 예상액: +{selectedRecipe.savingsAmount.toLocaleString()}원
            </div>

            <div className="mt-4">
              <h5 className="text-xs font-bold text-gray-600 mb-1.5">필수 재료</h5>
              <p className="text-xs text-gray-500 font-medium bg-brand-grey p-2.5 rounded-lg leading-relaxed">
                {selectedRecipe.ingredients.join(', ')}
              </p>
            </div>

            <div className="mt-4">
              <h5 className="text-xs font-bold text-gray-600 mb-1.5">조리 방법</h5>
              <ol className="text-xs text-gray-600 list-decimal pl-4.5 flex flex-col gap-2 leading-relaxed">
                {selectedRecipe.instructions.map((step, idx) => (
                  <li key={idx} className="pl-1">{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* 모달 3. 요금제 요금 변경 모킹 모달 */}


      {/* 모달 4. 약관 뷰 모달 */}
      {showTerms && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative animate-fade-in shadow-xl max-h-[70vh] overflow-y-auto">
            <button
              onClick={() => setShowTerms(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-brand-grey"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-extrabold text-gray-800 mb-3">서비스 이용약관</h4>
            <div className="text-[10px] text-gray-500 leading-relaxed flex flex-col gap-3 font-medium">
              <p>
                <strong>제 1조 (목적)</strong><br />
                본 약관은 [요리조리] 서비스 이용자가 제공받는 냉장고 자산 관리 및 식비 가계부 서비스의 이용조건 및 절차를 규정합니다.
              </p>
              <p>
                <strong>제 2조 (서비스의 제공)</strong><br />
                1. 회사는 이용자에게 영수증 분석 OCR 등록 대행, 소비기한 추적 알림, AI 기반 맞춤형 레시피 등 자산 보존 목적의 서비스를 제공합니다.<br />
                2. PRO 멤버십 결제 시, 다중 디렉토리 구성 및 세션 연동 공유 권한이 해제됩니다.
              </p>
              <p>
                <strong>제 3조 (개인정보 보호)</strong><br />
                수집된 영수증 정보와 식비 지출 내역은 개인 식생활 패턴 파악 목적 이외의 용도로 절대 가공 및 유출되지 않음을 엄격히 준수합니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
