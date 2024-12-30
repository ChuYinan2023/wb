// 初始化 Netlify Function 基础 URL
chrome.runtime.onInstalled.addListener(async () => {
  // 你可以从环境变量、配置文件或其他方式获取正确的 URL
  const netlifyFunctionBaseUrl = 'https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions';
  
  await chrome.storage.local.set({
    'netlifyFunctionBaseUrl': netlifyFunctionBaseUrl
  });

  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'saveBookmark',
    title: '保存到书签库',
    contexts: ['page', 'link']
  });
});

// 从 Chrome 存储中获取 Netlify Function 的基础 URL 和用户 Token
const getNetlifyFunctionBaseUrl = async () => {
  try {
    // 获取 Function Base URL
    const { netlifyFunctionBaseUrl } = await chrome.storage.local.get('netlifyFunctionBaseUrl');
    
    // 获取用户 Token
    const { user_token } = await chrome.storage.local.get('user_token');

    console.log('%c🔍 获取存储信息', 'color: orange; font-weight: bold', {
      functionBaseUrl: netlifyFunctionBaseUrl,
      tokenExists: !!user_token,
      tokenType: typeof user_token
    });

    return {
      token: user_token?.token,
      netlifyFunctionBaseUrl: netlifyFunctionBaseUrl || 'https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions'
    };
  } catch (error) {
    console.error('%c❌ 获取存储信息失败', 'color: red; font-weight: bold', error);
    return {
      token: null,
      netlifyFunctionBaseUrl: 'https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions'
    };
  }
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

// 右键菜单点击事件处理
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    // 获取用户 token 和 Function Base URL
    const { token, netlifyFunctionBaseUrl } = await getNetlifyFunctionBaseUrl();

    // 调试：打印关键信息
    console.log('%c🔍 保存书签调试信息', 'color: green; font-weight: bold', {
      url: info.pageUrl || info.linkUrl,
      token: token ? '✅ Token存在' : '❌ Token不存在',
      functionBaseUrl: netlifyFunctionBaseUrl
    });

    const url = info.pageUrl || info.linkUrl;
    const title = await getPageTitle(url);
    const keywords = await getKeywords(url);
    const favicon = await getFavicon(url);

    // 调试：打印附加信息
    console.log('%c📝 书签详细信息', 'color: blue; font-weight: bold', {
      title,
      keywords,
      favicon
    });

    const bookmarkData = {
      url,
      title,
      keywords,
      favicon
    };

    const result = await fetch(`${netlifyFunctionBaseUrl}/add-bookmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bookmarkData)
    });

    // 调试：打印服务器响应
    const responseText = await result.text();
    console.log('%c🚀 服务器响应', 'color: purple; font-weight: bold', {
      status: result.status,
      responseText
    });

    if (!result.ok) {
      throw new Error(responseText);
    }

    console.log('服务器响应:', result);

    // 发送保存成功的通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: '书签保存成功',
      message: `已将 ${url} 添加到书签库`
    });

  } catch (error) {
    console.error('%c❌ 右键菜单保存书签失败', 'color: red; font-weight: bold', error);

    // 发送保存失败的通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: '书签保存失败',
      message: `无法保存书签：${error.message}`
    });
  }
});
