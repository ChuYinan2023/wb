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
    const token = await chrome.storage.local.get('user_token');
    if (token && token.email) {
      loginSection.style.display = 'none';
      bookmarkSection.style.display = 'block';
      userEmail.textContent = `欢迎，${token.email}`;
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
      const response = await fetch('/.netlify/functions/login', {
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
        errorMessage.textContent = result.message || '登录失败';
      }
    } catch (error) {
      errorMessage.textContent = '登录出错：' + error.message;
    }
  });

  // 退出登录
  logoutButton.addEventListener('click', async () => {
    await chrome.storage.local.remove('user_token');
    await checkAuthStatus();
  });

  // 添加书签
  addButton.addEventListener('click', async () => {
    const tokenData = await chrome.storage.local.get('user_token');
    if (!tokenData || !tokenData.token) {
      errorMessage.textContent = '请先登录';
      return;
    }

    const url = urlInput.value.trim();
    const tags = tagsInput.value.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    if (url) {
      chrome.runtime.sendMessage({
        action: 'addBookmark',
        url: url,
        tags: tags,
        token: tokenData.token
      });

      // 关闭弹窗
      window.close();
    }
  });

  // 从当前活动标签获取 URL
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    urlInput.value = tabs[0].url;
  });

  // 初始化时检查登录状态
  checkAuthStatus();
});
