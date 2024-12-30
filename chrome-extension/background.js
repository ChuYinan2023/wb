<<<<<<< HEAD
// 配置 Netlify Function 的基础 URL
const NETLIFY_FUNCTION_BASE_URL = 'https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions';
const FUNCTION_NAME = 'add-bookmark';

=======
>>>>>>> parent of c3703f3 (继续保存错误的bug)
// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addBookmark',
    title: '添加到书签库',
    contexts: ['page', 'link']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('创建右键菜单失败:', chrome.runtime.lastError);
    }
  });
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('右键菜单点击事件触发', { info, tab });

  // 使用 Promise 处理异步操作
  chrome.storage.local.get('user_token').then(({ user_token }) => {
    console.log('右键菜单添加书签 - Token:', user_token);

    if (!user_token || !user_token.token) {
      console.error('添加书签失败：未登录');
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: '添加书签失败',
        message: '请先登录'
      }, (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error('创建通知失败:', chrome.runtime.lastError);
        }
      });
      return;
    }

    const url = info.linkUrl || info.pageUrl;
    console.log('右键菜单添加书签 - URL:', url);
    
    if (!url) {
      console.error('添加书签失败：缺少 URL');
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: '添加书签失败',
        message: '无法获取网页地址'
      }, (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error('创建通知失败:', chrome.runtime.lastError);
        }
      });
      return;
    }

    // 直接调用 Netlify Function 添加书签
<<<<<<< HEAD
    const functionUrl = `${NETLIFY_FUNCTION_BASE_URL}/${FUNCTION_NAME}`;
    console.log('调用的完整 Function URL:', functionUrl);

    // 额外的调试信息
    console.log('Function 调用详情:', {
      baseUrl: NETLIFY_FUNCTION_BASE_URL,
      functionName: FUNCTION_NAME,
      fullUrl: functionUrl
    });

    fetch(functionUrl, {
=======
    fetch('https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions/add-bookmark', {
>>>>>>> parent of c3703f3 (继续保存错误的bug)
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user_token.token}`
      },
      body: JSON.stringify({
        url: url.startsWith('http') ? url : `https://${url}`,
        tags: []
      })
    })
    .then(response => {
      console.log('响应状态:', response.status);
      console.log('响应头:', Object.fromEntries(response.headers.entries()));
      
      // 检查响应状态
      if (!response.ok) {
        // 尝试获取错误信息
        return response.text().then(errorText => {
          console.error('详细错误内容:', errorText);
          throw new Error(`HTTP错误! 状态: ${response.status}, 详情: ${errorText}`);
        });
      }
      
      return response.json();
    })
    .then(result => {
      console.log('服务器响应:', result);

      if (result.success) {
        console.log('右键菜单添加书签成功');
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon128.png',
          title: '书签保存成功',
          message: `已将 ${url} 添加到书签库`
        }, (notificationId) => {
          if (chrome.runtime.lastError) {
            console.error('创建通知失败:', chrome.runtime.lastError);
          }
        });
      } else {
        console.error('右键菜单添加书签失败:', result.error);
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon128.png',
          title: '书签保存失败',
          message: result.error || '无法添加书签'
        }, (notificationId) => {
          if (chrome.runtime.lastError) {
            console.error('创建通知失败:', chrome.runtime.lastError);
          }
        });
      }
    })
    .catch(error => {
      console.error('右键菜单添加书签发生网络错误:', error);
      console.error('错误详细信息:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: '书签保存错误',
        message: `网络错误：${error.message || '请重试'}`
      }, (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error('创建通知失败:', chrome.runtime.lastError);
        }
      });
    });
  }).catch(error => {
    console.error('获取用户 Token 失败:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: '书签保存错误',
      message: `获取用户信息失败：${error.message || '无法获取用户信息'}`
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error('创建通知失败:', chrome.runtime.lastError);
      }
    });
  });
});
