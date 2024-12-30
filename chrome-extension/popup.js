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

  // 配置 Netlify Function 的基础 URL
  const NETLIFY_FUNCTION_BASE_URL = 'https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions';

  // 添加书签
  addButton.addEventListener('click', async () => {
    try {
      const { user_token } = await chrome.storage.local.get('user_token');

      if (!user_token || !user_token.token) {
        errorMessage.textContent = '请先登录';
        return;
      }

      const url = urlInput.value.trim();

      if (!url) {
        errorMessage.textContent = '请输入有效的URL';
        return;
      }

      // 直接调用 Netlify Function 添加书签
      const functionUrl = `${NETLIFY_FUNCTION_BASE_URL}/add-bookmark`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user_token.token}`
        },
        body: JSON.stringify({
          url: url.startsWith('http') ? url : `https://${url}`,
          tags: []  // 不传入标签
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP错误! 状态: ${response.status}, 详情: ${errorText}`);
      }

      const result = await response.json();

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
      errorMessage.style.color = 'red';
      errorMessage.textContent = `保存书签错误：${error.message || '请重试'}`;
    }
  });

  // 初始化时检查登录状态
  checkAuthStatus();
});
