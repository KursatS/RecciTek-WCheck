export { }
import { showToast } from './utils/toastUtils'
import { SVG_EMPTY_FOLDER } from './utils/svgUtils'
import { initTicketLogic } from './utils/ticketLogic'
import { initProfileLogic } from './utils/profileLogic'
import { initPriorityLogic } from './utils/priorityLogic'
import { initSettingsLogic } from './utils/settingsLogic'
import { initBonusLogic } from './utils/bonusLogic'
import { initAdminLogic } from './utils/adminLogic'
import { initZReportLogic } from './utils/zreportLogic'
import { escapeHtml } from './utils/html'

//
const cardsDiv = document.getElementById('cards')!
const searchInput = document.getElementById('search') as HTMLInputElement
const toggleBtn = document.getElementById('toggle')!
const themeBtn = document.getElementById('theme-toggle')!
const clearCacheBtn = document.getElementById('clear-cache')!
const dcBtn = document.getElementById('double-copy-toggle')!
const clipboardUpperToggleBtn = document.getElementById('clipboard-upper-toggle')!
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
const tQueueBar = document.getElementById('ticket-queue-bar') as HTMLDivElement
const tSearchInput = document.getElementById('ticket-search') as HTMLInputElement
const tFilterStatus = document.getElementById('filter-status')!
const tFilterVisibility = document.getElementById('filter-visibility')!
const tFilterOwnership = document.getElementById('filter-ownership-toggle')!
const tQueueAll = document.getElementById('ticket-queue-main') as HTMLButtonElement
const tQueuePhone = document.getElementById('ticket-queue-phone') as HTMLButtonElement
const tQueueDetail = document.getElementById('ticket-queue-detail') as HTMLButtonElement
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
const sClipboardUpper = document.getElementById('clipboard-upper') as HTMLInputElement
const sLogoutBtn = document.getElementById('logout-btn') as HTMLButtonElement

// Bonus View Elements
const bonusDropZone = document.getElementById('bonus-drop-zone')!
const bonusFileInput = document.getElementById('bonus-file-input') as HTMLInputElement
const bonusResults = document.getElementById('bonus-results')!
const bonusAnalytics = document.getElementById('bonus-analytics')!
const workStartInput = document.getElementById('work-start') as HTMLInputElement
const workEndInput = document.getElementById('work-end') as HTMLInputElement

// Z Report View Elements
const zreportDropZone = document.getElementById('zreport-drop-zone')!
const zreportFileInput = document.getElementById('zreport-file-input') as HTMLInputElement
const zreportResults = document.getElementById('zreport-results')!
const zreportAnalytics = document.getElementById('zreport-analytics')!

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

// Device Call Elements
const sideDeviceCallBtn = document.getElementById('side-device-call-btn')!
const deviceCallModal = document.getElementById('device-call-modal')!
const dcallSerial = document.getElementById('dcall-serial') as HTMLInputElement
const dcallModel = document.getElementById('dcall-model') as HTMLInputElement
const dcallCustomer = document.getElementById('dcall-customer') as HTMLInputElement
const btnCancelDeviceCall = document.getElementById('btn-cancel-device-call')!
const btnSendDeviceCall = document.getElementById('btn-send-device-call')!
const deviceCallToastContainer = document.getElementById('device-call-toast-container')!


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

//
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

