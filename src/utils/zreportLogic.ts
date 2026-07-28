import { escapeHtml } from './html'

export function initZReportLogic(api: any, elements: any) {
    const {
        zreportDropZone,
        zreportFileInput,
        zreportResults,
        zreportAnalytics
    } = elements

    let lastZReportFile: File | null = null

    zreportDropZone.onclick = () => zreportFileInput.click()
    zreportDropZone.ondragover = (e: any) => { e.preventDefault(); zreportDropZone.classList.add('dragover') }
    zreportDropZone.ondragleave = () => zreportDropZone.classList.remove('dragover')
    zreportDropZone.ondrop = async (e: any) => {
        e.preventDefault()
        zreportDropZone.classList.remove('dragover')
        const file = e.dataTransfer?.files[0]
        if (file) {
            lastZReportFile = file
            await handleZReportFile(file)
        }
    }

    zreportFileInput.onchange = async () => {
        if (zreportFileInput.files && zreportFileInput.files[0]) {
            const file = zreportFileInput.files[0]
            lastZReportFile = file
            await handleZReportFile(file)
            zreportFileInput.value = ''
        }
    }

    async function handleZReportFile(file: File) {
        if (!file) return
        zreportResults.innerHTML = '<div style="text-align:center; color:var(--text-muted);">Hesaplanıyor...</div>'
        zreportAnalytics.style.display = 'none'

        try {
            let fileData: any = null
            const path = api.getPathForFile ? api.getPathForFile(file) : (file as any).path
            if (path) {
                fileData = path
            } else {
                fileData = await file.arrayBuffer()
            }
            const results = await api.calculateZReport(fileData)
            displayZReportResults(results)
        } catch (err: any) {
            console.error('Z-Report error:', err)
            zreportResults.innerHTML = `<div style="text-align:center; color:#ef4444;">Dosya okunurken hata oluştu: ${escapeHtml(err?.message || 'Bilinmeyen hata')}</div>`
        }
    }

    function displayZReportResults(results: any[]) {
        zreportResults.innerHTML = ''
        if (!results || results.length === 0) {
            zreportResults.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Ge\u00e7erli veri bulunamad\u0131. Excel dosyas\u0131n\u0131 kontrol edin.</p>'
            return
        }

        results.forEach((res: any, index: number) => {
            const card = document.createElement('div')
            card.className = 'result-card'
            card.style.animationDelay = `${index * 0.1}s`

            const topModels = (res.models || []).slice(0, 3)
                .map((m: any) => `${m.model}: ${m.count}`)
                .join(' | ')

            card.innerHTML = `
                <div class="result-info">
                    <h3>${res.date}</h3>
                    <div class="result-stats">
                        <div class="stat-item">Toplam Girilen Kay\u0131t: <strong>${res.totalCount}</strong></div>
                    </div>
                    ${topModels ? `<div style="margin-top:10px; font-size:0.78rem; color:var(--text-muted);">${topModels}</div>` : ''}
                </div>
                <div class="status-badge status-eligible">Z Raporu Haz\u0131r</div>
            `

            card.onclick = () => {
                zreportResults.querySelectorAll('.result-card').forEach((c: any) => c.classList.remove('active'))
                card.classList.add('active')
                showZReportAnalytics(res)
            }

            zreportResults.appendChild(card)
            if (index === 0) card.click()
        })
    }

    function showZReportAnalytics(res: any) {
        zreportAnalytics.style.display = 'block'
        zreportAnalytics.innerHTML = ''

        if (!res.models || res.models.length === 0) {
            zreportAnalytics.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Model verisi yok</p>'
            return
        }

        const maxCount = Math.max(...res.models.map((m: any) => m.count), 1)
        const modelCards = res.models.map((model: any) => `
            <div style="background:rgba(255,255,255,0.04); border:1px solid var(--glass-border); border-radius:16px; padding:14px 16px;">
                <div style="font-size:0.88rem; font-weight:700; color:var(--text-main); margin-bottom:8px; word-break:break-word;">${model.model}</div>
                <div style="font-size:0.78rem; color:var(--text-muted);">
                    Toplam Kay\u0131t: <strong style="color:var(--accent);">${model.count}</strong>
                </div>
            </div>
        `).join('')

        zreportAnalytics.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; gap:16px; flex-wrap:wrap;">
                <div>
                    <h2 style="margin:0 0 6px 0;">${res.date} Cihaz Da\u011f\u0131l\u0131m\u0131</h2>
                    <div style="font-size:0.85rem; color:var(--text-muted);">O g\u00fcn girilen modellerin detayl\u0131 adet bilgileri.</div>
                </div>
                <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.18); border-radius:16px; padding:12px 14px; min-width:120px;">
                    <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">G\u00fcnl\u00fck Toplam</div>
                    <div style="font-size:1.4rem; font-weight:800; color:var(--accent);">${res.totalCount}</div>
                </div>
            </div>
            
            <div id="zreport-chart" style="display:flex; align-items:flex-end; gap:8px; height:240px; border-bottom:2px solid var(--glass-border); position:relative; margin-bottom:18px; overflow-x:auto; padding-bottom:4px;"></div>
            
            <div style="margin-top:28px;">
                <h3 style="margin:0 0 14px 0;">Model Bazl\u0131 Toplamlar</h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
                    ${modelCards}
                </div>
            </div>

            <div style="margin-top:28px; margin-bottom:24px;">
                <h3 style="margin:0 0 14px 0;">Personel Bazl\u0131 Kay\u0131t Say\u0131lar\u0131</h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
                    ${(res.personnel || []).map((p: any) => `
                        <div style="background:rgba(255,255,255,0.04); border:1px solid var(--glass-border); border-radius:16px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center;">
                            <div style="font-size:0.88rem; font-weight:700; color:var(--text-main); word-break:break-word;">${escapeHtml(p.name)}</div>
                            <div style="font-size:0.78rem; color:var(--text-muted);">
                                Kay\u0131t Say\u0131s\u0131: <strong style="color:var(--accent);">${p.count}</strong>
                            </div>
                        </div>
                    `).join('') || '<p style="color:var(--text-muted);">Veri yok</p>'}
                </div>
            </div>
        `

        const chart = document.getElementById('zreport-chart')!
        
        // Sadece ilk 15 modeli grafikte gösterelim ki çok sıkışmasın
        const chartModels = res.models.slice(0, 15)
        chartModels.forEach((model: any, i: number) => {
            const barHeight = maxCount > 0 ? (model.count / maxCount) * 200 : 0
            const displayLabel = model.model.length > 8 ? model.model.substring(0, 6) + '..' : model.model

            const group = document.createElement('div')
            group.style.cssText = 'flex:1; min-width:32px; max-width:80px; display:flex; flex-direction:column; align-items:center; gap:6px;'
            group.innerHTML = `
                <div title="${model.model} | Kayıt: ${model.count}" style="width:100%; display:flex; flex-direction:column-reverse; align-items:center; border-radius:8px 8px 0 0; cursor:pointer; position:relative; height:0; transition:height 0.6s cubic-bezier(0.175,0.885,0.32,1.275);" class="bar-stack">
                    <div style="width:100%; height:${barHeight}px; background:linear-gradient(to top, var(--accent), #38bdf8); border-radius:4px 4px 0 0;"></div>
                    <span style="position:absolute; top:-18px; font-size:11px; font-weight:800; color:var(--text-main);">${model.count}</span>
                </div>
                <div style="font-size:9px; font-weight:600; color:var(--text-muted); text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;" title="${model.model}">${displayLabel}</div>
            `

            chart.appendChild(group)

            setTimeout(() => {
                const stack = group.querySelector('.bar-stack') as HTMLElement
                stack.style.height = `${barHeight}px`
            }, 30 + i * 18)
        })

        zreportAnalytics.scrollIntoView({ behavior: 'smooth' })
    }
}
