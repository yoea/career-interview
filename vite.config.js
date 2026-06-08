import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import os from 'os'

// Get git commit hash at build time
const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
const buildHost = os.hostname()
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
    },
  },
})
