/*
  # Create bookmarks schema

  1. New Tables
    - `bookmarks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `url` (text)
      - `title` (text)
      - `description` (text)
      - `thumbnail` (text)
      - `tags` (text array)
      - `keywords` (text array)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `bookmarks` table
    - Add policies for authenticated users to:
      - Read their own bookmarks
      - Create new bookmarks
      - Update their own bookmarks
      - Delete their own bookmarks
*/

CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail text,
  tags text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own bookmarks"
  ON bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
  ON bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON bookmarks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);