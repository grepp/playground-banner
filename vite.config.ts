import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

/** preview.html 은 sandbox 로 스크립트를 막으므로 Vite client 주입을 제거한다. */
function stripPreviewScripts(): Plugin {
  return {
    name: 'strip-preview-scripts',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const file = ctx.filename.replaceAll('\\', '/');
        if (!file.endsWith('/preview.html')) return html;
        return html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
      },
    },
  };
}

/** GitHub Pages project site: https://datalater.github.io/grepp-main-banner/ */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/grepp-main-banner/' : '/',
  plugins: [react(), tailwindcss(), stripPreviewScripts()],
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [resolve(root, 'src/banner/hera/vendor')],
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        preview: resolve(root, 'preview.html'),
      },
    },
  },
}));
