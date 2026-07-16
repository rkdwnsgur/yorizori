'use client';

import React, { useState } from 'react';
import { IngredientItem, ExpenseRecord, BadgeTitle } from '../types';
import { Calendar, Wallet, Award, ChevronRight, AlertTriangle, ArrowRight, CheckCircle2, TrendingDown, Edit2, X, Trash2, PlusCircle } from 'lucide-react';

interface HomeDashboardProps {
  items: IngredientItem[];
  expenses: ExpenseRecord[];
  badges: BadgeTitle[];
  budget: number;
  budgetStartDate?: string;
  budgetEndDate?: string;
  budgetMemo?: string;
  totalSaved: number;
  onNavigateToTab: (tab: 'home' | 'search' | 'notification' | 'mypage') => void;
  onSelectRecipe: (ingredients: string[]) => void;
  activeSubTab?: 'fridge' | 'ledger';
  onSubTabChange?: (tab: 'fridge' | 'ledger') => void;
  onUpdateBudget?: (amount: number, startDate?: string, endDate?: string, memo?: string) => void;
  onUpdateExpense?: (id: string, updated: { title: string; amount: number; category: ExpenseRecord['category'] }) => void;
  onDeleteExpense?: (id: string) => void;
  onResetBudget?: () => void;
}

export default function HomeDashboard({
  items,
  expenses,
  badges,
  budget,
  budgetStartDate = '',
  budgetEndDate = '',
  budgetMemo = '',
  totalSaved,
  onNavigateToTab,
  onSelectRecipe,
  activeSubTab = 'fridge',
  onSubTabChange,
  onUpdateBudget,
  onUpdateExpense,
  onDeleteExpense,
  onResetBudget,
}: HomeDashboardProps) {

  // 예산 편집 상태
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState(budget.toString());
  const [budgetStartInput, setBudgetStartInput] = useState(budgetStartDate);
  const [budgetEndInput, setBudgetEndInput] = useState(budgetEndDate);
  const [budgetMemoInput, setBudgetMemoInput] = useState(budgetMemo);

  // 지출 항목 편집 상태
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  const [expenseTitleInput, setExpenseTitleInput] = useState('');
  const [expenseAmountInput, setExpenseAmountInput] = useState('');
  const [expenseCategoryInput, setExpenseCategoryInput] = useState<ExpenseRecord['category']>('마트 장보기');

  // 카테고리별 간편 추가 상태
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [addCategory, setAddCategory] = useState<ExpenseRecord['category']>('마트 장보기');
  const [addTitle, setAddTitle] = useState('');
  const [addAmount, setAddAmount] = useState('');

  // 소비기한 계산
  const getDDay = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const urgentItems = items
    .filter((item) => {
      const dDay = getDDay(item.expiryDate);
      return dDay <= 3;
    })
    .sort((a, b) => getDDay(a.expiryDate) - getDDay(b.expiryDate));

  // 기간별 필터 상태 (주간, 월간, 연간)
  const [periodFilter, setPeriodFilter] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  // 이번 달 총 지출 (고정값 계산 유지 - UI 기타 부분의 호환성을 위해)
  const currentMonthExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // 기간 필터에 따른 지출 내역 계산
  const getFilteredExpenses = () => {
    const today = new Date();
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      
      // 밀리초 기준 차이 계산
      const diffTime = today.getTime() - expDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (periodFilter === 'weekly') {
        return diffDays >= 0 && diffDays <= 7; // 최근 7일
      } else if (periodFilter === 'monthly') {
        // 같은 년도와 같은 월 (이번 달)
        return expDate.getFullYear() === today.getFullYear() && expDate.getMonth() === today.getMonth();
      } else {
        // 같은 년도 (올해)
        return expDate.getFullYear() === today.getFullYear();
      }
    });
  };

  const filteredPeriodExpenses = getFilteredExpenses();
  const periodExpensesSum = filteredPeriodExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // 기간에 비례한 예산 스케일링 설정
  const periodBudget = periodFilter === 'weekly' 
    ? Math.round(budget / 4) 
    : periodFilter === 'yearly' 
    ? budget * 12 
    : budget;

  const periodBudgetLabel = periodFilter === 'weekly'
    ? '주간 권장 예산'
    : periodFilter === 'yearly'
    ? '연간 목표 예산'
    : '이번 달 목표 예산';

  const expensePercentage = periodBudget > 0 
    ? Math.min(Math.round((periodExpensesSum / periodBudget) * 100), 100) 
    : 0;

  // 카테고리별 지출 합계 (기간 필터 반영)
  const categoryExpenses = filteredPeriodExpenses.reduce(
    (acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const freshPercentage = items.length
    ? Math.round(((items.length - urgentItems.length) / items.length) * 100)
    : 100;

  const unlockedBadges = badges.filter((b) => b.isUnlocked).slice(0, 3);

  // 예산 변경 제출
  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(budgetInput);
    if (isNaN(parsed) || parsed <= 0) return;
    if (onUpdateBudget) {
      onUpdateBudget(parsed, budgetStartInput, budgetEndInput, budgetMemoInput);
    }
    setShowBudgetModal(false);
  };

  // 지출 편집 제출
  const handleExpenseEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    const parsedAmount = parseInt(expenseAmountInput);
    if (!expenseTitleInput.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (onUpdateExpense) {
      onUpdateExpense(selectedExpense.id, {
        title: expenseTitleInput,
        amount: parsedAmount,
        category: expenseCategoryInput,
      });
    }
    setShowExpenseModal(false);
  };

  // 지출 삭제 요청
  const handleExpenseDelete = (id: string) => {
    if (onDeleteExpense) onDeleteExpense(id);
    setShowExpenseModal(false);
  };

  // 카테고리별 간편 지출 추가 제출
  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(addAmount);
    if (!addTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    // 간편 추가를 위해 가상 ID로 page.tsx의 handleUpdateExpense나 handleAddMultipleItems을 활용할 수 있으나,
    // page.tsx의 handleUpdateExpense(id가 매칭되지 않으면 아무 일도 없으므로) 대신, 새 지출을 주입해주기 위해
    // page.tsx에 전달하도록 custom하게 바인딩할 수 있습니다.
    // 여기서는 기존 expenses 수정에 pseudo ID를 push 해주는 대신, onUpdateExpense를 새 ID와 함께 매핑하여 page.tsx에서 추가 처리할 수 있도록 하겠습니다.
    if (onUpdateExpense) {
      // id = `exp_new_${Date.now()}` 형태로 보내서 page.tsx의 handleUpdateExpense가 handleAddMultipleItems과 유사하게 작동하도록 바인딩하거나
      // updateExpense 내부에서 mapping 없는 경우 신규 항목 push하게 구현하는 기법
      onUpdateExpense(`new_${Date.now()}`, {
        title: addTitle,
        amount: parsedAmount,
        category: addCategory,
      });
    }

    setAddTitle('');
    setAddAmount('');
    setShowAddExpenseModal(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-32 px-4 pt-4 bg-[#FCFDFD]">
      {activeSubTab === 'fridge' ? (
        /* --- 1. 냉장고 대시보드 탭 --- */
        <div className="flex flex-col gap-6 animate-fade-in text-left">
          
          {/* 보관도 게이지 카드 */}
          <div className="bg-white p-5 rounded-2xl border border-brand-grey shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 tracking-wider mb-2">FRIDGE STATUS</h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold text-gray-800">냉장고 신선 보관도</span>
              <span className="text-xl font-extrabold text-brand-green">{freshPercentage}%</span>
            </div>
            
            <div className="w-full bg-brand-grey h-3.5 rounded-full overflow-hidden mb-4">
              <div
                className="bg-brand-green h-full rounded-full transition-all duration-500"
                style={{ width: `${freshPercentage}%` }}
              ></div>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              {urgentItems.length > 0
                ? `소비기한이 3일 이하로 남은 식재료가 ${urgentItems.length}개 있습니다. 신속히 요리해 보세요!`
                : '모든 식재료가 아직 넉넉한 유효기간을 가지고 있습니다. 아주 좋은 살림이군요!'}
            </p>
          </div>

          {/* 구출 대기 식재료 가로 슬라이더 */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4.5 h-4.5 text-brand-coral" />
                구출 대기 식재료
              </h3>
              <button 
                onClick={() => onNavigateToTab('search')}
                className="text-xs font-semibold text-brand-green flex items-center hover:underline"
              >
                전체보기 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {urgentItems.length > 0 ? (
              <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                {urgentItems.map((item) => {
                  const dDay = getDDay(item.expiryDate);
                  const isExpired = dDay < 0;
                  return (
                    <div
                      key={item.id}
                      className="min-w-[135px] bg-white p-4.5 rounded-xl border border-brand-grey shadow-sm snap-start flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs text-gray-400 font-medium">{item.category}</span>
                        <h4 className="text-sm font-bold text-gray-800 mt-0.5 truncate">{item.name}</h4>
                      </div>
                      <div className="mt-4">
                        <span
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                            isExpired
                              ? 'bg-red-50 text-red-500'
                              : dDay === 0
                              ? 'bg-brand-coral/10 text-brand-coral'
                              : 'bg-brand-orange/10 text-brand-orange'
                          }`}
                        >
                          {isExpired ? '만료' : dDay === 0 ? '오늘까지' : `D-${dDay}`}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-2 font-medium">수량: {item.quantity}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-brand-grey/50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
                구출이 시급한 식재료가 없습니다. 😊
              </div>
            )}
          </div>

          {/* AI 레시피 유도 카드 */}
          {urgentItems.length > 0 && (
            <div className="bg-brand-green-light/60 p-5 rounded-2xl border border-brand-green/10 flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="text-sm font-extrabold text-brand-green mb-1">소비기한 임박 식재료 긴급 구출!</h4>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  가장 오래된 <strong>{urgentItems.slice(0, 2).map((item) => item.name).join(', ')}</strong> 재료들을 조합해 만들 수 있는 식비를 줄여주는 AI 맞춤 요리를 확인해보세요.
                </p>
              </div>
              <button
                onClick={() => onSelectRecipe(urgentItems.map((item) => item.name))}
                className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                임박 재료 구출 레시피 추천받기
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-fade-in text-left">
          {/* 기간 필터 스위치 탭 */}
          <div className="flex bg-brand-grey p-1 rounded-xl self-start">
            {(['weekly', 'monthly', 'yearly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPeriodFilter(mode)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                  periodFilter === mode
                    ? 'bg-white text-brand-green shadow-xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {mode === 'weekly' ? '주간 (7일)' : mode === 'monthly' ? '월간 (이번달)' : '연간 (올해)'}
              </button>
            ))}
          </div>
          
          {/* A. 이번 달 예산 게이지 카드 (클릭하여 편집할 수 있도록 커서 포인터 및 이벤트 바인딩) */}
          <div
            onClick={() => {
              setBudgetInput(budget.toString());
              setBudgetStartInput(budgetStartDate || '');
              setBudgetEndInput(budgetEndDate || '');
              setBudgetMemoInput(budgetMemo || '');
              setShowBudgetModal(true);
            }}
            className="bg-white p-5 rounded-2xl border border-brand-grey shadow-sm cursor-pointer hover:border-brand-green/30 hover:shadow-xs transition-all relative group"
          >
            <div className="absolute top-4 right-4 text-gray-300 group-hover:text-brand-green transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </div>
            
            <h3 className="text-xs font-semibold text-gray-400 tracking-wider mb-2">BUDGET PLAN ({periodFilter === 'weekly' ? '주간' : periodFilter === 'yearly' ? '연간' : '월간'} • 클릭하여 설정)</h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold text-gray-800">{periodBudgetLabel}</span>
              <span className="text-xs text-gray-500">
                <strong className="text-gray-800 font-extrabold">{periodExpensesSum.toLocaleString()}원</strong> / {periodBudget.toLocaleString()}원
              </span>
            </div>

            <div className="w-full bg-brand-grey h-3.5 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  expensePercentage >= 85 ? 'bg-brand-coral' : 'bg-brand-green'
                }`}
                style={{ width: `${expensePercentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>남은 예산: {Math.max(0, periodBudget - periodExpensesSum).toLocaleString()}원</span>
              <span className={`font-bold ${expensePercentage >= 85 ? 'text-brand-coral' : 'text-brand-green'}`}>
                {expensePercentage}% 사용
              </span>
            </div>

            {/* 예산 사용 계획 세부 요약 */}
            {(budgetStartDate || budgetEndDate || budgetMemo) && (
              <div className="mt-4 pt-3.5 border-t border-brand-grey text-[10px] text-gray-500 flex flex-col gap-1.5 font-bold">
                {(budgetStartDate || budgetEndDate) && (
                  <div className="flex items-center gap-1">
                    <span className="text-brand-green">📅 계획 기간:</span>
                    <span className="text-gray-700">
                      {budgetStartDate || '미지정'} ~ {budgetEndDate || '미지정'}
                    </span>
                  </div>
                )}
                {budgetMemo && (
                  <div className="flex items-start gap-1">
                    <span className="text-brand-green flex-shrink-0">📝 사용 계획:</span>
                    <span className="text-gray-700 font-medium italic">"{budgetMemo}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* B. 카테고리별 식비 소비 카드 (카테고리를 클릭하여 간편 지출 금액을 가산/수정할 수 있도록 고도화) */}
          <div className="bg-white p-5 rounded-2xl border border-brand-grey shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3.5 flex items-center gap-1.5">
              <Wallet className="w-4.5 h-4.5 text-brand-green" />
              카테고리별 식비 (클릭하여 추가)
            </h3>
            
            <div className="flex flex-col gap-3.5">
              {['마트 장보기', '외식', '배달', '기타'].map((cat) => {
                const amount = categoryExpenses[cat] || 0;
                const ratio = currentMonthExpenses ? Math.round((amount / currentMonthExpenses) * 100) : 0;
                return (
                  <div
                    key={cat}
                    onClick={() => {
                      setAddCategory(cat as any);
                      setAddTitle(`${cat} 추가 지출`);
                      setAddAmount('');
                      setShowAddExpenseModal(true);
                    }}
                    className="flex flex-col gap-1.5 cursor-pointer hover:bg-brand-grey/40 p-2 rounded-xl transition-all border border-transparent hover:border-brand-grey"
                  >
                    <div className="flex justify-between text-xs font-semibold text-gray-700 items-center">
                      <span className="flex items-center gap-1">
                        {cat}
                        <PlusCircle className="w-3.5 h-3.5 text-gray-300 hover:text-brand-green transition-colors" />
                      </span>
                      <span>
                        {amount.toLocaleString()}원 <span className="text-gray-400 font-normal">({ratio}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-brand-grey h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-green h-full rounded-full transition-all duration-300"
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* C. 신규 추가: 세부 지출 내역 리스트 (개별 항목 클릭하여 금액/카테고리 수정 및 삭제 연동) */}
          <div className="bg-white p-5 rounded-2xl border border-brand-grey shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3.5 flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5 text-brand-green" />
              최근 지출 내역 (클릭하여 편집)
            </h3>

            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => {
                    setSelectedExpense(exp);
                    setExpenseTitleInput(exp.title);
                    setExpenseAmountInput(exp.amount.toString());
                    setExpenseCategoryInput(exp.category);
                    setShowExpenseModal(true);
                  }}
                  className="bg-brand-grey/50 hover:bg-brand-grey p-3 rounded-xl flex items-center justify-between text-xs cursor-pointer border border-transparent hover:border-brand-green/10 transition-all"
                >
                  <div>
                    <div className="font-extrabold text-gray-800">{exp.title}</div>
                    <div className="text-[9px] text-gray-400 mt-1 font-medium">
                      {exp.date} | 분류: {exp.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-gray-700">{exp.amount.toLocaleString()}원</span>
                    <span className="text-[7px] text-brand-green font-bold block mt-0.5">수정하기</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 냉파 절약 시뮬레이터 */}
          <div className="bg-brand-green/5 border border-brand-green/10 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-green-light flex items-center justify-center text-brand-green flex-shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">냉장고 파먹기로 절약한 소중한 식비</div>
              <div className="text-lg font-extrabold text-brand-green mt-0.5">
                누적 +{totalSaved.toLocaleString()}원 절약
              </div>
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                외식 대신 냉장고 속 식재료를 버리지 않고 안전하게 요리해 먹은 환경 기여 금액 환산 결과입니다.
              </p>
            </div>
          </div>

          {/* 획득한 타이틀 훈장함 */}
          <div className="pb-8">
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-1.5 px-1">
              <Award className="w-4.5 h-4.5 text-brand-green" />
              내가 획득한 식비 타이틀
            </h3>
            {unlockedBadges.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {unlockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-white p-3.5 rounded-xl border border-brand-green/20 shadow-sm flex flex-col items-center text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-green"></div>
                    <span className="text-2xl mb-1.5">{badge.icon}</span>
                    <h4 className="text-xs font-extrabold text-gray-800 truncate w-full">{badge.name}</h4>
                    <span className="text-[9px] text-brand-green font-bold mt-1 bg-brand-green-light px-1.5 py-0.5 rounded-md">
                      획득완료
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-brand-grey/50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
                아직 획득한 타이틀이 없습니다. 식비를 아껴 칭호를 획득해 보세요! 🏅
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. 예산 수정 모달 팝업 */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs relative animate-fade-in shadow-xl text-left">
            <button
              onClick={() => setShowBudgetModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-brand-grey"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h4 className="text-sm font-extrabold text-gray-850 mb-3.5">식비 목표 예산 및 사용 계획 수정</h4>
            
            <form onSubmit={handleBudgetSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">목표 예산 금액 (원) *</label>
                <input
                  type="number"
                  required
                  placeholder="예: 300000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none font-bold text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">계획 시작일</label>
                  <input
                    type="date"
                    value={budgetStartInput}
                    onChange={(e) => setBudgetStartInput(e.target.value)}
                    className="w-full bg-brand-grey py-2 px-2 rounded-lg text-[10px] outline-none font-bold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">계획 종료일</label>
                  <input
                    type="date"
                    value={budgetEndInput}
                    onChange={(e) => setBudgetEndInput(e.target.value)}
                    className="w-full bg-brand-grey py-2 px-2 rounded-lg text-[10px] outline-none font-bold text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">식비 절약 계획 / 각오</label>
                <textarea
                  placeholder="예: 외식 최소화, 남은 재료 위주 냉장고 털기!"
                  value={budgetMemoInput}
                  onChange={(e) => setBudgetMemoInput(e.target.value)}
                  rows={2}
                  className="w-full bg-brand-grey py-2 px-3 rounded-lg text-xs outline-none font-medium text-gray-700 resize-none"
                />
              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="submit"
                  className="w-full bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  예산 사용 계획 저장
                </button>
                {onResetBudget && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('설정하신 예산 금액과 사용 기간 및 각오를 모두 초기화하시겠습니까?')) {
                        onResetBudget();
                        setBudgetInput('300000');
                        setBudgetStartInput('');
                        setBudgetEndInput('');
                        setBudgetMemoInput('');
                        setShowBudgetModal(false);
                      }
                    }}
                    className="w-full border border-gray-300 hover:bg-gray-50 text-gray-500 text-xs font-bold py-2.5 rounded-xl transition-colors text-center"
                  >
                    계획 초기화
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. 지출 내역 수정 및 카테고리 변경 모달 */}
      {showExpenseModal && selectedExpense && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs relative animate-fade-in shadow-xl text-left">
            <button
              onClick={() => setShowExpenseModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-brand-grey"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h4 className="text-sm font-extrabold text-gray-850 mb-3.5">지출 기록 편집 및 분류 변경</h4>
            
            <form onSubmit={handleExpenseEditSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">지출 품목명 *</label>
                <input
                  type="text"
                  required
                  value={expenseTitleInput}
                  onChange={(e) => setExpenseTitleInput(e.target.value)}
                  className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">지출 금액 (원) *</label>
                  <input
                    type="number"
                    required
                    value={expenseAmountInput}
                    onChange={(e) => setExpenseAmountInput(e.target.value)}
                    className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">카테고리</label>
                  <select
                    value={expenseCategoryInput}
                    onChange={(e) => setExpenseCategoryInput(e.target.value as any)}
                    className="w-full bg-brand-grey py-2.5 px-2 rounded-lg text-xs outline-none text-gray-700 font-semibold border-none appearance-none"
                  >
                    <option value="마트 장보기">마트 장보기</option>
                    <option value="외식">외식</option>
                    <option value="배달">배달</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleExpenseDelete(selectedExpense.id)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 border border-red-200/20"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 삭제
                </button>
                <button
                  type="submit"
                  className="flex-2 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm text-center"
                >
                  수정 내용 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. 카테고리별 간편 지출 신규 등록 모달 */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs relative animate-fade-in shadow-xl text-left">
            <button
              onClick={() => setShowAddExpenseModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-brand-grey"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h4 className="text-sm font-extrabold text-gray-850 mb-3.5">
              💸 [{addCategory}] 지출 추가
            </h4>
            
            <form onSubmit={handleAddExpenseSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">지출 내역명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 마트 야채 추가 구매, 중국집 외식"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">금액 (원) *</label>
                <input
                  type="number"
                  required
                  placeholder="금액을 입력하세요"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full bg-brand-grey py-2.5 px-3 rounded-lg text-xs outline-none text-gray-800 font-bold"
                />
              </div>

              <button
                type="submit"
                className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
              >
                지출 추가 등록
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
