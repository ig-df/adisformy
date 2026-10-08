import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function preservePwaAssets(): Plugin {
  return {
    name: 'preserve-pwa-assets',
    closeBundle() {
      const distHtmlPath = path.resolve(__dirname, 'dist/index.html');
      if (fs.existsSync(distHtmlPath)) {
        let content = fs.readFileSync(distHtmlPath, 'utf-8');
        content = content
          .replace(/href="\/assets\/manifest-[^"]*\.json"/g, 'href="manifest.json"')
          .replace(/href="\/assets\/icon-192-[^"]*\.png"/g, 'href="icon-192.png"')
          .replace(/href="\/assets\/icon-512-[^"]*\.png"/g, 'href="icon-512.png"')
          .replace(/href="\/assets\/favicon-[^"]*\.ico"/g, 'href="favicon.ico"')
          .replace(/href="\/assets\/favicon-32-[^"]*\.png"/g, 'href="favicon-32.png"')
          .replace(/href="\/assets\/favicon-16-[^"]*\.png"/g, 'href="favicon-16.png"')
          .replace(/href="\/assets\/favicon-qFmTI5sE\.ico"/g, 'href="favicon.ico"')
          .replace(/sizes="180x180" href="[^"]*"/g, 'sizes="180x180" href="apple-touch-icon.png"');
        fs.writeFileSync(distHtmlPath, content, 'utf-8');
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), preservePwaAssets()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
