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
    const { ticketList, tSearchInput, tFilterTabs, tcPending, tcProgress, tcCompleted } = elements

    async function loadTickets() {
        const tickets = await api.getTickets()
        if (!tickets) return
        renderTicketsList(tickets)
    }

    function renderTicketsList(tickets: any[]) {
        ticketList.innerHTML = ''
        const searchQuery = tSearchInput?.value?.toLowerCase().trim() || ''
        const activeFilter = (tFilterTabs?.querySelector('.active') as HTMLElement)?.dataset.filter || 'all'

        tcPending.textContent = String(tickets.filter((t: any) => t.status === 'pending').length)
        tcProgress.textContent = String(tickets.filter((t: any) => t.status === 'in_progress').length)
        tcCompleted.textContent = String(tickets.filter((t: any) => t.status === 'completed').length)

        let filtered = tickets
        if (activeFilter !== 'all') {
            if (activeFilter === 'aras') filtered = filtered.filter((t: any) => t.aras_code)
            else filtered = filtered.filter((t: any) => t.status === activeFilter)
        }
        if (searchQuery) {
            filtered = filtered.filter((t: any) => (t.serial || '').toLowerCase().includes(searchQuery) || (t.customer_name || '').toLowerCase().includes(searchQuery))
        }

        if (filtered.length === 0) {
            ticketList.innerHTML = '<div class="priority-empty">Henüz talep yok.</div>'
            return
        }

        const currentRole = getCurrentRole()
        const personnelName = getPersonnelName()

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

            card.innerHTML = `
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
                    ${actionsHTML}
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
                }
                loadTickets()
            })
        })
    }

    tFilterTabs.addEventListener('click', (e: Event) => {
        const tab = (e.target as HTMLElement).closest('.filter-tab') as HTMLElement
        if (!tab) return
        tFilterTabs.querySelectorAll('.filter-tab').forEach((t: any) => t.classList.remove('active'))
        tab.classList.add('active')
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
