export { }
import { showToast } from './utils/toastUtils'
import { SVG_EMPTY_TICKET } from './utils/svgUtils'
const api = (window as any).electronAPI

// ── DOM Refs ─────────────────────────────────────────────────────────
const ticketList = document.getElementById('ticket-list')!
const emptyState = document.getElementById('empty-state')!
const countPending = document.getElementById('count-pending')!
const countProgress = document.getElementById('count-progress')!
const countCompleted = document.getElementById('count-completed')!
const filterTabs = document.getElementById('filter-tabs')!
const searchInput = document.getElementById('ticket-search') as HTMLInputElement

let allTickets: any[] = []
let activeFilter = 'all'
let searchQuery = ''
let currentRole = 'mh'
let personnelName = ''

const MISSING_TYPE_LABELS: Record<string, string> = {
    address: 'Adres Bilgisi',
    fault_form: 'Arıza Beyanı',
    contact: 'Müşteri İletişim',
    other: 'Diğer'
}

// ── Filter tab clicks ────────────────────────────────────────────────
filterTabs.addEventListener('click', (e) => {
    const tab = (e.target as HTMLElement).closest('.filter-tab') as HTMLElement
    if (!tab) return
    filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'))
    tab.classList.add('active')
    activeFilter = tab.dataset.filter || 'all'
    renderTickets(allTickets)
})

// ── Search ───────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.toLowerCase().trim()
    renderTickets(allTickets)
})

// ── Ticket real-time updates ─────────────────────────────────────────
api.onTicketUpdate((tickets: any[]) => renderTickets(tickets))

api.onRefreshCards(() => {
    api.getSettings().then((s: any) => {
        currentRole = s.role || 'mh'
        personnelName = s.personnelName || 'Bilinmeyen'
        api.getTickets().then((tickets: any[]) => { if (tickets) renderTickets(tickets) })
    })
})

// ── Init ─────────────────────────────────────────────────────────────
Promise.all([
    api.getSettings(),
    api.getTickets()
]).then(([settings, tickets]: [any, any[]]) => {
    if (settings.theme === 'light') document.body.classList.add('light')
    currentRole = settings.role || 'mh'
    personnelName = settings.personnelName || 'Bilinmeyen'
    if (tickets) renderTickets(tickets)
})

// Skeleton while waiting for initial data
showSkeletonTickets()

// ── Show skeleton while loading tickets ──────────────────────────────
function showSkeletonTickets() {
    ticketList.innerHTML = `
        <div class="ticket-card" style="pointer-events:none;">
            <div class="ticket-body" style="flex:1;display:flex;flex-direction:column;gap:10px;">
                <div class="skeleton" style="width:30%;height:20px;"></div>
                <div class="skeleton" style="width:55%;height:14px;"></div>
                <div class="skeleton" style="width:80%;height:40px;"></div>
            </div>
        </div>
        <div class="ticket-card" style="pointer-events:none;opacity:0.6;">
            <div class="ticket-body" style="flex:1;display:flex;flex-direction:column;gap:10px;">
                <div class="skeleton" style="width:25%;height:20px;"></div>
                <div class="skeleton" style="width:45%;height:14px;"></div>
                <div class="skeleton" style="width:90%;height:40px;"></div>
            </div>
        </div>
    `
    emptyState.style.display = 'none'
}

