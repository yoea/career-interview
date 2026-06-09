/**
 * Production server: static files + Bilibili API proxy
 *
 * Usage: node server.mjs
 * Env:   PORT=3000 (default)
 */

import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = process.env.STATIC_DIR || path.join(__dirname, 'dist')
const PORT = process.env.PORT || 3000

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
}

// ─── Bilibili API proxy ──────────────────────────────────────────
function proxyBilibili(apiPath) {
  return new Promise((resolve, reject) => {
    const url = `https://api.bilibili.com${apiPath}`
    const req = https.get(url, {
      headers: {
        'Referer': 'https://www.bilibili.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, data }))
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

// ─── Static file server ──────────────────────────────────────────
function serveStatic(res, filePath) {
  // If path is a directory, look for index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html')
  }

  const ext = path.extname(filePath)
  const mime = MIME[ext] || 'application/octet-stream'

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': mime })
    fs.createReadStream(filePath).pipe(res)
  } else {
    // SPA fallback: serve index.html for all non-file routes
    const index = path.join(DIST, 'index.html')
    if (fs.existsSync(index)) {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      fs.createReadStream(index).pipe(res)
    } else {
      res.writeHead(404)
      res.end('Not found')
    }
  }
}

// ─── HTTP server ─────────────────────────────────────────────────
import { recordVisit, getVisitCount, getAllVisits, getBulkIpGeo, saveIpGeo } from './visits.js'

const PROVINCE_MAP = {
  '北京': '北京市', '天津': '天津市', '上海': '上海市', '重庆': '重庆市',
  '河北': '河北省', '山西': '山西省', '辽宁': '辽宁省', '吉林': '吉林省',
  '黑龙江': '黑龙江省', '江苏': '江苏省', '浙江': '浙江省', '安徽': '安徽省',
  '福建': '福建省', '江西': '江西省', '山东': '山东省', '河南': '河南省',
  '湖北': '湖北省', '湖南': '湖南省', '广东': '广东省', '海南': '海南省',
  '四川': '四川省', '贵州': '贵州省', '云南': '云南省', '陕西': '陕西省',
  '甘肃': '甘肃省', '青海': '青海省', '台湾': '台湾省',
  '内蒙古': '内蒙古自治区', '广西': '广西壮族自治区', '西藏': '西藏自治区',
  '宁夏': '宁夏回族自治区', '新疆': '新疆维吾尔自治区',
  '香港': '香港特别行政区', '澳门': '澳门特别行政区',
}

async function lookupAndSaveGeo(ips) {
  if (!ips.length) return
  try {
    const geoRes = await fetch('http://ip-api.com/batch?lang=zh-CN&fields=query,regionName,city,isp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ips),
    })
    if (!geoRes.ok) return
    const geoData = await geoRes.json()
    const entries = geoData
      .filter(g => g.query && g.status !== 'fail')
      .map(g => ({
        ip: g.query,
        province: PROVINCE_MAP[g.regionName] || g.regionName || '',
        city: g.city || '',
        isp: g.isp || '',
      }))
    await saveIpGeo(entries)
    console.log(`[geo] Saved ${entries.length} IP geolocations to DB`)
  } catch (e) {
    console.warn('[geo] Background lookup failed:', e.message)
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  // Visit tracking API
  if (url.pathname === '/api/visit' && req.method === 'POST') {
    let body = ''
    for await (const chunk of req) body += chunk
    try {
      const data = JSON.parse(body)
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress
      await recordVisit({
        ip,
        ua: req.headers['user-agent'] || '',
        route: data.route || url.pathname,
        referer: req.headers['referer'] || '',
        method: req.method,
      })
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
      res.end('{"ok":true}')
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end('{"error":"bad request"}')
    }
    return
  }

  if (url.pathname === '/api/visit/count') {
    const count = await getVisitCount()
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify({ count }))
    return
  }

  // ─── Dashboard Stats API (1min cache) ──────────────────────────
  if (url.pathname === '/api/dashboard/stats') {
    // Serve from cache if fresh
    const _dc = globalThis._dashboardCache || (globalThis._dashboardCache = { json: null, ts: 0 })
    if (_dc.json && Date.now() - _dc.ts < 60000) {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' })
      res.end(_dc.json)
      return
    }
    try {
      const visits = await getAllVisits()
      const now = Date.now()
      const dayMs = 86400000

      const parseUA = (ua) => {
        if (!ua) return { device: '未知', browser: '未知', os: '未知' }
        const u = ua.toLowerCase()
        // Device
        let device = 'Desktop'
        if (/mobile|android.*mobile|iphone|ipod/.test(u)) device = 'Mobile'
        else if (/ipad|tablet|android(?!.*mobile)/.test(u)) device = 'Tablet'
        // OS
        let os = '其他'
        if (/windows phone/.test(u)) os = 'Windows Phone'
        else if (/iphone|ipad|ipod/.test(u)) os = 'iOS'
        else if (/android/.test(u)) os = 'Android'
        else if (/mac os x|macintosh/.test(u)) os = 'macOS'
        else if (/windows nt/.test(u)) os = 'Windows'
        else if (/linux/.test(u)) os = 'Linux'
        // Browser (order matters: check Edge before Chrome, etc.)
        let browser = '其他'
        if (/edg\//.test(u)) browser = 'Edge'
        else if (/opr\//.test(u) || /opera/.test(u)) browser = 'Opera'
        else if (/chrome\//.test(u)) browser = 'Chrome'
        else if (/safari\//.test(u) && !/chrome/.test(u)) browser = 'Safari'
        else if (/firefox\//.test(u)) browser = 'Firefox'
        else if (/msie|trident/.test(u)) browser = 'IE'
        else if (/ucbrowser/.test(u)) browser = 'UC'
        else if (/micromessenger/.test(u)) browser = 'WeChat'
        else if (/qqbrowser/.test(u)) browser = 'QQ Browser'
        else if (/baidubrowser|baiduboxapp/.test(u)) browser = 'Baidu'
        return { device, browser, os }
      }

      // ─── Aggregation ───
      const dailyMap = {}
      const hourlyArr = new Array(168).fill(0) // 7 days
      const deviceMap = {}, browserMap = {}, osMap = {}
      const ipMap = {}, routeMap = {}

      let peakHour = '-'
      let mobileCount = 0
      const today0 = new Date(); today0.setHours(0,0,0,0)

      const KNOWN_ROUTES = new Set(['/', '/interviews', '/categories', '/topics', '/about', '/terms', '/privacy', '/dashboard'])

      for (const v of visits) {
        const t = new Date(v.created_at)
        const age = now - t.getTime()

        // Daily (last 30 days)
        if (age <= 30 * dayMs) {
          const key = t.toISOString().slice(0, 10)
          dailyMap[key] = (dailyMap[key] || 0) + 1
        }

        // Hourly (last 7 days)
        if (age <= 7 * dayMs) {
          const dayIdx = Math.floor((now - age) / dayMs) - Math.floor((now - 7 * dayMs) / dayMs)
          if (dayIdx >= 0 && dayIdx < 7) {
            hourlyArr[dayIdx * 24 + t.getHours()]++
          }
        }

        // UA
        const ua = parseUA(v.ua)
        deviceMap[ua.device] = (deviceMap[ua.device] || 0) + 1
        browserMap[ua.browser] = (browserMap[ua.browser] || 0) + 1
        osMap[ua.os] = (osMap[ua.os] || 0) + 1
        if (ua.device === 'Mobile' || ua.device === 'Tablet') mobileCount++

        // IP
        if (v.ip) ipMap[v.ip] = (ipMap[v.ip] || 0) + 1

        // Route (strip query string, use first path segment only)
        if (v.route) {
          const pathOnly = v.route.split('?')[0]
          const seg = '/' + (pathOnly.split('/').filter(Boolean)[0] || '')
          const key = KNOWN_ROUTES.has(seg) ? seg : '/其他'
          routeMap[key] = (routeMap[key] || 0) + 1
        }
      }

      // Peak hour (last 7 days aggregate by hour-of-day)
      const hourAgg = new Array(24).fill(0)
      for (let i = 0; i < 168; i++) hourAgg[i % 24] += hourlyArr[i]
      const peakH = hourAgg.indexOf(Math.max(...hourAgg))
      peakHour = `${String(peakH).padStart(2, '0')}:00-${String((peakH + 1) % 24).padStart(2, '0')}:00`

      // Daily array (last 30 days)
      const daily = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now - i * dayMs)
        const key = d.toISOString().slice(0, 10)
        if (dailyMap[key]) daily.push({ date: key, count: dailyMap[key] })
      }
      // Fill zero days
      const dailyFull = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now - i * dayMs)
        const key = d.toISOString().slice(0, 10)
        dailyFull.push({ date: key, count: dailyMap[key] || 0 })
      }

      // Hourly labels (last 24h)
      const hourly24 = []
      const nowH = new Date()
      for (let i = 23; i >= 0; i--) {
        const t = new Date(nowH.getTime() - i * 3600000)
        const h = t.getHours()
        const key = Math.floor((now - i * 3600000) / dayMs) - Math.floor((now - 7 * dayMs) / dayMs)
        const idx = (key >= 0 && key < 7) ? key * 24 + h : -1
        hourly24.push({
          hour: `${String(h).padStart(2, '0')}:00`,
          count: idx >= 0 ? hourlyArr[idx] : 0,
        })
      }

      // Top routes
      const routeStats = Object.entries(routeMap)
        .map(([route, hits]) => ({ route, hits }))
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 10)

      // Top IPs (sorted by count)
      const topIps = Object.entries(ipMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([ip, count]) => ({ ip, count, province: '', city: '', isp: '' }))

      // Load cached geo from DB (synchronous, instant)
      const cachedGeo = await getBulkIpGeo(topIps.map(e => e.ip))
      for (const entry of topIps) {
        const geo = cachedGeo[entry.ip]
        if (geo) {
          entry.province = geo.province || ''
          entry.city = geo.city || ''
          entry.isp = geo.isp || ''
        }
      }

      // Async: look up unknown IPs with count >= 5 (fire-and-forget)
      const MIN_LOOKUP_COUNT = 5
      const unknownIps = topIps.filter(e =>
        !e.province &&
        e.count >= MIN_LOOKUP_COUNT &&
        !e.ip.startsWith('192.168.') &&
        !e.ip.startsWith('10.') &&
        !e.ip.startsWith('172.')
      )
      if (unknownIps.length > 0) {
        // Non-blocking: run in background, don't await
        lookupAndSaveGeo(unknownIps.map(e => e.ip)).catch(() => {})
      }

      // Province distribution
      const provinceMap = {}
      for (const entry of topIps) {
        if (entry.province) provinceMap[entry.province] = (provinceMap[entry.province] || 0) + entry.count
      }
      const provinceStats = Object.entries(provinceMap)
        .map(([province, count]) => ({ province, count }))
        .sort((a, b) => b.count - a.count)

      const total = visits.length
      const uniqueIps = Object.keys(ipMap).length
      const days = new Set(visits.map(v => new Date(v.created_at).toISOString().slice(0, 10))).size
      const provinces = new Set(topIps.filter(e => e.province).map(e => e.province)).size

      const json = JSON.stringify({
        total,
        uniqueIps,
        dailyAvg: days > 0 ? Math.round(total / days) : 0,
        provinces,
        peakHour,
        mobilePercent: total > 0 ? Math.round(mobileCount / total * 100) : 0,
        daily: dailyFull,
        hourly24,
        devices: Object.entries(deviceMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        browsers: Object.entries(browserMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        os: Object.entries(osMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        routeStats,
        topIps,
        provinceStats,
      })
      _dc.json = json
      _dc.ts = Date.now()
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' })
      res.end(json)
    } catch (e) {
      console.error('Dashboard stats error:', e)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }

  // CORS preflight for visit API
  if (url.pathname === '/api/visit' && req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  // API proxy: /api/bili/*
  if (url.pathname.startsWith('/api/bili/')) {
    const apiPath = url.pathname.replace('/api/bili', '') + url.search
    try {
      const result = await proxyBilibili(apiPath)
      res.writeHead(result.status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      })
      res.end(result.data)
    } catch (e) {
      res.writeHead(502)
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }

  // Static files
  const filePath = path.join(DIST, url.pathname)
  serveStatic(res, filePath)
})

server.listen(PORT, () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`)
  console.log(`  Static: ${DIST}`)
  console.log(`  Proxy:  /api/bili/* → https://api.bilibili.com/*`)
})
