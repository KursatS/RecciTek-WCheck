import { escapeHtml } from './html'

function formatTimestamp(timestampMs: number | null | undefined): string {
    if (!timestampMs) return 'tarih verisi bulunamadı'
    try {
        const date = new Date(timestampMs)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${day}.${month}.${year} ${hours}:${minutes}`
    } catch (e) {
        return 'tarih verisi bulunamadı'
    }
}

export function initPriorityLogic(api: any, elements: any) {
    const { prioList, addPrioBtn, pSerial, pCustomer, pDesc } = elements

    if (!document.getElementById('prio-highlight-style')) {
        const style = document.createElement('style')
        style.id = 'prio-highlight-style'
        style.textContent = `
            @keyframes highlightPulse {
                0% { box-shadow: 0 0 0px rgba(59, 130, 246, 0); background: rgba(255,255,255,0.02); }
                20% { box-shadow: 0 0 25px rgba(59, 130, 246, 1); background: rgba(59, 130, 246, 0.3); }
                100% { box-shadow: 0 0 0px rgba(59, 130, 246, 0); background: rgba(255,255,255,0.02); }
            }
            .highlight-pulse {
                animation: highlightPulse 2s ease-out !important;
                border: 1px solid rgba(59, 130, 246, 0.6) !important;
            }
        `
        document.head.appendChild(style)
    }

    ;(window as any)._editingPriorityId = null

    let cachedDevices: any[] = []

    function focusPriorityDevice(target: { id?: string; serial?: string }) {
        const searchInput = document.getElementById('priority-search') as HTMLInputElement | null
        if (searchInput) {
            searchInput.value = ''
        }

        const matched = cachedDevices.find(d =>
            (target.id && d.id === target.id) ||
            (target.serial && d.serial?.toUpperCase() === target.serial.toUpperCase())
        )

        if (!matched) return

        ;(window as any)._editingPriorityId = null
        renderPriorityDevices()

        setTimeout(() => {
            const itemEl = document.getElementById(`prio-item-${matched.id}`)
            if (itemEl) {
                itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                itemEl.classList.add('highlight-pulse')
                setTimeout(() => itemEl.classList.remove('highlight-pulse'), 2000)
            }
        }, 120)
    }

    async function loadPriorityDevices() {
        cachedDevices = await api.getPriorityDevices()
        renderPriorityDevices()
    }

    function renderPriorityDevices() {
        const query = (document.getElementById('priority-search') as HTMLInputElement)?.value.toLowerCase() || ''
        prioList.innerHTML = ''

        const filtered = cachedDevices.filter(d =>
            (d.serial && d.serial.toLowerCase().includes(query)) ||
            (d.customer_name && d.customer_name.toLowerCase().includes(query))
        )

        if (!filtered || filtered.length === 0) {
            prioList.innerHTML = '<div class="priority-empty">Kayıtlı öncelikli cihaz yok.</div>'
            return
        }

        filtered.forEach((d: any) => {
            const item = document.createElement('div')
            item.className = 'priority-item'
            item.id = `prio-item-${d.id}`

            const isEditing = (window as any)._editingPriorityId === d.id

            if (isEditing) {
                item.innerHTML = `
                    <div class="priority-item-body" style="display:flex; flex-direction:column; gap:6px; width: 100%;">
                        <input type="text" id="edit-prio-customer-${d.id}" value="${escapeHtml(d.customer_name)}" class="priority-input" placeholder="Müşteri Adı">
                        <input type="text" id="edit-prio-serial-${d.id}" value="${escapeHtml(d.serial)}" class="priority-input" placeholder="Seri No">
                        <input type="text" id="edit-prio-desc-${d.id}" value="${escapeHtml(d.description)}" class="priority-input" placeholder="Açıklama">
                        <div style="font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.05); padding-top:4px;">
                            Ekleyen: ${escapeHtml(d.created_by || 'Bilinmiyor')} | Tarih: ${formatTimestamp(d.created_at)}
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px; padding-left: 10px; align-items:center;">
                        <button class="btn-add-priority" style="padding: 6px 10px; font-size: 0.8rem;" onclick="saveEditPriority('${d.id}')">Kaydet</button>
                        <button class="btn-del-priority" style="background: rgba(255,255,255,0.1);" onclick="cancelEditPriority()">×</button>
                    </div>
                `
            } else {
                item.innerHTML = `
                    <div class="priority-item-body">
                        <div class="priority-item-name">${escapeHtml(d.customer_name)}</div>
                        <div class="priority-item-serial">${escapeHtml(d.serial)}</div>
                        <div class="priority-item-desc">${escapeHtml(d.description)}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px;">
                            Ekleyen: ${escapeHtml(d.created_by || 'Bilinmiyor')} | Tarih: ${formatTimestamp(d.created_at)}
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px; padding-left: 10px; align-items:center;">
                        <button class="btn-del-priority" style="background: rgba(59, 130, 246, 0.4);" onclick="startEditPriority('${d.id}')">✏️</button>
                        <button class="btn-del-priority" onclick="deletePriority('${d.id}')">×</button>
                    </div>
                `
            }

            prioList.appendChild(item)
        })
    }

    document.getElementById('priority-search')?.addEventListener('input', renderPriorityDevices)

    addPrioBtn.onclick = async () => {
        const serialVal = pSerial.value.trim().toUpperCase()
        if (!serialVal) return

        const existing = cachedDevices.find(d => d.serial.toUpperCase() === serialVal)
        if (existing) {
            const confirmed = await (window as any).showConfirm(
                'Cihaz Zaten Kayıtlı',
                'Aynı seri numarasında farklı bir kayıt var. Bu cihazı düzenlemek ister misiniz?',
                'Evet'
            )
            if (confirmed) {
                ;(window as any).startEditPriority(existing.id)
                focusPriorityDevice({ id: existing.id })
                pSerial.value = ''
                pCustomer.value = ''
                pDesc.value = ''
            }
            return
        }

        const settings = await api.getSettings()
        const data = {
            serial: serialVal,
            customer_name: pCustomer.value.trim() || 'Belirtilmedi',
            description: pDesc.value.trim(),
            created_by: settings.personnelName || settings.username || 'Bilinmiyor'
        }
        await api.addPriorityDevice(data)
        pSerial.value = ''
        pCustomer.value = ''
        pDesc.value = ''
        loadPriorityDevices()
    }

    ;(window as any).deletePriority = async (id: string) => {
        await api.deletePriorityDevice(id)
        loadPriorityDevices()
    }

    ;(window as any).startEditPriority = (id: string) => {
        ;(window as any)._editingPriorityId = id
        renderPriorityDevices()
    }

    ;(window as any).cancelEditPriority = () => {
        ;(window as any)._editingPriorityId = null
        renderPriorityDevices()
    }

    ;(window as any).saveEditPriority = async (id: string) => {
        const cInput = document.getElementById(`edit-prio-customer-${id}`) as HTMLInputElement
        const sInput = document.getElementById(`edit-prio-serial-${id}`) as HTMLInputElement
        const dInput = document.getElementById(`edit-prio-desc-${id}`) as HTMLInputElement
        if (!sInput.value.trim()) return

        await api.updatePriorityDevice(id, {
            customer_name: cInput.value.trim() || 'Belirtilmedi',
            serial: sInput.value.trim().toUpperCase(),
            description: dInput.value.trim()
        })

        ;(window as any)._editingPriorityId = null
        loadPriorityDevices()
    }

    return { loadPriorityDevices, focusPriorityDevice }
}
