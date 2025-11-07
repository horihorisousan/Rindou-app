import type { Metadata, Viewport } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Noto_Sans_JP } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { MenuProvider } from '@/lib/menu-context';

export const metadata: Metadata = {
  title: '林道マップ',
  description: '林道情報を共有するマップ型SNS',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        {process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={notoSansJp.className} style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <AuthProvider>
          <MenuProvider>
            <Header />
            <main style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
              </div>
              <Footer />
            </main>
          </MenuProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
