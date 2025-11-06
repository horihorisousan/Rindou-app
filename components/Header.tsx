'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useMenu } from '@/lib/menu-context';

export default function Header() {
  const { user, username, signOut, loading } = useAuth();
  const router = useRouter();
  const { mobileMenuOpen, setMobileMenuOpen } = useMenu();

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header style={{
      backgroundColor: '#2d5016',
      color: 'white',
      padding: '0.75rem 1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative'
    }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Link
          href="/"
          onClick={handleLinkClick}
          style={{
            textDecoration: 'none',
            color: 'white'
          }}
        >
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
            fontWeight: 'bold'
          }}>
            林道マップ
          </h1>
        </Link>

        {/* ハンバーガーメニューボタン (モバイルのみ表示) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-button"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* デスクトップメニュー */}
        <div
          className="desktop-menu"
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}
        >
          <Link
            href="/"
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              backgroundColor: 'transparent',
              textAlign: 'center',
              whiteSpace: 'nowrap'
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
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  backgroundColor: 'transparent',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
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
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  backgroundColor: 'transparent',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
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
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.9, display: 'none' }} className="username-display">
                  {username || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'white',
                    border: '1px solid white',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link
                  href="/login"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    border: '1px solid white',
                    transition: 'background-color 0.2s',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
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
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    border: '1px solid #4CAF50',
                    transition: 'background-color 0.2s',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
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

      {/* モバイルメニュー (折りたたみ式) */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#2d5016',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '1rem',
            flexDirection: 'column',
            gap: '0.75rem',
            zIndex: 1000
          }}
        >
          <Link
            href="/"
            onClick={handleLinkClick}
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              padding: '0.75rem',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              textAlign: 'center'
            }}
          >
            マップ
          </Link>
          {user && (
            <>
              <Link
                href="/post"
                onClick={handleLinkClick}
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  textAlign: 'center'
                }}
              >
                投稿
              </Link>
              <Link
                href="/profile"
                onClick={handleLinkClick}
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  textAlign: 'center'
                }}
              >
                プロフィール
              </Link>
              <div style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.8)',
                textAlign: 'center'
              }}>
                {username || user.email}
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '1px solid white',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  textAlign: 'center'
                }}
              >
                ログアウト
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link
                href="/login"
                onClick={handleLinkClick}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid white',
                  textAlign: 'center',
                  display: 'block'
                }}
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                onClick={handleLinkClick}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #4CAF50',
                  textAlign: 'center',
                  display: 'block'
                }}
              >
                新規登録
              </Link>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .mobile-menu-button {
          display: none;
        }
        .mobile-menu {
          display: flex;
        }
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-button {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .username-display {
            display: inline !important;
          }
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
