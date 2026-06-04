// Vercel Serverless Function: proxy 微信二维码图片
// /api/wechat-qr → xhef OSS image
export default async function handler(req, res) {
  const targetUrl = 'https://xhef.oss-cn-hangzhou.aliyuncs.com/xhef/base_data/owe/aboutus/XHEF_wx.png';

  try {
    const resp = await fetch(targetUrl, {
      headers: {
        'Referer': 'https://www.xhef.org',
      },
    });

    if (!resp.ok) {
      res.status(resp.status).send('Image fetch failed');
      return;
    }

    const buffer = await resp.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    res.status(502).send('Proxy error');
  }
}
