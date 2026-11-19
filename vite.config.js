import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_API_BASE_URL || 'http://localhost:5000'
  const lpBackendTarget = env.VITE_LP_BACKEND_URL || 'http://172.20.204.238:8080'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5999,
      proxy: {
        // Proxy ASP.NET WebMethod & Web API requests to IIS Express / Kestrel
        '/Dashboard.aspx': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/lp-api': {
          target: lpBackendTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/lp-api/, '/api'),
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
