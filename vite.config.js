import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_API_BASE_URL || 'https://localhost:44314'

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        // Proxy ASP.NET WebMethod & Web API requests to IIS Express
        '/Dashboard.aspx': {
          target: backendTarget,
          changeOrigin: true,
          secure: false, // Allows self-signed localhost SSL certificates
        },
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
