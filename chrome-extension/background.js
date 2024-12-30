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

// 右键菜单点击事件处理
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    // 获取用户 token 和 Function Base URL
    const { user_token } = await chrome.storage.local.get('user_token');
    const NETLIFY_FUNCTION_BASE_URL = await getNetlifyFunctionBaseUrl();
    const FUNCTION_NAME = 'add-bookmark';

    console.log('保存书签 - 用户 Token 信息:', {
      tokenExists: !!user_token,
      tokenType: typeof user_token,
      tokenKeys: user_token ? Object.keys(user_token) : 'No token'
    });

    if (!user_token || !user_token.token) {
      console.error('未登录：缺少有效的用户令牌');
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: '未登录',
        message: '请先登录书签管理器'
      });
      return;
    }

    // 获取要保存的 URL
    const url = info.linkUrl || info.pageUrl;

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

    // 调用 Netlify Function 添加书签
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

    // 发送保存成功的通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: '书签保存成功',
      message: `已将 ${url} 添加到书签库`
    });

  } catch (error) {
    console.error('右键菜单保存书签失败:', error);

    // 发送保存失败的通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: '书签保存失败',
      message: `无法保存书签：${error.message}`
    });
  }
});
