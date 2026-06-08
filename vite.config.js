import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Get git commit hash at build time
const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
const buildHost = execSync('hostname').toString().trim()
const now = new Date()
const buildTime = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_HOST__: JSON.stringify(buildHost),
  },
  server: {
    proxy: {
      '/api/bili': {
        target: 'https://api.bilibili.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bili/, ''),
        headers: {
          'Referer': 'https://www.bilibili.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      },
      '/api/wechat-qr': {
        target: 'https://xhef.oss-cn-hangzhou.aliyuncs.com',
        changeOrigin: true,
        rewrite: () => '/xhef/base_data/owe/aboutus/XHEF_wx.png',
        headers: {
          'Referer': 'https://www.xhef.org',
        },
      },
    },
  },
})
