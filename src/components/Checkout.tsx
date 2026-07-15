'use client';

import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, CreditCard, Sparkles, ShieldCheck, Check } from 'lucide-react';

interface CheckoutProps {
  nickname: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export default function Checkout({
  nickname,
  onPaymentSuccess,
  onCancel,
}: CheckoutProps) {
  // 요금제 가격 선택 (월 구독 vs 연 구독)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  // 카드 폼 정보 상태
  const [cardNumber1, setCardNumber1] = useState('');
  const [cardNumber2, setCardNumber2] = useState('');
  const [cardNumber3, setCardNumber3] = useState('');
  const [cardNumber4, setCardNumber4] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardPin, setCardPin] = useState('');
  const [cardHolder, setCardHolder] = useState(`${nickname}`);

  // 결제 진행 중 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'plan_details' | 'payment_form'>('plan_details');

  const price = selectedPlan === 'monthly' ? 2900 : 19000;
  const priceLabel = selectedPlan === 'monthly' ? '월 2,900원' : '연 19,000원 (연 45% 할인)';

  // 카드 번호 합쳐서 보여주기용
  const formattedCardNumber = `${cardNumber1.padEnd(4, '•')} ${cardNumber2.padEnd(4, '•')} ${cardNumber3.padEnd(4, '•')} ${cardNumber4.padEnd(4, '•')}`;
  const formattedExpiry = `${expiryMonth.padStart(2, '0')}/${expiryYear || '••'}`;

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber1.length < 4 || cardNumber2.length < 4 || cardNumber3.length < 4 || cardNumber4.length < 4) {
      alert('올바른 신용카드 번호 16자리를 입력해 주세요.');
      return;
    }
    if (!expiryMonth || !expiryYear || cvc.length < 3 || cardPin.length < 2) {
      alert('결제 승인 카드 정보를 모두 채워주세요.');
      return;
    }

    setIsProcessing(true);

    // 1.8초 동안 가상 보안 통신 결제 승인 연출
    setTimeout(() => {
      setIsProcessing(false);
      alert(`🎉 결제가 정상 승인되었습니다! 요리조리 PRO 멤버십과 함께 스마트한 식생활을 시작해 보세요.`);
      onPaymentSuccess();
    }, 1800);
  };

  return (
    <div className="flex flex-col h-full bg-[#FCFDFD] animate-fade-in text-left">
      {/* A. 상단 타이틀 바 */}
      <div className="pt-8 pb-3 px-4 bg-white border-b border-brand-grey flex items-center gap-2.5 z-10 flex-shrink-0">
        <button
          onClick={() => {
            if (step === 'payment_form') {
              setStep('plan_details');
            } else {
              onCancel();
            }
          }}
          className="text-gray-500 hover:text-brand-green p-1 hover:bg-brand-grey rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
          {step === 'plan_details' ? '요리조리 멤버십 신청' : '안전 가상 결제'}
        </span>
      </div>

      {/* B. 메인 폼 컨텐츠 */}
      <div className="flex-1 overflow-y-auto px-4.5 pt-4 pb-28">
        {step === 'plan_details' ? (
          /* 1단계: 플랜 소개 및 혜택 가이드 */
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* 프로 혜택 카드 히어로 */}
            <div className="bg-gradient-to-br from-brand-green to-[#2D5A46] p-5.5 rounded-2xl text-white shadow-md">
              <div className="flex items-center gap-1.5 opacity-90 text-[10px] font-bold tracking-wider uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-green-light" />
                Premium Benefit Plan
              </div>
              <h3 className="text-lg font-black leading-tight mt-1.5">
                식비는 절반으로,<br />냉장고 관리는 무제한으로!
              </h3>
              <p className="text-[10px] text-brand-green-light/80 mt-2 leading-relaxed">
                가정용 냉동고 추가, 김치냉장고 분리, 가족 연동 초대 링크 발급으로 더욱 조리 있게 아껴보세요.
              </p>
            </div>

            {/* 핵심 혜택 리스트 */}
            <div className="bg-white p-4.5 rounded-2xl border border-brand-grey shadow-xs">
              <h4 className="text-xs font-bold text-gray-400 tracking-wider mb-3.5">PRO 멤버십 제공 혜택</h4>
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-brand-green-light flex items-center justify-center mt-0.5 flex-shrink-0 text-brand-green">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-extrabold text-gray-700">무제한 멀티 보관 공간 추가</span>
                    <p className="text-[9.5px] text-gray-400 mt-0.5 leading-relaxed">
                      실온, 냉동, 김치냉장고, 베란다 보관함 등 이름을 변경하여 무제한 생성
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-brand-green-light flex items-center justify-center mt-0.5 flex-shrink-0 text-brand-green">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-extrabold text-gray-700">무제한 카톡 공유 및 실시간 동기화</span>
                    <p className="text-[9.5px] text-gray-400 mt-0.5 leading-relaxed">
                      초대 링크를 생성해 가족원들을 초대하고 냉장고 재료를 동시에 공유 및 관리
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-brand-green-light flex items-center justify-center mt-0.5 flex-shrink-0 text-brand-green">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-extrabold text-gray-700">소비기한 만료 전 모바일 카톡 알림 발송</span>
                    <p className="text-[9.5px] text-gray-400 mt-0.5 leading-relaxed">
                      D-3 임박 식재료를 식사 시간에 맞추어 오전 09:00에 카카오 알림톡으로 무료 전송
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 결제 플랜 선택 칩 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-400 px-1 tracking-wider">결제 방식 선택</span>
              
              {/* 월간 결제 */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                  selectedPlan === 'monthly'
                    ? 'border-brand-green bg-brand-green-light/40 shadow-xs'
                    : 'border-brand-grey bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="text-xs font-extrabold text-gray-800">월간 구독 플랜</div>
                  <p className="text-[10px] text-gray-400 mt-1">매월 정기적으로 간편하고 스마트하게</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-brand-green">월 2,900원</div>
                </div>
              </div>

              {/* 연간 결제 */}
              <div
                onClick={() => setSelectedPlan('yearly')}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between relative overflow-hidden ${
                  selectedPlan === 'yearly'
                    ? 'border-brand-green bg-brand-green-light/40 shadow-xs'
                    : 'border-brand-grey bg-white hover:border-brand-green/30'
                }`}
              >
                <div className="absolute top-0 right-0 bg-brand-coral text-white text-[7px] font-extrabold px-2 py-0.5 rounded-bl-lg">
                  최대 45% 할인
                </div>
                <div>
                  <div className="text-xs font-extrabold text-gray-800">연간 멤버십 플랜</div>
                  <p className="text-[10px] text-gray-400 mt-1">1년 약정으로 추가 절약 혜택까지</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-brand-green">연 19,000원</div>
                  <span className="text-[8px] text-gray-400 line-through">정가 34,800원</span>
                </div>
              </div>
            </div>

            {/* 결제하기 진행 단추 */}
            <button
              onClick={() => setStep('payment_form')}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              {price.toLocaleString()}원 결제하러 가기
            </button>
          </div>
        ) : (
          /* 2단계: 신용카드 결제 카드 매칭 인터랙션 폼 */
          <div className="flex flex-col gap-5 animate-fade-in">
            
            {/* 💳 프리미엄 그라데이션 가상 신용카드 렌더링 (실시간 텍스트 바인딩) */}
            <div className="w-full h-[155px] bg-gradient-to-tr from-[#3A3F47] via-[#5F6A7A] to-[#8696A7] rounded-2xl p-5 text-white flex flex-col justify-between shadow-md relative overflow-hidden">
              {/* 은은한 보안 광원 조과 */}
              <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-white/5"></div>
              
              {/* 카드 상단: 회사명 및 IC칩 */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black tracking-widest text-[#D2D9E1] uppercase">
                  YORI JORI PREMIUM
                </span>
                {/* 노란 골드 IC칩 형상화 */}
                <div className="w-8 h-6 rounded bg-[#F7D070]/90 border border-[#DAA520]/20 flex flex-col justify-between p-1">
                  <div className="w-full h-[1.5px] bg-black/10"></div>
                  <div className="w-full h-[1.5px] bg-black/10"></div>
                  <div className="w-full h-[1.5px] bg-black/10"></div>
                </div>
              </div>

              {/* 카드 중간: 카드 번호 */}
              <div className="text-base tracking-[0.18em] font-black text-center text-[#F8FAFC]">
                {formattedCardNumber}
              </div>

              {/* 카드 하단: 소유자 명 & 만료 유효기간 */}
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[8px] text-[#A5B4FC]/70 uppercase block font-semibold">CARD HOLDER</span>
                  <span className="text-[10px] font-extrabold tracking-wide uppercase text-white truncate max-w-[120px] block mt-0.5">
                    {cardHolder || 'MIN SU'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-[#A5B4FC]/70 uppercase block font-semibold">EXPIRE DATE</span>
                  <span className="text-[10px] font-black text-white block mt-0.5">
                    {formattedExpiry}
                  </span>
                </div>
              </div>
            </div>

            {/* 카드 정보 입력 폼 */}
            <form onSubmit={handleSubmitPayment} className="flex flex-col gap-4 bg-white p-4.5 rounded-2xl border border-brand-grey shadow-xs text-xs">
              {/* 1. 카드번호 입력 */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">카드 번호 (16자리)</label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="1234"
                    value={cardNumber1}
                    onChange={(e) => setCardNumber1(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-brand-grey py-2 px-2.5 rounded-lg text-xs outline-none text-center font-black text-gray-800"
                  />
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="5678"
                    value={cardNumber2}
                    onChange={(e) => setCardNumber2(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-brand-grey py-2 px-2.5 rounded-lg text-xs outline-none text-center font-black text-gray-800"
                  />
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={cardNumber3}
                    onChange={(e) => setCardNumber3(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-brand-grey py-2 px-2.5 rounded-lg text-xs outline-none text-center font-black text-gray-800"
                  />
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={cardNumber4}
                    onChange={(e) => setCardNumber4(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-brand-grey py-2 px-2.5 rounded-lg text-xs outline-none text-center font-black text-gray-800"
                  />
                </div>
              </div>

              {/* 2. 유효기간, CVC */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">유효기간 (월/년)</label>
                  <div className="flex items-center gap-1 bg-brand-grey rounded-lg px-2 py-1">
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="MM"
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-10 bg-transparent py-1 text-center font-bold text-gray-800 outline-none"
                    />
                    <span className="text-gray-300">/</span>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="YY"
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-10 bg-transparent py-1 text-center font-bold text-gray-800 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">CVC 번호 (3자리)</label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    placeholder="•••"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-brand-grey py-2 px-3 rounded-lg font-bold text-center text-gray-800 outline-none"
                  />
                </div>
              </div>

              {/* 3. 소유자명 및 비밀번호 */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">소유자 성명</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-brand-grey py-2 px-3 rounded-lg text-gray-800 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">비밀번호 앞 2자리</label>
                  <input
                    type="password"
                    required
                    maxLength={2}
                    placeholder="••"
                    value={cardPin}
                    onChange={(e) => setCardPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-brand-grey py-2 px-3 rounded-lg text-center font-bold text-gray-800 outline-none"
                  />
                </div>
              </div>

              {/* 보안 통신 가이드 */}
              <div className="bg-brand-grey p-2.5 rounded-xl text-[9px] text-gray-400 flex items-center gap-1.5 font-medium leading-relaxed mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
                SSL 256비트 보안 금융 암호화 기술로 보호되며 안전하게 처리됩니다.
              </div>

              {/* 결제 승인 요청 버튼 */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-brand-green hover:bg-brand-green-hover text-white text-xs font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                    보안 승인 요청 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-brand-green-light" />
                    {price.toLocaleString()}원 정기 결제 승인
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
