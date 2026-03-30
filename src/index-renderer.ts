export { }
import { showToast } from './utils/toastUtils'
import { SVG_EMPTY_FOLDER } from './utils/svgUtils'
import { initTicketLogic } from './utils/ticketLogic'
import { initProfileLogic } from './utils/profileLogic'
import { initPriorityLogic } from './utils/priorityLogic'
import { initSettingsLogic } from './utils/settingsLogic'
import { initBonusLogic } from './utils/bonusLogic'
import { initAdminLogic } from './utils/adminLogic'

// ── Element References ──────────────────────────────────────────────
const cardsDiv = document.getElementById('cards')!
const searchInput = document.getElementById('search') as HTMLInputElement
const toggleBtn = document.getElementById('toggle')!
const themeBtn = document.getElementById('theme-toggle')!
const clearCacheBtn = document.getElementById('clear-cache')!
const dcBtn = document.getElementById('double-copy-toggle')!
const statusDot = document.getElementById('status-dot')!
const statusInfo = document.getElementById('status-info')!
const statusRefreshBtn = document.getElementById('status-refresh-btn')!

// Sidebar Elements
const sideLevel = document.getElementById('side-level')!
const sideName = document.getElementById('side-name')!
const sideXp = document.getElementById('side-xp')!
const sideXpFill = document.getElementById('side-xp-fill')!
const navItems = document.querySelectorAll('.nav-item')
const viewSections = document.querySelectorAll('.view-section')
const ticketBadge = document.getElementById('ticket-badge')!

// Tickets View Elements
const ticketList = document.getElementById('ticket-list')!
const tcPending = document.getElementById('count-pending')!
const tcProgress = document.getElementById('count-progress')!
const tcCompleted = document.getElementById('count-completed')!
const tSearchInput = document.getElementById('ticket-search') as HTMLInputElement
const tFilterStatus = document.getElementById('filter-status')!
const tFilterVisibility = document.getElementById('filter-visibility')!
const tFilterOwnership = document.getElementById('filter-ownership-toggle')!
const tFilterAras = document.getElementById('filter-aras-toggle')!
const btnManualTicket = document.getElementById('btn-manual-ticket')

// Profile View Elements
const pMyLevel = document.getElementById('my-level')!
const pMyName = document.getElementById('my-name')!
const pMyRole = document.getElementById('my-role')!
const pMyXp = document.getElementById('my-xp')!
const pNextLevelXp = document.getElementById('next-level-xp')!
const pXpFill = document.getElementById('my-xp-fill')!
const scoreboardContainer = document.getElementById('scoreboard')!
const profileFilterBtns = document.querySelectorAll('.filter-btn')

// Priority View Elements
const prioList = document.getElementById('priority-list')!
const pSerial = document.getElementById('p-serial') as HTMLInputElement
const pCustomer = document.getElementById('p-customer') as HTMLInputElement
const pDesc = document.getElementById('p-desc') as HTMLInputElement
const addPrioBtn = document.getElementById('add-priority-btn')!

// Settings View Elements
const sPersonnelName = document.getElementById('personnel-name') as HTMLInputElement
const sUserRole = document.getElementById('user-role') as HTMLInputElement
const sShortcutClear = document.getElementById('shortcut-clear') as HTMLInputElement
const sShortcutCopy = document.getElementById('shortcut-copy') as HTMLInputElement
const sPopupSize = document.getElementById('popup-size') as HTMLSelectElement
const sPopupTimeout = document.getElementById('popup-timeout') as HTMLInputElement
const sAutoStart = document.getElementById('auto-start') as HTMLInputElement
const sPreventDuplicate = document.getElementById('prevent-duplicate') as HTMLInputElement
const sSaveBtn = document.getElementById('save-settings-btn') as HTMLButtonElement

// Bonus View Elements
const bonusDropZone = document.getElementById('bonus-drop-zone')!
const bonusFileInput = document.getElementById('bonus-file-input') as HTMLInputElement
const bonusResults = document.getElementById('bonus-results')!
const bonusAnalytics = document.getElementById('bonus-analytics')!
const workStartInput = document.getElementById('work-start') as HTMLInputElement
const workEndInput = document.getElementById('work-end') as HTMLInputElement

