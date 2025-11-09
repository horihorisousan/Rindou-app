/**
 * 管理者権限チェック
 * 環境変数 ADMIN_EMAIL に設定されたメールアドレスを管理者とする
 */
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  return adminEmail ? email === adminEmail : false;
}
