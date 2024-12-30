import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// 确保在 Netlify 环境变量中设置这些值
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase 配置:', {
  url: supabaseUrl ? '✓' : '✗',
  anonKeyLength: supabaseAnonKey?.length || 0
});

// 创建 Supabase 客户端，启用详细日志
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: false
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
});

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
  console.log('收到书签请求:', {
    method: event.httpMethod,
    headers: JSON.stringify(event.headers),
    body: event.body
  });

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
    console.error('无效的 HTTP 方法:', event.httpMethod);
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
  console.log('授权头:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('缺少或无效的授权头:', authHeader);
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: '未授权：缺少有效的令牌' })
    };
  }

  const token = authHeader.split(' ')[1];
  console.log('Token 长度:', token.length);

  try {
    // 解析请求体
    const requestBody: BookmarkRequest = JSON.parse(event.body || '{}');
    console.log('解析后的请求体:', JSON.stringify(requestBody, null, 2));

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
      console.error('URL 为空');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'URL 不能为空' })
      };
    }

    // 获取用户信息（假设令牌中包含用户 ID）
    console.log('尝试获取用户信息...');
    
    // 尝试使用 verifyJWT 方法
    const { data: jwtData, error: jwtError } = await supabase.auth.getUser(token);
    
    console.log('JWT 验证结果:', {
      jwtData: jwtData ? '✅ 存在' : '❌ 不存在',
      jwtError: jwtError?.message || '无错误',
      fullToken: token ? `Token长度: ${token.length}` : '❌ Token为空'
    });

    // 如果 JWT 验证失败，尝试直接解析 Token
    if (jwtError || !jwtData.user) {
      try {
        // 手动解码 JWT（注意：这只是一个简单的演示，实际应用中应使用更安全的方法）
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('手动解析 Token:', {
            sub: payload.sub,
            email: payload.email
          });
        }
      } catch (decodeError) {
        console.error('Token 解析错误:', decodeError);
      }
    }

    const user = jwtData?.user;

    if (!user) {
      console.error('无法获取用户信息', {
        jwtError,
        userExists: !!user
      });
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: '无法验证用户身份', 
          details: jwtError?.message || '未知错误' 
        })
      };
    }

    // 生成默认缩略图
    const defaultThumbnail = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;

    // 插入书签
    console.log('尝试插入书签...');
    
    // 检查用户是否有权限
    const { data: permissionCheck, error: permissionError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    console.log('权限检查结果:', {
      permissionCheck,
      permissionError
    });

    if (permissionError) {
      console.error('权限检查错误:', permissionError);
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: '权限不足', 
          details: permissionError.message 
        })
      };
    }

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

    console.log('书签插入结果:', {
      dataExists: !!data,
      errorExists: !!error,
      errorMessage: error?.message,
      errorCode: error?.code
    });

    if (error) {
      console.error('插入书签错误:', {
        error,
        bookmarkData: {
          user_id: user.id,
          url,
          title,
          description,
          tags,
          thumbnail: favicon || defaultThumbnail,
          keywords,
          summary
        }
      });
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: '保存书签失败', 
          details: error.message,
          code: error.code,
          suggestion: '请检查数据库权限设置'
        })
      };
    }

    console.log('书签保存成功:', data[0]);

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
