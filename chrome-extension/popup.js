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
  const tagsInput = document.getElementById('tagsInput');
  const addButton = document.getElementById('addButton');

  // 检查登录状态
  const checkAuthStatus = async () => {
    const { user_token } = await chrome.storage.local.get('user_token');
    console.log('Auth Status Check:', user_token);
    
    if (user_token && user_token.email) {
      loginSection.style.display = 'none';
      bookmarkSection.style.display = 'block';
      userEmail.textContent = `欢迎，${user_token.email}`;
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

      console.log('Login Response Status:', response.status);
      
      const result = await response.json();
      console.log('Login Response Body:', result);

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
      console.log('Add Bookmark - Token Data:', user_token);

      if (!user_token || !user_token.token) {
        errorMessage.textContent = '请先登录';
        console.error('添加书签失败：未登录');
        return;
      }

      const url = urlInput.value.trim();
      const tags = tagsInput.value.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');

      console.log('Add Bookmark - Details:', { 
        url, 
        tags, 
        tokenLength: user_token.token.length 
      });

      if (url) {
        chrome.runtime.sendMessage({
          action: 'addBookmark',
          url: url,
          tags: tags,
          token: user_token.token
        }, (response) => {
          console.log('Add Bookmark - Message Send Response:', response);
        });

        // 关闭弹窗
        window.close();
      } else {
        console.error('添加书签失败：URL为空');
        errorMessage.textContent = '请输入有效的URL';
      }
    } catch (error) {
      console.error('添加书签发生错误:', error);
      errorMessage.textContent = '添加书签出错：' + error.message;
    }
  });

  // 从当前活动标签获取 URL
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    urlInput.value = tabs[0].url;
  });

  // 初始化时检查登录状态
  checkAuthStatus();
});
