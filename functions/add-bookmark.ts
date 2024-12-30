import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// 确保在 Netlify 环境变量中设置这些值
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface BookmarkRequest {
  url: string;
  tags?: string[];
  title?: string;
  description?: string;
  keywords?: string[];
  favicon?: string;
  summary?: string;
}

const handler: Handler = async (event, context) => {
  // 处理 OPTIONS 请求（用于跨域）
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: ''
    };
  }

  // 检查是否是 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: '只支持 POST 方法' })
    };
  }

  // 验证授权
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: '未授权：缺少有效的令牌' })
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    // 解析请求体
    const requestBody: BookmarkRequest = JSON.parse(event.body || '{}');
    const { 
      url, 
      tags = [], 
      title = url, 
      description = '', 
      keywords = [],
      favicon,
      summary = ''
    } = requestBody;

    if (!url) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'URL 不能为空' })
      };
    }

    // 获取用户信息（假设令牌中包含用户 ID）
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: '无效的用户令牌' })
      };
    }

    // 生成默认缩略图
    const defaultThumbnail = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;

    // 插入书签
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        url: url,
        title: title,
        description: description,
        tags: tags,
        thumbnail: favicon || defaultThumbnail,
        keywords: keywords.length > 0 ? keywords : null,
        summary: summary
      })
      .select();

    if (error) {
      console.error('插入书签错误:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: '保存书签失败', 
          details: error.message,
          code: error.code
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        bookmark: data[0]
      })
    };

  } catch (error) {
    console.error('处理书签请求时发生错误:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: '服务器内部错误', 
        details: String(error) 
      })
    };
  }
};

export { handler };
