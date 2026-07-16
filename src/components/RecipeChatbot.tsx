'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IngredientItem, Recipe, StorageUnit } from '../types';
import { Send, Bot, User, Bookmark, Sparkles, Check, AlertCircle } from 'lucide-react';

interface RecipeChatbotProps {
  items: IngredientItem[];
  storages: StorageUnit[];
  onSaveRecipe: (recipe: Recipe) => void;
  savedRecipes: Recipe[];
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  recipe?: Recipe;
}

export default function RecipeChatbot({
  items,
  storages,
  onSaveRecipe,
  savedRecipes,
}: RecipeChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 초기 챗봇 인사말
  useEffect(() => {
    const activeItems = items.length;
    const initialText = `안녕하세요! 저는 냉장고 속 식재료 구출을 도와드리는 🤖요리조리 레시피 요정입니다.

현재 냉장고에 총 ${activeItems}개의 식재료가 보관되어 있습니다. 
Groq Cloud AI와 실시간으로 통신하여 냉장고 안의 재료로 최고의 맞춤 레시피를 제안해 드립니다.

💡 예시: "남은 재료로 반찬 하나 추천해줘", "소비기한 임박한 재료 구출법 알려줘"`;

    setMessages([
      {
        id: 'msg_welcome',
        sender: 'bot',
        text: initialText,
        timestamp: new Date(),
      },
    ]);
  }, [items.length]);

  // 스크롤 제어
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // D-Day 계산 헬퍼
  const getDDay = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Groq API를 통해 실시간 AI 답변 및 레시피 객체 가져오기
  const callGroqAPI = async (userText: string, history: Message[]): Promise<{ text: string; recipe?: Recipe }> => {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!apiKey) {
      console.warn('NEXT_PUBLIC_GROQ_API_KEY가 정의되지 않았습니다. 로컬 시뮬레이션 모드로 응답합니다.');
      return fallbackLocalResponse(userText);
    }
    
    // 최근 5개의 대화 히스토리만 가공하여 Context 주입
    const formattedHistory = history
      .slice(-5)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      }));

    // 현재 식재료 목록 및 임박 상태 파싱
    const fridgeContext = items.map(it => {
      const dDay = getDDay(it.expiryDate);
      return `- ${it.name} (수량: ${it.quantity}, 소비기한: D-${dDay >= 0 ? dDay : '만료'})`;
    }).join('\n');

    const urgentItems = items.filter(it => {
      const dDay = getDDay(it.expiryDate);
      return dDay <= 3;
    });

    const urgentContext = urgentItems.map(it => {
      const dDay = getDDay(it.expiryDate);
      return `- ${it.name} (수량: ${it.quantity}, 소비기한: D-${dDay >= 0 ? dDay : '만료'})`;
    }).join('\n');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are a professional recipe helper bot named "요리조리 레시피 요정".
Your task is to suggest delicious custom recipes based on the user's remaining refrigerator items.

