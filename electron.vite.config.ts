import { resolve } from 'path'
import { defineConfig, externalsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalsPlugin()]
  },
  preload: {
    plugins: [externalsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer')
      }
    },
    plugins: [vue(), react()],
    input: {
      index: resolve(__dirname, 'src/renderer/index.html'),
      login: resolve(__dirname, 'src/renderer/login.html'),
      settings: resolve(__dirname, 'src/renderer/settings.html'),
      bonus: resolve(__dirname, 'src/renderer/bonus.html'),
      tickets: resolve(__dirname, 'src/renderer/tickets.html'),
      admin: resolve(__dirname, 'src/renderer/admin.html'),
      profile: resolve(__dirname, 'src/renderer/profile.html'),
      popup: resolve(__dirname, 'src/renderer/popup.html'),
      splash: resolve(__dirname, 'src/renderer/splash.html')
    }
  }
})
