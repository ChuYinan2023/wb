// 初始化 Netlify Function 基础 URL
chrome.runtime.onInstalled.addListener(async () => {
  // 你可以从环境变量、配置文件或其他方式获取正确的 URL
  const netlifyFunctionBaseUrl = 'https://tranquil-marigold-0af3ab.netlify.app/.netlify/functions';
  
  await chrome.storage.local.set({
    'netlifyFunctionBaseUrl': netlifyFunctionBaseUrl
  });
});
