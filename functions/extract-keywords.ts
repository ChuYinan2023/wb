import { Handler } from '@netlify/functions';
import axios from 'axios';
import { ZhipuAI } from 'zhipuai';
import * as cheerio from 'cheerio';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler: Handler = async (event, context) => {
  // 允许跨域请求
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

    // 使用 cheerio 提取主要文本内容
    const $ = cheerio.load(htmlContent);
    
    // 移除脚本、样式和不需要的标签
    $('script, style, nav, header, footer, aside').remove();
    
    // 提取主要文本内容
    const mainText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);

    // 使用 ZhipuAI 提取关键词
    const apiKey = process.env.ZHIPUAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API Key 未配置', 
          details: 'ZHIPUAI_API_KEY 环境变量未设置' 
        })
      };
    }

    const client = new ZhipuAI({
      apiKey: apiKey
    });
    
    const aiResponse = await client.chat.completions.create({
      model: "glm-4v-flash",
      messages: [
        {
          role: "user",
          content: `请从以下网页内容中提取3-5个最重要的关键词。只返回关键词，用逗号分隔。
          
          网页内容：${mainText}`
        }
      ],
      top_p: 0.7,
      temperature: 0.9,
      max_tokens: 256
    });

    // 提取关键词
    const keywords = aiResponse.choices[0]?.message?.content
      ?.split(/[,，]/)
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0)
      .slice(0, 5) || [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ keywords })
    };
  } catch (error) {
    console.error('Keyword extraction error:', error);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ 
        error: 'Failed to extract keywords', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }) 
    };
  }
};
