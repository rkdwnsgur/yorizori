'use client';

import React from 'react';
import { Calendar, AlertCircle, ShoppingBag, BellOff, CheckCircle } from 'lucide-react';

export interface AppNotification {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationsProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export default function Notifications({
  notifications,
  onMarkAsRead,
  onClearAll,
}: NotificationsProps) {
  return (
    <div className="flex flex-col h-full pb-24 bg-[#FCFDFD]">
      {/* 상단 헤더 */}
      <div className="p-4 bg-white border-b border-brand-grey flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg font-extrabold text-gray-800">소식 알림판</h2>
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
          >
            모두 비우기
          </button>
        )}
      </div>

      {/* 알림 메시지 타임라인 리스트 */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
        {notifications.length > 0 ? (
          <div className="flex flex-col gap-3">
            {notifications.map((notif) => {
              // 타입별 디자인 변수 설정
              let iconBg = 'bg-brand-grey text-gray-500';
              let iconElement = <Calendar className="w-5 h-5" />;
              let cardBorder = 'border-brand-grey';
              
              if (notif.type === 'warning') {
                iconBg = 'bg-brand-coral/10 text-brand-coral';
                iconElement = <AlertCircle className="w-5 h-5" />;
                cardBorder = 'border-brand-coral/20';
              } else if (notif.type === 'success') {
                iconBg = 'bg-brand-green-light text-brand-green';
                iconElement = <CheckCircle className="w-5 h-5" />;
                cardBorder = 'border-brand-green/20';
              }

              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead(notif.id)}
                  className={`bg-white p-4 rounded-2xl border ${cardBorder} shadow-sm flex items-start gap-3.5 transition-all duration-300 relative cursor-pointer group ${
                    notif.read ? 'opacity-70' : 'hover:border-brand-green/30'
                  }`}
                >
                  {/* 미동작 알림(읽지 않음) 표시 */}
                  {!notif.read && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-green"></span>
                  )}

                  {/* 아이콘 */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    {iconElement}
                  </div>

                  {/* 텍스트 내용 */}
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-gray-800">{notif.title}</h4>
                      <span className="text-[10px] text-gray-400 font-medium group-hover:text-gray-500">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mt-1 font-medium">
                      {notif.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center text-gray-400 text-sm border-2 border-dashed border-brand-grey rounded-2xl h-[300px]">
            <BellOff className="w-10 h-10 text-gray-300 mb-4" />
            <p className="font-semibold">도착한 소식이 없습니다.</p>
            <p className="text-xs mt-1 text-gray-300">식재료 유통기한 임박 알림 등이 여기에 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
