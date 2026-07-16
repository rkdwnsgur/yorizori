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

  // 인터넷 실존 검증 레시피 데이터베이스 (이상한 가짜 조리법 추천 방지 및 출처 명기)
  const VERIFIED_RECIPE_DB = [
    {
      name: '백종원 감자짜글이',
      source: '백종원 요리비책',
      requiredIngredients: ['감자', '통조림햄', '스팸'],
      allIngredients: ['감자 2개', '통조림햄(스팸) 1캔', '양파 1/2개', '대파 1/2대', '고추장 1스푼', '고춧가루 1스푼', '진간장 4스푼', '설탕 1스푼', '다진 마늘 1스푼'],
      instructions: [
        '감자는 굵게 채 썰고, 양파도 채 썰고 대파는 송송 썰어 준비합니다.',
        '통조림햄은 비닐봉지에 넣어 손으로 으깨어 뭉개 줍니다.',
        '냄비에 썰어둔 감자, 양파, 으깬 햄을 넣고 물 2컵을 붓습니다.',
        '고추장, 고춧가루, 진간장, 설탕, 다진 마늘을 넣고 양념을 고루 풉니다.',
        '국물이 졸아들 때까지 끓이다가 대파를 넣고 한소끔 더 끓여 완성합니다.'
      ],
      savingsAmount: 8500
    },
    {
      name: '백종원 양파 덮밥',
      source: '만개의레시피',
      requiredIngredients: ['양파', '달걀', '계란'],
      allIngredients: ['양파 1개', '달걀 2개', '대파 1/2대', '진간장 2스푼', '설탕 1스푼', '맛술 2스푼', '물 3스푼'],
      instructions: [
        '양파는 얇게 채 썰고 대파는 송송 썰어 준비합니다.',
        '팬에 양념장 재료(진간장, 설탕, 맛술, 물)를 모두 넣고 끓입니다.',
        '양념이 끓어오르면 채 썬 양파를 넣고 중불에서 투명해질 때까지 끓입니다.',
        '달걀 2개를 대충 풀어 끓고 있는 양파 위에 둘러 넣습니다.',
        '뚜껑을 덮어 달걀이 반숙으로 익으면 밥 위에 얹어 덮밥으로 즐깁니다.'
      ],
      savingsAmount: 4500
    },
    {
      name: '백종원 달걀국',
      source: '백종원 요리비책',
      requiredIngredients: ['달걀', '계란', '대파'],
      allIngredients: ['달걀 2알', '대파 1/2대', '국간장 1스푼', '다진 마늘 1/2스푼', '소금 약간', '후추 약간'],
      instructions: [
        '대파는 얇게 송송 썰어 두고 달걀은 그릇에 곱게 풀어 둡니다.',
        '냄비에 물 3~4컵을 붓고 끓이다가 다진 마늘과 국간장을 넣어 줍니다.',
        '물이 끓어오르면 풀어둔 달걀물을 가장자리부터 빙 둘러서 부어 줍니다.',
        '달걀물이 몽글몽글 떠오르면 썰어둔 대파를 넣고 소금으로 부족한 간을 맞춘 뒤 후추를 뿌려 완성합니다.'
      ],
      savingsAmount: 3500
    },
    {
      name: '백종원 김치볶음밥',
      source: '백종원 요리비책',
      requiredIngredients: ['김치', '대파'],
      allIngredients: ['신김치 1컵', '대파 1/2대', '식용유 2스푼', '진간장 1스푼', '고춧가루 1/2스푼', '설탕 1/2스푼', '밥 1공기', '달걀 1알'],
      instructions: [
        '신김치는 잘게 가위로 썰고 대파는 송송 썰어 준비합니다.',
        '팬에 식용유를 두르고 대파를 볶아 향긋한 파기름을 냅니다.',
        '파기름이 나오면 썰어둔 김치와 설탕, 고춧가루를 넣어 달달 볶습니다.',
        '김치가 숨이 죽으면 간장 1스푼을 팬 가장자리에 태우듯 눌려 풍미를 더한 뒤 고루 섞어줍니다.',
        '불을 끄고 찬밥을 넣어 비빈 뒤, 다시 약불을 켜서 고슬고슬하게 볶고 계란프라이를 얹어 냅니다.'
      ],
      savingsAmount: 5000
    },
    {
      name: '백종원 당근전',
      source: '만개의레시피',
      requiredIngredients: ['당근'],
      allIngredients: ['당근 1개', '부침가루 1/2컵', '소금 1/2티스푼', '물 1/3컵', '식용유'],
      instructions: [
        '당근은 깨끗이 씻어 필러로 껍질을 벗긴 뒤 얇게 채 썰어 줍니다.',
        '볼에 채 썬 당근과 소금을 넣어 가볍게 버무려 절입니다.',
        '당근에 부침가루와 물을 조금씩 부어가며 가볍게 엉기는 정도의 반죽을 만듭니다.',
        '팬에 식용유를 두르고 달군 후 반죽을 얇게 펴서 앞뒤로 바삭바삭하게 지져내어 맛있는 당근전을 완성합니다.'
      ],
      savingsAmount: 4000
    },
    {
      name: '백종원 두부조림',
      source: '백종원 요리비책',
      requiredIngredients: ['두부', '대파'],
      allIngredients: ['두부 1모', '대파 1/2대', '진간장 4스푼', '고춧가루 1스푼', '설탕 1/2스푼', '다진 마늘 1/2스푼', '들기름 1스푼', '물 1/2컵'],
      instructions: [
        '두부는 한 입 크기 적당한 두께로 썰고 대파는 송송 썹니다.',
        '넓적한 냄비나 팬에 썰어둔 두부를 가지런히 깝니다.',
        '간장, 고춧가루, 설탕, 마늘, 물을 섞어 양념장을 만들어 두부 위에 골고루 부어 줍니다.',
        '조림 국물이 반으로 줄어들 때까지 중불에서 졸이다가 대파와 들기름을 끼얹어 마무리합니다.'
      ],
      savingsAmount: 5500
    },
    {
      name: '백종원 오이무침',
      source: '백종원 요리비책',
      requiredIngredients: ['오이'],
      allIngredients: ['오이 1개', '양파 1/4개', '고추장 1스푼', '고춧가루 1스푼', '진간장 1스푼', '설탕 1스푼', '식초 2스푼', '다진 마늘 1/2스푼', '통깨 약간'],
      instructions: [
        '오이를 깨끗이 씻어 한입 크기로 적당한 두께로 썰어 줍니다.',
        '양파는 가볍게 채 썰어 둡니다.',
        '볼에 고추장, 고춧가루, 진간장, 설탕, 식초, 다진 마늘을 넣고 잘 섞어 양념장을 만듭니다.',
        '준비한 오이와 양파를 넣고 양념에 골고루 조물조물 무쳐 냅니다.',
        '마지막에 통깨를 뿌려 완성합니다.'
      ],
      savingsAmount: 3000
    },
    {
      name: '백종원 어묵볶음',
      source: '백종원 요리비책',
      requiredIngredients: ['어묵', '오뎅'],
      allIngredients: ['사각어묵 4장', '양파 1/2개', '대파 1/2대', '진간장 2스푼', '설탕 1/2스푼', '다진 마늘 1/2스푼', '물 3스푼', '참기름 1스푼', '통깨'],
      instructions: [
        '어묵은 먹기 좋은 크기로 썰고 양파는 채 썰고 대파는 어슷 썹니다.',
        '팬에 식용유를 두르고 다진 마늘과 대파를 넣어 향을 냅니다.',
        '어묵과 양파를 넣고 가볍게 볶아 줍니다.',
        '진간장, 설탕, 물을 섞어 부어 양념이 고루 배도록 졸이듯 볶습니다.',
        '불을 끈 후 참기름과 통깨를 둘러 볶아 마무리합니다.'
      ],
      savingsAmount: 4000
    }
  ];

  // 로컬 폴백 응답 발전형 (100% 실존하는 인터넷 검증 레시피 연동)
  const fallbackLocalResponse = (userText: string): { text: string; recipe?: Recipe } => {
    const input = userText.toLowerCase();
    const isAskingUrgent = input.includes('임박') || input.includes('소비기한') || input.includes('유통기한') || input.includes('상하') || input.includes('빨리 먹') || input.includes('구출');

    // 1. 냉장고 식재료 현황 파악
    const userIngredients = items.map(it => it.name.split(' ')[0].replace(/[0-9]/g, '').trim()); // "양파 3개" -> "양파"
    const urgentItems = items.filter(it => getDDay(it.expiryDate) <= 3);
    const urgentNames = urgentItems.map(it => it.name.split(' ')[0].replace(/[0-9]/g, '').trim());

    // ----------------------------------------------------
    // [1순위] 사용자의 구체적인 특정 식재료 질문 매칭
    // ----------------------------------------------------
    const targetIngredients = ['오이', '감자', '양파', '달걀', '계란', '대파', '김치', '당근', '두부', '어묵', '오뎅', '스팸', '햄'];
    const detectedIngredient = targetIngredients.find(ing => input.includes(ing));

    if (detectedIngredient) {
      const matchedRecipe = VERIFIED_RECIPE_DB.find(recipe =>
        recipe.requiredIngredients.some(req => detectedIngredient.includes(req.toLowerCase()) || req.toLowerCase().includes(detectedIngredient))
      );

      if (matchedRecipe) {
        return {
          text: `💡 말씀하신 [${detectedIngredient}] 재료가 포함된 실존 레시피 [${matchedRecipe.name}]를 안내해 드립니다! 맛있게 요리해 보세요. (출처: ${matchedRecipe.source})`,
          recipe: {
            id: `local_rec_v_${Date.now()}`,
            name: matchedRecipe.name,
            ingredients: matchedRecipe.allIngredients,
            instructions: matchedRecipe.instructions,
            savingsAmount: matchedRecipe.savingsAmount,
          }
        };
      } else {
        return {
          text: `💡 현재 요리조리 레시피 요정 사전에 [${detectedIngredient}] 관련 검증된 레시피가 등록되어 있지 않습니다. 대신 냉장고에 보관 중이신 다른 재료(양파, 대파 등)로 맛있는 백종원 레시피를 찾아드릴까요?`
        };
      }
    }

    // ----------------------------------------------------
    // [2순위] 소비기한 임박 재료 사용 레시피 필터링
    // ----------------------------------------------------
    if (isAskingUrgent && urgentItems.length > 0) {
      const matchedRecipe = VERIFIED_RECIPE_DB.find(recipe => 
        recipe.requiredIngredients.some(req => urgentNames.some(uName => uName.includes(req)))
      );

      if (matchedRecipe) {
        return {
          text: `💡 현재 냉장고에 소비기한이 임박한 식재료(${urgentNames.join(', ')})가 감지되어, 이를 최우선으로 소진할 수 있는 [${matchedRecipe.name}] 레시피를 제안해 드립니다. (출처: ${matchedRecipe.source})`,
          recipe: {
            id: `local_rec_v_${Date.now()}`,
            name: matchedRecipe.name,
            ingredients: matchedRecipe.allIngredients,
            instructions: matchedRecipe.instructions,
            savingsAmount: matchedRecipe.savingsAmount,
          }
        };
      }
    }

    // ----------------------------------------------------
    // [3순위] 일반 매칭 (냉장고 보유 재료 중 매칭)
    // ----------------------------------------------------
    const holdMatchedRecipe = VERIFIED_RECIPE_DB.find(recipe =>
      recipe.requiredIngredients.some(req => userIngredients.some(uName => uName.includes(req)))
    );

    if (holdMatchedRecipe) {
      return {
        text: `💡 냉장고에 보관 중이신 재료를 기반으로 구성한 [${holdMatchedRecipe.name}] 레시피를 제안해 드립니다. (출처: ${holdMatchedRecipe.source})`,
        recipe: {
          id: `local_rec_v_${Date.now()}`,
          name: holdMatchedRecipe.name,
          ingredients: holdMatchedRecipe.allIngredients,
          instructions: holdMatchedRecipe.instructions,
          savingsAmount: holdMatchedRecipe.savingsAmount,
        }
      };
    }

    // ----------------------------------------------------
    // [4순위] 기본 실존 레시피 폴백 (백종원 김치볶음밥)
    // ----------------------------------------------------
    const defaultRecipe = VERIFIED_RECIPE_DB[3]; // 백종원 김치볶음밥
    return {
      text: `💡 냉장고의 잔여 식재료들을 효율적으로 소비하기 좋은 대중적인 인기 요리인 [${defaultRecipe.name}] 레시피입니다. (출처: ${defaultRecipe.source})`,
      recipe: {
        id: `local_rec_v_${Date.now()}`,
        name: defaultRecipe.name,
        ingredients: defaultRecipe.allIngredients,
        instructions: defaultRecipe.instructions,
        savingsAmount: defaultRecipe.savingsAmount,
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