CRITICAL INSTRUCTIONS:
- If the user asks about expiring, urgent, or soon-to-be-expired items (keywords: '임박', '소비기한', '유통기한', '빨리 먹어야', '상하기 직전', '구출' 등), you MUST analyze the provided "Urgent Refrigerator Items" list first.
- Explicitly list the expiring soon items from that list in your "reply" content, and suggest a custom recipe that prioritizes using at least one of those urgent items.
- If there are no urgent items (D-Day <= 3 or Expired), kindly tell the user in Korean that all their items are currently safe and fresh, then suggest a recipe using normal active items.
- You must response ONLY in a valid JSON object matching exactly this schema:
{
  "reply": "A helpful response in Korean, answering their question and introducing the suggested recipe (1-3 sentences).",
  "recipe": {
    "name": "Name of the recommended recipe (e.g. '브로콜리 베이컨 볶음')",
    "ingredients": ["Ingredient 1 with portion size (e.g. '브로콜리 1송이')", "Ingredient 2 (e.g. '슬라이스 베이컨 3장')"],
    "instructions": ["Step 1 of cooking (in Korean)", "Step 2 of cooking", "Step 3 of cooking"],
    "savingsAmount": 6000 // Estimated savings in Won (number between 3000 and 10000)
  }
}
If the user's message is a greeting or does not request or require a cooking recipe, set the "recipe" property to null.
Do not output anything other than the JSON object. All text fields in the JSON must be in Korean.`
            },
            {
              role: 'system',
              content: `User's current active refrigerator items:\n${fridgeContext || 'None (Fridge is empty)'}`
            },
            {
              role: 'system',
              content: `Urgent Refrigerator Items (D-Day <= 3 or Expired):\n${urgentContext || 'None (All items are fresh and safe)'}`
            },
            ...formattedHistory,
            {
              role: 'user',
              content: userText
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API HTTP Error: ${response.status}`);
      }

      const json = await response.json();
      const choiceContent = json.choices?.[0]?.message?.content;
      
      if (!choiceContent) {
        throw new Error('No content returned from Groq');
      }

      const result = JSON.parse(choiceContent);
      return {
        text: result.reply,
        recipe: result.recipe || undefined,
      };

    } catch (err) {
      console.error('Groq API 호출 실패, 로컬 폴백 기동:', err);
      // API 실패 시 부드럽게 대처하는 로컬 룰베이스 폴백
      return fallbackLocalResponse(userText);
    }
  };

  // 로컬 폴백 응답 발전형
  const fallbackLocalResponse = (userText: string): { text: string; recipe?: Recipe } => {
    const input = userText.toLowerCase();
    const isAskingUrgent = input.includes('임박') || input.includes('소비기한') || input.includes('유통기한') || input.includes('상하') || input.includes('빨리 먹') || input.includes('구출');

    // 1) 소비기한 임박 식재료를 조회하는 경우
    if (isAskingUrgent) {
      const urgentItems = items.filter(it => {
        const dDay = getDDay(it.expiryDate);
        return dDay <= 3;
      });

      if (urgentItems.length > 0) {
        const itemNames = urgentItems.map(it => it.name.split(' ')[0]); // "양파 3개" -> "양파"
        const title = `${itemNames.join(', ')} 구출 모둠전`;
        const recipeIngredients = [
          ...urgentItems.map(it => `${it.name} (${it.quantity})`),
          '부침가루 1컵',
          '찬물 1/2컵',
          '식용유 약간'
        ];

        return {
          text: `💡 (💡 냉장고 데이터 실시간 분석) 현재 냉장고에 소비기한이 임박하거나 지난 식재료(${itemNames.join(', ')})가 확인되어, 이를 빠르게 소진할 수 있는 [${title}] 레시피를 제안해 드립니다. 상하기 전에 어서 조리해 보세요!`,
          recipe: {
            id: `local_rec_urg_${Date.now()}`,
            name: title,
            ingredients: recipeIngredients,
            instructions: [
              '소비기한이 임박한 식재료들을 깨끗이 씻은 후 채썰어 준비합니다.',
              '볼에 부침가루 1컵과 찬물 1/2컵을 섞어 부드럽게 반죽을 만듭니다.',
              '반죽에 썰어둔 야채 및 임박 재료들을 넣고 가볍게 버무립니다.',
              '달궈진 팬에 식용유를 넉넉히 두르고 앞뒤로 노릇하고 바삭하게 구워내 완성합니다.'
            ],
            savingsAmount: 6000,
          }
        };
      } else {
        return {
          text: `💡 (💡 냉장고 데이터 실시간 분석) 확인해 보니 현재 냉장고에는 소비기한이 3일 이하로 남은 임박 식품이 전혀 없이 신선하게 잘 유지되고 있습니다! 대신 보관 중인 재료로 만들기 편한 별미 비빔면을 추천해 드립니다.`,
          recipe: {
            id: `local_rec_fresh_${Date.now()}`,
            name: '새콤달콤 비빔소면',
            ingredients: ['소면 1인분', '초고추장 2스푼', '오이 1/4개', '통깨 약간'],
            instructions: [
              '끓는 물에 소면을 삶은 뒤 곧바로 찬물에 여러 번 헹궈 물기를 뺍니다.',
              '그릇에 면을 담고 초고추장 2스푼을 가볍게 넣어 비빕니다.',
              '고명으로 신선한 오이채를 송송 썰어 얹고 통깨를 뿌려 완성합니다.'
            ],
            savingsAmount: 3000,
          }
        };
      }
    }

    // 2) 특정 식품명 대조 매칭
    const matchedItem = items.find(it => {
      const cleanName = it.name.split(' ')[0].replace(/[0-9]/g, '').trim(); // 숫자 제거
      return cleanName.length >= 2 && input.includes(cleanName);
    });

    if (matchedItem) {
      const cleanName = matchedItem.name.split(' ')[0];
      const title = `초간단 ${cleanName} 볶음`;
      return {
        text: `💡 (💡 냉장고 데이터 실시간 분석) 사용 중이신 냉장고에서 [${matchedItem.name}] 재료가 조회되어, 이를 활용해 빠르게 만들 수 있는 [${title}] 레시피를 준비했습니다.`,
        recipe: {
          id: `local_rec_match_${Date.now()}`,
          name: title,
          ingredients: [`${matchedItem.name} (${matchedItem.quantity})`, '진간장 1스푼', '참기름 1/2스푼', '식용유'],
          instructions: [
            `${cleanName}을(를) 깨끗이 다듬어 한 입 크기로 썰어 줍니다.`,
            '팬에 식용유를 한 바퀴 두르고 썰어둔 재료를 넣어 중불에서 고루 볶습니다.',
            '간장 1스푼으로 간을 맞추고, 불을 끈 뒤 참기름을 가볍게 두르고 그릇에 담아 완성합니다.'
          ],
          savingsAmount: 4000,
        }
      };
    }

    // 3) 기본 볶음밥 폴백
    return {
      text: `💡 (💡 냉장고 데이터 실시간 분석) 냉장고 안의 기본 식재료들을 털어 만들 수 있는 초간단 계란 야채 볶음밥 레시피를 제안해 드립니다.`,
      recipe: {
        id: `local_rec_r_${Date.now()}`,
        name: '초간단 계란 야채 볶음밥',
        ingredients: ['찬밥 1공기', '달걀 1알', '대파 1/4대', '소금 한 꼬집'],
        instructions: [
          '대파를 쫑쫑 썰어 식용유 2스푼을 두른 팬에 볶아 파기름을 냅니다.',
          '달걀 1알을 풀어 스크램블을 만들어 밥과 함께 볶습니다.',
          '소금이나 굴소스 1/2스푼으로 간을 맞추어 고슬하게 볶아 마무리합니다.'
        ],
        savingsAmount: 5000,
      }
    };
  };

  // 메시지 전송
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Groq API 호출 수행
    const response = await callGroqAPI(userText, messages);

    const botMessage: Message = {
      id: `msg_${Date.now() + 1}`,
      sender: 'bot',
      text: response.text,
      timestamp: new Date(),
      recipe: response.recipe,
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  // 레시피 저장
  const handleSaveClick = (recipe: Recipe) => {
    const isAlreadySaved = savedRecipes.some(r => r.name === recipe.name);
    if (isAlreadySaved) {
      alert('이미 저장된 레시피입니다.');
      return;
    }
    onSaveRecipe(recipe);
  };

  return (
    <div className="flex flex-col h-full bg-[#FCFDFD] text-left">
      {/* 챗봇 헤더 */}
      <div className="pt-6 pb-4 px-4 bg-white border-b border-brand-grey flex items-center justify-between z-30 flex-shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white relative">
            <Bot className="w-4.5 h-4.5" />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
              요리조리 레시피 요정
              <span className="text-[8px] bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded font-black">
                Groq LLM
              </span>
            </h3>
            <p className="text-[9px] text-gray-400 font-bold mt-0.5">내 냉장고 잔여 재료 기반 맞춤형 조리법 추천</p>
          </div>
        </div>
      </div>

      {/* 대화 내역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3.5 text-xs leading-relaxed whitespace-pre-wrap font-medium shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-brand-green text-white rounded-tr-none'
                  : 'bg-white text-gray-700 border border-brand-grey rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>

            {/* 챗봇이 추천한 레시피 저장용 카드 UI */}
            {msg.recipe && (
              <div className="mt-2.5 w-full max-w-[85%] bg-white rounded-2xl border border-brand-green/20 p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-brand-green bg-brand-green-light px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-brand-green animate-pulse" />
                    AI 추천 구출 요리
                  </span>
                  <span className="text-[9px] text-brand-coral font-bold bg-brand-coral/5 px-2 py-0.5 rounded-md">
                    절약액: +{msg.recipe.savingsAmount.toLocaleString()}원
                  </span>
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-gray-800">{msg.recipe.name}</h4>
                  <p className="text-[9px] text-gray-400 mt-1 font-bold">
                    재료: {msg.recipe.ingredients.join(', ')}
                  </p>
                </div>
                <div className="bg-brand-grey/50 p-2.5 rounded-lg text-[9px] text-gray-600 flex flex-col gap-1 font-medium">
                  {msg.recipe.instructions.map((step, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <span className="text-brand-green font-bold flex-shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                {/* 저장 버튼 */}
                <button
                  onClick={() => handleSaveClick(msg.recipe!)}
                  disabled={savedRecipes.some(r => r.name === msg.recipe!.name)}
                  className={`w-full py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all active:scale-97 ${
                    savedRecipes.some(r => r.name === msg.recipe!.name)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-brand-green hover:bg-brand-green-hover text-white shadow-xs'
                  }`}
                >
                  {savedRecipes.some(r => r.name === msg.recipe!.name) ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>레시피 저장 완료</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>이 레시피 보관함에 저장하기</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <span className="text-[8px] text-gray-300 mt-1 px-1 font-bold">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {/* 타이핑 중 애니메이션 */}
        {isTyping && (
          <div className="flex items-center gap-1 bg-white border border-brand-grey px-4.5 py-3 rounded-2xl rounded-tl-none self-start shadow-xs">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 대화 입력 바 */}
      <form
        onSubmit={handleSendMessage}
        className="p-3.5 bg-white border-t border-brand-grey flex items-center gap-2 flex-shrink-0 z-30 pb-6"
      >
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={isTyping ? "AI가 조리법을 작명하는 중입니다..." : "요리조리 AI에게 질문을 건네보세요..."}
          disabled={isTyping}
          className="flex-1 bg-brand-grey/70 py-3 px-4 rounded-2xl text-xs outline-none text-gray-800 font-medium placeholder-gray-400 focus:bg-brand-grey transition-all disabled:opacity-75"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          className="w-10 h-10 rounded-full bg-brand-green hover:bg-brand-green-hover text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
