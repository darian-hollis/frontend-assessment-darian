import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  test: {
    // Separate processes so tests can change process.env.TZ
    pool: "forks",
  },
})
