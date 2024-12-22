import React, { useEffect } from 'react';
import { AddBookmark } from './components/AddBookmark';
import { FilterBar } from './components/FilterBar';
import { BookmarkList } from './components/BookmarkList';
import { Header } from './components/Header';
import { ViewMode } from './types';
import { useBookmarks } from './hooks/useBookmarks';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase';

export default function App() {
  const { bookmarks, addBookmark, deleteBookmark } = useBookmarks();
  const [search, setSearch] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  const availableTags = Array.from(
    new Set(bookmarks.flatMap(bookmark => bookmark.tags))
  );

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = search === '' ||
      bookmark.title.toLowerCase().includes(search.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(search.toLowerCase()) ||
      bookmark.description?.toLowerCase().includes(search.toLowerCase());

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => bookmark.tags.includes(tag));

    return matchesSearch && matchesTags;
  });

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AddBookmark 
          onAdd={addBookmark} 
          bookmarks={bookmarks} 
        />
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedTags={selectedTags}
          availableTags={availableTags}
          onTagToggle={handleTagToggle}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <BookmarkList
          bookmarks={filteredBookmarks}
          viewMode={viewMode}
          onDeleteBookmark={deleteBookmark}
        />
      </main>
    </div>
  );
}