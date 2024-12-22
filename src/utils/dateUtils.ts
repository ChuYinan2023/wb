export function getRelativeTime(date: Date | string): string {
  // 安全地转换日期
  const safeParseDate = (input: Date | string): Date => {
    // 如果已经是 Date 对象，直接返回
    if (input instanceof Date) return input;

    // 尝试解析字符串
    const parsedDate = new Date(input);

    // 检查日期是否有效
    if (isNaN(parsedDate.getTime())) {
      console.warn(`无法解析日期: ${input}`);
      return new Date(); // 返回当前时间
    }

    return parsedDate;
  };

  const parsedDate = safeParseDate(date);
  const now = new Date();
  const diff = now.getTime() - parsedDate.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // 刚刚
  if (seconds < 60) {
    return '刚刚';
  }

  // 一小时内
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }

  // 24小时内
  if (hours < 24) {
    return `${hours}小时前`;
  }

  // 两天内
  if (days < 2) {
    return '昨天';
  }

  // 一周内
  if (days < 7) {
    return `${days}天前`;
  }

  // 同一年
  if (parsedDate.getFullYear() === now.getFullYear()) {
    return parsedDate.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric'
    });
  }

  // 不同年份
  return parsedDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
}