import { Handler } from '@netlify/functions';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

    // 获取网页内容
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10秒超时
    });

    const htmlContent = response.data;

    // 使用 cheerio 提取标题
    const $ = cheerio.load(htmlContent);
    const title = $('title').text().trim() || new URL(url).hostname;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ title })
    };
  } catch (error) {
    console.error('Page title extraction error:', error);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ 
        error: 'Failed to extract page title', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }) 
    };
  }
};
