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
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

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
