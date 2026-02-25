import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        build: {
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/main.ts')
                }
            }
        }
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/preload.ts')
                }
            }
        }
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
                    tickets: resolve(__dirname, 'src/tickets.html')
                }
            }
        }
    }
})
