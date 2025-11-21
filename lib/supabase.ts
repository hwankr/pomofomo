import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 우리의 Supabase 창고와 연결된 '리모컨'을 만듭니다.
export const supabase = createClient(supabaseUrl, supabaseKey);