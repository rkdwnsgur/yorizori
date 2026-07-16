'use client';

import React, { useState } from 'react';
import { IngredientItem, StorageUnit } from '../types';
import { Search, Plus, Trash2, X, Edit2, Check, Settings, LayoutGrid, AlertTriangle, ArrowLeft, Refrigerator, ShoppingBasket, Snowflake, Archive } from 'lucide-react';

interface SearchRegisterProps {
  items: IngredientItem[];
  storages: StorageUnit[];
  currentStorageId: string;
  onAddItem: (item: Omit<IngredientItem, 'id' | 'registeredAt' | 'storageId'>) => void;
  onDeleteItem: (id: string) => void;
  onSelectStorage: (id: string) => void;
  onAddStorage: (name: string, type: StorageUnit['type']) => void;
  onUpdateStorageName: (id: string, name: string) => void;
  onDeleteStorage: (id: string) => void;
  onUpdateItem: (id: string, updated: Omit<IngredientItem, 'id' | 'registeredAt' | 'storageId'>) => void;
}

export default function SearchRegister({
  items,
  storages,
  currentStorageId,
  onAddItem,
  onDeleteItem,
  onSelectStorage,
  onAddStorage,
  onUpdateStorageName,
  onDeleteStorage,
  onUpdateItem,
}: SearchRegisterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // 상세 보기 모달 상태 (이 냉장고 뚜껑을 클릭해야 음식 리스트가 보임)
  const [showDetailId, setShowDetailId] = useState<string | null>(null);

  // 보관소 관리 모달 및 에디터 상태
  const [showStorageMgmt, setShowStorageMgmt] = useState(false);
  const [newStorageName, setNewStorageName] = useState('');
  const [newStorageType, setNewStorageType] = useState<StorageUnit['type']>('냉장고');
  
  const [editStorageId, setEditStorageId] = useState<string | null>(null);
  const [editStorageNameInput, setEditStorageNameInput] = useState('');

  // 수동 식재료 등록 폼 상태
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState('1개');
  const [manualCat, setManualCat] = useState<'야채' | '육류/해물' | '유제품' | '가공식품' | '기타'>('야채');
  const [manualExpiry, setManualExpiry] = useState('');
  const [manualPrice, setManualPrice] = useState('0');

  // 식재료 수정 폼 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editCat, setEditCat] = useState<'야채' | '육류/해물' | '유제품' | '가공식품' | '기타'>('야채');
  const [editExpiry, setEditExpiry] = useState('');
  const [editPrice, setEditPrice] = useState('0');

  const categories = ['전체', '야채', '육류/해물', '유제품', '가공식품', '기타'];

  // 현재 상세 조회 중인 보관소 객체
  const detailStorage = storages.find((s) => s.id === showDetailId);

  const getDDay = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 상세 모달 내에서 검색/카테고리 필터링된 식재료
  const filteredItems = items.filter((item) => {
    const matchesStorage = item.storageId === showDetailId;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || item.category === selectedCategory;
    return matchesStorage && matchesSearch && matchesCategory;
  });

  // 보관소 타입별 아이콘 컴포넌트 렌더러
  const renderStorageIcon = (type: StorageUnit['type'], sizeClass = "w-9 h-9") => {
    switch (type) {
      case '냉장고':
      case '김치냉장고':
        return <Refrigerator className={`${sizeClass} text-brand-green`} />; // 냉장고 & 김치냉장고 통일성 부여
      case '냉동고':
        return <Snowflake className={`${sizeClass} text-sky-400`} />; // 냉동고
      case '실온보관':
        return <ShoppingBasket className={`${sizeClass} text-amber-600`} />; // 식당용 식자재 바구니 선반
      default:
        return <ShoppingBasket className={`${sizeClass} text-gray-400`} />;
    }
  };

  // 보관소 추가
  const handleCreateStorage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStorageName.trim()) return;
    onAddStorage(newStorageName, newStorageType);
    setNewStorageName('');
    setNewStorageType('냉장고');
  };

  // 보관소 이름 편집 완료
  const handleRenameSave = (id: string) => {
    if (!editStorageNameInput.trim()) return;
    onUpdateStorageName(id, editStorageNameInput);
    setEditStorageId(null);
  };

  // 수동 추가 제출
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualExpiry || !showDetailId) return;

    onAddItem({
      name: manualName,
      quantity: manualQty,
      category: manualCat,
      expiryDate: manualExpiry,
      price: parseInt(manualPrice) || 0,
    });

    setManualName('');
    setManualQty('1개');
    setManualCat('야채');
    setManualExpiry('');
    setManualPrice('0');
    setShowManualModal(false);
  };

  // 수정 진입 핸들러
  const handleStartEdit = (item: IngredientItem) => {
    setSelectedItemId(item.id);
    setEditName(item.name);
    setEditQty(item.quantity);
    setEditCat(item.category);
    setEditExpiry(item.expiryDate);
    setEditPrice(item.price.toString());
    setShowEditModal(true);
  };

  // 수정 완료 제출
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !editName.trim() || !editExpiry) return;

    onUpdateItem(selectedItemId, {
      name: editName,
      quantity: editQty,
      category: editCat,
      expiryDate: editExpiry,
      price: parseInt(editPrice) || 0,
    });

    setSelectedItemId(null);
    setShowEditModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#FCFDFD] relative overflow-hidden text-left">
      
      {/* ---------------------------------------------------- */}
      {/* 메인 뷰: 극단적으로 깔끔하고 미니멀한 보관소 선택창 중심 디자인 */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto px-4.5 pt-5 pb-28 flex flex-col gap-6">
        
        {/* 상단 소개 타이틀 */}
        <div className="flex justify-between items-center px-0.5">
          <div>
            <h3 className="text-base font-black text-gray-800">내 보관 자산 목록</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1">확인하려는 냉장고 문을 클릭하여 열어보세요.</p>
          </div>
          <button
            onClick={() => setShowStorageMgmt(true)}
            className="text-gray-400 hover:text-brand-green p-2 rounded-xl bg-brand-grey/50 hover:bg-brand-grey transition-all flex items-center gap-1.5 text-[10px] font-bold"
          >
            <Settings className="w-3.5 h-3.5" />
            공간 관리
          </button>
        </div>

        {/* 소비기한 임박 식품 긴급 표시 (D-3 이내) */}
        {(() => {
          const urgentItems = items.filter((item) => {
            const d = getDDay(item.expiryDate);
            return d >= 0 && d <= 3;
          });
          if (urgentItems.length === 0) return null;

          return (
            <div className="bg-brand-coral/5 p-4.5 rounded-[22px] border border-brand-coral/10 text-left flex flex-col gap-3 flex-shrink-0 animate-fade-in">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-brand-coral animate-pulse" />
                <span className="text-[10px] font-black text-brand-coral uppercase tracking-wide">
                  전체 보관소 임박 식품 (D-3 이내)
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-0.5">
                {urgentItems.map((item) => {
                  const dDay = getDDay(item.expiryDate);
                  return (
                    <div
                      key={item.id}
                      className="bg-white px-3 py-2.5 rounded-xl border border-brand-grey shadow-xs flex-shrink-0 flex flex-col justify-between min-w-[115px]"
                    >
                      <div>
                        <div className="text-[7.5px] font-bold text-gray-400 bg-brand-grey px-1.5 py-0.5 rounded inline-block truncate max-w-[85px]">
                          {storages.find((st) => st.id === item.storageId)?.name || '보관소'}
                        </div>
                        <h4 className="text-[9.5px] font-black text-gray-800 mt-1.5 truncate w-[90px]">
                          {item.name}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[8px] text-gray-400 font-bold">{item.quantity}</span>
                        <span className="text-[8px] font-black text-brand-coral bg-brand-coral/10 px-1.5 py-0.5 rounded">
                          D-{dDay === 0 ? 'Day' : dDay}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 뭉툭하고 미려한 네모 냉장고 카드 그리드 (2열 바둑판 배치) */}
        <div className="grid grid-cols-2 gap-4">
          {storages.map((s) => {
            const storageItems = items.filter((item) => item.storageId === s.id);
            const storageItemsCount = storageItems.length;

            // 해당 냉장고에 유통기한 D-3 임박한 긴급 식품 개수 계산
            const urgentCountInStorage = storageItems.filter(
              (item) => getDDay(item.expiryDate) <= 3
            ).length;

            return (
              <div
                key={s.id}
                onClick={() => {
                  onSelectStorage(s.id);
                  setShowDetailId(s.id);
                  setSearchQuery('');
                  setSelectedCategory('전체');
                }}
                className="bg-white p-5 rounded-[22px] border border-brand-grey shadow-sm cursor-pointer hover:border-brand-green/30 hover:shadow-md active:scale-95 transition-all flex flex-col justify-between h-[125px] relative overflow-hidden group text-left"
              >
                {/* 우측 상단 임박 배지 */}
                {urgentCountInStorage > 0 && (
                  <span className="absolute top-3.5 right-3.5 bg-brand-coral text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-md animate-pulse">
                    긴급 {urgentCountInStorage}
                  </span>
                )}

                {/* 상단: 진짜 가전/보관함 아이콘 */}
                <div className="mb-1 group-hover:scale-110 transition-transform">
                  {renderStorageIcon(s.type, "w-10 h-10")}
                </div>

                {/* 하단: 텍스트 정보 */}
                <div>
                  <h4 className="text-xs font-black text-gray-800 truncate">{s.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">
                    보관 식품: {storageItemsCount}개
                  </p>
                </div>
              </div>
            );
          })}

          {/* 간편 공간 생성 바로가기 카드 */}
          <div
            onClick={() => setShowStorageMgmt(true)}
            className="border-2 border-dashed border-brand-grey p-5 rounded-[22px] flex flex-col items-center justify-center h-[125px] cursor-pointer hover:border-brand-green/20 hover:bg-brand-green-light/10 transition-all text-center"
          >
            <Plus className="w-6 h-6 text-gray-300 mb-1.5" />
            <span className="text-[10px] text-gray-400 font-extrabold leading-none">새 공간 추가하기</span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 상세 서브 스크린: 보관소 클릭 시 슬라이드 오버레이 형태로 노출 */}
      {/* ---------------------------------------------------- */}
      {showDetailId && detailStorage && (
        <div className="absolute inset-0 bg-[#FCFDFD] z-30 flex flex-col animate-fade-in text-left">
          
          {/* 상세 헤더 (뒤로가기 포함) */}
          <div className="pt-8 pb-3 px-4.5 bg-white border-b border-brand-grey flex items-center justify-between z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDetailId(null)}
                className="text-gray-500 hover:text-brand-green p-1 hover:bg-brand-grey rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-[9px] font-extrabold text-brand-green tracking-wider uppercase">
                  {detailStorage.type} 상세 정보
                </span>
                <h3 className="text-xs font-black text-gray-800 mt-0.5 flex items-center gap-1.5">
                  {renderStorageIcon(detailStorage.type, "w-4.5 h-4.5")} {detailStorage.name}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setShowManualModal(true)}
              className="text-[10px] bg-brand-green hover:bg-brand-green-hover text-white font-extrabold py-2 px-3 rounded-lg shadow-sm flex items-center gap-1 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              식품 등록
            </button>
          </div>

          {/* 상세 스크롤 뷰포트 */}
          <div className="flex-1 overflow-y-auto px-4.5 pt-4 pb-28 flex flex-col gap-4">
            
            {/* 검색창 */}
            <div className="relative flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={`${detailStorage.name} 속 식품 검색...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-grey py-2.5 pl-10 pr-4 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-green/30 transition-all text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* 카테고리 칩스 */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === cat
                      ? 'bg-brand-green text-white shadow-xs'
                      : 'bg-brand-grey text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 깔끔한 식품 세로형 상세 리스트 (가로 잘림 카드 대신 정갈한 1열 세로형 카드로 리포지셔닝) */}
            <div className="flex flex-col gap-3">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const dDay = getDDay(item.expiryDate);
                  const isExpired = dDay < 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-white p-3.5 rounded-xl border border-brand-grey shadow-xs flex items-center justify-between relative group hover:border-brand-green/20 transition-all"
                    >
                      <div className="flex items-center gap-3 pr-8">
                        {/* 카테고리별 마일스톤 이모지 뱃지 */}
                        <div className="w-10 h-10 rounded-xl bg-brand-grey flex items-center justify-center text-lg">
                          {item.category === '야채' ? '🥬' : item.category === '육류/해물' ? '🥩' : item.category === '유제품' ? '🥛' : item.category === '가공식품' ? '🥫' : '🍳'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-gray-800">{item.name}</h4>
                            <span className="text-[8px] text-gray-400 bg-brand-grey px-1.5 py-0.5 rounded-md font-bold">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="text-[9px] text-gray-400 mt-1 font-medium">
                            등록일: {item.registeredAt.substring(0, 10)} | 금액: {item.price.toLocaleString()}원
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 소비기한 D-Day */}
                        <span
                          className={`text-[8.5px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${
                            isExpired
                              ? 'bg-red-50 text-red-500'
                              : dDay <= 2
                              ? 'bg-brand-coral/10 text-brand-coral'
                              : 'bg-brand-green-light text-brand-green'
                          }`}
                        >
                          {isExpired ? '만료됨' : dDay === 0 ? '오늘만료' : `D-${dDay}`}
                        </span>

                        {/* 수정 단추 */}
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="text-gray-300 hover:text-brand-green p-1.5 rounded-lg hover:bg-brand-green-light/40 transition-colors"
                          title="식품 수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* 삭제 단추 */}
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="식품 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 text-xs border-2 border-dashed border-brand-grey rounded-2xl min-h-[160px] mt-2">
                  <span className="text-2xl mb-2">🧊</span>
                  <p className="font-semibold text-gray-500">보관된 식품이 없습니다.</p>
                  <p className="text-[9px] text-gray-300 mt-0.5">우측 상단 [식품 등록]이나 촬영등록을 해주세요!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 수동 등록 모달 */}
      {showManualModal && (
        <div className="fixed inset-0 z-45 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl relative text-left">
            <button
              onClick={() => setShowManualModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-brand-grey"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-sm font-bold text-gray-800 mb-4">식재료 등록 ({detailStorage?.name})</h3>
            
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">재료 이름 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 국산 콩두부 300g"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">수량 *</label>
                  <input
                    type="text"
                    required
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">구매 금액 *</label>
                  <input
                    type="number"
                    required
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">카테고리</label>
                  <select
                    value={manualCat}
                    onChange={(e) => setManualCat(e.target.value as any)}
                    className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800 border-none appearance-none"
                  >
                    <option value="야채">야채</option>
                    <option value="육류/해물">육류/해물</option>
                    <option value="유제품">유제품</option>
                    <option value="가공식품">가공식품</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">소비기한 만료일 *</label>
                  <input
                    type="date"
                    required
                    value={manualExpiry}
                    onChange={(e) => setManualExpiry(e.target.value)}
                    className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-3 rounded-xl mt-3 transition-colors shadow-sm"
              >
                {detailStorage?.name}에 추가하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 보관소 관리 모달 */}
      {showStorageMgmt && (
        <div className="fixed inset-0 z-45 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl relative animate-fade-in max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowStorageMgmt(false);
                setEditStorageId(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-brand-grey"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-gray-800 mb-5 flex items-center gap-1.5">
              <LayoutGrid className="w-5 h-5 text-brand-green" />
              내 보관 영역 리스트
            </h3>

            {/* 보관소 목록 */}
            <div className="flex flex-col gap-2.5 mb-6 text-left">
              {storages.map((s) => (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    currentStorageId === s.id
                      ? 'border-brand-green bg-brand-green-light/40'
                      : 'border-brand-grey bg-white'
                  }`}
                >
                  {editStorageId === s.id ? (
                    <div className="flex-1 flex items-center gap-1.5 pr-2">
                      <input
                        type="text"
                        value={editStorageNameInput}
                        onChange={(e) => setEditStorageNameInput(e.target.value)}
                        className="border border-brand-green/30 bg-white rounded px-2 py-1 text-xs outline-none flex-1 font-bold text-gray-800"
                      />
                      <button
                        onClick={() => handleRenameSave(s.id)}
                        className="bg-brand-green text-white p-1 rounded hover:bg-brand-green-hover"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-800">{s.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-brand-grey text-gray-500 rounded">
                          {s.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        보관 식품: {items.filter((item) => item.storageId === s.id).length}개
                      </span>
                    </div>
                  )}

                  {editStorageId !== s.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditStorageId(s.id);
                          setEditStorageNameInput(s.name);
                        }}
                        className="text-gray-400 hover:text-brand-green p-1 hover:bg-brand-grey rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      
                      {storages.length > 1 && (
                        <button
                          onClick={() => onDeleteStorage(s.id)}
                          className="text-gray-300 hover:text-red-500 p-1 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 새 보관소 추가 */}
            <div className="border-t border-brand-grey pt-5 text-left">
              <h4 className="text-xs font-extrabold text-gray-500 mb-3">+ 새 보관 공간 추가</h4>
              <form onSubmit={handleCreateStorage} className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="예: 김치냉장고2, 다용도실"
                    value={newStorageName}
                    onChange={(e) => setNewStorageName(e.target.value)}
                    className="flex-1 bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800"
                  />
                  <select
                    value={newStorageType}
                    onChange={(e) => setNewStorageType(e.target.value as any)}
                    className="bg-brand-grey border-none py-2.5 px-2 rounded-lg text-xs outline-none text-gray-700 cursor-pointer"
                  >
                    <option value="냉장고">냉장고</option>
                    <option value="냉동고">냉동고</option>
                    <option value="김치냉장고">김치냉장고</option>
                    <option value="실온보관">실온보관</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  보관소 추가 등록
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 식재료 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 z-45 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl relative text-left">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedItemId(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-brand-grey"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-1.5">
              <Edit2 className="w-4 h-4 text-brand-green animate-pulse" />
              보관 식품 정보 수정
            </h3>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">식품 이름 *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">수량/용량 *</label>
                  <input
                    type="text"
                    required
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">구매 금액 *</label>
                  <input
                    type="number"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">카테고리</label>
                  <select
                    value={editCat}
                    onChange={(e) => setEditCat(e.target.value as any)}
                    className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800 border-none appearance-none cursor-pointer"
                  >
                    <option value="야채">야채</option>
                    <option value="육류/해물">육류/해물</option>
                    <option value="유제품">유제품</option>
                    <option value="가공식품">가공식품</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">소비기한 만료일 *</label>
                  <input
                    type="date"
                    required
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value)}
                    className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-3 rounded-xl mt-3 transition-colors shadow-sm active:scale-97"
              >
                식품 정보 수정하기
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
