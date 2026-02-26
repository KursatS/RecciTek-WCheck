export { }
const api = (window as any).electronAPI
const ticketList = document.getElementById('ticket-list')!
const emptyState = document.getElementById('empty-state')!
const countPending = document.getElementById('count-pending')!
const countProgress = document.getElementById('count-progress')!
const countCompleted = document.getElementById('count-completed')!

const MISSING_TYPE_LABELS: Record<string, string> = {
    address: 'Adres Bilgisi',
    fault_form: 'Arıza Beyanı',
    contact: 'Müşteri İletişim',
    other: 'Diğer'
}

let currentRole = 'mh'
let personnelName = ''

// Listen for real-time ticket updates from main process
api.onTicketUpdate((tickets: any[]) => {
    renderTickets(tickets)
})

api.onRefreshCards(() => {
    api.getSettings().then((s: any) => {
        currentRole = s.role || 'mh'
        personnelName = s.personnelName || 'Bilinmeyen'
        api.getTickets().then((tickets: any[]) => {
            if (tickets) renderTickets(tickets)
        })
    })
})

// Initialize: Load settings first, then tickets
Promise.all([
    api.getSettings(),
    api.getTickets()
]).then(([settings, tickets]: [any, any[]]) => {
    if (settings.theme === 'light') document.body.classList.add('light')
    currentRole = settings.role || 'mh'
    personnelName = settings.personnelName || 'Bilinmeyen'
    if (tickets) renderTickets(tickets)
})

