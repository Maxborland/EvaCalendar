module.exports = {
  apps : [{
    name: 'eva-calendar-backend',
    script: 'index.js',
    cwd: 'back/',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    env: {
      NODE_ENV: 'production'
    }
  }]
};