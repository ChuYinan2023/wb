import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (email: string, password: string) => {
    try {
      console.log('🔐 开始登录:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ 登录错误:', error);
        throw error;
      }

      console.log('✅ 登录成功，完整认证数据:', JSON.stringify(data, null, 2));

      // 打印 Token 详细信息
      if (data.session) {
        console.log('🔑 Token 信息:', {
          accessToken: data.session.access_token ? '✅ 存在' : '❌ 不存在',
          tokenType: data.session.token_type,
          expiresIn: data.session.expires_in,
          expiresAt: new Date(data.session.expires_at * 1000).toLocaleString(),
          userId: data.session.user?.id
        });
      }

      // 额外验证用户信息
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ 获取用户信息错误:', userError);
        throw userError;
      }

      console.log('👤 当前登录用户:', JSON.stringify(user, null, 2));
      
      set({ user, loading: false });
    } catch (error) {
      console.error('❌ 登录过程中发生错误:', error);
      throw error;
    }
  },
  signUp: async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null });
  },
  setUser: (user) => set({ user, loading: false }),
}));