import React from 'react';
import { BookmarkCard } from './BookmarkCard';
import { Bookmark, ViewMode } from '../types';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  viewMode: ViewMode;
  onDeleteBookmark: (id: string) => void;
}

export function BookmarkList({ bookmarks, viewMode, onDeleteBookmark }: BookmarkListProps) {
  const groupedBookmarks = bookmarks.reduce((groups, bookmark) => {
    const date = new Date(bookmark.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(bookmark);
    return groups;
  }, {} as Record<string, Bookmark[]>);

  const gridClass = viewMode === 'list'
    ? 'space-y-4'
    : viewMode === 'masonry'
    ? 'columns-1 sm:columns-2 lg:columns-3 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

  return (
    <div className="space-y-6">
      {Object.entries(groupedBookmarks).map(([date, bookmarks]) => (
        <div key={date}>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">{date}</h2>
          <div className={gridClass}>
            {bookmarks.map(bookmark => (
              <div key={bookmark.id} className={viewMode === 'masonry' ? 'mb-4 break-inside-avoid' : ''}>
                <BookmarkCard 
                  bookmark={bookmark} 
                  viewMode={viewMode}
                  onDelete={onDeleteBookmark}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}