import { escapeHtml } from './html'
import { showToast } from './toastUtils'

function formatTimestamp(timestampMs: number | null | undefined): string {
    if (!timestampMs) return 'Tarih yok'
    try {
        const date = new Date(timestampMs)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${day}.${month}.${year} ${hours}:${minutes}`
    } catch {
        return 'Tarih yok'
    }
}

export function initDeviceCallLogic(api: any, elements: any) {
    const {
        dcallHistoryList,
        dcallSearchInput,
        dcallStatusFilter,
        btnOpenModal,
        deviceCallModal,
        dcallSerial,
        dcallModel,
        dcallCustomer,
        btnCancelModal,
        btnSendModal
    } = elements

    let latestCalls: any[] = []
    let currentPersonnelName = ''

    function openModal() {
        if (dcallSerial) dcallSerial.value = ''
        if (dcallModel) dcallModel.value = ''
        if (dcallCustomer) dcallCustomer.value = ''
        if (deviceCallModal) deviceCallModal.classList.add('active')
        if (dcallSerial) dcallSerial.focus()
    }

    function closeModal() {
        if (deviceCallModal) deviceCallModal.classList.remove('active')
    }

    if (btnOpenModal) btnOpenModal.onclick = () => openModal()
    if (btnCancelModal) btnCancelModal.onclick = () => closeModal()

    if (btnSendModal) {
        btnSendModal.onclick = async () => {
            const serial = dcallSerial.value.trim().toUpperCase()
            const model = dcallModel.value.trim().toUpperCase()
            const customer = dcallCustomer.value.trim()

            if (!serial) { dcallSerial.focus(); return }
            if (!model) { dcallModel.focus(); return }

            btnSendModal.textContent = 'Gönderiliyor...'
            btnSendModal.setAttribute('disabled', 'true')

            try {
                await api.createDeviceCall({
                    serial,
                    model_name: model,
                    customer_name: customer,
                    created_by: currentPersonnelName || 'Bilinmiyor'
                })
                closeModal()
            } catch (err) {
                console.error('Device call error:', err)
                showToast('Hata', 'Çağrı gönderilemedi', 'error')
            } finally {
                btnSendModal.textContent = '📢 Çağrı Gönder'
                btnSendModal.removeAttribute('disabled')
            }
        }
    }

    if (dcallSearchInput) {
        dcallSearchInput.addEventListener('input', () => renderHistory())
    }
    if (dcallStatusFilter) {
        dcallStatusFilter.addEventListener('change', () => renderHistory())
    }

    function renderHistory() {
        if (!dcallHistoryList) return

        const query = (dcallSearchInput?.value || '').trim().toLowerCase()
        const filterStatus = dcallStatusFilter?.value || 'all'

        let filtered = latestCalls.filter(call => {
            // Status filter
            if (filterStatus !== 'all' && call.status !== filterStatus) return false

            // Query filter
            if (query) {
                const s = (call.serial || '').toLowerCase()
                const m = (call.model_name || '').toLowerCase()
                const c = (call.customer_name || '').toLowerCase()
                const creator = (call.created_by || '').toLowerCase()
                const resolver = (call.resolved_by || '').toLowerCase()
                if (!s.includes(query) && !m.includes(query) && !c.includes(query) && !creator.includes(query) && !resolver.includes(query)) {
                    return false
                }
            }
            return true
        })

        if (filtered.length === 0) {
            dcallHistoryList.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(255,255,255,0.02); border: 1.5px dashed var(--glass-border); border-radius: 24px;">
                    <div style="font-size: 3rem; margin-bottom: 12px; opacity: 0.5;">📢</div>
                    <h3 style="font-size: 1.25rem; color: var(--text-main); margin-bottom: 6px;">Henüz bir cihaz çağrısı yok</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">"📢 Yeni Cihaz Sor" butonuna tıklayarak yeni bir çağrı başlatabilirsiniz.</p>
                </div>
            `
            return
        }

        dcallHistoryList.innerHTML = filtered.map(call => {
            const isMine = currentPersonnelName && (call.created_by || '').toLowerCase() === currentPersonnelName.toLowerCase()

            let badgeHtml = ''
            if (call.status === 'active') {
                badgeHtml = `<span style="display:inline-flex; align-items:center; gap:6px; font-size:0.7rem; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:8px; background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3);"><span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;"></span> ⏳ AKTİF / YANIT BEKLENİYOR</span>`
            } else if (call.status === 'resolved') {
                badgeHtml = `<span style="display:inline-flex; align-items:center; gap:6px; font-size:0.7rem; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:8px; background:rgba(34,197,94,0.15); color:#22c55e; border:1px solid rgba(34,197,94,0.3);">✅ CİHAZ BULUNDU</span>`
            } else if (call.status === 'cancelled') {
                badgeHtml = `<span style="display:inline-flex; align-items:center; gap:6px; font-size:0.7rem; font-weight:700; text-transform:uppercase; padding:4px 10px; border-radius:8px; background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);">✕ İPTAL EDİLDİ</span>`
            }

            const customerLine = call.customer_name
                ? `<div style="font-size:0.83rem; color:#94a3b8; margin-top:2px;">Müşteri: <strong style="color:#f1f5f9; cursor:pointer;" class="dcall-copyable" data-copy="${escapeHtml(call.customer_name)}" title="Tıklayarak kopyalayın">${escapeHtml(call.customer_name)}</strong></div>`
                : ''

            let resolvedLine = ''
            if (call.status === 'resolved' && call.resolved_by) {
                resolvedLine = `<div style="font-size:0.8rem; color:#22c55e; margin-top:8px; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.08); display:flex; align-items:center; gap:6px;"><span>✅</span> <span>Bulan: <strong>${escapeHtml(call.resolved_by)}</strong> (${formatTimestamp(call.resolved_at)})</span></div>`
            }

            let actionBtnHtml = ''
            if (call.status === 'active') {
                if (!isMine) {
                    actionBtnHtml = `<button class="dcall-here-act-btn" data-id="${call.id}" style="width:100%; margin-top:14px; padding:10px; background:linear-gradient(135deg,#16a34a,#15803d); color:#fff; border:none; border-radius:12px; font-weight:700; font-size:0.88rem; cursor:pointer; box-shadow:0 4px 12px rgba(22,163,74,0.3); transition:all 0.2s;">📱 Cihaz Bende</button>`
                } else {
                    actionBtnHtml = `<button class="dcall-cancel-act-btn" data-id="${call.id}" style="width:100%; margin-top:14px; padding:10px; background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.3); border-radius:12px; font-weight:700; font-size:0.88rem; cursor:pointer; transition:all 0.2s;">✕ Çağrıyı İptal Et</button>`
                }
            }

            return `
                <div class="card" style="display:flex; flex-direction:column; justify-content:space-between; position:relative; background:var(--card-bg); border:1px solid var(--glass-border); border-radius:20px; padding:20px;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            ${badgeHtml}
                            <span style="font-size:0.75rem; color:#64748b;">${formatTimestamp(call.created_at)}</span>
                        </div>
                        <div style="font-size:1.15rem; font-weight:800; color:#f8fafc; cursor:pointer; margin-bottom:4px;" class="dcall-copyable" data-copy="${escapeHtml(call.model_name)}" title="Tıklayarak kopyalayın">${escapeHtml(call.model_name)}</div>
                        <div style="font-size:0.85rem; color:#94a3b8; margin-bottom:4px;">Seri No: <strong style="color:#38bdf8; cursor:pointer;" class="dcall-copyable" data-copy="${escapeHtml(call.serial)}" title="Tıklayarak kopyalayın">${escapeHtml(call.serial)}</strong></div>
                        ${customerLine}
                        <div style="font-size:0.78rem; color:#64748b; margin-top:10px;">Çağrı Yapan: <strong style="color:#cbd5e1;">${escapeHtml(call.created_by)}</strong></div>
                        ${resolvedLine}
                    </div>
                    ${actionBtnHtml}
                </div>
            `
        }).join('')

        // Add event listeners for copyable elements and action buttons
        dcallHistoryList.querySelectorAll('.dcall-copyable').forEach(el => {
            el.addEventListener('click', (e) => {
                const text = (e.currentTarget as HTMLElement).dataset.copy
                if (text) {
                    navigator.clipboard.writeText(text)
                    showToast('Kopyalandı', `${text} panoya kopyalandı!`)
                }
            })
        })

        dcallHistoryList.querySelectorAll('.dcall-here-act-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = (e.currentTarget as HTMLElement).dataset.id
                if (!id) return
                try {
                    await api.resolveDeviceCall(id, currentPersonnelName || 'Bilinmiyor')
                    showToast('Başarılı', 'Cihazın sizde olduğu bildirildi!')
                } catch (err) {
                    console.error(err)
                }
            })
        })

        dcallHistoryList.querySelectorAll('.dcall-cancel-act-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = (e.currentTarget as HTMLElement).dataset.id
                if (!id) return
                try {
                    await api.cancelDeviceCall(id)
                    showToast('İptal Edildi', 'Çağrı iptal edildi')
                } catch (err) {
                    console.error(err)
                }
            })
        })
    }

    return {
        updateData(calls: any[], name: string) {
            latestCalls = calls || []
            currentPersonnelName = name || ''
            const viewSec = document.getElementById('view-device-calls')
            if (viewSec && viewSec.classList.contains('active')) {
                renderHistory()
            }
        },
        renderHistory,
        openModal
    }
}
