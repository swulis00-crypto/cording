import { defineConfig } from 'vite';

export default defineConfig({
  // 상대 경로로 빌드해 GitHub Pages 하위 폴더(/cording/book-trail/)나 Vercel 어디서든 동작하게 한다.
  base: './',
  server: {
    port: 5173,
    host: true,
    open: false
  }
});
