import React from 'react';
import { Search, LayoutGrid, List, Layout } from 'lucide-react';
import { ViewMode } from '../types';

interface FilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  selectedTags: string[];
  availableTags: string[];
  onTagToggle: (tag: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function FilterBar({
  search,
  onSearchChange,
  selectedTags,
  availableTags,
  onTagToggle,
  viewMode,
  onViewModeChange,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search bookmarks..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => onViewModeChange('masonry')}
            className={`p-2 rounded ${viewMode === 'masonry' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
          >
            <Layout size={20} />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
          >
            <List size={20} />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableTags.map(tag => (
          <button
            key={tag}
            onClick={() => onTagToggle(tag)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedTags.includes(tag)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}