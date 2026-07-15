export interface StorageUnit {
  id: string;
  name: string;
  type: '냉장고' | '냉동고' | '김치냉장고' | '실온보관' | '기타';
}

export interface IngredientItem {
  id: string;
  name: string;
  quantity: string;
  category: '야채' | '육류/해물' | '유제품' | '가공식품' | '기타';
  expiryDate: string; // YYYY-MM-DD
  price: number;
  registeredAt: string;
  storageId: string; // 소속 보관소 ID 필드 추가
}

export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: '마트 장보기' | '외식' | '배달' | '기타';
  date: string; // YYYY-MM-DD
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  savingsAmount: number;
}

export interface BadgeTitle {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  condition: string;
}