// ── Render Tickets ───────────────────────────────────────────────────
function renderTickets(tickets: any[]) {
    allTickets = tickets

    const oldCards = ticketList.querySelectorAll('.ticket-card')
    oldCards.forEach(c => c.remove())

    const pending = tickets.filter(t => t.status === 'pending').length
    const inProgress = tickets.filter(t => t.status === 'in_progress').length
    const completed = tickets.filter(t => t.status === 'completed').length

    countPending.textContent = String(pending)
    countProgress.textContent = String(inProgress)
    countCompleted.textContent = String(completed)

    let filtered = [...tickets]
    if (activeFilter === 'pending') filtered = filtered.filter(t => t.status === 'pending')
    else if (activeFilter === 'in_progress') filtered = filtered.filter(t => t.status === 'in_progress')
    else if (activeFilter === 'completed') filtered = filtered.filter(t => t.status === 'completed')
    else if (activeFilter === 'aras') filtered = filtered.filter(t => t.aras_code && t.aras_code.trim() !== '')

    // Search filter
    if (searchQuery) {
        filtered = filtered.filter(t =>
            (t.serial || '').toLowerCase().includes(searchQuery) ||
            (t.customer_name || '').toLowerCase().includes(searchQuery)
        )
    }

    if (filtered.length === 0) {
        ticketList.innerHTML = ''
        emptyState.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;padding:40px 20px;">
                ${SVG_EMPTY_TICKET}
                <div style="font-weight:600;font-size:1rem;margin-bottom:6px;">
                    ${searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz aktif talep yok'}
                </div>
                <div style="font-size:0.84rem;color:var(--text-muted);">
                    ${searchQuery ? '"' + searchQuery + '" ile eşleşen kayıt bulunamadı.' : 'Tüm talepler tamamlandı veya henüz oluşturulmadı.'}
                </div>
            </div>
        `
        emptyState.style.display = 'block'
        return
    }
    emptyState.style.display = 'none'

    filtered.forEach(ticket => {
        const card = document.createElement('div')
        card.className = `ticket-card status-${ticket.status}`

        const timeStr = ticket.created_at
            ? new Date(ticket.created_at).toLocaleString('tr-TR')
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
                    const types = ticket.missing_type.split(',').map((t: string) => t.trim())
                    let structuredInputs = '<div class="structured-responses" style="display:flex;flex-direction:column;gap:8px;">'
                    types.forEach((type: string, idx: number) => {
                        structuredInputs += `
                            <div class="collab-group">
                                <span class="collab-label">${type}</span>
                                <input type="text" class="response-input structured-input"
                                    data-type="${type}"
                                    id="resp-${ticket.id}-${idx}"
                                    placeholder="${type} cevabını girin...">
                            </div>
                        `
                    })
                    structuredInputs += '</div>'
                    actionsHtml = `
                        <span class="badge badge-in_progress">Üstlenildi</span>
                        ${structuredInputs}
                        <button class="btn-sm btn-complete" data-id="${ticket.id}" style="margin-top:8px;">Tamamla</button>
                    `
                } else {
                    actionsHtml = `<span class="badge badge-in_progress">${ticket.responded_by} üstlendi</span>`
                }
            } else {
                actionsHtml = `
                    <span class="badge badge-completed">Tamamlandı</span>
                    <button class="btn-sm btn-reopen" data-id="${ticket.id}" style="margin-top:8px;">Düzenle</button>
                `
            }
        } else {
            if (ticket.status === 'pending') actionsHtml = `<span class="badge badge-pending">Bekliyor</span>`
            else if (ticket.status === 'in_progress') actionsHtml = `<span class="badge badge-in_progress">${ticket.responded_by} bakıyor</span>`
            else actionsHtml = `<span class="badge badge-completed">✅ Tamamlandı</span>`
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

        const collabHtml = `
            <div class="collab-container">
                <div class="collab-group">
                    <span class="collab-label">Müşteri İsmi</span>
                    <input type="text" class="response-input collab-input" id="cust-${ticket.id}" value="${ticket.customer_name || ''}" placeholder="İsim Girin...">
                </div>
                <div class="collab-group">
                    <span class="collab-label">Aras Kodu</span>
                    <input type="text" class="response-input collab-input" id="aras-${ticket.id}" value="${ticket.aras_code || ''}" placeholder="Aras Kodu...">
                </div>
                <div class="collab-group">
                    <span class="collab-label">Telefon Numarası</span>
                    <input type="text" class="response-input collab-input" id="phone-${ticket.id}" value="${ticket.phone_number || ''}" placeholder="05XX...">
                </div>
            </div>
            <button class="btn-sm btn-update" data-id="${ticket.id}" style="margin-top: 12px;">Güncelle</button>
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

    bindTicketActions()
}

function bindTicketActions() {
    document.querySelectorAll('.btn-claim').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await api.claimTicket((btn as HTMLElement).dataset.id!, personnelName)
                showToast('Talebi başarıyla üstlendiniz.', 'success')
            } catch (e: any) {
                showToast('Hata: ' + e.message, 'error')
            }
        })
    })

    document.querySelectorAll('.btn-complete').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = (btn as HTMLElement).dataset.id!
            const inputs = document.querySelectorAll(`[id^="resp-${id}-"]`) as NodeListOf<HTMLInputElement>
            const responses: string[] = []
            let allFilled = true
            inputs.forEach(input => {
                const val = input.value.trim()
                if (!val) { input.style.borderColor = '#ef4444'; allFilled = false }
                else { input.style.borderColor = ''; responses.push(`${input.dataset.type}: ${val}`) }
            })
            if (!allFilled) {
                showToast('Lütfen istenen tüm bilgileri doldurun.', 'error')
                return
            }
            try {
                await api.completeTicket(id, responses.join(' | '))
                showToast('Bilgiler iletildi. Talep kapatıldı.', 'success')
            } catch (e: any) {
                showToast('Hata: ' + e.message, 'error')
            }
        })
    })

    document.querySelectorAll('.btn-reopen').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await api.reopenTicket((btn as HTMLElement).dataset.id!)
                showToast('Talep yeniden açıldı.', 'info')
            } catch (e: any) {
                showToast('Hata: ' + e.message, 'error')
            }
        })
    })

    document.querySelectorAll('.btn-update').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = (btn as HTMLElement).dataset.id!
            btn.textContent = 'Güncelleniyor...'
                ; (btn as HTMLButtonElement).disabled = true
            try {
                await api.updateTicketDetails(id, {
                    customer_name: (document.getElementById(`cust-${id}`) as HTMLInputElement)?.value?.trim() || '',
                    aras_code: (document.getElementById(`aras-${id}`) as HTMLInputElement)?.value?.trim() || '',
                    phone_number: (document.getElementById(`phone-${id}`) as HTMLInputElement)?.value?.trim() || ''
                })
                showToast('Cihaz detayları güncellendi.', 'success')
            } catch (e: any) {
                showToast('Güncelleme hatası: ' + e.message, 'error')
            } finally {
                btn.textContent = 'Güncelle'
                    ; (btn as HTMLButtonElement).disabled = false
            }
        })
    })
}
