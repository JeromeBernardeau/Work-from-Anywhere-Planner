// PM2 ecosystem configuration for FICOFI Work-from-Anywhere Planner
module.exports = {
  apps: [
    {
      name: 'ficofi-planner',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=ficofi-work-planner-production --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false, // Disable PM2 file monitoring (wrangler handles hot reload)
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}