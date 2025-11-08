import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // 개발 서버 포트 (원하는 포트로 변경)
    host: true, // 네트워크에서 접근 가능하도록 설정
  },
  preview: {
    port: 4173, // 프리뷰 서버 포트
  }
})
