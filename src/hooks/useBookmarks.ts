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

  const addBookmark = async (url: string, tags: string[]) => {
    if (!user) return;

    try {
      // In a real app, you'd fetch metadata from the URL here
      const newBookmark = {
        user_id: user.id,
        url,
        title: 'New Bookmark',
        description: 'This is a placeholder description.',
        tags,
        thumbnail: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=32&h=32&fit=crop&auto=format',
        keywords: ['placeholder', 'new', 'bookmark']
      };
      
      const { error } = await supabase
        .from('bookmarks')
        .insert(newBookmark);

      if (error) throw error;
      
      await fetchBookmarks();
    } catch (error) {
      console.error('Error adding bookmark:', error);
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