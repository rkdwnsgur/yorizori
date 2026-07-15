-- 1. 유저 프로필 테이블 생성 (auth.users 와 1:1 대응)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  nickname text not null default '요리조리사',
  family_count int not null default 1,
  subscription text not null default 'free', -- 'free' | 'pro'
  spent_points int not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 활성화
alter table public.profiles enable row level security;

-- RLS Policies 정의
create policy "사용자는 본인의 프로필을 조회할 수 있습니다."
  on public.profiles for select
  using (auth.uid() = id);

create policy "사용자는 본인의 프로필을 수정할 수 있습니다."
  on public.profiles for update
  using (auth.uid() = id);


-- 2. 보관 영역(냉장고, 냉동고, 실온 등) 테이블 생성
create table public.storages (
  id uuid default gen_random_uuid() not null primary key,
  name text not null,
  type text not null, -- '냉장고' | '냉동고' | '김치냉장고' | '실온보관' | '기타'
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 활성화
alter table public.storages enable row level security;

-- RLS Policies 정의
create policy "사용자는 본인의 보관 영역만 관리할 수 있습니다."
  on public.storages for all
  using (auth.uid() = user_id);


-- 3. 보관된 식재료 테이블 생성
create table public.ingredients (
  id uuid default gen_random_uuid() not null primary key,
  name text not null,
  quantity text not null default '1개',
  category text not null, -- '야채' | '육류/해물' | '유제품' | '가공식품' | '기타'
  expiry_date date not null,
  price int not null default 0,
  storage_id uuid references public.storages on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 활성화
alter table public.ingredients enable row level security;

-- RLS Policies 정의
create policy "사용자는 본인의 식재료만 관리할 수 있습니다."
  on public.ingredients for all
  using (auth.uid() = user_id);


-- 4. 식비 가계부 지출 내역 테이블 생성
create table public.expenses (
  id uuid default gen_random_uuid() not null primary key,
  title text not null,
  amount int not null default 0,
  category text not null, -- '마트 장보기' | '외식' | '배달' | '기타'
  date date not null default current_date,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 활성화
alter table public.expenses enable row level security;

-- RLS Policies 정의
create policy "사용자는 본인의 지출 내역만 관리할 수 있습니다."
  on public.expenses for all
  using (auth.uid() = user_id);


-- 5. 저장된(북마크한) AI 레시피 테이블 생성
create table public.saved_recipes (
  id uuid default gen_random_uuid() not null primary key,
  recipe_id text not null,
  name text not null,
  ingredients text[] not null,
  instructions text[] not null,
  savings_amount int not null default 0,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 활성화
alter table public.saved_recipes enable row level security;

-- RLS Policies 정의
create policy "사용자는 본인이 북마크한 레시피만 관리할 수 있습니다."
  on public.saved_recipes for all
  using (auth.uid() = user_id);


-- 6. 포인트 교환 모바일 기프티콘 테이블 생성
create table public.purchased_coupons (
  id uuid default gen_random_uuid() not null primary key,
  coupon_name text not null,
  price int not null default 0,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 활성화
alter table public.purchased_coupons enable row level security;

-- RLS Policies 정의
create policy "사용자는 본인이 교환한 기프티콘 내역만 조회할 수 있습니다."
  on public.purchased_coupons for all
  using (auth.uid() = user_id);


-- 7. 회원 가입 자동 트리거 함수 정의
-- auth.users 에 가입 행이 생성되면, public.profiles 로 닉네임과 가구원 정보를 자동 매핑 인서트
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname, family_count, subscription, spent_points)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', '요리조리사'),
    coalesce((new.raw_user_meta_data->>'family_count')::int, 1),
    'free',
    0
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger 바인딩
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
