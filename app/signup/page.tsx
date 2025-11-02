'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, signUp } = useAuth();

  // 既にログイン済みの場合はトップページにリダイレクト
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  // ユーザー名のリアルタイムチェック
  useEffect(() => {
    const checkUsername = async () => {
      if (!username) {
        setUsernameError('');
        setUsernameAvailable(null);
        return;
      }

      // ユーザー名の形式チェック
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        setUsernameError('3〜20文字の英数字とアンダースコアのみ使用できます');
        setUsernameAvailable(false);
        return;
      }

      setCheckingUsername(true);
      setUsernameError('');

      try {
        const response = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
        const data = await response.json();

        // レスポンスのステータスコードをチェック
        if (!response.ok) {
          // エラーレスポンスの場合
          if (data.error) {
            setUsernameError(data.error);
          } else {
            setUsernameError('ユーザー名の確認中にエラーが発生しました');
          }
          setUsernameAvailable(null);
          return;
        }

        // 正常なレスポンスの場合
        if (data.available) {
          setUsernameAvailable(true);
          setUsernameError('');
        } else {
          setUsernameAvailable(false);
          setUsernameError('このユーザー名は既に使用されています');
        }
      } catch (err) {
        console.error('Username check error:', err);
        setUsernameError('ユーザー名の確認中にエラーが発生しました');
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!username) {
      setError('ユーザー名を入力してください');
      return;
    }

    if (!usernameAvailable) {
      setError('有効なユーザー名を入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);

    try {
      // ユーザー登録
      const { error: signUpError } = await signUp(email, password);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // ユーザーIDを取得するために少し待つ
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 現在のユーザーを取得
      const { data: { user } } = await supabaseBrowser.auth.getUser();

      if (!user) {
        setError('ユーザー情報の取得に失敗しました');
        return;
      }

      // クライアント側で直接プロフィールを作成
      const { error: profileError } = await supabaseBrowser
        .from('profiles')
        .insert({
          id: user.id,
          username: username,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);

        // 重複エラーのチェック
        if (profileError.code === '23505') {
          setError('このユーザー名は既に使用されています');
        } else {
          setError(`プロフィールの作成に失敗しました: ${profileError.message}`);
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error('Signup error:', err);
      setError('登録中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 認証チェック中またはログイン済みの場合の表示
  if (authLoading || (user && !success)) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>読み込み中...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#4CAF50', marginBottom: '20px' }}>登録完了</h2>
          <p>メールアドレスに確認メールを送信しました。</p>
          <p>メール内のリンクをクリックしてアカウントを有効化してください。</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%',
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: '#333',
        }}>
          新規登録
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              color: '#666',
              fontSize: '14px',
            }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              color: '#666',
              fontSize: '14px',
            }}>
              ユーザー名
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="例: user_name123"
                style={{
                  width: '100%',
                  padding: '10px',
                  paddingRight: '40px',
                  border: `1px solid ${
                    usernameError ? '#c62828' :
                    usernameAvailable ? '#4CAF50' :
                    '#ddd'
                  }`,
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
              {checkingUsername && (
                <span style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  fontSize: '14px',
                }}>
                  確認中...
                </span>
              )}
              {!checkingUsername && usernameAvailable === true && (
                <span style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#4CAF50',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}>
                  ✓
                </span>
              )}
              {!checkingUsername && usernameAvailable === false && username && (
                <span style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#c62828',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}>
                  ✗
                </span>
              )}
            </div>
            {usernameError && (
              <div style={{
                color: '#c62828',
                fontSize: '12px',
                marginTop: '5px',
              }}>
                {usernameError}
              </div>
            )}
            {usernameAvailable && !usernameError && (
              <div style={{
                color: '#4CAF50',
                fontSize: '12px',
                marginTop: '5px',
              }}>
                このユーザー名は使用可能です
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              color: '#666',
              fontSize: '14px',
            }}>
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              color: '#666',
              fontSize: '14px',
            }}>
              パスワード（確認）
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
        }}>
          既にアカウントをお持ちですか？{' '}
          <Link href="/login" style={{ color: '#4CAF50', textDecoration: 'none' }}>
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
}
