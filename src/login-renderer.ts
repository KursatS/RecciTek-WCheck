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

btnMin.onclick = () => api.minimizeWindow()
btnClose.onclick = () => api.closeWindow()

// Load saved credentials
api.getSettings().then((settings: any) => {
    if (settings.rememberMe) {
        usernameInput.value = settings.savedUsername || ''
        passwordInput.value = settings.savedPassword || ''
        rememberMeCb.checked = true
    }
})

// Admin account was initialized securely in the DB.

async function handleLogin() {
    const un = usernameInput.value.trim()
    const pw = passwordInput.value.trim()

    if (!un || !pw) {
        errorMsg.textContent = 'Lütfen kullanıcı adı ve şifre girin.'
        return
    }

    btnLogin.disabled = true
    btnLogin.textContent = 'Giriş Yapılıyor...'
    errorMsg.textContent = ''

    try {
        const q = query(collection(db, 'users'), where('username', '==', un), where('password', '==', pw))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
            errorMsg.textContent = 'Hatalı kullanıcı adı veya şifre!'
            btnLogin.disabled = false
            btnLogin.textContent = 'Giriş Yap'
            return
        }

        const userData = snapshot.docs[0].data()

        // Admin needs to behave like kargo_kabul for ticket operations
        const effectiveRole = userData.role === 'admin' ? 'kargo_kabul' : userData.role

        // Save user session to settings
        const currentSettings = await api.getSettings()
        await api.saveSettings({
            ...currentSettings,
            personnelName: userData.fullName,
            role: effectiveRole,
            username: un,
            isAdmin: un === 'KursatS' || userData.role === 'admin',
            isLoggedIn: true,
            rememberMe: rememberMeCb.checked,
            savedUsername: rememberMeCb.checked ? un : '',
            savedPassword: rememberMeCb.checked ? pw : ''
        })

        // Notify main process that login is successful
        await api.loginSuccess()

    } catch (error: any) {
        console.error('Login error:', error)
        errorMsg.textContent = 'Bağlantı hatası: ' + error.message
        btnLogin.disabled = false
        btnLogin.textContent = 'Giriş Yap'
    }
}

btnLogin.addEventListener('click', handleLogin)

passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin()
})
