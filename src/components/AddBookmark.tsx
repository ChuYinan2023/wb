import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddBookmarkProps {
  onAdd: (url: string, tags: string[], title?: string, description?: string, keywords?: string[]) => void;
}

export function AddBookmark({ onAdd }: AddBookmarkProps) {
  const [url, setUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isValidUrl = (url: string): boolean => {
    try {
      // 更宽松的 URL 校验
      const parsedUrl = new URL(url.includes('://') ? url : `https://${url}`);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  };

  const extractKeywords = async (url: string) => {
    if (!url) return [];

    setIsLoading(true);
    setError('');
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      
      const response = await fetch(import.meta.env.DEV 
        ? 'http://localhost:8888/.netlify/functions/extract-keywords'
        : '/.netlify/functions/extract-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: fullUrl })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('错误响应内容:', errorText);
        return [];
      }

      const data = await response.json();
      const newKeywords = data.keywords || [];
      
      console.log('提取的关键词:', newKeywords);
      
      return newKeywords;
    } catch (err: any) {
      console.error('关键词提取失败', err);
      setError('关键词提取失败：' + (err.message || '未知错误'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    
    if (trimmedUrl && (isValidUrl(trimmedUrl))) {
      const formattedUrl = trimmedUrl.includes('://') ? trimmedUrl : `https://${trimmedUrl}`;
      
      const extractedKeywords = await extractKeywords(formattedUrl);
      
      onAdd(formattedUrl, tags, undefined, undefined, extractedKeywords);
      setUrl('');
      setTags([]);
      setKeywords(extractedKeywords);
      setError('');
    } else {
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
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入网页链接"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex gap-2 items-center mb-4">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="添加标签"
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
        />
        <button
          type="button"
          onClick={addTag}
          className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          添加标签
        </button>
      </div>
      
      {tags.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">标签：</span>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={20} />
          添加书签
        </button>
      </div>
    </form>
  );
}