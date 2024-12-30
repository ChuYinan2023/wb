document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('urlInput');
  const tagsInput = document.getElementById('tagsInput');
  const addButton = document.getElementById('addButton');
  const errorMessage = document.getElementById('errorMessage');

  // 配置 Netlify Function 的基础 URL
  const NETLIFY_FUNCTION_BASE_URL = 'https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions';
  const FUNCTION_NAME = 'add-bookmark';

  // 获取当前活动标签页的信息
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const currentTab = tabs[0];
    urlInput.value = currentTab.url;

    try {
      // 获取页面标题
      const titleResponse = await fetch(
        import.meta.env.DEV 
          ? 'http://localhost:8888/.netlify/functions/get-page-title'
          : '/.netlify/functions/get-page-title', 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentTab.url })
        }
      );

      let pageTitle = currentTab.title;
      if (titleResponse.ok) {
        const titleData = await titleResponse.json();
        pageTitle = titleData.title || currentTab.title;
      }

      // 获取 favicon
      const faviconResponse = await fetch(
        import.meta.env.DEV 
          ? 'http://localhost:8888/.netlify/functions/get-favicon'
          : '/.netlify/functions/get-favicon', 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentTab.url })
        }
      );

      let favicon = null;
      if (faviconResponse.ok) {
        const faviconData = await faviconResponse.json();
        favicon = faviconData.favicon;
      }

      // 提取关键词
      const keywordsResponse = await fetch(
        import.meta.env.DEV 
          ? 'http://localhost:8888/.netlify/functions/extract-keywords'
          : '/.netlify/functions/extract-keywords', 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentTab.url })
        }
      );

      let keywords = [];
      if (keywordsResponse.ok) {
        const keywordsData = await keywordsResponse.json();
        keywords = keywordsData.keywords || [];
      }

      // 添加书签
      addButton.addEventListener('click', async () => {
        try {
          const { user_token } = await chrome.storage.local.get('user_token');
          console.log('Add Bookmark - Token Data:', user_token);

          if (!user_token || !user_token.token) {
            errorMessage.style.color = 'red';
            errorMessage.textContent = '请先登录';
            console.error('添加书签失败：未登录');
            return;
          }

          const url = urlInput.value.trim();
          const tags = tagsInput.value.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');

          console.log('Add Bookmark - Details:', { 
            url, 
            tags, 
            tokenLength: user_token.token.length 
          });

          if (!url) {
            errorMessage.style.color = 'red';
            errorMessage.textContent = '请输入有效的URL';
            return;
          }

          // 直接调用 Netlify Function 添加书签
          const functionUrl = `${NETLIFY_FUNCTION_BASE_URL}/${FUNCTION_NAME}`;
          console.log('调用的完整 Function URL:', functionUrl);

          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user_token.token}`
            },
            body: JSON.stringify({
              url: url.startsWith('http') ? url : `https://${url}`,
              tags: tags,
              title: pageTitle,
              favicon: favicon,
              keywords: keywords
            })
          });

          console.log('Add Bookmark - Response Status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('详细错误内容:', errorText);
            throw new Error(`HTTP错误! 状态: ${response.status}, 详情: ${errorText}`);
          }

          const result = await response.json();
          console.log('Add Bookmark - Response Body:', result);

          // 显示成功消息
          errorMessage.style.color = 'green';
          errorMessage.textContent = '书签添加成功！';

          // 可选：关闭弹窗或清空输入
          window.close();

        } catch (error) {
          console.error('添加书签失败:', error);
          errorMessage.style.color = 'red';
          errorMessage.textContent = `添加书签失败：${error.message}`;
        }
      });

    } catch (error) {
      console.error('获取页面信息失败:', error);
      errorMessage.style.color = 'red';
      errorMessage.textContent = '获取页面信息失败';
    }
  });
});
