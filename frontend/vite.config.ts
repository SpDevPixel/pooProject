import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
// 🚨 새로 추가된 부분: SSL 플러그인을 불러옵니다. (단수형 basicSsl 주의)
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  // 🚨 헷갈리기 쉬운 부분 (강조): 배열의 이름은 복수형인 plugins 입니다!
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    // 🚨 새로 추가된 부분: 여기에 단수형 함수 basicSsl()을 추가해 줍니다. 쉼표(,) 잊지 마세요!
    basicSsl(), 
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 🚨 헷갈리기 쉬운 부분 (강조): 속성 이름에 복수형 s가 들어간 assetsInclude 입니다!
  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'], // 확장자 배열들도 여러 개니 복수형 형태를 띱니다.
})