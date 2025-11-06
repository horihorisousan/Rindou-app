-- contactsテーブルの既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Anyone can create contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;

-- 新しいRLSポリシー: 誰でも（匿名ユーザーも認証済みユーザーも）問い合わせを作成できる
CREATE POLICY "Enable insert for all users"
  ON contacts
  FOR INSERT
  WITH CHECK (true);

-- ログインユーザーは自分の問い合わせを閲覧できる
CREATE POLICY "Enable read for users based on user_id"
  ON contacts
  FOR SELECT
  USING (auth.uid() = user_id);
