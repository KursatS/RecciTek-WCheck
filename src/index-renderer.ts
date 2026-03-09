export { }
// ── Element References ──────────────────────────────────────────────
const cardsDiv = document.getElementById('cards')!
const searchInput = document.getElementById('search') as HTMLInputElement
const toggleBtn = document.getElementById('toggle')!
const themeBtn = document.getElementById('theme-toggle')!
const clearCacheBtn = document.getElementById('clear-cache')!
const settingsBtn = document.getElementById('settings-btn')!
const bonusBtn = document.getElementById('bonus-btn')!
const profileBtn = document.getElementById('profile-btn')!
const adminBtn = document.getElementById('admin-btn')!
const ticketsBtn = document.getElementById('tickets-btn')!
const ticketBadge = document.getElementById('ticket-badge')!
const dcBtn = document.getElementById('double-copy-toggle')!
const statusDot = document.getElementById('status-dot')!
const statusInfo = document.getElementById('status-info')!
const statusRefreshBtn = document.getElementById('status-refresh-btn')!

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
function showConfirm(title: string, message: string, confirmText = 'Evet, Sil'): Promise<boolean> {
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
    api.getCachedData().then((data: any[]) => {
        cardsDiv.innerHTML = ''

        if (!data || data.length === 0) {
            cardsDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📂</div>
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
function applyTheme(isDark: boolean) {
    document.body.classList.toggle('dark', isDark)
    document.body.classList.toggle('light', !isDark)
    themeBtn.textContent = isDark ? '🌙' : '☀️'
}

themeBtn.onclick = () => {
    const isDark = document.body.classList.contains('dark')
    const newDark = !isDark
    applyTheme(newDark)

    // Save to settings
    api.getSettings().then((s: any) => {
        api.saveSettings({ ...s, theme: newDark ? 'dark' : 'light' })
    })
}

// Initial theme load
api.getSettings().then((s: any) => {
    const theme = s.theme || 'dark'
    applyTheme(theme === 'dark')
})

// ── Search ──────────────────────────────────────────────────────────
searchInput.oninput = () => loadCards()

// ── Navigation Buttons ──────────────────────────────────────────────
settingsBtn.onclick = () => api.openSettings()
bonusBtn.onclick = () => api.openBonus()
ticketsBtn.onclick = () => api.openTickets()
profileBtn.onclick = () => api.openProfile()
adminBtn.onclick = () => api.openAdmin()

// ── Clear Cache ─────────────────────────────────────────────────────
clearCacheBtn.onclick = async () => {
    const confirmed = await showConfirm(
        'Tüm Geçmişi Temizle',
        'Tüm sorgu geçmişiniz kalıcı olarak silinecektir. Emin misiniz?',
        'Tümünü Sil'
    )
    if (confirmed) {
        await api.clearCache()
        loadCards()
    }
}

    // ── Delete Entry (global) ───────────────────────────────────────────
    ; (window as any).deleteEntry = async (serial: string) => {
        const confirmed = await showConfirm(
            'Kaydı Sil',
            `${serial} seri numaralı cihazı listeden silmek istediğinizden emin misiniz?`
        )
        if (confirmed) {
            await api.deleteEntry(serial)
            loadCards()
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
    await api.toggleDoubleCopy(!current)
    updateDCUI(!current)
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

// ── IPC Event Listeners ─────────────────────────────────────────────
api.onRefreshCards(() => {
    api.getSettings().then((s: any) => {
        currentRole = s.role || 'kargo_kabul'
        personnelName = s.personnelName || ''

        if (bonusBtn) {
            bonusBtn.style.display = currentRole === 'kargo_kabul' ? 'flex' : 'none'
        }
        if (adminBtn) {
            adminBtn.style.display = s.isAdmin ? 'flex' : 'none'
        }
        if (profileBtn) {
            profileBtn.style.display = s.isLoggedIn ? 'flex' : 'none'
        }

        loadCards()
    })
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

// ── Initial Load ────────────────────────────────────────────────────
// ── Initial Load ────────────────────────────────────────────────────
Promise.all([
    api.getSettings(),
    api.getTickets()
]).then(([s, tickets]: [any, any[]]) => {
    currentRole = s.role || 'kargo_kabul'
    personnelName = s.personnelName || ''

    if (bonusBtn) {
        bonusBtn.style.display = currentRole === 'kargo_kabul' ? 'flex' : 'none'
    }
    if (adminBtn) {
        adminBtn.style.display = s.isAdmin ? 'flex' : 'none'
    }

    // Login kontrolü
    if (!personnelName.trim()) {
        setTimeout(() => {
            api.openSettings()
        }, 1000)
    }

    if (tickets) {
        activeTickets = tickets;

        const pendingCount = tickets.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length
        if (pendingCount > 0) {
            ticketBadge.style.display = 'block'
            ticketBadge.textContent = String(pendingCount)
        } else {
            ticketBadge.style.display = 'none'
        }
    }
    loadCards();
});
