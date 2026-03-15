import { showToast } from './toastUtils'

function formatWaitTime(ms: number): string {
    const mins = Math.floor(ms / 60000)
    if (mins < 1) return 'Az önce eklendi'
    if (mins < 60) return `${mins} dakikadır cevap bekliyor`
    const hrs = Math.floor(mins / 60)
    const remMins = mins % 60
    if (remMins === 0) return `${hrs} saattir cevap bekliyor`
    return `${hrs} sa ${remMins} dk bekleniyor`
}

let waitTimerInterval: ReturnType<typeof setInterval> | null = null

function startWaitingTimers() {
    if (waitTimerInterval) return
    waitTimerInterval = setInterval(() => {
        document.querySelectorAll('.wait-timer[data-created-at]').forEach((el: any) => {
            const createdAt = parseInt(el.dataset.createdAt, 10)
            if (!createdAt) return
            el.textContent = formatWaitTime(Date.now() - createdAt)
        })
    }, 60000)
}

function stopWaitingTimers() {
    if (waitTimerInterval) {
        clearInterval(waitTimerInterval)
        waitTimerInterval = null
    }
}

export function initTicketLogic(
    api: any,
    elements: any,
    getCurrentRole: () => string,
    getPersonnelName: () => string
) {
    const { ticketList, tSearchInput, tFilterStatus, tFilterVisibility, tFilterOwnership, tcPending, tcProgress, tcCompleted, btnManualTicket } = elements

    // Helper for manual ticket opening
    function promptManualTicket() {
        const modalOverlay = document.getElementById('modal-overlay')!
        const modalTitle = document.getElementById('modal-title')!
        const modalText = document.getElementById('modal-text')!
        const modalConfirm = document.getElementById('modal-confirm')!
        const modalCancel = document.getElementById('modal-cancel')!
        
        modalTitle.textContent = 'Manuel Bildirim Aç'
        modalText.innerHTML = ''

        const form = document.createElement('div')
        form.style.cssText = 'display:flex;flex-direction:column;gap:12px;margin-top:12px;'

        // Checkbox elements
        const fields = [
            { id: 'chk-man-ariza', label: 'Arıza Beyanı' },
            { id: 'chk-man-adres', label: 'Adres Bilgisi' },
            { id: 'chk-man-tel', label: 'Telefon Numarası' },
            { id: 'chk-man-fatura', label: 'Fatura Tarihi' },
            { id: 'chk-man-seri', label: 'Seri Numarası' },
            { id: 'chk-man-isim', label: 'İsim ve Soyisim' }
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

        <label style="font-size:0.85rem;color:#94a3b8;">Seri Numarası (Opsiyonel)</label>
        <input type="text" id="man-serial" placeholder="Bilinmiyorsa boş bırakın..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">
        
        <label style="font-size:0.85rem;color:#94a3b8;">Müşteri İsmi (Opsiyonel)</label>
        <input type="text" id="man-customer" placeholder="Müşteri adı soyadı..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

        <label style="font-size:0.85rem;color:#94a3b8;">Aras Kodu (Opsiyonel)</label>
        <input type="text" id="man-aras" placeholder="Aras kargo kodu..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

        <label style="font-size:0.85rem;color:#94a3b8;">Telefon Numarası (Opsiyonel)</label>
        <input type="text" id="man-phone" placeholder="Müşteri iletişim numarası..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">

        <label style="font-size:0.85rem;color:#94a3b8;">Not (Opsiyonel)</label>
        <input type="text" id="man-note" placeholder="Ekstra detay ekleyin..." style="padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-size:13px;outline:none;">
        `
        modalText.appendChild(form)
        modalConfirm.textContent = 'Oluştur'

        modalOverlay.classList.add('active')

        modalConfirm.onclick = async () => {
            const selectedTypes: string[] = []
            fields.forEach(f => {
                const el = document.getElementById(f.id) as HTMLInputElement
                if (el && el.checked) {
                    selectedTypes.push(el.value)
                }
            })

            const missingType = selectedTypes.length > 0 ? selectedTypes.join(', ') : 'Belirtilmedi'
            const serial = (document.getElementById('man-serial') as HTMLInputElement).value.trim()
            const note = (document.getElementById('man-note') as HTMLInputElement).value.trim()
            const customerName = (document.getElementById('man-customer') as HTMLInputElement).value.trim()
            const arasCode = (document.getElementById('man-aras') as HTMLInputElement).value.trim()
            const phoneNumber = (document.getElementById('man-phone') as HTMLInputElement).value.trim()

            try {
                await api.createTicket({
                    serial: serial || 'Seri No Yok',
                    model_name: '',
                    model_color: '',
                    missing_type: missingType,
                    note,
                    customer_name: customerName,
                    aras_code: arasCode,
                    phone_number: phoneNumber,
                    created_by: getPersonnelName() || 'İsimsiz Personel'
                })
                showToast('Manuel bildirim oluşturuldu.', 'success')
            } catch (e: any) {
                showToast('Bildirim oluşturulurken hata: ' + e.message, 'error')
            }

            modalOverlay.classList.remove('active')
        }

        modalCancel.onclick = () => {
            modalOverlay.classList.remove('active')
        }
    }

    if (btnManualTicket) {
        btnManualTicket.addEventListener('click', promptManualTicket)
    }

    async function loadTickets() {
        const tickets = await api.getTickets()
        if (!tickets) return
        renderTicketsList(tickets)
    }

    function renderTicketsList(tickets: any[]) {
        ticketList.innerHTML = ''
        const searchQuery = tSearchInput?.value?.toLowerCase().trim() || ''
        const currentRole = getCurrentRole()
        const personnelName = getPersonnelName()

        const statusFilter = tFilterStatus?.value || 'all'
        const visibilityFilter = tFilterVisibility?.value || 'visible'
        const ownershipFilter = tFilterOwnership?.value || 'mine'

        tcPending.textContent = String(tickets.filter((t: any) => t.status === 'pending').length)
        tcProgress.textContent = String(tickets.filter((t: any) => t.status === 'in_progress').length)
        tcCompleted.textContent = String(tickets.filter((t: any) => t.status === 'completed').length)

        let filtered = tickets
        
        // Status Filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'aras') filtered = filtered.filter((t: any) => t.aras_code)
            else filtered = filtered.filter((t: any) => t.status === statusFilter)
        }
        
        // Visibility Filter
        if (visibilityFilter === 'visible') {
             filtered = filtered.filter((t: any) => !t.is_hidden)
        } else if (visibilityFilter === 'hidden') {
             filtered = filtered.filter((t: any) => t.is_hidden)
        }
        
        // Ownership Filter
        if (ownershipFilter === 'mine') {
             filtered = filtered.filter((t: any) => t.created_by === personnelName || t.responded_by === personnelName)
        }
        
        // Search
        if (searchQuery) {
            filtered = filtered.filter((t: any) => (t.serial || '').toLowerCase().includes(searchQuery) || (t.customer_name || '').toLowerCase().includes(searchQuery))
        }

        if (filtered.length === 0) {
            ticketList.innerHTML = '<div class="priority-empty">Talep bulunamadı.</div>'
            return
        }

        const fragment = document.createDocumentFragment()

        filtered.forEach((ticket: any) => {
            const card = document.createElement('div')
            card.className = `ticket-card status-${ticket.status}`

            const statusLabel = ticket.status === 'pending' ? 'Bekliyor' : (ticket.status === 'in_progress' ? 'İşleniyor' : 'Tamamlandı')
            const badgeClass = `badge-${ticket.status}`
            const missingLabels: any = { address: 'Adres', fault_form: 'Arıza Formu', contact: 'İletişim', other: 'Diğer' }
            const missingLabel = missingLabels[ticket.missing_type] || ticket.missing_type
            const createdDate = ticket.created_at ? new Date(ticket.created_at).toLocaleString('tr-TR') : ''

            let actionsHTML = ''
            let waitTimerHTML = ''

            if (ticket.status === 'pending') {
                const waitMs = ticket.created_at ? Date.now() - ticket.created_at : 0
                waitTimerHTML = `<div class="wait-timer" data-created-at="${ticket.created_at || ''}" style="font-size:0.75rem;color:#f59e0b;margin-top:4px;display:flex;align-items:center;gap:4px;">⏳ ${formatWaitTime(waitMs)}</div>`
            }

            if (ticket.status === 'pending' && currentRole === 'mh') {
                actionsHTML = `<button class="btn-sm btn-claim" data-action="claim" data-id="${ticket.id}">Üstlen</button>`
            } else if (ticket.status === 'in_progress' && currentRole === 'mh') {
                actionsHTML = `
                    <input class="response-input" id="resp-${ticket.id}" placeholder="Yanıtınızı yazın...">
                    <button class="btn-sm btn-complete" data-action="complete" data-id="${ticket.id}">Tamamla</button>
                `
            } else if (ticket.status === 'completed' && currentRole === 'mh') {
                actionsHTML = `<button class="btn-sm btn-reopen" data-action="reopen" data-id="${ticket.id}">Yeniden Aç</button>`
            }

            let responseHTML = ''
            if (ticket.response) {
                responseHTML = `<div class="ticket-response"><strong>${ticket.responded_by || 'MH'}:</strong> ${ticket.response}</div>`
            }

            let collabHTML = ''
            if (ticket.customer_name || ticket.aras_code || ticket.phone_number) {
                collabHTML = `<div class="collab-container">
                    ${ticket.customer_name ? `<div class="collab-group"><span class="collab-label">Müşteri</span><span>${ticket.customer_name}</span></div>` : ''}
                    ${ticket.aras_code ? `<div class="collab-group"><span class="collab-label">Aras Kodu</span><span>${ticket.aras_code}</span></div>` : ''}
                    ${ticket.phone_number ? `<div class="collab-group"><span class="collab-label">Telefon</span><span>${ticket.phone_number}</span></div>` : ''}
                </div>`
            }

            // Optional delete button for Kargo Kabul
            let deleteHTML = ''
            if (currentRole === 'kargo_kabul') {
                deleteHTML = `<button class="delete-btn" title="Sil" data-action="delete" data-id="${ticket.id}">🗑️</button>`
            }

            // Optional hide/unhide button
            let hideHTML = ''
            if (ticket.status === 'completed') {
                if (ticket.is_hidden) {
                    hideHTML = `<button class="btn-sm btn-reopen" data-action="unhide" data-id="${ticket.id}" style="margin-left:8px;">Gözetleme</button>`
                } else {
                    hideHTML = `<button class="btn-sm btn-update" data-action="hide" data-id="${ticket.id}" style="margin-top:0; margin-left:8px;">Gizle</button>`
                }
            }

            card.innerHTML = `
                ${deleteHTML}
                <div class="ticket-body">
                    <div class="ticket-serial">${ticket.serial || 'Seri No Yok'}</div>
                    <div class="ticket-model">${ticket.model_name || ''} ${ticket.model_color ? '- ' + ticket.model_color : ''}</div>
                    <span class="ticket-missing-type">${missingLabel}</span>
                    ${ticket.note ? `<div class="ticket-note"><strong>Not:</strong> ${ticket.note}</div>` : ''}
                    ${responseHTML}
                    ${waitTimerHTML}
                    ${collabHTML}
                    <div class="ticket-time">${createdDate}</div>
                </div>
                <div class="ticket-actions">
                    <span class="${badgeClass}">${statusLabel}</span>
                    <div style="display: flex; gap: 8px;">
                      ${actionsHTML}
                      ${hideHTML}
                    </div>
                </div>
            `
            fragment.appendChild(card)
        })

        ticketList.appendChild(fragment)
        startWaitingTimers()

        // Bind ticket action buttons
        ticketList.querySelectorAll('[data-action]').forEach((btn: any) => {
            btn.addEventListener('click', async (e: any) => {
                const el = e.target as HTMLElement
                const action = el.dataset.action
                const btnOrCard = el.closest('.ticket-card')
                // Always get the ID from the dataset
                const id = el.dataset.id!
                
                if (action === 'claim') {
                    await api.claimTicket(id, personnelName)
                    showToast('Talep üstlenildi.', 'success')
                } else if (action === 'complete') {
                    const input = document.getElementById(`resp-${id}`) as HTMLInputElement
                    const response = input?.value?.trim()
                    if (!response) { showToast('Lütfen bir yanıt yazın.', 'error'); return }
                    await api.completeTicket(id, response)
                    showToast('Talep tamamlandı.', 'success')
                } else if (action === 'reopen') {
                    await api.reopenTicket(id)
                    showToast('Talep yeniden açıldı.', 'info')
                } else if (action === 'delete') {
                    if (confirm('Bu bileti silmek istediğinize emin misiniz?')) {
                        await api.deleteTicket(id)
                        showToast('Bilet silindi', 'success')
                    }
                } else if (action === 'hide') {
                    await api.hideTicket(id, personnelName)
                    showToast('Bilet gizlendi', 'info')
                } else if (action === 'unhide') {
                    await api.unhideTicket(id)
                    showToast('Bilet görünür yapıldı', 'info')
                }
                loadTickets()
            })
        })
    }

    if (tFilterStatus) tFilterStatus.addEventListener('change', loadTickets)
    if (tFilterVisibility) tFilterVisibility.addEventListener('change', loadTickets)
    if (tFilterOwnership) tFilterOwnership.addEventListener('change', loadTickets)

    let searchTimeout: NodeJS.Timeout
    tSearchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
            loadTickets()
        }, 300)
    })

    return { loadTickets, renderTicketsList, stopWaitingTimers }
}
