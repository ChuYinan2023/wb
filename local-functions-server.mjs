import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ZhipuAI } from 'zhipuai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();
const port = 8888;

// 配置 CORS 中间件
const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS origin:', origin);
    // 允许所有源，包括 null（本地开发）
    callback(null, true);
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// 详细的日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('完整请求头:', req.headers);
  console.log('请求体:', req.body);
  next();
});

app.use(cors(corsOptions));
app.use(bodyParser.json());

// 处理预检请求
app.options('/.netlify/functions/extract-keywords', cors(corsOptions));
app.options('/.netlify/functions/get-favicon', cors(corsOptions));
app.options('/.netlify/functions/get-page-title', cors(corsOptions));

app.post('/.netlify/functions/extract-keywords', async (req, res) => {
  console.log('收到关键词提取请求，完整请求体:', JSON.stringify(req.body, null, 2));

  try {
    const { url } = req.body;

    if (!url) {
      console.error('URL 不能为空');
      return res.status(400).json({ error: 'URL is required' });
    }

    // 检查 API Key
    const apiKey = process.env.ZHIPUAI_API_KEY;
    if (!apiKey) {
      console.error('未找到 ZHIPUAI_API_KEY');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // 获取网页内容
    let response;
    try {
      console.log('准备获取网页内容，URL:', url);
      response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10秒超时
      });
      console.log('网页内容获取成功');
    } catch (fetchError) {
      console.error('获取网页内容失败:', fetchError.message);
      return res.status(500).json({ 
        error: 'Failed to fetch webpage', 
        details: fetchError.message 
      });
    }

    const htmlContent = response.data;

    // 使用 cheerio 提取主要文本内容
    const $ = cheerio.load(htmlContent);
    
    // 移除脚本、样式和不需要的标签
    $('script, style, nav, header, footer, aside').remove();
    
    // 提取主要文本内容
    const mainText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);

    if (!mainText) {
      console.error('未提取到网页文本内容');
      return res.status(400).json({ error: 'No text content found' });
    }

    console.log('提取的文本长度:', mainText.length);

    // 使用 ZhipuAI 提取关键词
    console.log('初始化 ZhipuAI 客户端，API Key:', apiKey.substring(0, 10) + '...');
    const client = new ZhipuAI({
      apiKey: apiKey
    });
    
    let aiResponse;
    try {
      console.log('准备调用 AI 接口');
      aiResponse = await client.chat.completions.create({
        model: "glm-4v-flash",  // 使用更通用的模型
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
      console.log('AI 接口调用成功:', JSON.stringify(aiResponse, null, 2));
    } catch (aiError) {
      console.error('AI 关键词提取失败:', aiError);
      return res.status(500).json({ 
        error: 'Failed to extract keywords with AI', 
        details: aiError.message,
        fullError: aiError
      });
    }

    // 提取关键词
    const keywords = aiResponse.choices[0]?.message?.content
      ?.split(/[,，]/)
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0)
      .slice(0, 5) || [];

    console.log('提取的关键词:', keywords);

    res.status(200).json({ keywords });
  } catch (error) {
    console.error('关键词提取总错误:', error);
    res.status(500).json({ 
      error: 'Failed to extract keywords', 
      details: error instanceof Error ? error.message : 'Unknown error',
      fullError: error
    });
  }
});

// 添加 favicon 处理程序
app.post('/.netlify/functions/get-favicon', async (req, res) => {
  console.log('收到 favicon 请求，完整请求体:', JSON.stringify(req.body, null, 2));

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;

    const faviconResponse = await axios.get(faviconUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000
    });

    const base64Favicon = `data:image/png;base64,${Buffer.from(faviconResponse.data, 'binary').toString('base64')}`;

    return res.status(200).json({ favicon: base64Favicon });
  } catch (error) {
    console.error('Favicon extraction error:', error);
    return res.status(500).json({ 
      error: 'Failed to extract favicon', 
      details: error.message 
    });
  }
});

// 添加页面标题处理程序
app.post('/.netlify/functions/get-page-title', async (req, res) => {
  console.log('收到页面标题请求，完整请求体:', JSON.stringify(req.body, null, 2));

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const htmlContent = response.data;
    const $ = cheerio.load(htmlContent);
    const title = $('title').text().trim() || new URL(url).hostname;

    return res.status(200).json({ title });
  } catch (error) {
    console.error('Page title extraction error:', error);
    return res.status(500).json({ 
      error: 'Failed to extract page title', 
      details: error.message 
    });
  }
});

// 添加错误处理中间件
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(500).json({
    error: 'Unexpected server error',
    details: err.message,
    fullError: err
  });
});

app.listen(port, () => {
  console.log(`本地函数服务器运行在 http://localhost:${port}`);
});
