import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
console.log('Supabase Anon Key Length:', process.env.VITE_SUPABASE_ANON_KEY?.length);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '', 
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

console.log('Supabase Client Created');

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

    console.log('Supabase Login Result:', {
      data: data ? 'Received' : 'No Data',
      error: error ? error.message : 'No Error'
    });

    if (error) {
      console.error('Supabase Login Error:', {
        message: error.message,
        status: error.status,
        details: error.details
      });

      return { 
        statusCode: 401, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ 
          success: false, 
          message: error.message || '登录失败',
          details: error.details
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
