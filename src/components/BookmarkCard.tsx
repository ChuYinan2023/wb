import React, { useState } from 'react';
import { ExternalLink, Tag, Trash2, Globe, Bookmark as BookmarkIcon } from 'lucide-react';
import { Bookmark } from '../types';
import { getRelativeTime } from '../utils/dateUtils';

// 如果需要调试，可以取消注释并使用
// console.log('测试无效日期:', getRelativeTime('invalid date'));
// console.log('测试当前日期:', getRelativeTime(new Date()));
// console.log('测试字符串日期:', getRelativeTime('2024-01-01T00:00:00'));
// console.log('测试过去日期:', getRelativeTime(new Date('2023-01-01')));

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
        
        {bookmark.summary && (
          <div className="text-gray-600 mb-3 line-clamp-3 text-sm">
            {bookmark.summary}
          </div>
        )}

        {/* 关键词展示区域 */}
        {bookmark.keywords && bookmark.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {bookmark.keywords.map((keyword, index) => (
              <span 
                key={index} 
                className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
              >
                <BookmarkIcon size={12} className="text-purple-500" />
                {keyword}
              </span>
            ))}
          </div>
        )}

        {/* 标签展示区域 */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {bookmark.tags.map((tag, index) => (
              <span 
                key={index} 
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
              >
                <Tag size={12} className="text-blue-500" />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className={`text-sm text-gray-500 ${viewMode === 'list' ? 'text-right' : 'mt-3'}`}>
          {getRelativeTime(bookmark.created_at)}
        </div>
      </div>
    </div>
  );
}