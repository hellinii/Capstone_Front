/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// 단위 테스트 전용 설정. 앱 빌드(vite.config.ts)와 분리하고 tailwind/proxy 플러그인은
// 제외해 테스트를 가볍게 유지한다. alias(@ → src)만 앱과 동일하게 맞춘다.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
