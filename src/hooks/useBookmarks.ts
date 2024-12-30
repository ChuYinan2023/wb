import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { Database } from '../types/database';

type Bookmark = Database['public']['Tables']['bookmarks']['Row']

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    } else {
      setBookmarks([]);
    }
  }, [user]);

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return;
    }

    setBookmarks(data);
  };

  const addBookmark = async (
    url: string, 
    tags: string[], 
    title?: string, 
    description?: string, 
    keywords: string[] = [],
    favicon?: string,
    summary?: string
  ) => {
    console.log('🔍 调试：开始添加书签');
    console.log('🔑 本地存储用户(完整对象):', JSON.stringify(user, null, 2));
    
    if (!user) {
      console.error('❌ 错误：未登录用户');
      return null;
    }

    try {
      // 获取当前会话用户信息
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 会话信息(完整对象):', JSON.stringify(sessionData, null, 2));
      
      if (sessionError) {
        console.error('❌ 会话错误:', sessionError);
        return null;
      }

      // 额外验证用户ID
      const currentUser = sessionData?.session?.user;
      console.log('👤 当前认证用户(完整对象):', JSON.stringify(currentUser, null, 2));

      // 额外打印 auth.uid() 信息
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      console.log('🆔 supabase.auth.getUser()(完整对象):', JSON.stringify(authUser, null, 2));
      console.log('🆔 supabase.auth.getUser() Error:', authError);

      // 打印所有可能的用户ID和详细信息
      console.log('🔑 用户ID和详细信息对比:', {
        localUser: {
          id: user.id,
          email: user.email
        },
        sessionUser: {
          id: currentUser?.id,
          email: currentUser?.email
        },
        authUser: {
          id: authUser?.id,
          email: authUser?.email
        }
      });

      const bookmarkData = {
        user_id: authUser?.id || currentUser?.id || user.id, 
        url,
        title: title || '',
        description,
        tags,
        keywords,
        thumbnail: favicon,
        created_at: new Date().toISOString()
      };

      console.log('📝 准备插入的书签数据:', JSON.stringify(bookmarkData, null, 2));

      const { data, error } = await supabase
        .from('bookmarks')
        .insert(bookmarkData);

      if (error) {
        console.error('❌ 插入书签错误:', error);
        console.error('❌ 错误详情:', JSON.stringify(error, null, 2));
        return null;
      }

      console.log('✅ 书签添加成功:', data);
      return data;

    } catch (catchError) {
      console.error('❌ 捕获到未知错误:', catchError);
      return null;
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;
      
      await fetchBookmarks();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  return {
    bookmarks,
    addBookmark,
    deleteBookmark
  };
}