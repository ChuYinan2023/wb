-- 为 bookmarks 表添加 keywords 列
ALTER TABLE bookmarks
ADD COLUMN keywords text[] DEFAULT ARRAY[]::text[];

-- 如果需要，可以为现有记录设置默认值
UPDATE bookmarks SET keywords = ARRAY[]::text[] WHERE keywords IS NULL;