//
function showAskMHModal(serial: string, modelName: string, modelColor: string): void {
    modalTitle.textContent = 'MH\'ye Sor'
    modalText.innerHTML = ''

    const form = document.createElement('div')
    form.style.cssText = 'display:flex;flex-direction:column;gap:12px;margin-top:12px;'

    // Checkbox elements
    const fields = [
        { id: 'chk-ariza', label: 'Ar\u0131za Beyan\u0131' },
        { id: 'chk-adres', label: 'Adres Bilgisi' },
        { id: 'chk-tel', label: 'Telefon Numaras\u0131' },
        { id: 'chk-fatura', label: 'Fatura Tarihi' },
        { id: 'chk-seri', label: 'Seri Numaras\u0131' },
        { id: 'chk-isim', label: '\u0130sim ve Soyisim' }
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
    <label style="font-size:0.85rem;color:#94a3b8;margin-bottom:-8px;">Eksik Bilgiler (Birden fazla se\u00e7ebilirsiniz)</label>
    ${checkboxesHtml}
    
    <label style="font-size:0.85rem;color:#94a3b8;">M\u00fc\u015fteri \u0130smi (Opsiyonel)</label>
    <input type="text" id="mh-customer" placeholder="M\u00fc\u015fteri ad\u0131 soyad\u0131..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

    <label style="font-size:0.85rem;color:#94a3b8;">Aras Kodu (Opsiyonel)</label>
    <input type="text" id="mh-aras" placeholder="Aras kargo kodu..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

    <label style="font-size:0.85rem;color:#94a3b8;">Telefon Numaras\u0131 (Opsiyonel)</label>
    <input type="text" id="mh-phone" placeholder="M\u00fc\u015fteri ileti\u015fim numaras\u0131..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

    <label style="font-size:0.85rem;color:#94a3b8;">Not (Opsiyonel)</label>
    <input type="text" id="mh-note" placeholder="Ekstra detay ekleyin..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">
    `
    modalText.appendChild(form)
    modalConfirm.textContent = 'G\u00f6nder'

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
                created_by: personnelName || '\u0130simsiz Personel'
            })
            showToast('Eksik bilgi talebiniz MH departman\u0131na iletildi.', 'success')
        } catch (e: any) {
            showToast('Talep olu\u015fturulurken hata: ' + e.message, 'error')
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

//
function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

//
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
                    ? `<button class="ask-mh-btn" data-serial="${item.serial}" data-model="${item.model_name || ''}" data-color="${item.model_color || ''}" style="position:absolute;bottom:12px;right:12px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;" title="MH'ye Sor">&#128233; MH'ye Sor</button>`
                    : ''

                card.className = cardClass
                card.style.position = 'relative'
                card.innerHTML = `
          <button class="delete-btn" onclick="deleteEntry('${item.serial}')">&#10005;</button>
          ${askMHBtn}
          <div class="status-tag">${statusLabel}</div>
          <p><strong>Seri:</strong> ${item.serial}</p>
          <p><strong>Model:</strong> ${item.model_name || 'Bilinmiyor'} ${item.model_color || ''}</p>
          <p><strong>Tarih:</strong> ${formatDate(item.copy_date)}</p>
          ${item.warranty_end ? `<p><strong>Biti\u015f:</strong> ${item.warranty_end}</p>` : ''}
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

//
toggleBtn.onclick = () => {
    monitoringEnabled = !monitoringEnabled
    const span = toggleBtn.querySelector('span')
    if (span) {
        span.textContent = monitoringEnabled ? '\u{1F4CB} Clipboard \u0130zleme: Aktif' : '\u{1F4CB} Clipboard \u0130zleme: Devre D\u0131\u015f\u0131'
    }
    toggleBtn.style.opacity = monitoringEnabled ? '1' : '0.6'
    api.toggleMonitoring(monitoringEnabled)
}

//
const ALL_THEMES = ['dark', 'midnight', 'ocean', 'sunset'] as const
const THEME_ICONS: Record<string, string> = {
    dark: '\u{1F319}',
    midnight: '\u{1F52E}',
    ocean: '\u{1F30A}',
    sunset: '\u{1F305}'
}
let currentTheme = 'dark'

function applyTheme(theme: string) {
    currentTheme = theme
    document.body.classList.remove(...ALL_THEMES)
    document.body.classList.add(theme)
    themeBtn.textContent = THEME_ICONS[theme] || '\u{1F319}'
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


//
let mainSearchTimeout: NodeJS.Timeout
searchInput.oninput = () => {
    clearTimeout(mainSearchTimeout)
    mainSearchTimeout = setTimeout(() => {
        loadCards()
    }, 300)
}

//
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
    if (viewName === 'history') {
        loadCards()
        api.getSettings().then((s: any) => {
            updateClipboardUpperUI(s.clipboardUpperEnabled !== false)
        })
    }
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

//
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
    personnelName = settings.personnelName || '\u0130simsiz'
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
            pMyRole.textContent = me.role === 'mh' ? 'M\u00fc\u015fteri Hizmetleri' : 'Kargo Kabul'
            pMyXp.textContent = String(me.xp || 0)
            pNextLevelXp.textContent = String(nextXp)
            pXpFill.style.width = `${Math.min(100, progress)}%`
        }
    }
}


//
clearCacheBtn.onclick = async () => {
    const confirmed = await showConfirm(
        'T\u00fcm Ge\u00e7mi\u015fi Temizle',
        'T\u00fcm sorgu ge\u00e7mi\u015finiz kal\u0131c\u0131 olarak silinecektir. Emin misiniz?',
        'T\u00fcm\u00fcn\u00fc Sil'
    )
    if (confirmed) {
        try {
            await api.clearCache()
            loadCards()
            showToast('T\u00fcm \u00f6nbellek ba\u015far\u0131yla temizlendi.', 'success')
        } catch (e: any) {
            showToast('Temizleme hatas\u0131: ' + e.message, 'error')
        }
    }
}

//
    ; (window as any).deleteEntry = async (serial: string) => {
        const confirmed = await showConfirm(
            'Kayd\u0131 Sil',
            `${serial} seri numaral\u0131 cihaz\u0131 listeden silmek istedi\u011finizden emin misiniz?`
        )
        if (confirmed) {
            try {
                await api.deleteEntry(serial)
                loadCards()
                showToast(`${serial} kayd\u0131 silindi.`, 'success')
            } catch (e: any) {
                showToast('Silinemedi: ' + e.message, 'error')
            }
        }
    }

//
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
        showToast(`Double Copy modu ${!current ? 'a\u00e7\u0131ld\u0131' : 'kapat\u0131ld\u0131'}.`, 'info')
    } catch (e: any) {
        showToast('Double Copy değişemedi: ' + e.message, 'error')
    }
}

function updateClipboardUpperUI(enabled: boolean) {
    const span = clipboardUpperToggleBtn.querySelector('span')
    if (span) {
        span.textContent = enabled ? '🔠 Büyük Harf Yapıştır: Aktif' : '🔠 Büyük Harf Yapıştır: Kapalı'
    }
    clipboardUpperToggleBtn.classList.toggle('btn-warning', !enabled)
    clipboardUpperToggleBtn.classList.toggle('btn-primary', enabled)
}

api.getSettings().then((s: any) => updateClipboardUpperUI(s.clipboardUpperEnabled !== false))

clipboardUpperToggleBtn.onclick = async () => {
    const s = await api.getSettings()
    const current = s.clipboardUpperEnabled !== false
    const next = !current
    try {
        await api.saveSettings({ ...s, clipboardUpperEnabled: next })
        updateClipboardUpperUI(next)
        showToast(`Büyük harf yapıştırma özelliği ${next ? 'etkinle\u015ftirildi' : 'devre d\u0131\u015f\u0131 b\u0131rak\u0131ld\u0131'}.`, 'info')
    } catch (e: any) {
        showToast('Büyük harf yapıştırma ayarı değiştirilemedi: ' + e.message, 'error')
    }
}

//
api.onServerStatusUpdate((status: { online: boolean; latency: number }) => {
    statusDot.className = 'status-dot ' + (status.online ? (status.latency > 1000 ? 'slow' : 'online') : 'offline')
    statusInfo.textContent = status.online ? `Sunucu: ${status.latency}ms` : 'Sunucu: Eri\u015filemiyor'
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
        span.textContent = monitoringEnabled ? '\u{1F4CB} Clipboard \u0130zleme: Aktif' : '\u{1F4CB} Clipboard \u0130zleme: Devre D\u0131\u015f\u0131'
    }
    toggleBtn.style.opacity = monitoringEnabled ? '1' : '0.6'
})

//

//
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
            <strong style="font-size:1.1rem;">&#9888;&#65039; ÖNCELİKLİ CİHAZ!</strong>
            <button id="close-priority-alert" style="background:none; border:none; color:white; font-size:1.2rem; cursor:pointer; padding:0 4px;">&#10005;</button>
        </div>
        <div style="font-size:0.95rem; font-weight:600;">${escapeHtml(device.customer_name)}</div>
        <div style="font-size:0.85rem; opacity:0.9; background:rgba(0,0,0,0.1); padding:8px; border-radius:8px;">${escapeHtml(device.description)}</div>
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
            loadPriorityDevices()
            showToast('Cihaz sistemden kalıcı olarak silindi.', 'success')
        }
    }
})

//
const { loadTickets, renderTicketsList } = initTicketLogic(
    api,
    { ticketList, tSearchInput, tFilterStatus, tFilterVisibility, tFilterOwnership, tQueueAll, tQueuePhone, tQueueDetail, tcPending, tcProgress, tcCompleted, btnManualTicket },
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

const { loadPriorityDevices, focusPriorityDevice } = initPriorityLogic(api, {
    prioList, addPrioBtn, pSerial, pCustomer, pDesc
})

const { loadSettingsToUI } = initSettingsLogic(api, {
    sPersonnelName, sUserRole, sShortcutClear, sShortcutCopy,
    sPopupSize, sPopupTimeout, sAutoStart, sPreventDuplicate, sLogoutBtn,
    sClipboardUpper
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
        showToast('Cihaz ba\u015far\u0131yla silindi.', 'success')
    }
}

//
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
    if (sideDeviceCallBtn) sideDeviceCallBtn.style.display = currentRole === 'kargo_kabul' ? 'flex' : 'none'
    if (tQueueBar) tQueueBar.style.display = 'flex'
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
        if (sideDeviceCallBtn) sideDeviceCallBtn.style.display = s.role === 'kargo_kabul' ? 'flex' : 'none'
        if (tQueueBar) tQueueBar.style.display = 'flex'
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

api.onFocusPriorityDevice((device: any) => {
    switchView('priority')
    loadPriorityDevices().then(() => {
        focusPriorityDevice(device)
    })
})

api.onPriorityDevicesUpdate(() => {
    loadPriorityDevices()
})

initBonusLogic(api, {
    bonusDropZone,
    bonusFileInput,
    bonusResults,
    bonusAnalytics,
    workStartInput,
    workEndInput
})

initZReportLogic(api, {
    zreportDropZone,
    zreportFileInput,
    zreportResults,
    zreportAnalytics
})

const { loadAdminUsers } = initAdminLogic(api, {
    adminUserList, btnAddUser, adminModal, adminModalTitle,
    adminUserId, adminUsername, adminPassword, adminFullname,
    adminRole, btnCancelAdminModal, btnSaveAdminUser
}, undefined as any)

//
;(function setupAutoUpdater() {
    const bar = document.createElement('div')
    bar.id = 'update-bar'
    bar.style.cssText = 'display:none;position:fixed;bottom:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-top:1px solid #38bdf8;padding:12px 24px;align-items:center;gap:14px;font-size:0.9rem;color:#f8fafc;box-shadow:0 -4px 24px rgba(0,0,0,0.5);'
    bar.innerHTML = `
        <span id="update-msg" style="font-weight:600;flex:1;">📢 Yeni sürüm mevcut!</span>
        <div id="update-progress-wrap" style="display:none;flex:1;max-width:200px;height:8px;background:rgba(255,255,255,0.15);border-radius:4px;overflow:hidden;">
            <div id="update-progress-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#38bdf8,#0284c7);border-radius:4px;transition:width 0.3s;"></div>
        </div>
        <button id="update-action-btn" style="padding:8px 20px;border:none;border-radius:10px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#ffffff;cursor:pointer;font-size:0.85rem;font-weight:700;box-shadow:0 0 12px rgba(56,189,248,0.4);transition:all 0.2s;">İndir</button>
        <button id="update-dismiss-btn" style="padding:6px 10px;border:none;background:transparent;color:#94a3b8;cursor:pointer;font-size:1.2rem;line-height:1;">&#10005;</button>
    `
    document.body.appendChild(bar)

    const updateMsg = document.getElementById('update-msg')!
    const progressWrap = document.getElementById('update-progress-wrap')!
    const progressBar = document.getElementById('update-progress-bar')!
    const actionBtn = document.getElementById('update-action-btn') as HTMLButtonElement
    const dismissBtn = document.getElementById('update-dismiss-btn')!

    const btnCheckUpdate = document.getElementById('btn-check-update') as HTMLButtonElement | null
    const updateCheckStatus = document.getElementById('update-check-status') as HTMLDivElement | null

    let updateState: 'idle' | 'available' | 'downloading' | 'ready' = 'idle'

    api.onUpdateAvailable((version: string) => {
        updateState = 'available'
        updateMsg.textContent = `📢 Yeni sürüm mevcut: v${version}`
        bar.style.display = 'flex'
        actionBtn.textContent = '⚡ İndir'
        actionBtn.disabled = false
        actionBtn.style.opacity = '1'
        actionBtn.style.background = 'linear-gradient(135deg,#38bdf8,#0284c7)'
        actionBtn.style.color = '#ffffff'
        actionBtn.style.boxShadow = '0 0 12px rgba(56,189,248,0.4)'
        actionBtn.style.cursor = 'pointer'

        if (updateCheckStatus) {
            updateCheckStatus.style.color = '#38bdf8'
            updateCheckStatus.textContent = `📢 Yeni sürüm bulundu: v${version}`
        }
        if (btnCheckUpdate) {
            btnCheckUpdate.textContent = '🔄 Tekrar Denetle'
            btnCheckUpdate.disabled = false
        }
    })

    api.onUpdateNotAvailable(() => {
        if (updateCheckStatus) {
            updateCheckStatus.style.color = '#4ade80'
            updateCheckStatus.textContent = '✓ Harika! En güncel sürümü kullanıyorsunuz.'
        }
        if (btnCheckUpdate) {
            btnCheckUpdate.textContent = '🔍 Güncellemeleri Kontrol Et'
            btnCheckUpdate.disabled = false
        }
    })

    api.onUpdateError((err: string) => {
        if (updateCheckStatus) {
            updateCheckStatus.style.color = '#f87171'
            updateCheckStatus.textContent = `⚠️ Kontrol hatası: ${err}`
        }
        if (btnCheckUpdate) {
            btnCheckUpdate.textContent = '🔍 Güncellemeleri Kontrol Et'
            btnCheckUpdate.disabled = false
        }
    })

    api.onUpdateProgress((percent: number) => {
        progressWrap.style.display = 'block'
        progressBar.style.width = `${percent}%`
        updateMsg.textContent = `⏬ İndiriliyor... %${percent}`
    })

    api.onUpdateDownloaded(() => {
        updateState = 'ready'
        progressWrap.style.display = 'none'
        updateMsg.textContent = '✓ Güncelleme hazır! Uygulamayı yeniden başlatıp yükleyin.'
        actionBtn.textContent = '🚀 Şimdi Güncelle'
        actionBtn.disabled = false
        actionBtn.style.opacity = '1'
        actionBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
        actionBtn.style.color = '#ffffff'
        actionBtn.style.fontWeight = '800'
        actionBtn.style.boxShadow = '0 0 16px rgba(34, 197, 94, 0.6)'
        actionBtn.style.cursor = 'pointer'
    })

    actionBtn.onclick = () => {
        if (updateState === 'available' || updateState === 'idle') {
            updateState = 'downloading'
            actionBtn.textContent = '⏳ İndiriliyor...'
            actionBtn.style.opacity = '0.7'
            actionBtn.disabled = true
            api.startUpdateDownload()
        } else if (updateState === 'ready') {
            actionBtn.textContent = 'Yükleniyor...'
            actionBtn.disabled = true
            api.installUpdate()
        }
    }

    dismissBtn.onclick = () => {
        bar.style.display = 'none'
    }

    if (btnCheckUpdate) {
        btnCheckUpdate.onclick = async () => {
            btnCheckUpdate.disabled = true
            btnCheckUpdate.textContent = '⏳ Kontrol Ediliyor...'
            if (updateCheckStatus) {
                updateCheckStatus.style.color = '#94a3b8'
                updateCheckStatus.textContent = 'GitHub sunucularına bağlanılıyor...'
            }
            try {
                const res = await api.checkForUpdates()
                if (res && res.updateInfo && res.updateInfo.version) {
                    updateState = 'available'
                    updateMsg.textContent = `📢 Yeni sürüm mevcut: v${res.updateInfo.version}`
                    bar.style.display = 'flex'
                    actionBtn.textContent = '⚡ İndir'
                    actionBtn.disabled = false
                    actionBtn.style.opacity = '1'
                    actionBtn.style.background = 'linear-gradient(135deg,#38bdf8,#0284c7)'
                    actionBtn.style.color = '#ffffff'
                    actionBtn.style.boxShadow = '0 0 12px rgba(56,189,248,0.4)'
                    actionBtn.style.cursor = 'pointer'

                    if (updateCheckStatus) {
                        updateCheckStatus.style.color = '#38bdf8'
                        updateCheckStatus.textContent = `📢 Yeni sürüm bulundu: v${res.updateInfo.version}`
                    }
                    btnCheckUpdate.textContent = '🔄 Tekrar Denetle'
                }
            } catch (e: any) {
                if (updateCheckStatus) {
                    updateCheckStatus.style.color = '#f87171'
                    updateCheckStatus.textContent = '⚠️ Güncelleme kontrolü başlatılamadı.'
                }
                btnCheckUpdate.textContent = '🔍 Güncellemeleri Kontrol Et'
            } finally {
                btnCheckUpdate.disabled = false
                if (btnCheckUpdate.textContent === '⏳ Kontrol Ediliyor...') {
                    btnCheckUpdate.textContent = '🔍 Güncellemeleri Kontrol Et'
                }
            }
        }
    }
})()

// ── Device Call System ────────────────────────────────────────────────
;(() => {
    // Dismissed call IDs (locally, so 'Bende değil' only hides for this user)
    const dismissedCalls = new Set<string>()
    // Track active toast DOM nodes by call ID
    const activeToasts = new Map<string, HTMLDivElement>()

    function openDeviceCallModal() {
        dcallSerial.value = ''
        dcallModel.value = ''
        dcallCustomer.value = ''
        deviceCallModal.classList.add('active')
        dcallSerial.focus()
    }

    function closeDeviceCallModal() {
        deviceCallModal.classList.remove('active')
    }

    sideDeviceCallBtn.onclick = () => openDeviceCallModal()
    btnCancelDeviceCall.onclick = () => closeDeviceCallModal()

    btnSendDeviceCall.onclick = async () => {
        const serial = dcallSerial.value.trim().toUpperCase()
        const model = dcallModel.value.trim().toUpperCase()
        const customer = dcallCustomer.value.trim()

        if (!serial) { dcallSerial.focus(); return }
        if (!model) { dcallModel.focus(); return }

        btnSendDeviceCall.textContent = 'Gönderiliyor...'
        btnSendDeviceCall.setAttribute('disabled', 'true')

        try {
            await api.createDeviceCall({
                serial,
                model_name: model,
                customer_name: customer,
                created_by: personnelName || 'Bilinmiyor'
            })
            closeDeviceCallModal()
        } catch (err) {
            console.error('Device call error:', err)
        } finally {
            btnSendDeviceCall.textContent = '\ud83d\udce2 \u00c7a\u011fr\u0131 G\u00f6nder'
            btnSendDeviceCall.removeAttribute('disabled')
        }
    }

    function createCallToast(call: any, isMine: boolean): HTMLDivElement {
        const toast = document.createElement('div')
        toast.style.cssText = [
            'pointer-events: all',
            'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            'border: 1px solid rgba(245,158,11,0.4)',
            'border-radius: 16px',
            'padding: 16px 20px',
            'min-width: 320px',
            'max-width: 460px',
            'box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.15)',
            'animation: slideDownFade 0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
            'backdrop-filter: blur(12px)'
        ].join(';')

        const customerLine = call.customer_name ? `<div style="font-size:0.78rem;color:#94a3b8;margin-top:2px;">M\u00fc\u015fteri: <strong>${call.customer_name}</strong></div>` : ''
        const callerInfo = `<div style="font-size:0.72rem;color:#64748b;margin-top:6px;">\u00c7a\u011fr\u0131 yapan: ${call.created_by}</div>`

        if (isMine) {
            // Creator sees a "waiting" toast that disappears when resolved
            toast.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                    <span style="font-size:1.3rem;">\ud83d\udce1</span>
                    <div>
                        <div style="font-size:0.72rem;color:#f59e0b;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">\u00c7a\u011fr\u0131 G\u00f6nderildi</div>
                        <div style="font-size:0.95rem;font-weight:700;color:#f8fafc;">${call.model_name}</div>
                        <div style="font-size:0.78rem;color:#94a3b8;">Seri: <strong>${call.serial}</strong></div>
                        ${customerLine}
                    </div>
                </div>
                <div style="font-size:0.78rem;color:#94a3b8;">Yan\u0131t bekleniyor...</div>`
        } else {
            // Others see an interactive toast with action buttons
            toast.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                    <span style="font-size:1.3rem;">\ud83d\udce2</span>
                    <div style="flex:1;">
                        <div style="font-size:0.72rem;color:#f59e0b;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Cihaz Aranıyor</div>
                        <div style="font-size:0.95rem;font-weight:700;color:#f8fafc;">${call.model_name}</div>
                        <div style="font-size:0.78rem;color:#94a3b8;">Seri: <strong>${call.serial}</strong></div>
                        ${customerLine}
                        ${callerInfo}
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button id="dcall-here-${call.id}" style="flex:1;padding:8px 0;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;border-radius:10px;font-weight:700;font-size:0.88rem;cursor:pointer;">\ud83d\udcf2 Cihaz Bende</button>
                    <button id="dcall-nothere-${call.id}" style="flex:1;padding:8px 0;background:rgba(255,255,255,0.07);color:#94a3b8;border:1px solid rgba(255,255,255,0.12);border-radius:10px;font-weight:600;font-size:0.88rem;cursor:pointer;">Bende De\u011fil</button>
                </div>`

            setTimeout(() => {
                const hereBtn = document.getElementById(`dcall-here-${call.id}`)
                const notHereBtn = document.getElementById(`dcall-nothere-${call.id}`)

                if (hereBtn) {
                    hereBtn.onclick = async () => {
                        hereBtn.textContent = 'Gönderiliyor...'
                        hereBtn.setAttribute('disabled', 'true')
                        try {
                            await api.resolveDeviceCall(call.id, personnelName || 'Bilinmiyor')
                        } catch (err) {
                            console.error('Resolve error:', err)
                        }
                    }
                }

                if (notHereBtn) {
                    notHereBtn.onclick = () => {
                        dismissedCalls.add(call.id)
                        removeToast(call.id)
                    }
                }
            }, 0)
        }

        return toast
    }

    function removeToast(callId: string) {
        const existing = activeToasts.get(callId)
        if (existing) {
            existing.style.opacity = '0'
            existing.style.transform = 'translateY(-20px) scale(0.95)'
            existing.style.transition = 'all 0.25s ease'
            setTimeout(() => {
                existing.remove()
                activeToasts.delete(callId)
            }, 260)
        }
    }

    api.onDeviceCallsUpdate((calls: any[]) => {
        if (currentRole !== 'kargo_kabul') return

        const activeCalls = calls.filter((c: any) => c.status === 'active')
        const resolvedCalls = calls.filter((c: any) => c.status === 'resolved')

        // Show toasts for active calls
        activeCalls.forEach((call: any) => {
            const isMine = call.created_by === personnelName

            // Don't show "Bende değil" dismissed calls
            if (!isMine && dismissedCalls.has(call.id)) return

            if (!activeToasts.has(call.id)) {
                const toast = createCallToast(call, isMine)
                deviceCallToastContainer.appendChild(toast)
                activeToasts.set(call.id, toast)
            }
        })

        // Handle resolved calls
        resolvedCalls.forEach((call: any) => {
            const isMine = call.created_by === personnelName

            if (isMine && call.resolved_by) {
                // If caller still has a toast or hasn't shown resolution yet
                let existing = activeToasts.get(call.id)
                if (!existing) {
                    // Create resolution card if not already rendered
                    existing = document.createElement('div')
                    existing.style.cssText = [
                        'pointer-events: all',
                        'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        'border: 1px solid rgba(34,197,94,0.5)',
                        'border-radius: 16px',
                        'padding: 16px 20px',
                        'min-width: 320px',
                        'max-width: 460px',
                        'box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(34,197,94,0.2)',
                        'animation: slideDownFade 0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
                        'backdrop-filter: blur(12px)'
                    ].join(';')
                    deviceCallToastContainer.appendChild(existing)
                    activeToasts.set(call.id, existing)
                }

                existing.style.border = '1px solid rgba(34,197,94,0.6)'
                existing.innerHTML = `
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="font-size:1.5rem;">\u2705</span>
                        <div>
                            <div style="font-size:0.72rem;color:#22c55e;font-weight:700;">Cihaz Bulundu!</div>
                            <div style="font-size:0.95rem;font-weight:700;color:#f8fafc;">${call.resolved_by} cihaz\u0131n kendisinde oldu\u011funu belirtti.</div>
                            <div style="font-size:0.78rem;color:#94a3b8;margin-top:2px;">${call.model_name} • ${call.serial}</div>
                        </div>
                    </div>`
                setTimeout(() => removeToast(call.id), 8000)
            } else {
                // Others: remove the toast
                removeToast(call.id)
            }
        })

        // Remove any toasts for calls that no longer appear as active or resolved
        const allCallIds = new Set(calls.map((c: any) => c.id))
        activeToasts.forEach((_, id) => {
            if (!allCallIds.has(id)) removeToast(id)
        })
    })

    // Inject keyframe animation if not yet present
    if (!document.getElementById('dcall-keyframes')) {
        const style = document.createElement('style')
        style.id = 'dcall-keyframes'
        style.textContent = `@keyframes slideDownFade { from { opacity:0; transform:translateY(-16px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }`
        document.head.appendChild(style)
    }
})()