// Admin View Elements
const adminUserList = document.getElementById('admin-user-list')!
const btnAddUser = document.getElementById('btn-add-user')!
const adminModal = document.getElementById('admin-user-modal')!
const adminModalTitle = document.getElementById('admin-modal-title')!
const adminUserId = document.getElementById('admin-user-id') as HTMLInputElement
const adminUsername = document.getElementById('admin-user-username') as HTMLInputElement
const adminPassword = document.getElementById('admin-user-password') as HTMLInputElement
const adminFullname = document.getElementById('admin-user-fullname') as HTMLInputElement
const adminRole = document.getElementById('admin-user-role') as HTMLSelectElement
const btnCancelAdminModal = document.getElementById('btn-cancel-admin-modal')!
const btnSaveAdminUser = document.getElementById('btn-save-admin-user')!


// Modal elements
const modalOverlay = document.getElementById('modal-overlay')!
const modalTitle = document.getElementById('modal-title')!
const modalText = document.getElementById('modal-text')!
const modalConfirm = document.getElementById('modal-confirm')!
const modalCancel = document.getElementById('modal-cancel')!

const api = (window as any).electronAPI

let monitoringEnabled = true
let currentRole = 'kargo_kabul'
let personnelName = ''
let activeTickets: any[] = []

// ── Custom Confirm Modal ────────────────────────────────────────────
export function showConfirm(title: string, message: string, confirmText = 'Evet, Sil'): Promise<boolean> {
    return new Promise((resolve) => {
        modalTitle.textContent = title
        modalText.textContent = message
        modalConfirm.textContent = confirmText

        modalOverlay.classList.add('active')

        const close = (result: boolean) => {
            modalOverlay.classList.remove('active')
            resolve(result)
        }

        modalConfirm.onclick = () => close(true)
        modalCancel.onclick = () => close(false)
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) close(false)
        }
    })
}
;(window as any).showConfirm = showConfirm

// ── Ask MH Modal ────────────────────────────────────────────────────
function showAskMHModal(serial: string, modelName: string, modelColor: string): void {
    modalTitle.textContent = 'MH\'ye Sor'
    modalText.innerHTML = ''

    const form = document.createElement('div')
    form.style.cssText = 'display:flex;flex-direction:column;gap:12px;margin-top:12px;'

    // Checkbox elements
    const fields = [
        { id: 'chk-ariza', label: 'Arıza Beyanı' },
        { id: 'chk-adres', label: 'Adres Bilgisi' },
        { id: 'chk-tel', label: 'Telefon Numarası' },
        { id: 'chk-fatura', label: 'Fatura Tarihi' },
        { id: 'chk-seri', label: 'Seri Numarası' },
        { id: 'chk-isim', label: 'İsim ve Soyisim' }
    ]

    let checkboxesHtml = '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px;">'
    fields.forEach(f => {
        checkboxesHtml += `
            <label style="display:flex;align-items:center;gap:8px;font-size:0.9rem;cursor:pointer;">
                <input type="checkbox" id="${f.id}" value="${f.label}" style="accent-color:#38bdf8;width:16px;height:16px;">
                ${f.label}
            </label>
        `
    })
    checkboxesHtml += '</div>'

    form.innerHTML = `
    <label style="font-size:0.85rem;color:#94a3b8;margin-bottom:-8px;">Eksik Bilgiler (Birden fazla seçebilirsiniz)</label>
    ${checkboxesHtml}
    
    <label style="font-size:0.85rem;color:#94a3b8;">Müşteri İsmi (Opsiyonel)</label>
    <input type="text" id="mh-customer" placeholder="Müşteri adı soyadı..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

    <label style="font-size:0.85rem;color:#94a3b8;">Aras Kodu (Opsiyonel)</label>
    <input type="text" id="mh-aras" placeholder="Aras kargo kodu..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

    <label style="font-size:0.85rem;color:#94a3b8;">Telefon Numarası (Opsiyonel)</label>
    <input type="text" id="mh-phone" placeholder="Müşteri iletişim numarası..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

    <label style="font-size:0.85rem;color:#94a3b8;">Not (Opsiyonel)</label>
    <input type="text" id="mh-note" placeholder="Ekstra detay ekleyin..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">
    `
    modalText.appendChild(form)
    modalConfirm.textContent = 'Gönder'

    modalOverlay.classList.add('active')

    modalConfirm.onclick = async () => {
        // Collect checked missing types
        const selectedTypes: string[] = []
        fields.forEach(f => {
            const el = document.getElementById(f.id) as HTMLInputElement
            if (el && el.checked) {
                selectedTypes.push(el.value)
            }
        })

        const missingType = selectedTypes.length > 0 ? selectedTypes.join(', ') : 'Belirtilmedi'
        const note = (document.getElementById('mh-note') as HTMLInputElement).value.trim()
        const customerName = (document.getElementById('mh-customer') as HTMLInputElement).value.trim()
        const arasCode = (document.getElementById('mh-aras') as HTMLInputElement).value.trim()
        const phoneNumber = (document.getElementById('mh-phone') as HTMLInputElement).value.trim()

        try {
            await api.createTicket({
                serial,
                model_name: modelName,
                model_color: modelColor,
                missing_type: missingType,
                note,
                customer_name: customerName,
                aras_code: arasCode,
                phone_number: phoneNumber,
                created_by: personnelName || 'İsimsiz Personel'
            })
            showToast('Eksik bilgi talebiniz MH departmanına iletildi.', 'success')
        } catch (e: any) {
            showToast('Talep oluşturulurken hata: ' + e.message, 'error')
        }

        modalOverlay.classList.remove('active')
    }

    modalCancel.onclick = () => {
        modalOverlay.classList.remove('active')
    }

    modalOverlay.onclick = (e: MouseEvent) => {
        if (e.target === modalOverlay) modalOverlay.classList.remove('active')
    }
}

