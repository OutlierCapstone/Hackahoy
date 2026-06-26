module.exports = {
  apps: [
    {
      name: "hackahoy-backend",
      cwd: "/home/ubuntu/Hackahoy",
      script: "dist/main.js",
      env: { NODE_ENV: "production", PORT: "4000" },
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: "400M",
    },
    {
      name: "hackahoy-frontend",
      cwd: "/home/ubuntu/Hackahoy/Hackahoy",
      script: ".next/standalone/server.js",
      env: { NODE_ENV: "production", PORT: "3000" },
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: "500M",
    },
    {
      name: "ai-tutor",
      cwd: "/home/ubuntu/Hackahoy/ai-tutor",
      script: "venv/bin/uvicorn",
      args: "app.main:app --host 0.0.0.0 --port 8000",
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: "600M",
    },
  ],
};
