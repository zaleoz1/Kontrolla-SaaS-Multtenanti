import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: mode === 'development' ? {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Middleware para servir arquivos de download
    middlewareMode: false,
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  // Usar a pasta public padrão para assets estáticos
  publicDir: 'public',
  build: {
    // Garantir que os arquivos estáticos sejam copiados
    assetsDir: 'assets',
    copyPublicDir: true,
    rollupOptions: {
      output: {
        // Manter estrutura de arquivos
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  plugins: [
    react(),
    // Plugin personalizado para servir arquivos de download
    {
      name: 'download-files',
      configureServer(server) {
        server.middlewares.use('/downloads', (req, res, next) => {
          const filePath = path.resolve(__dirname, '../dist-electron', req.url);
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Disposition', 'attachment');
            res.setHeader('Content-Type', 'application/octet-stream');
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
