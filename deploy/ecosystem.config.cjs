module.exports = {
  apps: [{
    name: 'ccca-career-interview',
    script: 'server.mjs',
    cwd: '/opt/xhef-career-interview/ccca.xhef.org',
    env: {
      PORT: 13682,
      STATIC_DIR: '/opt/xhef-career-interview/ccca.xhef.org',
    },
  }],
}
