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
    console.log('准备添加书签:', request.url);
    
    // 使用实际的 Web 应用地址
    chrome.tabs.create({ 
      url: `https://tranquil-marigold-0af3ab.netlify.app/add?url=${encodeURIComponent(request.url)}&tags=${encodeURIComponent(request.tags || '')}&token=${encodeURIComponent(request.token || '')}`
    });
  }
});
