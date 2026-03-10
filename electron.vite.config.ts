import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()]
    },
    preload: {
        plugins: [externalizeDepsPlugin()]
    },
    renderer: {
        root: 'src',
        build: {
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/index.html'),
                    settings: resolve(__dirname, 'src/settings.html'),
                    bonus: resolve(__dirname, 'src/bonus.html'),
                    splash: resolve(__dirname, 'src/splash.html'),
                    popup: resolve(__dirname, 'src/popup.html'),
                    tickets: resolve(__dirname, 'src/tickets.html'),
                    login: resolve(__dirname, 'src/login.html'),
                    profile: resolve(__dirname, 'src/profile.html'),
                    admin: resolve(__dirname, 'src/admin.html'),
                    priority: resolve(__dirname, 'src/priority.html')
                }
            }
        }
    }
})
