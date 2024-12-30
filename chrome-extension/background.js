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
