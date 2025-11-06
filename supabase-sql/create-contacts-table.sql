-- お問い合わせテーブルの作成
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replied_at TIMESTAMP WITH TIME ZONE
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- updated_at自動更新用のトリガー関数
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
DROP TRIGGER IF EXISTS trigger_update_contacts_updated_at ON contacts;
CREATE TRIGGER trigger_update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Row Level Security (RLS) の有効化
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（再実行時のエラーを防ぐ）
DROP POLICY IF EXISTS "Anyone can create contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;

-- RLSポリシー: 誰でも問い合わせを作成できる（匿名ユーザーも含む）
CREATE POLICY "Anyone can create contacts"
  ON contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLSポリシー: ログインユーザーは自分の問い合わせを閲覧できる
CREATE POLICY "Users can view their own contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLSポリシー: 匿名ユーザーは自分が送信した問い合わせを閲覧できない
-- （セキュリティのため、送信後は管理者のみが閲覧可能）

-- ※管理者用のポリシーは別途設定が必要です
-- 例: 管理者ロールを持つユーザーはすべての問い合わせを閲覧・編集できる
-- CREATE POLICY "Admins can view all contacts"
--   ON contacts
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_roles
--       WHERE user_id = auth.uid() AND role = 'admin'
--     )
--   );

-- コメントの追加（テーブルとカラムの説明）
COMMENT ON TABLE contacts IS 'お問い合わせフォームの送信データを保存するテーブル';
COMMENT ON COLUMN contacts.id IS 'お問い合わせID（UUID）';
COMMENT ON COLUMN contacts.name IS '送信者の名前';
COMMENT ON COLUMN contacts.email IS '送信者のメールアドレス';
COMMENT ON COLUMN contacts.subject IS 'お問い合わせの件名';
COMMENT ON COLUMN contacts.message IS 'お問い合わせ内容';
COMMENT ON COLUMN contacts.user_id IS 'ログインユーザーのID（ログインしている場合）';
COMMENT ON COLUMN contacts.status IS '対応状況: pending=未対応, in_progress=対応中, resolved=解決済み, closed=クローズ';
COMMENT ON COLUMN contacts.created_at IS '作成日時';
COMMENT ON COLUMN contacts.updated_at IS '更新日時';
COMMENT ON COLUMN contacts.replied_at IS '返信日時';
