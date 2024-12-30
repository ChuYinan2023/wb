-- 为 bookmarks 表添加 summary 列
ALTER TABLE bookmarks ADD COLUMN summary TEXT DEFAULT '';

-- 为已存在的记录设置默认摘要
UPDATE bookmarks SET summary = '' WHERE summary IS NULL;