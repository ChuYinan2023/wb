// 配置 Netlify Function 的基础 URL
const NETLIFY_FUNCTION_BASE_URL = 'https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions';
const FUNCTION_NAME = 'add-bookmark';

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveBookmark',
    title: '保存到书签库',
    contexts: ['page', 'link']
  });
});

// 右键菜单点击事件处理
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    // 获取用户 token
    const { user_token } = await chrome.storage.local.get('user_token');

    if (!user_token || !user_token.token) {
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

    console.log('尝试保存书签:', { 
      url, 
      tokenPresent: !!user_token.token 
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
        tags: []  // 不传入标签
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