// ── Date Formatter ──────────────────────────────────────────────────
function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// ── Card Renderer ───────────────────────────────────────────────────
function loadCards() {
    cardsDiv.innerHTML = `
        <div class="card" style="display:flex; flex-direction:column; gap:12px; pointer-events:none; opacity:0.7;">
            <div class="skeleton" style="width: 30%; height: 24px;"></div>
            <div class="skeleton" style="width: 100%; height: 60px;"></div>
            <div class="skeleton" style="width: 60%; height: 20px;"></div>
        </div>
        <div class="card" style="display:flex; flex-direction:column; gap:12px; pointer-events:none; opacity:0.5;">
            <div class="skeleton" style="width: 40%; height: 24px;"></div>
            <div class="skeleton" style="width: 100%; height: 60px;"></div>
            <div class="skeleton" style="width: 80%; height: 20px;"></div>
        </div>
    `

    api.getCachedData().then((data: any[]) => {
        cardsDiv.innerHTML = ''

        if (!data || data.length === 0) {
            cardsDiv.innerHTML = `
        <div class="empty-state">
          ${SVG_EMPTY_FOLDER}
          <h3>Henüz bir cihaz sorgulanmadı</h3>
          <p>Panoya bir seri numarası kopyaladığınızda burada görünecektir.</p>
        </div>
      `
            return
        }

        const query = searchInput.value.toLowerCase()
        data.sort((a: any, b: any) => new Date(b.copy_date).getTime() - new Date(a.copy_date).getTime())

        // FIX: PRECOMPUTE TICKET MAP (O(1) lookups)
        const completedTicketsMap = new Map();
        activeTickets.forEach(t => {
            if (t.status === 'completed') {
                completedTicketsMap.set(t.serial, t);
            }
        });

        // FIX: BATCH DOM APPENDS
        const fragment = document.createDocumentFragment();

        data.forEach((item: any) => {
            if (item.serial.toLowerCase().includes(query)) {
                const card = document.createElement('div')
                let cardClass = 'card'
                const statusLabel = item.warranty_status

                if (statusLabel.includes('RECCI')) cardClass += ' recci'
                else if (statusLabel.includes('KVK')) cardClass += ' kvk'
                else cardClass += ' out-of-warranty'

                // Check if this serial has a completed ticket to show MH response
                const completedTicket = completedTicketsMap.get(item.serial);

                // MH'ye Sor button (STRICTLY only for kargo_kabul role and if no completed response exists)
                const askMHBtn = (currentRole === 'kargo_kabul' && !completedTicket?.response)
                    ? `<button class="ask-mh-btn" data-serial="${item.serial}" data-model="${item.model_name || ''}" data-color="${item.model_color || ''}" style="position:absolute;bottom:12px;right:12px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;" title="MH'ye Sor">📩 MH'ye Sor</button>`
                    : ''

                card.className = cardClass
                card.style.position = 'relative'
                card.innerHTML = `
          <button class="delete-btn" onclick="deleteEntry('${item.serial}')">✕</button>
          ${askMHBtn}
          <div class="status-tag">${statusLabel}</div>
          <p><strong>Seri:</strong> ${item.serial}</p>
          <p><strong>Model:</strong> ${item.model_name || 'Bilinmiyor'} ${item.model_color || ''}</p>
          <p><strong>Tarih:</strong> ${formatDate(item.copy_date)}</p>
          ${item.warranty_end ? `<p><strong>Bitiş:</strong> ${item.warranty_end}</p>` : ''}
          ${completedTicket?.response ? `<div style="margin-top:8px;padding:8px 12px;background:rgba(16,185,129,0.08);border-radius:10px;font-size:0.8rem;max-height:100px;overflow-y:auto;word-break:break-word;border:1px solid rgba(16,185,129,0.2);"><strong style="color:#10b981;display:block;margin-bottom:2px;">MH Cevap:</strong>${completedTicket.response}</div>` : ''}
        `
                fragment.appendChild(card)
            }
        })

        cardsDiv.appendChild(fragment)

        // Bind Ask MH buttons
        cardsDiv.querySelectorAll('.ask-mh-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation()
                const el = btn as HTMLElement
                showAskMHModal(el.dataset.serial!, el.dataset.model!, el.dataset.color!)
            })
        })
    })
}

