module.exports = {
  apps: [
    {
      name: `api.webcup:9002`,
      script: "./bin/www",
      watch: false,
      log_date_format: "MM-DD hh:mm:ss.SSS A",
      env: {
        PORT: 9002,
        NODE_ENV: "development",
      },
      env_test: {
        PORT: 9002,
        NODE_ENV: "test",
      },
      env_production: {
        PORT: 9002,
        NODE_ENV: "production",
      },
    },
  ],
};
