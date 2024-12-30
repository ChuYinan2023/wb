// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addBookmark',
    title: '添加到书签库',
    contexts: ['page', 'link']
  });
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    // 获取用户 token
    const { user_token } = await chrome.storage.local.get('user_token');
    console.log('右键菜单添加书签 - Token:', user_token);

    if (!user_token || !user_token.token) {
      console.error('添加书签失败：未登录');
      return;
    }

    const url = info.linkUrl || info.pageUrl;
    console.log('右键菜单添加书签 - URL:', url);
    
    if (!url) {
      console.error('添加书签失败：缺少 URL');
      return;
    }

    // 直接调用 Netlify Function 添加书签
    const response = await fetch('https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions/add-bookmark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user_token.token}`
      },
      body: JSON.stringify({
        url: url.startsWith('http') ? url : `https://${url}`,
        tags: []
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('右键菜单添加书签成功');
      // 可以考虑发送桌面通知
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: '书签保存成功',
        message: `已将 ${url} 添加到书签库`
      });
    } else {
      console.error('右键菜单添加书签失败:', result.error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: '书签保存失败',
        message: result.error || '无法添加书签'
      });
    }
  } catch (error) {
    console.error('右键菜单添加书签发生错误:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: '书签保存错误',
      message: '网络错误，请重试'
    });
  }
});
