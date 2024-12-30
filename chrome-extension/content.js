// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addBookmark') {
    // 可以在这里执行一些页面内操作
    console.log('接收到添加书签请求:', request.url);
    
    // 示例：可以尝试获取页面额外信息
    const pageInfo = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content')?.split(',') || []
    };

    // 发送完整的页面信息
    chrome.runtime.sendMessage({
      action: 'bookmarkDetails',
      url: request.url,
      ...pageInfo
    });
  }
});
