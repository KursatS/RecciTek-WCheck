import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebaseConfig'

const api = (window as any).electronAPI
const btnLogin = document.getElementById('login-btn') as HTMLButtonElement
const errorMsg = document.getElementById('error-msg')!
const usernameInput = document.getElementById('username') as HTMLInputElement
const passwordInput = document.getElementById('password') as HTMLInputElement
const btnMin = document.getElementById('btn-min')!
const btnClose = document.getElementById('btn-close')!
const rememberMeCb = document.getElementById('remember-me') as HTMLInputElement
const autoLoginCb = document.getElementById('auto-login') as HTMLInputElement

btnMin.onclick = () => api.minimizeWindow()
btnClose.onclick = () => api.closeWindow()

rememberMeCb.addEventListener('change', () => {
    if (!rememberMeCb.checked) autoLoginCb.checked = false
})

autoLoginCb.addEventListener('change', () => {
    if (autoLoginCb.checked) rememberMeCb.checked = true
})

async function performLogin(un: string, pw: string, isAutoAttempt = false) {
    if (!un || !pw) {
        errorMsg.textContent = 'Lütfen kullanıcı adı ve şifre girin.'
        return
    }

    btnLogin.disabled = true
    btnLogin.textContent = isAutoAttempt ? 'Otomatik giriş yapılıyor...' : 'Giriş Yapılıyor...'
    errorMsg.textContent = ''

    try {
        const q = query(collection(db, 'users'), where('username', '==', un), where('password', '==', pw))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
            errorMsg.textContent = 'Hatalı kullanıcı adı veya şifre!'
            if (isAutoAttempt) {
                autoLoginCb.checked = false
                const currentSettings = await api.getSettings()
                await api.saveSettings({
                    ...currentSettings,
                    autoLogin: false,
                    isLoggedIn: false
                })
                api.showLoginWindow()
            }
            return
        }

        const userData = snapshot.docs[0].data()
        const effectiveRole = userData.role === 'admin' ? 'kargo_kabul' : userData.role
        const currentSettings = await api.getSettings()

        await api.saveSettings({
            ...currentSettings,
            personnelName: userData.fullName,
            role: effectiveRole,
            username: un,
            isAdmin: un === 'KursatS' || userData.role === 'admin',
            isLoggedIn: true,
            rememberMe: rememberMeCb.checked,
            autoLogin: autoLoginCb.checked,
            savedUsername: rememberMeCb.checked ? un : '',
            savedPassword: rememberMeCb.checked ? pw : ''
        })

        await api.loginSuccess()
    } catch (error: any) {
        console.error('Login error:', error)
        errorMsg.textContent = 'Bağlantı hatası: ' + error.message
        if (isAutoAttempt) {
            api.showLoginWindow()
        }
    } finally {
        btnLogin.disabled = false
        btnLogin.textContent = 'Giriş Yap'
    }
}

async function handleLogin() {
    await performLogin(usernameInput.value.trim(), passwordInput.value.trim(), false)
}

api.getSettings().then(async (settings: any) => {
    if (settings.rememberMe) {
        usernameInput.value = settings.savedUsername || ''
        passwordInput.value = settings.savedPassword || ''
        rememberMeCb.checked = true
    }

    if (settings.autoLogin) {
        autoLoginCb.checked = true
    }

    if (settings.autoLogin && settings.savedUsername && settings.savedPassword) {
        await performLogin(settings.savedUsername, settings.savedPassword, true)
    }
})

btnLogin.addEventListener('click', handleLogin)

passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin()
})