// ── Monitoring Toggle ───────────────────────────────────────────────
toggleBtn.onclick = () => {
    monitoringEnabled = !monitoringEnabled
    const span = toggleBtn.querySelector('span')
    if (span) {
        span.textContent = monitoringEnabled ? '👁️ Clipboard İzleme: Aktif' : '👁️ Clipboard İzleme: Devre Dışı'
    }
    toggleBtn.style.opacity = monitoringEnabled ? '1' : '0.6'
    api.toggleMonitoring(monitoringEnabled)
}

// ── Theme Management ────────────────────────────────────────────────
const ALL_THEMES = ['dark', 'midnight', 'ocean', 'sunset'] as const
const THEME_ICONS: Record<string, string> = { dark: '🌙', midnight: '🔮', ocean: '🌊', sunset: '🌅' }
let currentTheme = 'dark'

function applyTheme(theme: string) {
    currentTheme = theme
    document.body.classList.remove(...ALL_THEMES)
    document.body.classList.add(theme)
    themeBtn.textContent = THEME_ICONS[theme] || '🌙'
    document.querySelectorAll('.theme-card').forEach((c: any) => {
        c.classList.toggle('selected', c.dataset.theme === theme)
    })
}

themeBtn.onclick = () => {
    const idx = ALL_THEMES.indexOf(currentTheme as any)
    const next = ALL_THEMES[(idx + 1) % ALL_THEMES.length]
    applyTheme(next)
    api.getSettings().then((s: any) => {
        api.saveSettings({ ...s, theme: next })
    })
}

const themePicker = document.getElementById('theme-picker')
if (themePicker) {
    themePicker.addEventListener('click', (e: Event) => {
        const card = (e.target as HTMLElement).closest('.theme-card') as HTMLElement | null
        if (!card || !card.dataset.theme) return
        const theme = card.dataset.theme
        applyTheme(theme)
        api.getSettings().then((s: any) => {
            api.saveSettings({ ...s, theme })
        })
    })
}

