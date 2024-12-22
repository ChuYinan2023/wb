const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const { ZhipuAI } = require('zhipuai');

const app = express();
const port = 8888;

app.use(cors());
app.use(bodyParser.json());

app.post('/.netlify/functions/extract-keywords', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // 获取网页内容
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const htmlContent = response.data;

    // 使用 cheerio 提取主要文本内容
    const $ = cheerio.load(htmlContent);
    
    // 移除脚本、样式和不需要的标签
    $('script, style, nav, header, footer, aside').remove();
    
    // 提取主要文本内容
    const mainText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);

    // 使用 ZhipuAI 提取关键词
    const client = new ZhipuAI(process.env.ZHIPUAI_API_KEY || '');
    
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

    res.status(200).json({ keywords });
  } catch (error) {
    console.error('Keyword extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract keywords', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.listen(port, () => {
  console.log(`本地函数服务器运行在 http://localhost:${port}`);
});
