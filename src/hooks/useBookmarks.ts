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
    // 使用 window.console 确保日志被正确输出
    window.console.log('🔍 调试：开始添加书签');
    window.console.warn('🚨 用户对象:', user);
  
    if (!user) {
      window.console.error('❌ 错误：未登录用户');
      return null;
    }

    try {
      // 获取当前会话用户信息
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
      window.console.warn('🔐 会话信息:', sessionData);
    
      if (sessionError) {
        window.console.error('❌ 会话错误:', sessionError);
        return null;
      }

      // 额外验证用户ID
      const currentUser = sessionData?.session?.user;

      // 额外打印 auth.uid() 信息
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      window.console.warn('🆔 supabase.auth.getUser() Error:', authError);

      // 使用警告级别的日志，增加可见性
      window.console.warn('%c🔑 用户ID对比', 'color: red; font-weight: bold; font-size: 16px', {
        localUserId: user?.id,
        sessionUserId: currentUser?.id,
        authUserId: authUser?.id
      });

      const bookmarkData = {
        user_id: authUser?.id || currentUser?.id || user?.id, 
        url,
        title: title || '',
        description,
        tags,
        keywords,
        thumbnail: favicon,
        created_at: new Date().toISOString()
      };

      window.console.warn('📝 准备插入的书签数据:', bookmarkData);

      const { data, error } = await supabase
        .from('bookmarks')
        .insert(bookmarkData);

      if (error) {
        window.console.error('❌ 插入书签错误:', error);
        window.console.error('❌ 错误详情:', JSON.stringify(error, null, 2));
        return null;
      }

      window.console.log('✅ 书签添加成功:', data);
      return data;

    } catch (catchError) {
      window.console.error('❌ 捕获到未知错误:', catchError);
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