api.getSettings().then((s: any) => {
    const theme = s.theme || 'dark'
    applyTheme(theme)
})


// ── Search ──────────────────────────────────────────────────────────
let mainSearchTimeout: NodeJS.Timeout
searchInput.oninput = () => {
    clearTimeout(mainSearchTimeout)
    mainSearchTimeout = setTimeout(() => {
        loadCards()
    }, 300)
}

// ── Sidebar Navigation ──────────────────────────────────────────────
function switchView(viewName: string) {
    viewSections.forEach(sec => sec.classList.remove('active'))
    navItems.forEach(item => item.classList.remove('active'))

    const targetSec = document.getElementById(`view-${viewName}`)
    const targetNavItem = document.querySelector(`[data-view="${viewName}"]`)

    if (targetSec && targetNavItem) {
        targetSec.classList.add('active')
        targetNavItem.classList.add('active')
    }

    // Refresh data based on view
    if (viewName === 'history') loadCards()
    else if (viewName === 'tickets') loadTickets()
    else if (viewName === 'profile') loadProfileScoreboard()
    else if (viewName === 'priority') loadPriorityDevices()
    else if (viewName === 'admin') loadAdminUsers()
    else if (viewName === 'settings') loadSettingsToUI()
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const view = (item as HTMLElement).dataset.view
        if (view) switchView(view)
    })
})

// ── Shared Profile Logic ────────────────────────────────────────────
function calculateLevel(xp: number): { level: number, nextXp: number } {
    let level = 1
    let threshold = 100
    while (xp >= threshold) {
        level++
        threshold += 100 * (level * 0.5)
    }
    return { level, nextXp: Math.floor(threshold) }
}

async function refreshSidebarProfile() {
    const settings = await api.getSettings()
    personnelName = settings.personnelName || 'İsimsiz'
    sideName.textContent = personnelName.toUpperCase()

    // Fetch user from DB for XP
    const users = await api.getUsers() // I need to add this IPC if it doesn't exist, or use scoreboard data
    const me = users?.find((u: any) => u.username === settings.username)
    if (me) {
        const { level, nextXp } = calculateLevel(me.xp || 0)
        sideLevel.textContent = String(level)
        sideXp.textContent = String(me.xp || 0)
        const progress = ((me.xp || 0) / nextXp) * 100
        sideXpFill.style.width = `${Math.min(100, progress)}%`

        // Also update Profile view if active
        if (pMyLevel) {
            pMyLevel.textContent = String(level)
            pMyName.textContent = me.fullName || me.username
            pMyRole.textContent = me.role === 'mh' ? 'Müşteri Hizmetleri' : 'Kargo Kabul'
            pMyXp.textContent = String(me.xp || 0)
            pNextLevelXp.textContent = String(nextXp)
            pXpFill.style.width = `${Math.min(100, progress)}%`
        }
    }
}


// ── Clear Cache ─────────────────────────────────────────────────────
clearCacheBtn.onclick = async () => {
    const confirmed = await showConfirm(
        'Tüm Geçmişi Temizle',
        'Tüm sorgu geçmişiniz kalıcı olarak silinecektir. Emin misiniz?',
        'Tümünü Sil'
    )
    if (confirmed) {
        try {
            await api.clearCache()
            loadCards()
            showToast('Tüm önbellek başarıyla temizlendi.', 'success')
        } catch (e: any) {
            showToast('Temizleme hatası: ' + e.message, 'error')
        }
    }
}

    // ── Delete Entry (global) ───────────────────────────────────────────
    ; (window as any).deleteEntry = async (serial: string) => {
        const confirmed = await showConfirm(
            'Kaydı Sil',
            `${serial} seri numaralı cihazı listeden silmek istediğinizden emin misiniz?`
        )
        if (confirmed) {
            try {
                await api.deleteEntry(serial)
                loadCards()
                showToast(`${serial} kaydı silindi.`, 'success')
            } catch (e: any) {
                showToast('Silinemedi: ' + e.message, 'error')
            }
        }
    }

