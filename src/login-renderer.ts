import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebaseConfig'

const api = (window as any).electronAPI
const btnLogin = document.getElementById('login-btn') as HTMLButtonElement
const errorMsg = document.getElementById('error-msg')!
const usernameInput = document.getElementById('username') as HTMLInputElement
const passwordInput = document.getElementById('password') as HTMLInputElement
const btnMin = document.getElementById('btn-min')!
const btnClose = document.getElementById('btn-close')!

btnMin.onclick = () => api.minimizeWindow()
btnClose.onclick = () => api.closeWindow()

// Initialize Admin account on first load if it doesn't exist (handled via main/ticketService later or manually here)
// For simplicity, we just check Firestore for the username and password

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

        // Save user session to settings
        const currentSettings = await api.getSettings()
        await api.saveSettings({
            ...currentSettings,
            personnelName: userData.fullName,
            role: userData.role,
            username: un,
            isAdmin: userData.role === 'admin'
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
