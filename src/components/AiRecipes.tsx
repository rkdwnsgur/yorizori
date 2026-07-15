'use client';

import React, { useState, useEffect } from 'react';
import { IngredientItem, Recipe } from '../types';
import { Sparkles, Bookmark, ChevronRight, X, AlertTriangle, ArrowRight, Lightbulb } from 'lucide-react';

interface AiRecipesProps {
  items: IngredientItem[];
  savedRecipes: Recipe[];
  onSaveRecipe: (recipe: Recipe) => void;
  onUnsaveRecipe: (id: string) => void;
  onRequestRecipeIngredients: string[] | null;
  onClearRequestIngredients: () => void;
}

export default function AiRecipes({
  items,
  savedRecipes,
  onSaveRecipe,
  onUnsaveRecipe,
  onRequestRecipeIngredients,
  onClearRequestIngredients,
}: AiRecipesProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRecipeDetails, setSelectedRecipeDetails] = useState<Recipe | null>(null);

  // 소비기한 D-3 이하 재료 추출
  const getDDay = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const urgentItems = items.filter((item) => getDDay(item.expiryDate) <= 3);

  // 외부(홈 대시보드 긴급 추천 버튼 등)에서 특정 재료 요리 추천을 요청한 경우 자동 선택
  useEffect(() => {
    if (onRequestRecipeIngredients) {
      setSelectedIngredients(onRequestRecipeIngredients);
      // 바로 생성 단계로 넘어감
      generateRecipesMock(onRequestRecipeIngredients);
      onClearRequestIngredients();
    }
  }, [onRequestRecipeIngredients, onClearRequestIngredients]);

  // 재료 선택 토글
  const toggleIngredientSelection = (name: string) => {
    if (selectedIngredients.includes(name)) {
      setSelectedIngredients(selectedIngredients.filter((i) => i !== name));
    } else {
      setSelectedIngredients([...selectedIngredients, name]);
    }
  };

  // 모킹된 레시피 데이터베이스
  const allMockedRecipes: Recipe[] = [
    {
      id: 'rec_1',
      name: '대파 듬뿍 대패삼겹살 볶음',
      ingredients: ['대파 1단', '한돈 삼겹살 400g'],
      instructions: [
        '대파는 5cm 크기로 큼직하게 썰고, 마늘은 편 썰어 준비합니다.',
        '팬을 달구고 대패삼겹살을 넣어 겉면이 바삭해질 때까지 볶습니다.',
        '고기 기름이 나오면 준비한 대파와 다진 마늘을 넣고 센 불에 빠르게 볶습니다.',
        '진간장 1큰술, 맛술 1큰술, 굴소스 0.5큰술을 섞어 소스를 붓고 대파가 숨이 죽을 때까지 볶아 완성합니다.'
      ],
      savingsAmount: 18000,
    },
    {
      id: 'rec_2',
      name: '신선란 계란말이와 구운 대파',
      ingredients: ['신선란 10구', '대파 1단'],
      instructions: [
        '계란 4알을 깨서 소금 한 꼬집과 맛술 0.5큰술을 넣고 잘 풀어줍니다.',
        '대파의 흰 부분은 곱게 다져 계란물에 섞고, 파란 부분은 고명용으로 남겨둡니다.',
        '달군 팬에 식용유를 얇게 두르고 계란물을 조금씩 부어가며 돌돌 말아줍니다.',
        '계란말이가 완성되면 한 김 식힌 뒤 먹기 좋은 크기로 썰어 냅니다.'
      ],
      savingsAmount: 9500,
    },
    {
      id: 'rec_3',
      name: '우유 달걀찜 (초간편 푸딩 식감)',
      ingredients: ['매일 우유 900ml', '신선란 10구'],
      instructions: [
        '계란 2알과 우유 100ml, 물 50ml를 넣고 거품기로 골고루 저어줍니다.',
        '체에 두 번 걸러 몽글몽글한 알끈을 깨끗이 제거합니다.',
        '그릇에 계란물을 담고 랩을 씌운 뒤, 구멍을 3~4개 뚫어 전자레인지에 3분 30초 돌려줍니다.',
        '참기름 한 방울과 통깨를 얹어 부드러운 아침 식사 대용으로 즐깁니다.'
      ],
      savingsAmount: 6000,
    },
    {
      id: 'rec_4',
      name: '아보카도 계란 간장비빔밥',
      ingredients: ['신선란 10구', '아보카도'],
      instructions: [
        '잘 익은 아보카도를 반으로 갈라 씨를 빼고 얇게 슬라이스합니다.',
        '팬에 식용유를 두르고 계란 프라이를 반숙으로 부쳐 줍니다.',
        '따뜻한 밥 위에 아보카도와 계란 프라이를 얹고, 진간장 1큰술, 참기름 1큰술을 올립니다.',
        '기호에 따라 조미김을 부수어 얹고 슥슥 비벼 먹습니다.'
      ],
      savingsAmount: 12000,
    },
  ];

  // 레시피 생성 모킹 동작
  const generateRecipesMock = (ingredients: string[]) => {
    setIsGenerating(true);
    setRecommendedRecipes([]);

    setTimeout(() => {
      // 선택된 재료 중 적어도 하나라도 겹치는 레시피 필터링
      const matches = allMockedRecipes.filter((recipe) => {
        return recipe.ingredients.some((reqIng) => {
          // 이름 매칭 (예: '대파 1단'은 '대파'를 포함하므로 매칭)
          return ingredients.some((selected) => {
            const cleanReq = reqIng.replace(/[^가-힣a-zA-Z]/g, '');
            const cleanSel = selected.replace(/[^가-힣a-zA-Z]/g, '');
            return cleanReq.includes(cleanSel) || cleanSel.includes(cleanReq);
          });
        });
      });

      // 만약 매칭되는 게 전혀 없다면 기본 추천 2개 노출
      if (matches.length === 0) {
        setRecommendedRecipes(allMockedRecipes.slice(0, 2));
      } else {
        setRecommendedRecipes(matches);
      }
      setIsGenerating(false);
    }, 1200); // 1.2초 대기 연출
  };

  const handleGenerateClick = () => {
    if (selectedIngredients.length === 0) return;
    generateRecipesMock(selectedIngredients);
  };

  // 저장 여부 확인
  const isRecipeSaved = (id: string) => {
    return savedRecipes.some((r) => r.id === id);
  };

  const handleBookmarkToggle = (recipe: Recipe) => {
    if (isRecipeSaved(recipe.id)) {
      onUnsaveRecipe(recipe.id);
    } else {
      onSaveRecipe(recipe);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 px-4 pt-4 bg-[#FCFDFD]">
      {/* 1. 재료 선택 헤더 */}
      <div className="mb-5 bg-white p-4.5 rounded-2xl border border-brand-grey shadow-sm">
        <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-4.5 h-4.5 text-brand-green" />
          구출할 재료 조합하기
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-4">
          냉장고 속 재료를 선택하면 AI가 최적의 조합 요리를 짜줍니다. (소비기한이 짧은 재료 우선 선택 권장)
        </p>

        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2.5 max-h-[160px] overflow-y-auto pr-1">
            {items.map((item) => {
              const dDay = getDDay(item.expiryDate);
              const isUrgent = dDay <= 3;
              const isSelected = selectedIngredients.includes(item.name);

              return (
                <button
                  key={item.id}
                  onClick={() => toggleIngredientSelection(item.name)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-brand-green text-white border-brand-green shadow-sm'
                      : 'bg-white text-gray-700 border-brand-grey hover:border-gray-300'
                  }`}
                >
                  {isUrgent && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-coral animate-pulse"></span>
                  )}
                  <span>{item.name}</span>
                  {isUrgent && !isSelected && (
                    <span className="text-[9px] text-brand-coral font-extrabold">D-{dDay}</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-brand-grey/50 border border-dashed border-gray-200 rounded-xl p-5 text-center text-gray-400 text-xs">
            냉장고에 등록된 식재료가 없습니다. 장보기 영수증을 먼저 등록해 주세요. 🥦
          </div>
        )}

        <button
          onClick={handleGenerateClick}
          disabled={selectedIngredients.length === 0 || isGenerating}
          className="w-full bg-brand-green hover:bg-brand-green-hover disabled:bg-gray-200 text-white text-xs font-bold py-3.5 rounded-xl mt-4 transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          {isGenerating ? (
            <>
              <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              최적 레시피 연산 중...
            </>
          ) : (
            <>
              AI 맞춤형 구출 요리 설계하기
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* 2. 생성된 추천 결과 */}
      <div className="flex-1">
        {recommendedRecipes.length > 0 ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h4 className="text-xs font-bold text-gray-400 tracking-wider px-1">
              AI 파먹기 매칭 결과 ({recommendedRecipes.length}개)
            </h4>
            
            {recommendedRecipes.map((recipe) => {
              const isSaved = isRecipeSaved(recipe.id);
              return (
                <div
                  key={recipe.id}
                  onClick={() => setSelectedRecipeDetails(recipe)}
                  className="bg-white p-5 rounded-2xl border border-brand-grey shadow-sm hover:border-brand-green/20 transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-green"></div>
                  
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-800 leading-tight group-hover:text-brand-green transition-colors">
                        {recipe.name}
                      </h4>
                      <div className="text-[10px] text-gray-400 mt-1 font-medium">
                        사용 재료: {recipe.ingredients.join(', ')}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmarkToggle(recipe);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSaved ? 'text-brand-green' : 'text-gray-300 hover:text-gray-500'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="mt-5 pt-3 border-t border-brand-grey flex items-center justify-between text-xs pl-2">
                    <span className="text-gray-400 font-medium flex items-center gap-1">
                      <Lightbulb className="w-4 h-4 text-brand-orange" />
                      외식비 대비 식비 절약액
                    </span>
                    <span className="font-extrabold text-brand-green">
                      +{recipe.savingsAmount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !isGenerating && (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 text-xs border border-dashed border-brand-grey rounded-2xl mt-4">
              <span className="text-2xl mb-2">🍽️</span>
              <p>구출할 재료들을 위에서 고른 뒤 버튼을 눌러보세요.</p>
              <p className="text-[10px] text-gray-300 mt-0.5">선택된 재료를 기반으로 즉석 요리를 기획합니다.</p>
            </div>
          )
        )}
      </div>

      {/* 3. 상세 레시피 팝업 모달 */}
      {selectedRecipeDetails && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative animate-fade-in shadow-xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRecipeDetails(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-brand-grey"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-extrabold text-gray-800 mb-1">{selectedRecipeDetails.name}</h4>
            <div className="text-[10px] text-brand-green font-bold bg-brand-green-light px-2 py-0.5 rounded inline-block">
              예상 식비 절약액: +{selectedRecipeDetails.savingsAmount.toLocaleString()}원
            </div>

            <div className="mt-4">
              <h5 className="text-xs font-bold text-gray-600 mb-1.5">필수 재료</h5>
              <p className="text-xs text-gray-500 font-medium bg-brand-grey p-2.5 rounded-lg leading-relaxed">
                {selectedRecipeDetails.ingredients.join(', ')}
              </p>
            </div>

            <div className="mt-4">
              <h5 className="text-xs font-bold text-gray-600 mb-1.5">조리 방법</h5>
              <ol className="text-xs text-gray-600 list-decimal pl-4.5 flex flex-col gap-2 leading-relaxed">
                {selectedRecipeDetails.instructions.map((step, idx) => (
                  <li key={idx} className="pl-1">{step}</li>
                ))}
              </ol>
            </div>
            
            <button
              onClick={() => {
                handleBookmarkToggle(selectedRecipeDetails);
                setSelectedRecipeDetails(null);
              }}
              className={`w-full text-xs font-bold py-3.5 rounded-xl mt-6 transition-colors shadow-sm flex items-center justify-center gap-1.5 ${
                isRecipeSaved(selectedRecipeDetails.id)
                  ? 'bg-brand-grey text-gray-600 hover:bg-gray-200'
                  : 'bg-brand-green hover:bg-brand-green-hover text-white'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              {isRecipeSaved(selectedRecipeDetails.id) ? '레시피 저장 취소' : '이 레시피 북마크에 보관'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