// ── Double Copy Toggle ──────────────────────────────────────────────
function updateDCUI(enabled: boolean) {
    dcBtn.textContent = enabled ? '🔄 Double Copy: Açık' : '🔄 Double Copy: Kapalı'
    dcBtn.classList.toggle('btn-warning', !enabled)
    dcBtn.classList.toggle('btn-primary', enabled)
}

api.getDoubleCopy().then((enabled: boolean) => updateDCUI(enabled))

dcBtn.onclick = async () => {
    const current = dcBtn.textContent!.includes('Açık')
    try {
        await api.toggleDoubleCopy(!current)
        updateDCUI(!current)
        showToast(`Double Copy modu ${!current ? 'açıldı' : 'kapatıldı'}.`, 'info')
    } catch (e: any) {
        showToast('Double Copy değişemedi: ' + e.message, 'error')
    }
}

// ── Server Status Listener ──────────────────────────────────────────
api.onServerStatusUpdate((status: { online: boolean; latency: number }) => {
    statusDot.className = 'status-dot ' + (status.online ? (status.latency > 1000 ? 'slow' : 'online') : 'offline')
    statusInfo.textContent = status.online ? `Sunucu: ${status.latency}ms` : 'Sunucu: Erişilemiyor'
    statusRefreshBtn.classList.remove('rotating')
})

statusRefreshBtn.addEventListener('click', () => {
    statusRefreshBtn.classList.add('rotating')
    api.manualServerStatusRefresh()
})

api.onCacheCleared(() => loadCards())

api.onMonitoringToggled((enabled: boolean) => {
    monitoringEnabled = enabled
    const span = toggleBtn.querySelector('span')
    if (span) {
        span.textContent = monitoringEnabled ? '👁️ Clipboard İzleme: Aktif' : '👁️ Clipboard İzleme: Devre Dışı'
    }
    toggleBtn.style.opacity = monitoringEnabled ? '1' : '0.6'
})

// ── Ticket Updates ──────────────────────────────────────────────────
api.onTicketUpdate((tickets: any[]) => {
    activeTickets = tickets

    // Update badge
    const pendingCount = tickets.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length
    if (pendingCount > 0) {
        ticketBadge.style.display = 'block'
        ticketBadge.textContent = String(pendingCount)
    } else {
        ticketBadge.style.display = 'none'
    }

    // Re-render cards to show ticket status
    loadCards()
})

// ── Priority Device Match ───────────────────────────────────────────
api.onPriorityDeviceMatch((device: any) => {
    const alertDiv = document.createElement('div')
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        background: #ef4444;
        color: white;
        padding: 16px 24px;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(239, 68, 68, 0.4);
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 300px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        animation: slideDownIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    `

    alertDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:1.1rem;">⚠️ ÖNCELİKLİ CİHAZ!</strong>
            <button id="close-priority-alert" style="background:none; border:none; color:white; font-size:1.2rem; cursor:pointer; padding:0 4px;">✕</button>
        </div>
        <div style="font-size:0.95rem; font-weight:600;">${device.customer_name}</div>
        <div style="font-size:0.85rem; opacity:0.9; background:rgba(0,0,0,0.1); padding:8px; border-radius:8px;">${device.description}</div>
        <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
            <button id="delete-priority-bound" style="background: rgba(239, 68, 68, 0.5); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s;">Sistemden Sil</button>
        </div>
    `

    if (!document.getElementById('priority-animations')) {
        const style = document.createElement('style')
        style.id = 'priority-animations'
        style.textContent = `
            @keyframes slideDownIn {
                from { opacity: 0; transform: translate(-50%, -40px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }
            #delete-priority-bound:hover { background: #dc2626 !important; transform: scale(1.05); }
        `
        document.head.appendChild(style)
    }

    document.body.appendChild(alertDiv)

    const closeBtn = alertDiv.querySelector('#close-priority-alert') as HTMLElement
    closeBtn.onclick = () => alertDiv.remove()

    const deleteBtn = alertDiv.querySelector('#delete-priority-bound') as HTMLElement
    deleteBtn.onclick = async () => {
        const confirmed = await showConfirm(
            'Sistemden Kalıcı Olarak Sil',
            `${device.customer_name} cihazı işleme alındı olarak işaretlenecek ve listeden kalkacaktır. Emin misiniz?`,
            'Evet, Sil'
        )
        if (confirmed) {
            await api.deletePriorityDevice(device.id)
            if (alertDiv.parentNode) alertDiv.remove()
            showToast('Cihaz sistemden kalıcı olarak silindi.', 'success')
        }
    }
})

