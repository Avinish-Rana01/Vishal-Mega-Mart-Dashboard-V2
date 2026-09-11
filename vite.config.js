import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_API_BASE_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: 5999,
      proxy: {
        // Proxy ASP.NET WebMethod & Web API requests to IIS Express / Kestrel
        '/Dashboard.aspx': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/hubs': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
          secure: false,
        }
      }
    }
  }
})
