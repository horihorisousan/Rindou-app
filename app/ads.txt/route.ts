export async function GET() {
  const adsContent = `google.com, pub-2247568702185856, DIRECT, f08c47fec0942fa0`;

  return new Response(adsContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
