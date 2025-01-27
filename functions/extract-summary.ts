import { Handler } from '@netlify/functions';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ZhipuAI } from 'zhipuai';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const extractMainText = async (url: string) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10秒超时
    });

    const htmlContent = response.data;
    const $ = cheerio.load(htmlContent);
    
    // 移除脚本、样式和不需要的标签
    $('script, style, nav, header, footer, aside').remove();
    
    // 提取主要文本内容
    const mainText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);

    return mainText;
  } catch (error) {
    console.error('Error extracting main text:', error);
    return null;
  }
};

export const handler: Handler = async (event) => {
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

    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'URL is required' }) 
      };
    }

    const mainText = await extractMainText(url);

    if (!mainText) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Unable to extract page content' })
      };
    }

    const client = new ZhipuAI.ChatCompletion({
      apiKey: process.env.ZHIPUAI_API_KEY
    });

    const aiResponse = await client.chat.completions.create({
      model: "glm-4v-flash",
      messages: [
        {
          role: "user",
          content: `生成一个简洁的摘要，不超过100个字。摘要应该捕捉以下网页内容的核心要点。

网页内容：${mainText}`
        }
      ],
      top_p: 0.7,
      temperature: 0.9,
      max_tokens: 256
    });

    const summary = aiResponse.choices[0]?.message?.content?.trim() || '';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ summary })
    };
  } catch (error) {
    console.error('Summary extraction error:', error);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ 
        error: 'Failed to extract summary', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }) 
    };
  }
};
