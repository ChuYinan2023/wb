import { Handler } from '@netlify/functions';
import axios from 'axios';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler: Handler = async (event, context) => {
  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // 检查请求方法和内容
    if (event.httpMethod !== 'POST') {
      return { 
        statusCode: 405, 
        headers,
        body: JSON.stringify({ error: 'Method Not Allowed' }) 
      };
    }

    // 解析请求体
    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'URL is required' }) 
      };
    }

    // 构建 favicon URL
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;

    // 尝试获取 favicon
    const faviconResponse = await axios.get(faviconUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000
    });

    // 将图片转换为 base64
    const base64Favicon = `data:image/png;base64,${Buffer.from(faviconResponse.data, 'binary').toString('base64')}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ favicon: base64Favicon })
    };
  } catch (error) {
    console.error('Favicon extraction error:', error);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ 
        error: 'Failed to extract favicon', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }) 
    };
  }
};
