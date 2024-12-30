import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '', 
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const handler: Handler = async (event, context) => {
  // 只处理 POST 请求
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ success: false, message: '只支持 POST 方法' }) 
    };
  }

  try {
    const { email, password } = JSON.parse(event.body || '{}');

    console.log('登录尝试:', { email, password: password ? '******' : '无密码' });
    console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
    console.log('Supabase Anon Key:', process.env.VITE_SUPABASE_ANON_KEY ? '已配置' : '未配置');

    if (!email || !password) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ success: false, message: '邮箱和密码不能为空' }) 
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ 
          success: false, 
          message: error.message || '登录失败' 
        }) 
      };
    }

    return { 
      statusCode: 200, 
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // 允许跨域
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        success: true, 
        token: data.session?.access_token,
        email: data.user?.email
      }) 
    };
  } catch (err: any) {
    console.error('登录错误:', err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        success: false, 
        message: err.message || '服务器错误' 
      }) 
    };
  }
};

export { handler };
