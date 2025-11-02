-- roadsテーブルに投稿者情報を追加
-- このSQLをSupabaseのSQL Editorで実行してください

-- user_idカラムを追加（auth.usersへの外部キー）
ALTER TABLE public.roads
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- user_idカラムにインデックスを作成（検索を高速化）
CREATE INDEX IF NOT EXISTS roads_user_id_idx ON public.roads(user_id);

-- 変更を即座にAPIに反映
NOTIFY pgrst, 'reload schema';

-- 既存のポリシーを削除（エラーを無視）
DROP POLICY IF EXISTS "Roads are viewable by everyone" ON public.roads;
DROP POLICY IF EXISTS "Authenticated users can insert roads" ON public.roads;
DROP POLICY IF EXISTS "Users can update their own roads" ON public.roads;
DROP POLICY IF EXISTS "Users can delete their own roads" ON public.roads;

-- RLSを有効化（既に有効な場合はエラーなし）
ALTER TABLE public.roads ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの設定
-- 全員が林道情報を読み取れるポリシー
CREATE POLICY "Roads are viewable by everyone"
  ON public.roads
  FOR SELECT
  USING (true);

-- ログインユーザーが林道を投稿できるポリシー
CREATE POLICY "Authenticated users can insert roads"
  ON public.roads
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ユーザーは自分の投稿のみ更新できるポリシー
CREATE POLICY "Users can update their own roads"
  ON public.roads
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分の投稿のみ削除できるポリシー
CREATE POLICY "Users can delete their own roads"
  ON public.roads
  FOR DELETE
  USING (auth.uid() = user_id);
