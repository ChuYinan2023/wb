import React, { useState } from 'react';
import { ExternalLink, Tag, Trash2, Globe } from 'lucide-react';
import { Bookmark } from '../types';
import { getRelativeTime } from '../utils/dateUtils';

interface BookmarkCardProps {
  bookmark: Bookmark;
  viewMode: 'grid' | 'list' | 'masonry';
  onDelete: (id: string) => void;
}

export function BookmarkCard({ bookmark, viewMode, onDelete }: BookmarkCardProps) {
  const [showDelete, setShowDelete] = useState(false);

  const cardClass = viewMode === 'list'
    ? 'flex gap-4 items-start'
    : 'flex flex-col';

  return (
    <div 
      className={`group bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow ${cardClass}`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden bg-gray-100">
            {bookmark.thumbnail ? (
              <img
                src={bookmark.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Globe className="text-gray-400" size={20} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate"
              >
                {bookmark.title || bookmark.url}
                <ExternalLink size={16} />
              </a>
              <button
                onClick={() => onDelete(bookmark.id)}
                className={`p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all ${
                  showDelete ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-500 truncate mb-2">{bookmark.url}</p>
          </div>
        </div>
        
        {bookmark.description && (
          <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
            {bookmark.description}
          </p>
        )}

        {bookmark.keywords && bookmark.keywords.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Keywords:</p>
            <p className="text-sm text-gray-600">{bookmark.keywords.join(', ')}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {bookmark.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
            >
              <Tag size={12} />
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className={`text-sm text-gray-500 ${viewMode === 'list' ? 'text-right' : 'mt-3'}`}>
        {getRelativeTime(new Date(bookmark.createdAt))}
      </div>
    </div>
  );
}