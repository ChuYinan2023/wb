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
      // 如果未登录，可以发送通知或打开登录页面
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

    // 调用 Netlify Function 添加书签
    const response = await fetch('https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions/add-bookmark', {
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

    // 发送保存成功的通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: '书签保存成功',
      message: `已将 ${url} 添加到书签库`
    });

  } catch (error) {
    // 发送保存失败的通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: '书签保存失败',
      message: `无法保存书签：${error.message}`
    });

    console.error('右键菜单保存书签失败:', error);
  }
});
