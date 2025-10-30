module.exports = {
  apps: [
    {
      name: "crowdsense-server",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};


