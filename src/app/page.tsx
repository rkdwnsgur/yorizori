'use client';

import React, { useState, useEffect } from 'react';
import { IngredientItem, ExpenseRecord, Recipe, BadgeTitle, StorageUnit } from '../types';
import Splash from '../components/Splash';
import HomeDashboard from '../components/HomeDashboard';
import SearchRegister from '../components/SearchRegister';
import AiRecipes from '../components/AiRecipes';
import Store from '../components/Store';
import MyPage from '../components/MyPage';
import Checkout from '../components/Checkout';
import AuthOnboarding from '../components/AuthOnboarding'; // 신규 인증 컴포넌트 임포트
import Notifications, { AppNotification as NotifType } from '../components/Notifications';
import { supabase } from '../utils/supabase'; // Supabase 브라우저 클라이언트 임포트
import { Share2, Edit2, Check, X, Bell, Award, Sparkles, BookOpen, Wallet, Home, Camera, User, ShoppingBag, Eye, LogOut } from 'lucide-react';

export default function MainApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<'home' | 'search' | 'recipe' | 'notification' | 'mypage' | 'store' | 'camera' | 'checkout'>('store');
  const [homeSubTab, setHomeSubTab] = useState<'fridge' | 'ledger'>('ledger');
  
  // 카메라 및 결제 이전 탭 기록용
  const [prevTab, setPrevTab] = useState<'home' | 'search' | 'recipe' | 'notification' | 'mypage' | 'store' | 'checkout'>('store');

  // Supabase Auth 세션 및 로딩 상태
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const mockSession = localStorage.getItem('yorijori_mock_session');
      if (mockSession) {
        try {
          return JSON.parse(mockSession).userId || null;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });
  const [isAuthChecking, setIsAuthChecking] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('yorijori_mock_session');
    }
    return true;
  });

  // 프로필 상태
  const [nickname, setNickname] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const mockSession = localStorage.getItem('yorijori_mock_session');
      if (mockSession) {
        try {
          return JSON.parse(mockSession).nickname || '요리조리사';
        } catch (e) {}
      }
    }
    return '요리조리사';
  });
  const [familyCount, setFamilyCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const mockSession = localStorage.getItem('yorijori_mock_session');
      if (mockSession) {
        try {
          return JSON.parse(mockSession).familyCount || 1;
        } catch (e) {}
      }
    }
    return 1;
  });
  const [subscription, setSubscription] = useState<'free' | 'pro'>('free');

  // 멀티 보관소 설정 상태
  const [storages, setStorages] = useState<StorageUnit[]>([
    { id: 'storage_1', name: '주방 냉장고', type: '냉장고' },
    { id: 'storage_2', name: '서랍형 냉동고', type: '냉동고' },
    { id: 'storage_3', name: '김치 냉장고', type: '김치냉장고' },
    { id: 'storage_4', name: '실온 보관함', type: '실온보관' },
  ]);
  const [currentStorageId, setCurrentStorageId] = useState('storage_1');

  // 식재료 상태
  const [items, setItems] = useState<IngredientItem[]>([
    {
      id: 'item_1',
      name: '양파 3개',
      quantity: '3개',
      category: '야채',
      expiryDate: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
      price: 1500,
      registeredAt: new Date().toISOString(),
      storageId: 'storage_1',
    },
    {
      id: 'item_2',
      name: '서울우유 1L',
      quantity: '1개',
      category: '유제품',
      expiryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      price: 2900,
      registeredAt: new Date().toISOString(),
      storageId: 'storage_1',
    },
    {
      id: 'item_3',
      name: '국산 흙당근',
      quantity: '2개',
      category: '야채',
      expiryDate: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
      price: 1200,
      registeredAt: new Date().toISOString(),
      storageId: 'storage_4',
    },
    {
      id: 'item_4',
      name: '가쓰오 생우동 2인분',
      quantity: '1봉',
      category: '가공식품',
      expiryDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      price: 4800,
      registeredAt: new Date().toISOString(),
      storageId: 'storage_1',
    },
  ]);

  // 가계부 지출 상태
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([
    { id: 'exp_1', title: '이마트 장보기', amount: 32000, category: '마트 장보기', date: '2026-07-02' },
    { id: 'exp_2', title: '배민 떡볶이', amount: 16000, category: '배달', date: '2026-07-10' },
  ]);

  // 예산 & 냉파 누적 절약액 상태
  const [budget, setBudget] = useState(300000);
  const [totalSaved, setTotalSaved] = useState(34000);

  // 포인트 몰 소비 및 쿠폰
  const [spentPoints, setSpentPoints] = useState(0);
  const [purchasedCoupons, setPurchasedCoupons] = useState<string[]>([]);

  // 저장된 레시피
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([
    {
      id: 'rec_3',
      name: '우유 달걀찜 (초간편 푸딩 식감)',
      ingredients: ['매일 우유 900ml', '신선란 10구'],
      instructions: [
        '계란 2알과 우유 100ml, 물 50ml를 넣고 거품기로 골고루 저어줍니다.',
        '체에 두 번 걸러 몽글몽글한 알끈을 깨끗이 제거합니다.',
        '그릇에 계란물을 담고 랩을 씌운 뒤, 전자레인지에 3분 30초 돌려줍니다.',
      ],
      savingsAmount: 6000,
    }
  ]);

  // 알림 상태
  const [notifications, setNotifications] = useState<NotifType[]>([
    {
      id: 'not_1',
      type: 'warning',
      title: '소비기한 임박 주의',
      message: '양파 3개의 유효기간이 1일 남았습니다. 상하기 전에 서둘러 조리해 주세요!',
      time: '방금 전',
      read: false,
    },
    {
      id: 'not_2',
      type: 'warning',
      title: '유통기한 만료 발생',
      message: '가쓰오 생우동 2인분의 유효기간이 지났습니다. 폐기 여부를 확인해 주세요.',
      time: '2시간 전',
      read: false,
    },
  ]);

  // 🏆 타이틀 상태
  const [badges, setBadges] = useState<BadgeTitle[]>([
    {
      id: 'badge_1',
      name: '제로 웨이스트 마스터',
      description: '한 달간 상해서 버린 음식 0개 유지',
      icon: '🌿',
      isUnlocked: true,
      condition: '버린 음식 0개 달성',
    },
    {
      id: 'badge_2',
      name: '지갑 수호자',
      description: '이번 달 식비 예산 80% 이하 사용 선방',
      icon: '🛡️',
      isUnlocked: true,
      condition: '예산 80% 이하 사용',
    },
    {
      id: 'badge_3',
      name: '냉장고 심폐소생술사',
      description: '소비기한 임박 식재료 AI 구출 레시피 3회 이상 완료',
      icon: '🧪',
      isUnlocked: false,
      condition: '임박 재료 요리 3회 완료',
    },
  ]);

  // 카메라 분석 단계 상태
  const [cameraStep, setCameraStep] = useState<'viewfinder' | 'scanning' | 'confirm'>('viewfinder');

  // 모킹된 영수증 인식 데이터
  const mockedParsedItems = [
    { name: '대파 1단', quantity: '1단', category: '야채' as const, expiryDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], price: 2800 },
    { name: '신선란 10구', quantity: '1팩', category: '기타' as const, expiryDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0], price: 3980 },
    { name: '매일 우유 900ml', quantity: '1개', category: '유제품' as const, expiryDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], price: 2900 },
    { name: '한돈 삼겹살 400g', quantity: '1팩', category: '육류/해물' as const, expiryDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], price: 12500 },
  ];
  const totalReceiptCost = mockedParsedItems.reduce((acc, c) => acc + c.price, 0);

  // 토스트 메시지
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI 레시피 바로가기 요청
  const [requestIngredients, setRequestIngredients] = useState<string[] | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // ==========================================
  // [Supabase] 세션 및 데이터 동기화 연동 프로세스
  // ==========================================
  
  // 최초 구동 시 세션 확인 및 데이터 패치
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          await fetchUserData(session.user.id);
        } else {
          // 가상 자동 로그인 복원 체크
          if (typeof window !== 'undefined') {
            const mockSessionStr = localStorage.getItem('yorijori_mock_session');
            if (mockSessionStr) {
              try {
                const mockSession = JSON.parse(mockSessionStr);
                setUserId(mockSession.userId || 'mock_user_123');
                setNickname(mockSession.nickname || '요리조리사');
                setFamilyCount(mockSession.familyCount || 1);
                setIsAuthChecking(false);
                return;
              } catch (pErr) {
                console.error('가상 세션 복구 실패:', pErr);
              }
            }
          }
          setIsAuthChecking(false);
        }
      } catch (err) {
        console.error('인증 체크 중 폴백 작동:', err);
        setIsAuthChecking(false);
      }
    };

    checkAuthAndFetch();

    // 인증 세션 변동 시 실시간 감지
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        await fetchUserData(session.user.id);
      } else {
        setUserId(null);
        setIsAuthChecking(false);
      }
    });

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  // Supabase Database에서 유저 정보 일괄 조회
  const fetchUserData = async (uId: string) => {
    setIsAuthChecking(true);
    try {
      // 1. 프로필 패치
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', uId).single();
      if (profile) {
        setNickname(profile.nickname);
        setFamilyCount(profile.family_count);
        setSubscription(profile.subscription as any);
        setSpentPoints(profile.spent_points);
      }

      // 2. 보관소 패치
      const { data: userStorages } = await supabase.from('storages').select('*').eq('user_id', uId);
      if (userStorages && userStorages.length > 0) {
        const mapped = userStorages.map(s => ({ id: s.id, name: s.name, type: s.type as any }));
        setStorages(mapped);
        setCurrentStorageId(mapped[0].id);
      } else {
        // 기본 보관소 생성
        const defaultStorages = [
          { name: '주방 냉장고', type: '냉장고' },
          { name: '서랍형 냉동고', type: '냉동고' },
          { name: '김치 냉장고', type: '김치냉장고' },
          { name: '실온 보관함', type: '실온보관' }
        ];
        const { data: created } = await supabase.from('storages').insert(
          defaultStorages.map(s => ({ ...s, user_id: uId }))
        ).select();
        
        if (created) {
          const mapped = created.map(s => ({ id: s.id, name: s.name, type: s.type as any }));
          setStorages(mapped);
          setCurrentStorageId(mapped[0].id);
        }
      }

      // 3. 식재료 패치
      const { data: userIngredients } = await supabase.from('ingredients').select('*').eq('user_id', uId);
      if (userIngredients) {
        setItems(userIngredients.map(i => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          category: i.category as any,
          expiryDate: i.expiry_date,
          price: i.price,
          registeredAt: i.created_at,
          storageId: i.storage_id
        })));
      }

      // 4. 가계부 지출 패치
      const { data: userExpenses } = await supabase.from('expenses').select('*').eq('user_id', uId);
      if (userExpenses) {
        setExpenses(userExpenses.map(e => ({
          id: e.id,
          title: e.title,
          amount: e.amount,
          category: e.category as any,
          date: e.date
        })));
      }

      // 5. 기프티콘 패치
      const { data: userCoupons } = await supabase.from('purchased_coupons').select('*').eq('user_id', uId);
      if (userCoupons) {
        setPurchasedCoupons(userCoupons.map(c => c.coupon_name));
      }

      // 6. 북마크 레시피 패치
      const { data: userRecipes } = await supabase.from('saved_recipes').select('*').eq('user_id', uId);
      if (userRecipes) {
        setSavedRecipes(userRecipes.map(r => ({
          id: r.recipe_id,
          name: r.name,
          ingredients: r.ingredients,
          instructions: r.instructions,
          savingsAmount: r.savings_amount
        })));
      }

    } catch (err) {
      console.error('사용자 데이터 로딩 중 에러 발생:', err);
    } finally {
      setIsAuthChecking(false);
    }
  };

  // 온보딩 완료 시점 콜백 (로그인/가입 완료)
  const handleAuthComplete = (uId: string, userNickname: string, userFamilyCount: number) => {
    setUserId(uId);
    setNickname(userNickname);
    setFamilyCount(userFamilyCount);

    if (typeof window !== 'undefined') {
      localStorage.setItem('yorijori_mock_session', JSON.stringify({
        userId: uId,
        nickname: userNickname,
        familyCount: userFamilyCount
      }));
    }

    triggerToast(`👋 ${userNickname}님, 요리조리에 오신 것을 환영합니다!`);
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('로그아웃 에러:', err);
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('yorijori_mock_session');
    }

    setUserId(null);
    triggerToast('🚪 정상 로그아웃 처리되었습니다.');
  };

  // ==========================================
  // [CRUD] Supabase REST API 연동 및 State 동시 반영 (폴백 탑재)
  // ==========================================

  // 1. 식재료 추가
  const handleAddItem = async (newItem: Omit<IngredientItem, 'id' | 'registeredAt' | 'storageId'>) => {
    const localId = `item_${Date.now()}`;
    const registeredAt = new Date().toISOString();
    
    // 로컬 상태 즉시 선반영 (Optimistic UI)
    const localItem: IngredientItem = {
      ...newItem,
      id: localId,
      registeredAt,
      storageId: currentStorageId,
    };
    setItems((prev) => [localItem, ...prev]);

    // Supabase DB 연동
    if (userId && !userId.startsWith('mock_')) {
      try {
        const { data } = await supabase.from('ingredients').insert({
          name: newItem.name,
          quantity: newItem.quantity,
          category: newItem.category,
          expiry_date: newItem.expiryDate,
          price: newItem.price,
          storage_id: currentStorageId,
          user_id: userId
        }).select().single();

        if (data) {
          // 가상 ID를 Supabase가 생성해준 실 ID로 교환
          setItems((prev) =>
            prev.map(i => i.id === localId ? { ...i, id: data.id } : i)
          );
        }
      } catch (err) {
        console.error('식재료 DB 삽입 에러:', err);
      }
    }

    setNotifications((prev) => [
      {
        id: `not_${Date.now()}`,
        type: 'success',
        title: '식재료 추가 완료',
        message: `냉장고에 ${newItem.name}이(가) 등록되었습니다.`,
        time: '방금 전',
        read: false,
      },
      ...prev,
    ]);

    const activeSt = storages.find(s => s.id === currentStorageId);
    triggerToast(`🥦 [${activeSt?.name || '보관소'}] ${newItem.name} 등록 완료!`);
  };

  // 2. 영수증 기반 다중 추가 (가계부 연동)
  const handleAddMultipleItems = async (
    newItems: Omit<IngredientItem, 'id' | 'registeredAt' | 'storageId'>[],
    receiptCost: number
  ) => {
    const localTime = new Date().toISOString();
    const createdItems = newItems.map((item, idx) => ({
      ...item,
      id: `item_${Date.now()}_${idx}`,
      registeredAt: localTime,
      storageId: currentStorageId,
    }));
    
    setItems((prev) => [...createdItems, ...prev]);

    const newExpense: ExpenseRecord = {
      id: `exp_${Date.now()}`,
      title: '영수증 자동 등록 마트',
      amount: receiptCost,
      category: '마트 장보기',
      date: new Date().toISOString().split('T')[0],
    };
    setExpenses((prev) => [newExpense, ...prev]);

    // Supabase DB 연동
    if (userId && !userId.startsWith('mock_')) {
      try {
        // 식재료 벌크 인서트
        await supabase.from('ingredients').insert(
          newItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            category: item.category,
            expiry_date: item.expiryDate,
            price: item.price,
            storage_id: currentStorageId,
            user_id: userId
          }))
        );

        // 지출 추가
        await supabase.from('expenses').insert({
          title: '영수증 자동 등록 마트',
          amount: receiptCost,
          category: '마트 장보기',
          date: newExpense.date,
          user_id: userId
        });

        // 데이터 재조회하여 ID 맵핑 동기화
        await fetchUserData(userId);
      } catch (err) {
        console.error('영수증 일괄 DB 동기화 에러:', err);
      }
    }

    setNotifications((prev) => [
      {
        id: `not_${Date.now()}`,
        type: 'success',
        title: '영수증 일괄 파싱 완료',
        message: `영수증에서 식재료 ${newItems.length}개와 지출금액 ${receiptCost.toLocaleString()}원이 등록되었습니다.`,
        time: '방금 전',
        read: false,
      },
      ...prev,
    ]);

    const activeSt = storages.find(s => s.id === currentStorageId);
    triggerToast(`🧾 [${activeSt?.name || '보관소'}]에 식재료 ${newItems.length}개 일괄 등록!`);
  };

  // 3. 식재료 삭제
  const handleDeleteItem = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    setItems((prev) => prev.filter((item) => item.id !== id));

    if (userId && !userId.startsWith('mock_') && !id.startsWith('item_')) {
      try {
        await supabase.from('ingredients').delete().eq('id', id);
      } catch (err) {
        console.error('DB 삭제 에러:', err);
      }
    }
    triggerToast(`🗑️ ${target.name}이(가) 삭제되었습니다.`);
  };

  // 4. 보관소 추가
  const handleAddStorage = async (name: string, type: StorageUnit['type']) => {
    const localId = `storage_${Date.now()}`;
    const newStorage: StorageUnit = {
      id: localId,
      name,
      type,
    };
    setStorages((prev) => [...prev, newStorage]);
    setCurrentStorageId(localId);

    if (userId && !userId.startsWith('mock_')) {
      try {
        const { data } = await supabase.from('storages').insert({
          name,
          type,
          user_id: userId
        }).select().single();

        if (data) {
          setStorages((prev) =>
            prev.map(s => s.id === localId ? { ...s, id: data.id } : s)
          );
          setCurrentStorageId(data.id);
        }
      } catch (err) {
        console.error('보관소 DB 추가 에러:', err);
      }
    }
    triggerToast(`📁 새 보관 공간 [${name} (${type})] 추가 완료!`);
  };

  // 5. 보관소 이름 편집
  const handleUpdateStorageName = async (id: string, name: string) => {
    setStorages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );

    if (userId && !userId.startsWith('mock_') && !id.startsWith('storage_')) {
      try {
        await supabase.from('storages').update({ name }).eq('id', id);
      } catch (err) {
        console.error('보관소 DB 수정 에러:', err);
      }
    }
    triggerToast('보관소 이름 변경 완료!');
  };

  // 6. 보관소 삭제
  const handleDeleteStorage = async (id: string) => {
    if (storages.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.storageId !== id));
    
    const filtered = storages.filter((s) => s.id !== id);
    setStorages(filtered);
    if (currentStorageId === id) {
      setCurrentStorageId(filtered[0].id);
    }

    if (userId && !userId.startsWith('mock_') && !id.startsWith('storage_')) {
      try {
        await supabase.from('storages').delete().eq('id', id);
      } catch (err) {
        console.error('보관소 DB 삭제 에러:', err);
      }
    }
    triggerToast('보관소가 삭제되었습니다.');
  };

  // 7. 레시피 북마크 저장
  const handleSaveRecipe = async (recipe: Recipe) => {
    if (savedRecipes.some((r) => r.id === recipe.id)) return;
    setSavedRecipes((prev) => [...prev, recipe]);
    setTotalSaved((prev) => prev + recipe.savingsAmount);

    if (userId && !userId.startsWith('mock_')) {
      try {
        await supabase.from('saved_recipes').insert({
          recipe_id: recipe.id,
          name: recipe.name,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          savings_amount: recipe.savingsAmount,
          user_id: userId
        });
      } catch (err) {
        console.error('레시피 DB 저장 에러:', err);
      }
    }
    
    if (savedRecipes.length + 1 >= 3) {
      setBadges((prev) =>
        prev.map((b) => (b.id === 'badge_3' ? { ...b, isUnlocked: true } : b))
      );
      triggerToast('🏆 [냉장고 심폐소생술사] 타이틀 획득! +500P 적립!');
    } else {
      triggerToast(`💚 레시피 저장 (식비 +${recipe.savingsAmount.toLocaleString()}원 절약 / 포인트 자동 적립)`);
    }
  };

  // 8. 레시피 북마크 해제
  const handleUnsaveRecipe = async (id: string) => {
    const target = savedRecipes.find((r) => r.id === id);
    setSavedRecipes((prev) => prev.filter((r) => r.id !== id));
    if (target) {
      setTotalSaved((prev) => Math.max(0, prev - target.savingsAmount));
    }

    if (userId && !userId.startsWith('mock_')) {
      try {
        await supabase.from('saved_recipes').delete().eq('recipe_id', id).eq('user_id', userId);
      } catch (err) {
        console.error('레시피 DB 삭제 에러:', err);
      }
    }
    triggerToast('즐겨찾기에서 레시피를 제외했습니다.');
  };

  // 9. 프로필 업데이트 (닉네임, 가구원)
  const handleUpdateProfile = async (newNickname: string, newFamilyCount: number) => {
    setNickname(newNickname);
    setFamilyCount(newFamilyCount);

    // 로컬 스토리지 가상 세션 데이터 동기화 업데이트 (새로고침 시 영구 반영)
    if (typeof window !== 'undefined') {
      const mockSessionStr = localStorage.getItem('yorijori_mock_session');
      if (mockSessionStr) {
        try {
          const sessionObj = JSON.parse(mockSessionStr);
          sessionObj.nickname = newNickname;
          sessionObj.familyCount = newFamilyCount;
          localStorage.setItem('yorijori_mock_session', JSON.stringify(sessionObj));
        } catch (e) {
          console.error('로컬 세션 갱신 실패:', e);
        }
      } else {
        localStorage.setItem('yorijori_mock_session', JSON.stringify({
          userId: userId || 'mock_user_123',
          nickname: newNickname,
          familyCount: newFamilyCount
        }));
      }
    }

    if (userId && !userId.startsWith('mock_')) {
      try {
        await supabase.from('profiles').update({
          nickname: newNickname,
          family_count: newFamilyCount,
          updated_at: new Date().toISOString()
        }).eq('id', userId);
      } catch (err) {
        console.error('프로필 DB 업데이트 에러:', err);
      }
    }
    triggerToast('프로필 정보가 저장되었습니다.');
  };

  // 10. 요금제 구독 (PRO)
  const handleUpgradeSubscription = async (plan: 'free' | 'pro') => {
    setSubscription(plan);

    if (userId && !userId.startsWith('mock_')) {
      try {
        await supabase.from('profiles').update({ subscription: plan }).eq('id', userId);
      } catch (err) {
        console.error('멤버십 DB 수정 에러:', err);
      }
    }

    if (plan === 'pro') {
      triggerToast('🎉 요리조리 PRO 멤버십 업그레이드 성공!');
    } else {
      triggerToast('일반 요금제로 변경되었습니다.');
    }
  };

  // 11. 쿠폰 포인트 교환 구매
  const handleBuyCoupon = async (productName: string, points: number) => {
    const updatedSpentPoints = spentPoints + points;
    setSpentPoints(updatedSpentPoints);
    setPurchasedCoupons((prev) => [productName, ...prev]);

    if (userId && !userId.startsWith('mock_')) {
      try {
        // 쿠폰 구매 내역 적재
        await supabase.from('purchased_coupons').insert({
          coupon_name: productName,
          price: points,
          user_id: userId
        });

        // 소모된 포인트 profiles 테이블 업데이트
        await supabase.from('profiles').update({
          spent_points: updatedSpentPoints
        }).eq('id', userId);
      } catch (err) {
        console.error('쿠폰 교환 DB 동기화 에러:', err);
      }
    }

    setNotifications((prev) => [
      {
        id: `not_coupon_${Date.now()}`,
        type: 'success',
        title: '교환권 구매 완료',
        message: `포인트 ${points}P를 사용하여 [${productName}] 모바일 교환권을 교환하셨습니다.`,
        time: '방금 전',
        read: false,
      },
      ...prev,
    ]);

    triggerToast(`🎁 [${productName}] 교환권 보관함에 즉시 지급!`);
  };

  // 12. 예산 수정
  const handleUpdateBudget = (amount: number) => {
    setBudget(amount);
    triggerToast(`💰 이번 달 식비 예산이 ${amount.toLocaleString()}원으로 수정되었습니다.`);
  };

  // 13. 지출 항목 수정 / 신규 가산
  const handleUpdateExpense = async (id: string, updated: { title: string; amount: number; category: ExpenseRecord['category'] }) => {
    const localDate = new Date().toISOString().split('T')[0];
    
    if (id.startsWith('new_')) {
      const localId = `exp_${Date.now()}`;
      const newExp: ExpenseRecord = {
        id: localId,
        title: updated.title,
        amount: updated.amount,
        category: updated.category,
        date: localDate,
      };
      setExpenses((prev) => [newExp, ...prev]);

      if (userId && !userId.startsWith('mock_')) {
        try {
          const { data } = await supabase.from('expenses').insert({
            title: updated.title,
            amount: updated.amount,
            category: updated.category,
            date: localDate,
            user_id: userId
          }).select().single();

          if (data) {
            setExpenses((prev) =>
              prev.map(e => e.id === localId ? { ...e, id: data.id } : e)
            );
          }
        } catch (err) {
          console.error('지출 DB 추가 에러:', err);
        }
      }
      triggerToast(`💸 지출 내역 [${updated.title}]이(가) 추가되었습니다.`);
    } else {
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
      );

      if (userId && !userId.startsWith('mock_') && !id.startsWith('exp_')) {
        try {
          await supabase.from('expenses').update({
            title: updated.title,
            amount: updated.amount,
            category: updated.category
          }).eq('id', id);
        } catch (err) {
          console.error('지출 DB 수정 에러:', err);
        }
      }
      triggerToast(`✏️ 지출 내역 [${updated.title}]이(가) 수정되었습니다.`);
    }
  };

  // 14. 지출 항목 삭제
  const handleDeleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));

    if (userId && !userId.startsWith('mock_') && !id.startsWith('exp_')) {
      try {
        await supabase.from('expenses').delete().eq('id', id);
      } catch (err) {
        console.error('지출 DB 삭제 에러:', err);
      }
    }
    triggerToast('🗑️ 지출 내역이 삭제되었습니다.');
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    triggerToast('알림판을 모두 비웠습니다.');
  };

  const handleShareClick = () => {
    if (subscription !== 'pro') {
      triggerToast('🚨 냉장고 공유 링크 발급은 프로(PRO) 요금제 혜택입니다.');
      return;
    }
    const inviteUrl = `https://yorijori.app/invite?fridgeId=fridge_pro_48291&sender=${nickname}`;
    navigator.clipboard.writeText(inviteUrl);
    triggerToast('🔗 클립보드에 초대 공유 링크가 복사되었습니다!');
  };

  // 카메라 셔터 클릭
  const startReceiptScan = () => {
    setCameraStep('scanning');
    setTimeout(() => {
      setCameraStep('confirm');
    }, 1500);
  };

  // 카메라 촬영 완료 -> 일괄 등록 및 냉장고 탭 복귀
  const confirmReceiptRegister = () => {
    handleAddMultipleItems(mockedParsedItems, totalReceiptCost);
    setCameraStep('viewfinder');
    setCurrentTab('search');
  };

  useEffect(() => {
    const currentMonthExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const isUnder80 = currentMonthExpenses <= budget * 0.8;
    setBadges((prev) =>
      prev.map((b) => (b.id === 'badge_2' ? { ...b, isUnlocked: isUnder80 } : b))
    );
  }, [expenses, budget]);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="min-h-screen bg-brand-grey flex items-center justify-center p-2">
      {/* 폰 목업 컨테이너 (h-[710px] w-[360px] 100% 핏 & overflow-hidden) */}
      <div className="w-[360px] h-[710px] bg-white rounded-[32px] shadow-2xl border-[6px] border-gray-800 flex flex-col overflow-hidden relative">
        
        {/* 상단 폰 노치 홀 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-gray-800 rounded-b-xl z-40 flex items-center justify-center">
          <div className="w-8 h-1 bg-gray-600 rounded-full"></div>
        </div>

        {/* 1. 앱 바 상단 헤더 (비로그인/카메라/결제 화면일 때는 헤더 숨김 처리) */}
        {userId && currentTab !== 'camera' && currentTab !== 'checkout' && (
          <div className="pt-6 pb-2.5 px-4 bg-white border-b border-brand-grey flex items-center justify-between z-30 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span
                onClick={() => {
                  setCurrentTab('store');
                  triggerToast('🏠 요리조리 홈 상점으로 이동했습니다.');
                }}
                className="text-xs font-black text-white bg-brand-green px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-brand-green-hover transition-all active:scale-95 select-none shadow-sm"
              >
                요리조리
              </span>
              {/* 로그아웃 버튼 배치 */}
              <button
                onClick={handleLogout}
                className="text-[9px] text-gray-400 hover:text-red-500 font-bold border border-gray-100 hover:border-red-200 px-1.5 py-1.5 rounded-lg flex items-center gap-0.5"
                title="로그아웃"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleShareClick}
                className="text-gray-400 hover:text-brand-green p-1.5 rounded-lg hover:bg-brand-grey transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentTab('notification')}
                className="relative text-gray-400 hover:text-brand-green p-1.5 rounded-lg hover:bg-brand-grey transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-brand-coral text-white text-[7px] font-extrabold flex items-center justify-center">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 2. 메인 뷰포트 (스크롤 가능한 내부 컨테이너) */}
        <div className="flex-1 overflow-y-auto relative bg-[#FCFDFD]">
          {/* 스플래쉬 화면이 폰 안 액정에 완전히 딱 맞도록 absolute 배치 */}
          {showSplash && <Splash onFinish={() => setShowSplash(false)} />}

          {!showSplash && isAuthChecking ? (
            /* 로딩 중 인디케이터 */
            <div className="absolute inset-0 flex items-center justify-center bg-[#FCFDFD] z-40">
              <div className="flex flex-col items-center gap-2">
                <span className="w-6 h-6 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin"></span>
                <span className="text-[10px] text-gray-400 font-bold">인증 세션 확인 중...</span>
              </div>
            </div>
          ) : !showSplash && !userId ? (
            /* 비로그인 상태: 딜 그린 온보딩 스크린 로드 */
            <AuthOnboarding onAuthComplete={handleAuthComplete} />
          ) : (
            /* 로그인 된 사용자 상태: 메인 기능 탭 라우팅 */
            <>
              {currentTab === 'camera' && (
                <div className="absolute inset-0 z-40 bg-black flex flex-col justify-between text-white p-6 animate-fade-in">
                  <div className="flex items-center justify-between pt-8 z-10">
                    <span className="text-xs font-extrabold tracking-wider text-brand-green-light">RECEIPT SCANNER</span>
                    <button
                      onClick={() => {
                        setCurrentTab(prevTab);
                        setCameraStep('viewfinder');
                      }}
                      className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10"
                    >
                      <X className="w-5.5 h-5.5" />
                    </button>
                  </div>

                  {cameraStep === 'viewfinder' && (
                    <>
                      <div className="flex-1 flex flex-col items-center justify-center my-6 relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px] opacity-40"></div>
                        <div className="w-[230px] h-[340px] border-2 border-dashed border-white/50 rounded-2xl relative flex items-center justify-center bg-white/5">
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-brand-green rounded-tl-md"></div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-brand-green rounded-tr-md"></div>
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-brand-green rounded-bl-md"></div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-brand-green rounded-br-md"></div>
                          <div className="text-[10px] text-white/50 text-center font-semibold leading-relaxed px-4">
                            여기에 마트 영수증을<br />맞추어 비춰주세요
                          </div>
                        </div>
                        <span className="text-[10px] text-brand-green-light font-bold mt-4 bg-brand-green/20 px-3 py-1 rounded-full border border-brand-green/30">
                          영수증 가이드 정렬 완료
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-3 pb-8 z-10">
                        <span className="text-[9px] text-white/60">버튼을 누르면 파싱 스캔을 모킹합니다</span>
                        <button
                          onClick={startReceiptScan}
                          className="w-16 h-16 rounded-full border-4 border-white bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center p-1"
                        >
                          <div className="w-full h-full rounded-full bg-white"></div>
                        </button>
                      </div>
                    </>
                  )}

                  {cameraStep === 'scanning' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="relative w-16 h-16 mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-brand-green/20 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-brand-green flex items-center justify-center bg-white/5">
                          <Camera className="w-7 h-7 text-brand-green animate-pulse" />
                        </div>
                      </div>
                      <h4 className="text-sm font-extrabold text-white mb-2 animate-bounce">
                        AI 분석가 영수증 해독 중...
                      </h4>
                      <p className="text-[10px] text-white/40 leading-relaxed">
                        품명 4종, 수량, 단가 데이터 매트릭스 구성 완료 단계
                      </p>
                    </div>
                  )}

                  {cameraStep === 'confirm' && (
                    <div className="flex-1 flex flex-col justify-center my-6 animate-fade-in text-gray-800">
                      <div className="bg-white rounded-2xl p-5 w-full shadow-2xl flex flex-col">
                        <div className="flex items-center gap-1.5 mb-4 border-b pb-3">
                          <Check className="w-5 h-5 text-brand-green" />
                          <h3 className="text-xs font-extrabold text-gray-800">분석 완료! 등록 대기 내역</h3>
                        </div>

                        <div className="flex flex-col gap-2.5 max-h-[170px] overflow-y-auto mb-4 pr-1">
                          {mockedParsedItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-brand-grey/60 p-2.5 rounded-lg flex items-center justify-between text-[10px]"
                            >
                              <div>
                                <div className="font-extrabold text-gray-800">{item.name}</div>
                                <div className="text-[8px] text-gray-400 mt-0.5">
                                  분류: {item.category} | 수량: {item.quantity}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-700">{item.price.toLocaleString()}원</div>
                                <div className="text-[8px] text-brand-coral font-bold mt-0.5">
                                  소비기한: {item.expiryDate}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-brand-green-light p-3 rounded-xl mb-5 flex items-center justify-between text-[10px] text-brand-green font-bold">
                          <span>총 지출 금액</span>
                          <span className="text-xs font-black">{totalReceiptCost.toLocaleString()}원</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCameraStep('viewfinder');
                            }}
                            className="flex-1 bg-brand-grey text-gray-600 text-[10px] font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                          >
                            재촬영
                          </button>
                          <button
                            onClick={confirmReceiptRegister}
                            className="flex-2 bg-brand-green hover:bg-brand-green-hover text-white text-[10px] font-bold py-3 rounded-xl transition-colors shadow-md"
                          >
                            일괄 등록 후 냉장고 이동
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentTab === 'store' && (
                <Store
                  totalSaved={totalSaved}
                  badges={badges}
                  spentPoints={spentPoints}
                  onBuyCoupon={handleBuyCoupon}
                />
              )}

              {currentTab === 'home' && (
                <HomeDashboard
                  items={items}
                  expenses={expenses}
                  badges={badges}
                  budget={budget}
                  totalSaved={totalSaved}
                  activeSubTab={homeSubTab}
                  onSubTabChange={(tab) => setHomeSubTab(tab)}
                  onNavigateToTab={(tab) => {
                    if (tab === 'search') setCurrentTab('search');
                  }}
                  onSelectRecipe={(recipeIngs) => {
                    setRequestIngredients(recipeIngs);
                    setCurrentTab('recipe');
                  }}
                  onUpdateBudget={handleUpdateBudget}
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}

              {currentTab === 'search' && (
                <SearchRegister
                  items={items}
                  storages={storages}
                  currentStorageId={currentStorageId}
                  onAddItem={handleAddItem}
                  onDeleteItem={handleDeleteItem}
                  onSelectStorage={(id) => setCurrentStorageId(id)}
                  onAddStorage={handleAddStorage}
                  onUpdateStorageName={handleUpdateStorageName}
                  onDeleteStorage={handleDeleteStorage}
                />
              )}

              {currentTab === 'recipe' && (
                <AiRecipes
                  items={items}
                  savedRecipes={savedRecipes}
                  onSaveRecipe={handleSaveRecipe}
                  onUnsaveRecipe={handleUnsaveRecipe}
                  onRequestRecipeIngredients={requestIngredients}
                  onClearRequestIngredients={() => setRequestIngredients(null)}
                />
              )}

              {currentTab === 'notification' && (
                <Notifications
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                  onClearAll={handleClearNotifications}
                />
              )}

              {currentTab === 'mypage' && (
                <MyPage
                  nickname={nickname}
                  familyCount={familyCount}
                  savedRecipes={savedRecipes}
                  badges={badges}
                  subscription={subscription}
                  onUpdateProfile={handleUpdateProfile}
                  onUnsaveRecipe={handleUnsaveRecipe}
                  onUpgradeSubscription={handleUpgradeSubscription}
                  purchasedCoupons={purchasedCoupons}
                  onNavigateToCheckout={() => {
                    setPrevTab(currentTab);
                    setCurrentTab('checkout');
                  }}
                />
              )}

              {currentTab === 'checkout' && (
                <Checkout
                  nickname={nickname}
                  onPaymentSuccess={() => {
                    handleUpgradeSubscription('pro');
                    setCurrentTab('mypage');
                  }}
                  onCancel={() => {
                    setCurrentTab('mypage');
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* 3. 하단 탭바 (비로그인/촬영/결제 모드일 때는 탭바 숨김 처리) */}
        {userId && currentTab !== 'camera' && currentTab !== 'checkout' && (
          <div className="bg-white border-t border-brand-grey py-1.5 px-3 flex items-center justify-between z-30 pb-4 flex-shrink-0">
            
            {/* A. 냉장고 */}
            <button
              onClick={() => setCurrentTab('search')}
              className={`flex-1 flex flex-col items-center gap-0.5 transition-all ${
                currentTab === 'search' ? 'text-brand-green font-bold scale-105' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <BookOpen className="w-[18px] h-[18px]" />
              <span className="text-[8px] mt-0.5">냉장고</span>
            </button>
            
            {/* B. 가계부 */}
            <button
              onClick={() => {
                setCurrentTab('home');
                setHomeSubTab('ledger');
              }}
              className={`flex-1 flex flex-col items-center gap-0.5 transition-all ${
                currentTab === 'home' && homeSubTab === 'ledger' ? 'text-brand-green font-bold scale-105' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Wallet className="w-[18px] h-[18px]" />
              <span className="text-[8px] mt-0.5">가계부</span>
            </button>

            {/* C. 사진촬영버튼 */}
            <button
              onClick={() => {
                setPrevTab(currentTab);
                setCurrentTab('camera');
                setCameraStep('viewfinder');
              }}
              className="flex-1 flex flex-col items-center -mt-3.5 transition-all relative z-40 group"
            >
              <div className="w-[38px] h-[38px] rounded-full bg-brand-green text-white flex items-center justify-center shadow-md group-hover:bg-brand-green-hover group-active:scale-95 transition-all">
                <Camera className="w-[17px] h-[17px]" />
              </div>
              <span className="text-[8px] text-gray-500 mt-0.5 font-bold">촬영등록</span>
            </button>

            {/* D. 상점 */}
            <button
              onClick={() => setCurrentTab('store')}
              className={`flex-1 flex flex-col items-center gap-0.5 transition-all ${
                currentTab === 'store' ? 'text-brand-green font-bold scale-105' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
              <span className="text-[8px] mt-0.5">상점</span>
            </button>

            {/* E. 마이페이지 */}
            <button
              onClick={() => setCurrentTab('mypage')}
              className={`flex-1 flex flex-col items-center gap-0.5 transition-all ${
                currentTab === 'mypage' ? 'text-brand-green font-bold scale-105' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <User className="w-[18px] h-[18px]" />
              <span className="text-[8px] mt-0.5">마이</span>
            </button>
          </div>
        )}

        {/* 4. 공통 토스트 팝업 */}
        {toastMessage && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[9px] px-3.5 py-2 rounded-full shadow-lg z-50 animate-fade-in flex items-center gap-1 whitespace-nowrap">
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </main>
  );
}
