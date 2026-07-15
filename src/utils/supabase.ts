import { createBrowserClient } from '@supabase/ssr';

// Supabase URL & Anon Key 유효성 검사 및 바인딩
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-ref.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

/**
 * Client Component (브라우저 사이드)에서 Supabase Auth 및 DB 통신에 사용할 싱글톤 브라우저 클라이언트
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
