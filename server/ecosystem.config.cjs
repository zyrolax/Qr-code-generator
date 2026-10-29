// PM2 process config for the Requesto test API.
// Run from the server/ directory:  pm2 start ecosystem.config.cjs
//
// index.js loads dotenv/config, so the server/.env file (NODE_ENV=production,
// MONGODB_URI, JWT_SECRET, BASE_URL, …) is what actually configures the app.
module.exports = {
  apps: [
    {
      name: "requesto-test-api",
      script: "src/index.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
