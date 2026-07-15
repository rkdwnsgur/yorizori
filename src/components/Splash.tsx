'use client';

import React, { useEffect, useState } from 'react';

interface SplashProps {
  onFinish: () => void;
}

export default function Splash({ onFinish }: SplashProps) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // 1.5초 후 페이드아웃 시작
    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 1500);

    // 2초 후 완전 종료
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-between bg-brand-green p-10 rounded-[32px] transition-opacity duration-500 ease-in-out ${
        fade ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 상단 장식 오프닝 */}
      <div className="flex flex-col items-center pt-24 animate-fade-in">
        <span className="text-sm font-semibold tracking-widest text-brand-green-light/80 uppercase">
          Wellness Asset Manager
        </span>
      </div>

      {/* 중앙 메인 로고 및 슬로건 */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          {/* 아보카도/딜 형상화를 모티브로 한 세련된 미니멀 원형 심볼 */}
          <div className="w-20 h-20 rounded-full border-4 border-brand-green-light flex items-center justify-center bg-brand-green shadow-lg animate-pulse">
            <svg
              className="w-10 h-10 text-brand-green-light"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 font-sans">
          요리조리
        </h1>
        <p className="text-sm text-brand-green-light/90 font-medium">
          Cook smart, Save wise
        </p>
      </div>

      {/* 하단 슬로건 */}
      <div className="flex flex-col items-center pb-12">
        <p className="text-xs text-brand-green-light/70 text-center font-light leading-relaxed">
          냉장고 속 재료로 요리하고,<br />
          식비는 조리 있게 줄이고
        </p>
      </div>
    </div>
  );
}
