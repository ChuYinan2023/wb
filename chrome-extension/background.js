// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addBookmark',
    title: '添加到书签库',
    contexts: ['page', 'link']
  });
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = info.linkUrl || info.pageUrl;
  
  // 发送消息到当前活动标签页
  chrome.tabs.sendMessage(tab.id, {
    action: 'addBookmark',
    url: url
  });
});

// 处理从弹窗发送的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addBookmark') {
    console.log('准备添加书签:', {
      url: request.url,
      tags: request.tags,
      tokenProvided: !!request.token
    });
    
    if (!request.url) {
      console.error('添加书签失败：缺少 URL');
      return;
    }

    // 确保 URL 是完整的
    const fullUrl = request.url.startsWith('http') 
      ? request.url 
      : `https://${request.url}`;

    // 构建更详细的 URL
    const addBookmarkUrl = new URL('https://tranquil-marigold-0af3ab.netlify.app/add');
    addBookmarkUrl.searchParams.set('url', fullUrl);
    
    // 添加标签
    if (request.tags && request.tags.length > 0) {
      addBookmarkUrl.searchParams.set('tags', request.tags.join(','));
    }
    
    // 添加 token
    if (request.token) {
      addBookmarkUrl.searchParams.set('token', request.token);
    }

    // 打开添加书签页面
    chrome.tabs.create({ 
      url: addBookmarkUrl.toString()
    }, (tab) => {
      console.log('已打开添加书签页面:', tab);
    });
  }
});