// ── Sub-view Initialization Logic ──────────────────────────────────
const { loadTickets, renderTicketsList } = initTicketLogic(
    api,
    { ticketList, tSearchInput, tFilterStatus, tFilterVisibility, tFilterOwnership, tFilterAras, tcPending, tcProgress, tcCompleted, btnManualTicket },
    () => currentRole,
    () => personnelName
)

const { loadProfileScoreboard } = initProfileLogic(
    api,
    {
        scoreboardContainer,
        profileFilterBtns,
        pMyLevel,
        pMyName,
        pMyRole,
        pMyXp,
        pNextLevelXp,
        pXpFill
    },
    personnelName,
    calculateLevel,
    refreshSidebarProfile
)

const { loadPriorityDevices } = initPriorityLogic(api, {
    prioList, addPrioBtn, pSerial, pCustomer, pDesc
})

const { loadSettingsToUI } = initSettingsLogic(api, {
    sPersonnelName, sUserRole, sShortcutClear, sShortcutCopy,
    sPopupSize, sPopupTimeout, sAutoStart, sPreventDuplicate, sSaveBtn
}, refreshSidebarProfile)

// Global window function for deletion
;(window as any).deletePriority = async (id: string) => {
    const confirmed = await showConfirm(
        'Öncelikli Cihazı Sil',
        'Bu cihazı öncelikli listeden silmek istediğinize emin misiniz?',
        'Evet, Sil'
    )
    if (confirmed) {
        await api.deletePriorityDevice(id)
        loadPriorityDevices()
        showToast('Cihaz başarıyla silindi.', 'success')
    }
}

// ── Initial Load ────────────────────────────────────────────────────
Promise.all([
    api.getSettings(),
    api.getTickets(),
    api.getUsers().catch(() => [])
]).then(([s, tickets, users]: [any, any[], any[]]) => {
    currentRole = s.role || 'kargo_kabul'
    personnelName = s.personnelName || ''
    
    const isAdmin = s.isAdmin === true || s.username === 'KursatS'
    const isLoggedIn = !!s.personnelName?.trim()

    // Sidebar role-based items
    const sideBonus = document.getElementById('side-bonus-btn')
    const sideAdmin = document.getElementById('side-admin-btn')
    const sideProfile = document.getElementById('side-profile-btn')

    if (sideBonus) sideBonus.style.display = currentRole === 'kargo_kabul' ? 'flex' : 'none'
    if (btnManualTicket) btnManualTicket.style.display = currentRole === 'kargo_kabul' ? 'flex' : 'none'
    if (sideAdmin) sideAdmin.style.display = isAdmin ? 'flex' : 'none'
    if (sideProfile) sideProfile.style.display = isLoggedIn ? 'flex' : 'none'

    if (tickets) {
        activeTickets = tickets
        const pendingCount = tickets.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length
        ticketBadge.style.display = pendingCount > 0 ? 'flex' : 'none'
        ticketBadge.textContent = String(pendingCount)
    }
    
    refreshSidebarProfile()
    loadCards()
})

