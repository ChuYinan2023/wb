import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddBookmarkProps {
  onAdd: (url: string, tags: string[]) => void;
}

export function AddBookmark({ onAdd }: AddBookmarkProps) {
  const [url, setUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  const isValidUrl = (url: string): boolean => {
    try {
      // 更宽松的 URL 校验
      const parsedUrl = new URL(url.includes('://') ? url : `https://${url}`);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    
    // 更宽松的 URL 校验
    if (trimmedUrl && (isValidUrl(trimmedUrl))) {
      // 如果没有协议，自动添加 https://
      const formattedUrl = trimmedUrl.includes('://') ? trimmedUrl : `https://${trimmedUrl}`;
      onAdd(formattedUrl, tags);
      setUrl('');
      setTags([]);
      setError('');
    } else {
      // 更具体的错误提示
      setError('请输入有效的网址（需要包含 http:// 或 https://）');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            placeholder="Enter URL to bookmark (e.g., https://example.com)"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
            }`}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={20} />
          Add
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="Add tags"
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={addTag}
          className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          Add Tag
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map(tag => (
            <span
              key={tag}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-blue-600"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </form>
  );
}