module.exports = {
  apps: [{
    name: 'career-interview',
    script: 'server.mjs',
    cwd: '/opt/1panel/www/sites/career.ewing.top',
    env: {
      PORT: 35173,
      STATIC_DIR: '/opt/1panel/www/sites/career.ewing.top/index',
    },
  }],
}