api.onRefreshCards(() => {
    api.getSettings().then((s: any) => {
        currentRole = s.role || 'kargo_kabul'
        personnelName = s.personnelName || ''
        
        const isAdmin = s.isAdmin === true || s.username === 'KursatS'
        const isLoggedIn = !!s.personnelName?.trim()
        
        const sideBonus = document.getElementById('side-bonus-btn')
        const sideAdmin = document.getElementById('side-admin-btn')
        const sideProfile = document.getElementById('side-profile-btn')

        if (sideBonus) sideBonus.style.display = s.role === 'kargo_kabul' ? 'flex' : 'none'
        if (btnManualTicket) btnManualTicket.style.display = s.role === 'kargo_kabul' ? 'flex' : 'none'
        if (sideAdmin) sideAdmin.style.display = isAdmin ? 'flex' : 'none'
        if (sideProfile) sideProfile.style.display = isLoggedIn ? 'flex' : 'none'

        refreshSidebarProfile()
        loadCards()
    })
})

api.onTicketUpdate((tickets: any[]) => {
    activeTickets = tickets
    const pendingCount = tickets.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length
    ticketBadge.style.display = pendingCount > 0 ? 'flex' : 'none'
    ticketBadge.textContent = String(pendingCount)
    if (document.getElementById('view-tickets')?.classList.contains('active')) {
        renderTicketsList(tickets)
    }
    loadCards()
})

initBonusLogic(api, {
    bonusDropZone,
    bonusFileInput,
    bonusResults,
    bonusAnalytics,
    workStartInput,
    workEndInput
})

const { loadAdminUsers } = initAdminLogic(api, {
    adminUserList, btnAddUser, adminModal, adminModalTitle,
    adminUserId, adminUsername, adminPassword, adminFullname,
    adminRole, btnCancelAdminModal, btnSaveAdminUser
}, undefined as any)

// ── Auto-Updater UI ─────────────────────────────────────────────────
;(function setupAutoUpdater() {
    const bar = document.createElement('div')
    bar.id = 'update-bar'
    bar.style.cssText = 'display:none;position:fixed;bottom:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-top:1px solid var(--accent);padding:10px 20px;align-items:center;gap:12px;font-size:0.85rem;color:var(--text-main);'
    bar.innerHTML = `
        <span id="update-msg">🚀 Yeni sürüm mevcut!</span>
        <div id="update-progress-wrap" style="display:none;flex:1;max-width:200px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
            <div id="update-progress-bar" style="height:100%;width:0%;background:var(--accent);border-radius:3px;transition:width 0.3s;"></div>
        </div>
        <button id="update-action-btn" style="padding:6px 16px;border:none;border-radius:8px;background:var(--accent);color:#fff;cursor:pointer;font-size:0.8rem;font-weight:600;">İndir</button>
        <button id="update-dismiss-btn" style="padding:6px 10px;border:none;background:transparent;color:var(--text-muted);cursor:pointer;font-size:1rem;">✕</button>
    `
    document.body.appendChild(bar)

    const updateMsg = document.getElementById('update-msg')!
    const progressWrap = document.getElementById('update-progress-wrap')!
    const progressBar = document.getElementById('update-progress-bar')!
    const actionBtn = document.getElementById('update-action-btn')!
    const dismissBtn = document.getElementById('update-dismiss-btn')!

    let updateState: 'available' | 'downloading' | 'ready' = 'available'

    api.onUpdateAvailable((version: string) => {
        updateMsg.textContent = `🚀 Yeni sürüm mevcut: v${version}`
        bar.style.display = 'flex'
        updateState = 'available'
        actionBtn.textContent = 'İndir'
    })

    api.onUpdateProgress((percent: number) => {
        progressWrap.style.display = 'block'
        progressBar.style.width = `${percent}%`
        updateMsg.textContent = `⏬ İndiriliyor... %${percent}`
    })

    api.onUpdateDownloaded(() => {
        updateState = 'ready'
        progressWrap.style.display = 'none'
        updateMsg.textContent = '✅ Güncelleme hazır!'
        actionBtn.textContent = 'Güncelle'
    })

    actionBtn.onclick = () => {
        if (updateState === 'available') {
            updateState = 'downloading'
            actionBtn.textContent = 'İndiriliyor...'
            actionBtn.style.opacity = '0.6'
            api.startUpdateDownload()
        } else if (updateState === 'ready') {
            api.installUpdate()
        }
    }

    dismissBtn.onclick = () => {
        bar.style.display = 'none'
    }
})()
