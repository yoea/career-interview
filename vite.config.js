import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
