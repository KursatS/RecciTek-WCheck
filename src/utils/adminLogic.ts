import { showToast } from './toastUtils'
import { showConfirm } from '../index-renderer'
import { escapeHtml } from './html'

export function initAdminLogic(
    api: any,
    elements: any,
    loadAdminUsersCallback: () => void
) {
    const {
        adminUserList, btnAddUser, adminModal, adminModalTitle,
        adminUserId, adminUsername, adminPassword, adminFullname,
        adminRole, btnCancelAdminModal, btnSaveAdminUser
    } = elements

    let adminUsersCache: any[] = []

    async function loadAdminUsers() {
        const users = await api.getUsers()
        adminUsersCache = users || []
        renderAdminUsers(adminUsersCache)
    }

    function renderAdminUsers(users: any[]) {
        adminUserList.innerHTML = ''
        users.forEach((user: any) => {
            const card = document.createElement('div')
            card.className = 'user-card'

            let badgeClass = 'badge-kargo'
            let roleDisplay = 'Kargo Kabul'
            if (user.role === 'admin' || user.username === 'KursatS') {
                badgeClass = 'badge-admin'
                roleDisplay = 'Yönetici'
            } else if (user.role === 'mh') {
                badgeClass = 'badge-mh'
                roleDisplay = 'Müşteri Hizmetleri'
            }

            card.innerHTML = `
                <span class="${badgeClass}">${roleDisplay}</span>
                <h3>${escapeHtml(user.fullName || 'İsimsiz')}</h3>
                <p><strong>K. Adı:</strong> ${escapeHtml(user.username)}</p>
                <p><strong>Şifre:</strong> <span style="opacity:0.7;">Güvenlik nedeniyle gizli</span></p>
                <p><strong>Level:</strong> ${user.level || 1} (${user.xp || 0} XP)</p>
                <div class="actions">
                    <button class="btn-edit" data-id="${user.id}">Düzenle</button>
                    <button class="btn-delete" data-id="${user.id}">Sil</button>
                    <button class="btn-reset-xp" data-id="${user.id}" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);">XP Sıfırla</button>
                </div>
            `
            adminUserList.appendChild(card)
        })

        adminUserList.querySelectorAll('.btn-edit').forEach((btn: any) => {
            btn.addEventListener('click', (e: any) => {
                const id = (e.target as HTMLElement).dataset.id!
                const user = adminUsersCache.find(u => u.id === id)
                if (user) openAdminModal(user)
            })
        })

        adminUserList.querySelectorAll('.btn-delete').forEach((btn: any) => {
            btn.addEventListener('click', async (e: any) => {
                const id = (e.target as HTMLElement).dataset.id!
                const user = adminUsersCache.find(u => u.id === id)
                const confirmed = await showConfirm('Kullanıcıyı Sil', `"${user?.username}" kullanıcısını silmek istediğinize emin misiniz?`)
                if (confirmed) {
                    await api.deleteUser(id)
                    loadAdminUsers()
                    showToast('Kullanıcı silindi.', 'success')
                }
            })
        })

        adminUserList.querySelectorAll('.btn-reset-xp').forEach((btn: any) => {
            btn.addEventListener('click', async (e: any) => {
                const id = (e.target as HTMLElement).dataset.id!
                const user = adminUsersCache.find(u => u.id === id)
                const confirmed = await showConfirm('XP Sıfırla', `"${user?.username}" kullanıcısının XP ve Level bilgisi sıfırlanacak. Emin misiniz?`)
                if (confirmed) {
                    await api.resetUserXp(id)
                    loadAdminUsers()
                    showToast('XP sıfırlandı.', 'success')
                }
            })
        })
    }

    function openAdminModal(user: any = null) {
        if (user) {
            adminModalTitle.textContent = 'Kullanıcıyı Düzenle'
            adminUserId.value = user.id
            adminUsername.value = user.username || ''
            adminPassword.value = ''
            adminPassword.placeholder = 'Değiştirmek için yeni şifre girin'
            adminFullname.value = user.fullName || ''
            adminRole.value = user.role || 'kargo_kabul'
        } else {
            adminModalTitle.textContent = 'Yeni Kullanıcı'
            adminUserId.value = ''
            adminUsername.value = ''
            adminPassword.value = ''
            adminPassword.placeholder = 'Giriş şifresi...'
            adminFullname.value = ''
            adminRole.value = 'kargo_kabul'
        }
        adminModal.classList.add('active')
    }

    btnAddUser.onclick = () => openAdminModal()
    btnCancelAdminModal.onclick = () => adminModal.classList.remove('active')

    btnSaveAdminUser.onclick = async () => {
        const username = adminUsername.value.trim()
        const password = adminPassword.value.trim()
        const fullName = adminFullname.value.trim()
        const role = adminRole.value
        const id = adminUserId.value

        if (!username || !fullName || !role || (!id && !password)) {
            showToast('Lütfen tüm alanları doldurun.', 'error')
            return
        }

        try {
            btnSaveAdminUser.textContent = 'Kaydediliyor...'
            ;(btnSaveAdminUser as HTMLButtonElement).disabled = true

            if (id) {
                const updateData: Record<string, string> = { username, fullName, role }
                if (password) updateData.password = password
                await api.updateUser(id, updateData)
            } else {
                await api.createUser({ username, password, fullName, role })
            }

            adminModal.classList.remove('active')
            loadAdminUsers()
            showToast('Kullanıcı kaydedildi.', 'success')
        } catch (e: any) {
            showToast('Hata: ' + e.message, 'error')
        } finally {
            btnSaveAdminUser.textContent = 'Kaydet'
            ;(btnSaveAdminUser as HTMLButtonElement).disabled = false
        }
    }

    return { loadAdminUsers }
}
