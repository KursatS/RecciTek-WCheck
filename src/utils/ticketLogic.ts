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

function showTicketHistoryModal(ticket: any) {
    // Remove any existing history modal
    document.getElementById('ticket-history-modal')?.remove()

    const overlay = document.createElement('div')
    overlay.id = 'ticket-history-modal'
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);animation:fadeIn 0.2s ease;'

    let historyRows = ''
    const history: any[] = ticket.action_history || []

    if (history.length > 0) {
        // Sort by timestamp ascending
        const sorted = [...history].sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0))
        sorted.forEach((entry: any, idx: number) => {
            const date = entry.timestamp ? new Date(entry.timestamp) : null
            const dateStr = date ? `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : '—'
            const iconMap: any = {
                'Oluşturuldu': '📝',
                'Üstlendi': '🤝',
                'Tamamlandı': '✅',
                'Ulaşılamadı Olarak İşaretledi': '🚫',
                'Yeniden Açtı': '🔄'
            }
            const icon = iconMap[entry.action] || '📌'
            const isLast = idx === sorted.length - 1
            historyRows += `
                <div style="display:flex;gap:12px;align-items:flex-start;position:relative;">
                    <div style="display:flex;flex-direction:column;align-items:center;">
                        <div style="width:32px;height:32px;border-radius:50%;background:rgba(56,189,248,0.15);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;border:1px solid rgba(56,189,248,0.3);">${icon}</div>
                        ${!isLast ? '<div style="width:2px;flex:1;background:rgba(255,255,255,0.1);margin:4px 0;min-height:20px;"></div>' : ''}
                    </div>
                    <div style="flex:1;padding-bottom:${isLast ? '0' : '16px'};">
                        <div style="font-weight:600;font-size:0.9rem;color:white;">${entry.action}</div>
                        <div style="font-size:0.8rem;color:#94a3b8;margin-top:2px;">${entry.user}</div>
                        <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">${dateStr}</div>
                    </div>
                </div>
            `
        })
    } else {
        // Fallback for old tickets without action_history
        historyRows = `
            <div style="display:flex;gap:12px;align-items:center;">
                <div style="width:32px;height:32px;border-radius:50%;background:rgba(56,189,248,0.15);display:flex;align-items:center;justify-content:center;font-size:1rem;border:1px solid rgba(56,189,248,0.3);">📝</div>
                <div>
                    <div style="font-weight:600;font-size:0.9rem;color:white;">Oluşturan</div>
                    <div style="font-size:0.8rem;color:#94a3b8;">${ticket.created_by || 'Bilinmiyor'}</div>
                </div>
            </div>
            ${ticket.responded_by ? `
            <div style="display:flex;gap:12px;align-items:center;margin-top:12px;">
                <div style="width:32px;height:32px;border-radius:50%;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;font-size:1rem;border:1px solid rgba(16,185,129,0.3);">🤝</div>
                <div>
                    <div style="font-weight:600;font-size:0.9rem;color:white;">Üstlenen</div>
                    <div style="font-size:0.8rem;color:#94a3b8;">${ticket.responded_by}</div>
                </div>
            </div>` : ''}
        `
    }

    overlay.innerHTML = `
        <div style="background:rgba(15,23,42,0.97);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;max-width:420px;width:90%;max-height:70vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h3 style="margin:0;font-size:1.1rem;color:white;">📜 İşlem Geçmişi</h3>
                <button id="close-history-modal" style="background:none;border:none;color:#94a3b8;font-size:1.3rem;cursor:pointer;padding:0 4px;">✕</button>
            </div>
            <div style="font-size:0.8rem;color:#64748b;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.08);">
                ${ticket.serial || 'Seri No Yok'} ${ticket.model_name ? '— ' + ticket.model_name : ''}
            </div>
            <div style="display:flex;flex-direction:column;">
                ${historyRows}
            </div>
        </div>
    `

    document.body.appendChild(overlay)

    // Close handlers
    overlay.querySelector('#close-history-modal')!.addEventListener('click', () => overlay.remove())
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
}

export function initTicketLogic(
    api: any,
    elements: any,
    getCurrentRole: () => string,
    getPersonnelName: () => string
) {
    const { ticketList, tSearchInput, tFilterStatus, tFilterVisibility, tFilterOwnership, tFilterAras, tcPending, tcProgress, tcCompleted, btnManualTicket } = elements

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
        const ownershipFilter = tFilterOwnership?.dataset?.val || 'mine'
        const arasActive = tFilterAras?.dataset?.active === 'true'

        tcPending.textContent = String(tickets.filter((t: any) => t.status === 'pending').length)
        tcProgress.textContent = String(tickets.filter((t: any) => t.status === 'in_progress').length)
        tcCompleted.textContent = String(tickets.filter((t: any) => t.status === 'completed').length)

        let filtered = tickets

        // Aras Kargo Toggle (takes priority)
        if (arasActive) {
            filtered = filtered.filter((t: any) => t.aras_code && !t.phone_number)
        } else {
            // Status Filter
            if (statusFilter !== 'all') {
                filtered = filtered.filter((t: any) => t.status === statusFilter)
            }
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

            let detailedResponseInputsHTML = ''
            if (ticket.status === 'in_progress' && currentRole === 'mh') {
                const requestedTypes = ticket.missing_type.split(',').map((t: string) => t.trim()).filter((t: string) => t !== 'Belirtilmedi' && t !== '')
                
                let parsedResponses: Record<string, string> = {}
                if (ticket.response) {
                    ticket.response.split(' | ').forEach((part: string) => {
                        const idx = part.indexOf(': ')
                        if (idx !== -1) {
                            const key = part.substring(0, idx).trim()
                            const val = part.substring(idx + 2).trim()
                            parsedResponses[key] = val
                        } else {
                            parsedResponses['Genel'] = part.trim()
                        }
                    })
                }

                if (requestedTypes.length === 0) {
                     detailedResponseInputsHTML = `
                        <div class="detailed-response-field" style="margin-bottom:8px;">
                            <label style="font-size:0.75rem;color:#94a3b8;display:block;margin-bottom:2px;">Yanıtınız</label>
                            <input class="response-input dyn-resp-${ticket.id}" data-reqtype="Genel" value="${parsedResponses['Genel'] || ''}" placeholder="Yanıtınızı yazın..." style="width:100%;padding:8px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-size:0.85rem;outline:none;transition:all 0.3s;">
                        </div>
                     `
                } else {
                     detailedResponseInputsHTML = requestedTypes.map((reqType: string) => `
                        <div class="detailed-response-field" style="margin-bottom:8px;">
                            <label style="font-size:0.75rem;color:#94a3b8;display:block;margin-bottom:2px;">${reqType}</label>
                            <input class="response-input dyn-resp-${ticket.id}" data-reqtype="${reqType}" value="${parsedResponses[reqType] || ''}" placeholder="${reqType} değerini girin..." style="width:100%;padding:8px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-size:0.85rem;outline:none;transition:all 0.3s;">
                        </div>
                     `).join('')
                }
            }

            if (ticket.status === 'pending' && currentRole === 'mh') {
                actionsHTML = `<button class="btn-sm btn-claim" data-action="claim" data-id="${ticket.id}">Üstlen</button>`
            } else if (ticket.status === 'in_progress' && currentRole === 'mh') {
                card.style.paddingBottom = '32px' // CSS Expansion
                actionsHTML = `
                    <div style="display:flex;flex-direction:column;gap:8px;width:100%;">
                        ${detailedResponseInputsHTML}
                        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
                            <button class="btn-sm" data-action="unreachable" data-id="${ticket.id}" style="background:rgba(239, 68, 68, 0.2);color:#ef4444;border:1px solid rgba(239, 68, 68, 0.3);" title="Ulaşılamıyor">🚫 Ulaşılamadı</button>
                            <button class="btn-sm btn-complete" data-action="complete" data-id="${ticket.id}" style="flex:1;">Tamamla</button>
                        </div>
                    </div>
                `
            } else if (ticket.status === 'completed' && currentRole === 'mh') {
                actionsHTML = `<button class="btn-sm btn-reopen" data-action="reopen" data-id="${ticket.id}">Yeniden Aç</button>`
            }

            let responseHTML = ''
            if (ticket.response) {
                const responseBlocksHTML = ticket.response.split(' | ').map((part: string) => {
                    const idx = part.indexOf(': ')
                    if (idx !== -1) {
                        const key = part.substring(0, idx).trim()
                        const val = part.substring(idx + 2).trim()
                        return `
                            <div style="background:rgba(255,255,255,0.05);padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);margin-bottom:8px;">
                                <span style="font-size:0.75rem;color:#94a3b8;display:block;margin-bottom:2px;">${key}</span>
                                <span style="color:white;font-size:0.85rem;">${val}</span>
                            </div>
                        `
                    } else {
                        return `
                            <div style="background:rgba(255,255,255,0.05);padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);margin-bottom:8px;">
                                <span style="font-size:0.75rem;color:#94a3b8;display:block;margin-bottom:2px;">Yanıt</span>
                                <span style="color:white;font-size:0.85rem;">${part.trim()}</span>
                            </div>
                        `
                    }
                }).join('')
                responseHTML = `
                    <div class="ticket-response" style="background:transparent;padding:0;border:none;">
                        <div style="font-size:0.8rem;color:var(--accent);margin-bottom:8px;"><strong>${ticket.responded_by || 'MH'}</strong> yanıtladı:</div>
                        ${responseBlocksHTML}
                    </div>
                `
            }

            let collabHTML = ''
            
            if (ticket.customer_name || ticket.aras_code || ticket.phone_number) {
                collabHTML = `<div class="collab-container">
                    ${ticket.customer_name ? `<div class="collab-group"><span class="collab-label">Müşteri</span><span>${ticket.customer_name}</span></div>` : ''}
                    ${ticket.aras_code ? `<div class="collab-group"><span class="collab-label">Aras Kodu</span><span>${ticket.aras_code}</span></div>` : ''}
                    ${ticket.phone_number ? `<div class="collab-group"><span class="collab-label">Telefon</span><span>📞 ${ticket.phone_number}</span></div>` : ''}
                </div>`
            }

            // Optional delete button for Kargo Kabul
            let deleteHTML = ''
            if (currentRole === 'kargo_kabul') {
                deleteHTML = `<button class="delete-btn" title="Sil" data-action="delete" data-id="${ticket.id}">🗑️</button>`
            }

            // Note and Unreachable count indicator
            let noteHTML = ''
            if (ticket.note || (ticket.unreachable_count && ticket.unreachable_count > 0)) {
                let noteContent = ticket.note ? `<span><strong>Not:</strong> ${ticket.note}</span>` : ''
                let unreachableBadge = (ticket.unreachable_count && ticket.unreachable_count > 0) 
                    ? `<span style="font-size:0.75rem;padding:2px 8px;border-radius:12px;background:rgba(239, 68, 68, 0.2);color:#ef4444;border:1px solid rgba(239, 68, 68, 0.3);">🚫 Ulaşılamadı: ${ticket.unreachable_count}</span>`
                    : ''
                const hasNote = !!ticket.note
                noteHTML = `<div ${hasNote ? 'class="ticket-note"' : ''} style="display:inline-flex; align-items:center; gap:8px; ${hasNote ? '' : 'margin-top:4px;'}">
                    ${unreachableBadge}
                    ${noteContent}
                </div>`
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
                    ${noteHTML}
                    ${responseHTML}
                    ${waitTimerHTML}
                    ${collabHTML}
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="ticket-time">${createdDate}</div>
                        <button class="btn-sm" data-action="info" data-id="${ticket.id}" style="background:transparent;border:none;font-size:1.1rem;cursor:pointer;padding:0 4px;opacity:0.6;transition:opacity 0.2s;" title="İşlem Geçmişi">ℹ️</button>
                    </div>
                </div>
                <div class="ticket-actions" style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
                    ${ticket.status === 'in_progress' && currentRole === 'mh' ? '' : `<span class="${badgeClass}">${statusLabel}</span>`}
                    <div style="display: flex; gap: 8px; flex:1; justify-content: flex-end; ${ticket.status === 'in_progress' && currentRole === 'mh' ? 'width:100%;' : ''}">
                      ${actionsHTML}
                      ${ticket.status === 'in_progress' && currentRole === 'mh' ? '' : hideHTML}
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
                    const inputs = document.querySelectorAll(`.dyn-resp-${id}`) as NodeListOf<HTMLInputElement>
                    let responseParts: string[] = []
                    
                    inputs.forEach(input => {
                        const val = input.value.trim()
                        if (val) {
                            responseParts.push(`${input.dataset.reqtype}: ${val}`)
                        }
                    })

                    const finalResponse = responseParts.join(' | ')
                    if (!finalResponse) { showToast('Lütfen en az bir alanı doldurun.', 'error'); return }
                    
                    await api.completeTicket(id, finalResponse)
                    showToast('Talep tamamlandı.', 'success')
                } else if (action === 'unreachable') {
                    await api.markTicketUnreachable(id, personnelName)
                    showToast('Bilet durumu ulaşılamıyor olarak güncellendi.', 'info')
                } else if (action === 'reopen') {
                    await api.reopenTicket(id, personnelName)
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
                } else if (action === 'info') {
                    const t = filtered.find((x: any) => x.id === id)
                    if (t) showTicketHistoryModal(t)
                    return // Do not call loadTickets unnecessarily
                }
                loadTickets()
            })
        })
    }

    if (tFilterStatus) tFilterStatus.addEventListener('change', loadTickets)
    if (tFilterVisibility) tFilterVisibility.addEventListener('change', loadTickets)
    if (tFilterAras) tFilterAras.addEventListener('click', () => {
        const isActive = tFilterAras.dataset.active === 'true'
        tFilterAras.dataset.active = isActive ? 'false' : 'true'
        if (!isActive) {
            tFilterAras.style.background = 'rgba(251,191,36,0.25)'
            tFilterAras.style.borderColor = 'rgba(251,191,36,0.6)'
            // Reset status dropdown when aras is active
            if (tFilterStatus) tFilterStatus.value = 'all'
        } else {
            tFilterAras.style.background = 'rgba(251,191,36,0.08)'
            tFilterAras.style.borderColor = 'rgba(251,191,36,0.3)'
        }
        loadTickets()
    })
    if (tFilterOwnership) tFilterOwnership.addEventListener('click', () => {
        const isAll = tFilterOwnership.dataset.val === 'all'
        tFilterOwnership.dataset.val = isAll ? 'mine' : 'all'
        tFilterOwnership.textContent = isAll ? getPersonnelName() : 'Tümü'
        loadTickets()
    })

    let searchTimeout: NodeJS.Timeout
    tSearchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
            loadTickets()
        }, 300)
    })

    return { loadTickets, renderTicketsList, stopWaitingTimers }
}
