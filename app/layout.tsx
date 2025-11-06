import type { Metadata } from 'next';
import Header from '@/components/Header';
import { Noto_Sans_JP } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: '林道マップ',
  description: '林道情報を共有するマップ型SNS',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
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
      <body className={notoSansJp.className} style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        height: '100vh'
      }}>
        <AuthProvider>
          <Header />
          <main style={{
            height: 'calc(100vh - 64px)',
            overflow: 'auto'
          }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