function renderTickets(tickets: any[]) {
    // Clear previous cards but keep empty state
    const oldCards = ticketList.querySelectorAll('.ticket-card')
    oldCards.forEach(c => c.remove())

    // Stats
    const pending = tickets.filter(t => t.status === 'pending').length
    const inProgress = tickets.filter(t => t.status === 'in_progress').length
    const completed = tickets.filter(t => t.status === 'completed').length

    countPending.textContent = String(pending)
    countProgress.textContent = String(inProgress)
    countCompleted.textContent = String(completed)

    if (tickets.length === 0) {
        emptyState.style.display = 'block'
        return
    }

    emptyState.style.display = 'none'

    tickets.forEach(ticket => {
        const card = document.createElement('div')
        card.className = `ticket-card status-${ticket.status}`

        const timeStr = ticket.created_at?.seconds
            ? new Date(ticket.created_at.seconds * 1000).toLocaleString('tr-TR')
            : ''

        let actionsHtml = ''

        if (currentRole === 'mh') {
            if (ticket.status === 'pending') {
                actionsHtml = `
          <span class="badge badge-pending">Bekliyor</span>
          <button class="btn-sm btn-claim" data-id="${ticket.id}">Üstlen</button>
        `
            } else if (ticket.status === 'in_progress') {
                if (ticket.responded_by === personnelName) {
                    // Structured response inputs based on missing_type
                    const types = ticket.missing_type.split(',').map((t: string) => t.trim());
                    let structuredInputs = '<div class="structured-responses" style="display:flex;flex-direction:column;gap:8px w-full;">';

                    types.forEach((type: string, idx: number) => {
                        structuredInputs += `
                            <div class="collab-group">
                                <span class="collab-label">${type}</span>
                                <input type="text" class="response-input structured-input" 
                                    data-type="${type}" 
                                    id="resp-${ticket.id}-${idx}" 
                                    placeholder="${type} cevabını girin...">
                            </div>
                        `;
                    });
                    structuredInputs += '</div>';

                    actionsHtml = `
                        <span class="badge badge-in_progress">Üstlenildi</span>
                        ${structuredInputs}
                        <button class="btn-sm btn-complete" data-id="${ticket.id}" style="margin-top:8px;">Tamamla</button>
                    `;
                } else {
                    actionsHtml = `
                        <span class="badge badge-in_progress">${ticket.responded_by} üstlendi</span>
                    `;
                }
            } else {
                actionsHtml = `<span class="badge badge-completed">Tamamlandı</span>`
            }
        } else {
            // Kargo Kabul view
            if (ticket.status === 'pending') {
                actionsHtml = `<span class="badge badge-pending">Bekliyor</span>`
            } else if (ticket.status === 'in_progress') {
                actionsHtml = `<span class="badge badge-in_progress">${ticket.responded_by} bakıyor</span>`
            } else {
                actionsHtml = `<span class="badge badge-completed">✅ Tamamlandı</span>`
            }
        }

        let responseHtml = ''
        if (ticket.status === 'completed' && ticket.response) {
            responseHtml = `
        <div class="ticket-response">
          <strong>Cevap:</strong> ${ticket.response}
          <div class="ticket-time">${ticket.responded_by} tarafından</div>
        </div>
      `
        }

        const isCompleted = ticket.status === 'completed'
        const disabledAttr = isCompleted ? 'disabled' : ''

        const collabHtml = `
            <div class="collab-container">
                <div class="collab-group">
                    <span class="collab-label">Müşteri İsmi</span>
                    <input type="text" class="response-input collab-input" id="cust-${ticket.id}" value="${ticket.customer_name || ''}" placeholder="İsim Girin..." ${disabledAttr}>
                </div>
                <div class="collab-group">
                    <span class="collab-label">Aras Kodu</span>
                    <input type="text" class="response-input collab-input" id="aras-${ticket.id}" value="${ticket.aras_code || ''}" placeholder="Aras Kodu..." ${disabledAttr}>
                </div>
                <div class="collab-group">
                    <span class="collab-label">Telefon Numarası</span>
                    <input type="text" class="response-input collab-input" id="phone-${ticket.id}" value="${ticket.phone_number || ''}" placeholder="05XX..." ${disabledAttr}>
                </div>
            </div>
            ${!isCompleted ? `<button class="btn-sm btn-update" data-id="${ticket.id}" style="margin-top: 12px;">Güncelle</button>` : ''}
        `

        card.innerHTML = `
      <div class="ticket-body">
        <div class="ticket-serial">${ticket.serial}</div>
        <div class="ticket-model">${ticket.model_name || ''} ${ticket.model_color || ''}</div>
        <span class="ticket-missing-type">${MISSING_TYPE_LABELS[ticket.missing_type] || ticket.missing_type}</span>
        ${ticket.note ? `<div class="ticket-note" style="margin-top:8px;"><strong>Not:</strong> ${ticket.note}</div>` : ''}
        
        ${collabHtml}

        ${responseHtml}
        <div class="ticket-time" style="margin-top:12px;">${timeStr} — ${ticket.created_by}</div>
      </div>
      <div class="ticket-actions">
        ${actionsHtml}
      </div>
    `

        ticketList.appendChild(card)
    })

    // Bind claim buttons
    document.querySelectorAll('.btn-claim').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = (btn as HTMLElement).dataset.id!
            await api.claimTicket(id, personnelName)
        })
    })

    // Bind complete buttons
    document.querySelectorAll('.btn-complete').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = (btn as HTMLElement).dataset.id!
            const inputs = document.querySelectorAll(`[id^="resp-${id}-"]`) as NodeListOf<HTMLInputElement>

            const responses: string[] = []
            let allFilled = true

            inputs.forEach(input => {
                const val = input.value.trim()
                const label = input.dataset.type
                if (!val) {
                    input.style.borderColor = '#ef4444'
                    allFilled = false
                } else {
                    input.style.borderColor = ''
                    responses.push(`${label}: ${val}`)
                }
            })

            if (!allFilled) return

            const finalResponse = responses.join(' | ')
            await api.completeTicket(id, finalResponse)
        })
    })

    // Bind update buttons (collab)
    document.querySelectorAll('.btn-update').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = (btn as HTMLElement).dataset.id!
            const custInput = document.getElementById(`cust-${id}`) as HTMLInputElement
            const arasInput = document.getElementById(`aras-${id}`) as HTMLInputElement
            const phoneInput = document.getElementById(`phone-${id}`) as HTMLInputElement

            btn.textContent = 'Güncelleniyor...'
                ; (btn as HTMLButtonElement).disabled = true

            await api.updateTicketDetails(id, {
                customer_name: custInput?.value?.trim() || '',
                aras_code: arasInput?.value?.trim() || '',
                phone_number: phoneInput?.value?.trim() || ''
            })

            btn.textContent = 'Güncelle'
                ; (btn as HTMLButtonElement).disabled = false
        })
    })
}
