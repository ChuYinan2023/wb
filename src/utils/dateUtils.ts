export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Just now
  if (seconds < 60) {
    return '刚刚';
  }

  // Within an hour
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }

  // Within 24 hours
  if (hours < 24) {
    return `${hours}小时前`;
  }

  // Within 2 days
  if (days < 2) {
    return '昨天';
  }

  // Within a week
  if (days < 7) {
    return `${days}天前`;
  }

  // Same year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric'
    });
  }

  // Different year
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
}