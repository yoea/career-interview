// Vercel Serverless Function: proxy B站 API
// /api/bili/* → https://api.bilibili.com/*
export default async function handler(req, res) {
  const { path = [] } = req.query;
  const biliPath = Array.isArray(path) ? path.join('/') : path;
  const targetUrl = `https://api.bilibili.com/${biliPath}`;

  // Forward query params (exclude 'path' which is Vercel's catch-all param)
  const { path: _, ...queryParams } = req.query;
  const qs = new URLSearchParams(queryParams).toString();
  const fullUrl = qs ? `${targetUrl}?${qs}` : targetUrl;

  try {
    const resp = await fetch(fullUrl, {
      headers: {
        'Referer': 'https://www.bilibili.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const contentType = resp.headers.get('content-type') || 'application/json';
    const body = await resp.text();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(resp.status).send(body);
  } catch (err) {
    res.status(502).json({ error: 'Proxy error', message: err.message });
  }
}
