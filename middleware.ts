import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ads.txt を配信
  if (request.nextUrl.pathname === '/ads.txt') {
    return new NextResponse('google.com, pub-2247568702185856, DIRECT, f08c47fec0942fa0', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/ads.txt'],
};
