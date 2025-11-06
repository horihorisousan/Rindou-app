'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, username, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header style={{
      backgroundColor: '#2d5016',
      color: 'white',
      padding: '1rem 2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          林道マップ
        </h1>
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <Link
            href="/"
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              backgroundColor: 'transparent',
              textAlign: 'center',
              minWidth: '80px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            マップ
          </Link>
          {user && (
            <>
              <Link
                href="/post"
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  backgroundColor: 'transparent',
                  textAlign: 'center',
                  minWidth: '80px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                投稿
              </Link>
              <Link
                href="/profile"
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  backgroundColor: 'transparent',
                  textAlign: 'center',
                  minWidth: '80px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                プロフィール
              </Link>
            </>
          )}
          {!loading && (
            user ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  {username || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'white',
                    border: '1px solid white',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    textAlign: 'center',
                    minWidth: '100px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link
                  href="/login"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '1rem',
                    fontWeight: '500',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    border: '1px solid white',
                    transition: 'background-color 0.2s',
                    textAlign: 'center',
                    minWidth: '100px',
                    display: 'inline-block'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '1rem',
                    fontWeight: '500',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    border: '1px solid #4CAF50',
                    transition: 'background-color 0.2s',
                    textAlign: 'center',
                    minWidth: '100px',
                    display: 'inline-block'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#45a049';
                    e.currentTarget.style.borderColor = '#45a049';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#4CAF50';
                    e.currentTarget.style.borderColor = '#4CAF50';
                  }}
                >
                  新規登録
                </Link>
              </div>
            )
          )}
        </div>
      </nav>
    </header>
  );
}
