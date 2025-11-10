'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  // ホーム画面では非表示
  if (pathname === '/') {
    return null;
  }

  return (
    <footer style={{
      backgroundColor: '#2d5016',
      color: 'white',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/guide"
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            利用ガイド
          </Link>
          <Link
            href="/privacy-policy"
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/contact"
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            お問い合わせ
          </Link>
        </div>

        <div style={{
          textAlign: 'center',
          fontSize: '0.85rem',
          opacity: 0.8
        }}>
          <p style={{ margin: 0 }}>
            &copy; {currentYear} 林道マップ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
