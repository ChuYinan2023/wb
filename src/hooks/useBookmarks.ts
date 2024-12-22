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

  const addBookmark = async (url: string, tags: string[], keywords: string[] = []) => {
    if (!user) {
      console.error('用户未登录');
      alert('请先登录');
      return;
    }

    try {
      // 检查网络状态
      if (!navigator.onLine) {
        console.error('网络离线');
        alert('网络连接已断开');
        return;
      }

      // 检查 Supabase 配置
      if (!supabase) {
        console.error('Supabase 客户端未正确初始化');
        alert('Supabase 初始化失败');
        return;
      }

      // In a real app, you'd fetch metadata from the URL here
      const newBookmark = {
        user_id: user.id,
        url,
        title: url, // 使用 URL 作为默认标题
        description: '', // 清空描述
        tags,
        thumbnail: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=32&h=32&fit=crop&auto=format',
        keywords: keywords.length > 0 ? keywords : ['placeholder', 'new', 'bookmark']
      };
      
      console.log('尝试添加书签:', newBookmark);
      console.log('当前用户ID:', user.id);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      
      const { data, error } = await supabase
        .from('bookmarks')
        .insert(newBookmark)
        .select();

      if (error) {
        console.error('添加书签错误详情:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // 根据错误类型提供更具体的错误提示
        if (error.code === '42501') {
          alert('权限不足：无法添加书签。请检查登录状态和权限。');
        } else {
          alert(`添加书签失败：${error.message}`);
        }
        
        throw error;
      }

      console.log('书签添加成功:', data);
      
      await fetchBookmarks();
    } catch (error) {
      console.error('添加书签失败:', error);
      alert(`添加书签失败: ${error instanceof Error ? error.message : '未知错误'}`);
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