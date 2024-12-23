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

      console.log('添加书签详细信息:', { 
        url, 
        tags, 
        title, 
        description, 
        keywords, 
        favicon, 
        summary 
      });

      const newBookmark = {
        user_id: user.id,
        url,
        title: title || url,
        description: description || '',
        tags,
        thumbnail: favicon || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`,
        keywords: keywords && keywords.length > 0 ? keywords : null,
        summary: summary || ''
      };

      console.log('准备插入的书签数据:', newBookmark);
      
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