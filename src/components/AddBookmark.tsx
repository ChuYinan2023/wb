import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddBookmarkProps {
  onAdd: (url: string, tags: string[], title?: string, description?: string, keywords?: string[], favicon?: string, summary?: string) => void;
}

export function AddBookmark({ onAdd }: AddBookmarkProps) {
  const [url, setUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [favicon, setFavicon] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [summary, setSummary] = useState('');

  const isValidUrl = (url: string): boolean => {
    try {
      // 更宽松的 URL 校验
      const parsedUrl = new URL(url.includes('://') ? url : `https://${url}`);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  };

  const fetchFavicon = async (url: string) => {
    try {
      const response = await fetch(import.meta.env.DEV 
        ? 'http://localhost:8888/.netlify/functions/get-favicon'
        : '/.netlify/functions/get-favicon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (response.ok) {
        const data = await response.json();
        setFavicon(data.favicon);
      }
    } catch (error) {
      console.error('获取 favicon 失败:', error);
    }
  };

  const fetchPageTitle = async (url: string) => {
    try {
      console.log('开发环境:', import.meta.env.DEV);
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:8888/.netlify/functions/get-page-title'
        : '/.netlify/functions/get-page-title';
      
      console.log('请求 URL:', apiUrl);
      console.log('目标网页 URL:', url);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      console.log('响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('获取的标题数据:', data);
        setTitle(data.title);
        return data.title;
      } else {
        const errorText = await response.text();
        console.error('获取标题失败，响应内容:', errorText);
        // 如果获取失败，尝试从 URL 中提取域名
        const hostname = new URL(url).hostname.replace('www.', '');
        setTitle(hostname);
        return hostname;
      }
    } catch (error) {
      console.error('获取页面标题失败，详细错误:', error);
      // 如果完全失败，使用 URL 作为标题
      const hostname = new URL(url).hostname.replace('www.', '');
      setTitle(hostname);
      return hostname;
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

  const extractSummary = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(import.meta.env.DEV 
        ? 'http://localhost:8888/.netlify/functions/extract-summary'
        : '/.netlify/functions/extract-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (response.ok) {
        const data = await response.json();
        const newSummary = data.summary || '';
        
        console.log('提取的摘要:', newSummary);
        setSummary(newSummary);
        return newSummary;
      } else {
        const errorText = await response.text();
        console.error('摘要提取失败，状态码:', response.status);
        console.error('错误响应:', errorText);
        setSummary('');
        return '';
      }
    } catch (error) {
      console.error('摘要提取异常:', error);
      setSummary('');
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidUrl(url)) {
      setError('请输入有效的网页链接');
      return;
    }

    setIsLoading(true);

    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;

      // 并行获取标题、关键词、摘要和 favicon
      const [extractedTitle, extractedKeywords, extractedSummary, extractedFavicon] = await Promise.all([
        fetchPageTitle(fullUrl),
        extractKeywords(fullUrl),
        extractSummary(fullUrl),
        fetchFavicon(fullUrl)
      ]);

      // 使用获取的数据调用 onAdd
      onAdd(
        fullUrl, 
        tags, 
        extractedTitle || title || fullUrl, 
        '', 
        extractedKeywords, 
        favicon, 
        extractedSummary
      );

      // 重置表单
      setUrl('');
      setTags([]);
      setTagInput('');
      setTitle(null);
      setFavicon(null);
      setSummary('');
      setKeywords([]);
    } catch (err) {
      console.error('添加书签失败:', err);
      setError('添加书签时发生错误');
    } finally {
      setIsLoading(false);
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