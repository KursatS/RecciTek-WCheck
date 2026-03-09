import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebaseConfig'

const usersGrid = document.getElementById('users-grid')!
const btnAddUser = document.getElementById('btn-add-user') as HTMLButtonElement
const userModal = document.getElementById('user-modal')!
const btnCancelModal = document.getElementById('btn-cancel-modal') as HTMLButtonElement
const btnSaveUser = document.getElementById('btn-save-user') as HTMLButtonElement
const modalTitle = document.getElementById('modal-title')!

const inputId = document.getElementById('user-id') as HTMLInputElement
const inputUsername = document.getElementById('user-username') as HTMLInputElement
const inputPassword = document.getElementById('user-password') as HTMLInputElement
const inputFullname = document.getElementById('user-fullname') as HTMLInputElement
const inputRole = document.getElementById('user-role') as HTMLSelectElement

let usersCache: any[] = []

async function loadUsers() {
    try {
        const q = query(collection(db, 'users'))
        const snapshot = await getDocs(q)

        usersCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        renderUsers(usersCache)
    } catch (error) {
        console.error('Error loading users:', error)
        usersGrid.innerHTML = `<div style="color:#ef4444;">Kullanıcılar yüklenirken hata oluştu.</div>`
    }
}

function renderUsers(users: any[]) {
    usersGrid.innerHTML = ''

    users.forEach(user => {
        const card = document.createElement('div')
        card.className = 'user-card'

        let badgeClass = 'badge-kargo'
        let roleDisplay = 'Kargo Kabul'

        if (user.role === 'admin') { badgeClass = 'badge-admin'; roleDisplay = 'Yönetici' }
        else if (user.role === 'mh') { badgeClass = 'badge-mh'; roleDisplay = 'Müşteri Hizmetleri' }

        card.innerHTML = `
            <span class="badge ${badgeClass}">${roleDisplay}</span>
            <h3>${user.fullName || 'İsimsiz'}</h3>
            <p><strong>K. Adı:</strong> ${user.username}</p>
            <p><strong>Şifre:</strong> <span style="cursor:pointer;opacity:0.5;" title="Göstermek için tıklayın" onclick="this.textContent = '${user.password}'; this.style.opacity = '1';">••••••</span></p>
            <p><strong>Level:</strong> ${user.level || 1} (${user.xp || 0} XP)</p>
            
            <div class="actions">
                <button class="btn-sm btn-edit" data-id="${user.id}">Düzenle</button>
                <button class="btn-sm btn-delete" data-id="${user.id}">Sil</button>
            </div>
        `
        usersGrid.appendChild(card)
    })

    // Bind edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.target as HTMLElement).dataset.id!
            const user = usersCache.find(u => u.id === id)
            if (user) openModal(user)
        })
    })

    // Bind delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = (e.target as HTMLElement).dataset.id!
            const user = usersCache.find(u => u.id === id)
            if (confirm(`"${user?.username}" kullanıcısını silmek istediğinize emin misiniz?`)) {
                await deleteDoc(doc(db, 'users', id))
                loadUsers()
            }
        })
    })
}

function openModal(user: any = null) {
    if (user) {
        modalTitle.textContent = 'Kullanıcıyı Düzenle'
        inputId.value = user.id
        inputUsername.value = user.username || ''
        inputPassword.value = user.password || ''
        inputFullname.value = user.fullName || ''
        inputRole.value = user.role || 'kargo_kabul'
    } else {
        modalTitle.textContent = 'Yeni Kullanıcı'
        inputId.value = ''
        inputUsername.value = ''
        inputPassword.value = ''
        inputFullname.value = ''
        inputRole.value = 'kargo_kabul'
    }
    userModal.classList.add('active')
}

btnAddUser.onclick = () => openModal()
btnCancelModal.onclick = () => userModal.classList.remove('active')

btnSaveUser.onclick = async () => {
    const username = inputUsername.value.trim()
    const password = inputPassword.value.trim()
    const fullName = inputFullname.value.trim()
    const role = inputRole.value
    const id = inputId.value

    if (!username || !password || !fullName || !role) {
        alert("Lütfen tüm alanları doldurun.")
        return
    }

    try {
        btnSaveUser.textContent = 'Kaydediliyor...'
        btnSaveUser.disabled = true

        const userData = {
            username,
            password,
            fullName,
            role,
            updatedAt: serverTimestamp()
        }

        if (id) {
            // Update
            await updateDoc(doc(db, 'users', id), userData)
        } else {
            // Create
            await addDoc(collection(db, 'users'), {
                ...userData,
                level: 1,
                xp: 0,
                createdAt: serverTimestamp()
            })
        }

        userModal.classList.remove('active')
        loadUsers()
    } catch (e: any) {
        alert("Hata: " + e.message)
    } finally {
        btnSaveUser.textContent = 'Kaydet'
        btnSaveUser.disabled = false
    }
}

// Ensure Admin account exists (For initial setup if database is empty)
async function ensureAdminExists() {
    try {
        const q = query(collection(db, 'users'))
        const snapshot = await getDocs(q)
        if (snapshot.empty) {
            await addDoc(collection(db, 'users'), {
                username: 'KursatS',
                password: 'Krst123456.',
                fullName: 'Kürşat Sinan',
                role: 'admin',
                level: 99,
                xp: 9999,
                createdAt: serverTimestamp()
            })
        }
    } catch { }
}

ensureAdminExists().then(() => {
    loadUsers()
})
