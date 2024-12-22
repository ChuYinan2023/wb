import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddBookmarkProps {
  onAdd: (url: string, tags: string[], title?: string, description?: string) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    
    // 更宽松的 URL 校验
    if (trimmedUrl && (isValidUrl(trimmedUrl))) {
      // 如果没有协议，自动添加 https://
      const formattedUrl = trimmedUrl.includes('://') ? trimmedUrl : `https://${trimmedUrl}`;
      onAdd(formattedUrl, [...tags, ...keywords]);
      setUrl('');
      setTags([]);
      setKeywords([]);
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

  const extractKeywords = async () => {
    if (!url) return;

    setIsLoading(true);
    setError(''); // 清除之前的错误
    try {
      console.log('发起关键词提取请求，URL:', url);
      
      // 确保 URL 是完整的
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

      console.log('响应状态:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('错误响应内容:', errorText);
        throw new Error(errorText || '关键词提取失败');
      }

      const data = await response.json();
      console.log('响应数据:', data);
      
      const newKeywords = data.keywords || [];
      
      console.log('提取的关键词:', newKeywords);
      
      // 添加新关键词，避免重复
      const uniqueKeywords = newKeywords.filter(
        (keyword: string) => !keywords.includes(keyword)
      );
      
      setKeywords([...keywords, ...uniqueKeywords]);
      setError('');
    } catch (err: any) {
      console.error('关键词提取失败', err);
      
      setError('关键词提取失败：' + (err.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
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
        <button
          type="button"
          onClick={extractKeywords}
          disabled={!url || isLoading}
          className={`px-4 py-2 rounded-md transition-colors ${
            !url || isLoading 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isLoading ? '提取中...' : '提取关键词'}
        </button>
      </div>
      
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}
      
      {/* 关键词显示区域 */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {keywords.map((keyword, index) => (
            <span 
              key={index} 
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
            >
              {keyword}
              <button 
                type="button"
                onClick={() => removeTag(keyword)}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
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
      <button
        type="submit"
        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
      >
        <Plus size={20} />
        Add
      </button>
    </form>
  );
}