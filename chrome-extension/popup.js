document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const bookmarkSection = document.getElementById('bookmarkSection');
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  const emailInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');
  const errorMessage = document.getElementById('errorMessage');
  const userEmail = document.getElementById('userEmail');
  const urlInput = document.getElementById('urlInput');
  const addButton = document.getElementById('addButton');

  // 从 Chrome 存储中获取 Netlify Function 的基础 URL
  const getNetlifyFunctionBaseUrl = async () => {
    const { netlifyFunctionBaseUrl } = await chrome.storage.local.get('netlifyFunctionBaseUrl');
    return netlifyFunctionBaseUrl || 'https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions';
  };

  // 获取页面标题
  const getPageTitle = async (url) => {
    try {
      const response = await fetch(`https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions/get-page-title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });
      const result = await response.json();
      return result.title || url;
    } catch (error) {
      console.error('获取页面标题失败:', error);
      return url;
    }
  };

  // 获取关键词
  const getKeywords = async (url) => {
    try {
      const response = await fetch(`https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions/extract-keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });
      const result = await response.json();
      return result.keywords || [];
    } catch (error) {
      console.error('获取关键词失败:', error);
      return [];
    }
  };

  // 获取网站图标
  const getFavicon = async (url) => {
    try {
      const response = await fetch(`https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions/get-favicon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });
      const result = await response.json();
      return result.favicon || null;
    } catch (error) {
      console.error('获取网站图标失败:', error);
      return null;
    }
  };

  // 检查登录状态
  const checkAuthStatus = async () => {
    const { user_token } = await chrome.storage.local.get('user_token');
    
    if (user_token && user_token.email) {
      loginSection.style.display = 'none';
      bookmarkSection.style.display = 'block';
      userEmail.textContent = user_token.email;
      
      // 获取当前活动标签页的 URL
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        urlInput.value = tabs[0].url;
      });
    } else {
      loginSection.style.display = 'block';
      bookmarkSection.style.display = 'none';
    }
  };

  // 登录
  loginButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      errorMessage.textContent = '请输入邮箱和密码';
      return;
    }

    try {
      // 发送登录请求到您的 Web 应用
      const response = await fetch('https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.success) {
        // 保存用户 token 和邮箱
        await chrome.storage.local.set({
          'user_token': {
            token: result.token,
            email: email
          }
        });
        
        await checkAuthStatus();
      } else {
        errorMessage.textContent = result.message || '登录失败：未知错误';
        console.error('Login Failed:', result);
      }
    } catch (error) {
      errorMessage.textContent = '登录出错：' + error.message;
      console.error('Login Fetch Error:', error);
    }
  });

  // 退出登录
  logoutButton.addEventListener('click', async () => {
    await chrome.storage.local.remove('user_token');
    await checkAuthStatus();
  });

  // 添加书签
  addButton.addEventListener('click', async () => {
    try {
      const { user_token } = await chrome.storage.local.get('user_token');
      const NETLIFY_FUNCTION_BASE_URL = await getNetlifyFunctionBaseUrl();
      const FUNCTION_NAME = 'add-bookmark';

      if (!user_token || !user_token.token) {
        errorMessage.textContent = '请先登录';
        return;
      }

      const url = urlInput.value.trim();

      if (!url) {
        errorMessage.textContent = '请输入有效的URL';
        return;
      }

      // 获取额外的页面信息
      const [title, keywords, favicon] = await Promise.all([
        getPageTitle(url),
        getKeywords(url),
        getFavicon(url)
      ]);

      console.log('尝试保存书签:', { 
        url, 
        title,
        keywords,
        favicon,
        tokenPresent: !!user_token.token,
        functionBaseUrl: NETLIFY_FUNCTION_BASE_URL
      });

      // 直接调用 Netlify Function 添加书签
      const fullFunctionUrl = `${NETLIFY_FUNCTION_BASE_URL}/${FUNCTION_NAME}`;
      console.log('Function URL:', fullFunctionUrl);

      const response = await fetch(fullFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user_token.token}`
        },
        body: JSON.stringify({
          url: url.startsWith('http') ? url : `https://${url}`,
          title: title,
          tags: [],
          keywords: keywords,
          favicon: favicon
        })
      });

      console.log('响应状态:', response.status);
      console.log('响应头:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('详细错误内容:', errorText);
        throw new Error(`HTTP错误! 状态: ${response.status}, 详情: ${errorText}`);
      }

      const result = await response.json();
      console.log('服务器响应:', result);

      if (result.success) {
        errorMessage.style.color = 'green';
        errorMessage.textContent = '书签保存成功！';
        
        // 可选：关闭插件窗口
        window.close();
      } else {
        errorMessage.style.color = 'red';
        errorMessage.textContent = result.error || '书签保存失败';
      }
    } catch (error) {
      console.error('保存书签失败:', error);
      errorMessage.style.color = 'red';
      errorMessage.textContent = `保存书签错误：${error.message || '请重试'}`;
    }
  });

  // 初始化时检查登录状态
  checkAuthStatus();
});
