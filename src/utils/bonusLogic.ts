export function initBonusLogic(api: any, elements: any) {
    const {
        bonusDropZone,
        bonusFileInput,
        bonusResults,
        bonusAnalytics,
        workStartInput,
        workEndInput
    } = elements

    let lastBonusFile: File | null = null

    bonusDropZone.onclick = () => bonusFileInput.click()
    bonusDropZone.ondragover = (e: any) => { e.preventDefault(); bonusDropZone.classList.add('dragover') }
    bonusDropZone.ondragleave = () => bonusDropZone.classList.remove('dragover')
    bonusDropZone.ondrop = async (e: any) => {
        e.preventDefault()
        bonusDropZone.classList.remove('dragover')
        const file = e.dataTransfer?.files[0]
        if (file) {
            lastBonusFile = file
            await handleBonusFile(file)
        }
    }

    bonusFileInput.onchange = async () => {
        if (bonusFileInput.files && bonusFileInput.files[0]) {
            const file = bonusFileInput.files[0]
            lastBonusFile = file
            await handleBonusFile(file)
        }
    }

    workStartInput.onchange = () => { if (lastBonusFile) handleBonusFile(lastBonusFile) }
    workEndInput.onchange = () => { if (lastBonusFile) handleBonusFile(lastBonusFile) }

    async function handleBonusFile(file: File) {
        if (!file) return
        bonusResults.innerHTML = '<div style="text-align:center; color:var(--text-muted);">Hesaplan\u0131yor...</div>'
        bonusAnalytics.style.display = 'none'

        try {
            const buffer = await file.arrayBuffer()
            const customHours = { start: workStartInput.value, end: workEndInput.value }
            const results = await api.calculateBonus(buffer, customHours)
            displayBonusResults(results)
        } catch (err) {
            bonusResults.innerHTML = '<div style="text-align:center; color:#ef4444;">Dosya okunurken hata olu\u015ftu.</div>'
        }
    }

    function displayBonusResults(results: any[]) {
        bonusResults.innerHTML = ''
        if (!results || results.length === 0) {
            bonusResults.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Ge\u00e7erli veri bulunamad\u0131.</p>'
            return
        }

        results.forEach((res: any, index: number) => {
            const card = document.createElement('div')
            card.className = 'result-card'
            card.style.animationDelay = `${index * 0.1}s`

            let statusText = ''
            let statusClass = ''
            if (res.isEligible) {
                statusText = 'Prim tamam'
                statusClass = 'status-eligible'
            } else {
                const remaining = Math.max(0, 850 - res.validCount)
                statusText = index === 0 ? `Eksik: ${remaining}` : 'Prim tamamlanmad\u0131'
                statusClass = 'status-pending-badge'

                if (index === 0 && remaining > 0) {
                    const monthParts = res.month.split(' ')
                    const monthName = monthParts[0]
                    const year = parseInt(monthParts[1] || new Date().getFullYear().toString(), 10)
                    const monthMap: Record<string, number> = {
                        Ocak: 1,
                        '\u015eubat': 2,
                        Mart: 3,
                        Nisan: 4,
                        'May\u0131s': 5,
                        Haziran: 6,
                        Temmuz: 7,
                        'A\u011fustos': 8,
                        'Eyl\u00fcl': 9,
                        Ekim: 10,
                        'Kas\u0131m': 11,
                        'Aral\u0131k': 12
                    }
                    const monthNumber = monthMap[monthName]
                    if (monthNumber) {
                        const today = new Date()
                        if (today.getMonth() + 1 === monthNumber && today.getFullYear() === year) {
                            const lastDay = new Date(year, monthNumber, 0).getDate()
                            let workingDayUnits = 0

                            for (let day = today.getDate(); day <= lastDay; day++) {
                                const weekDay = new Date(year, monthNumber - 1, day).getDay()
                                if (weekDay >= 1 && weekDay <= 5) workingDayUnits += 1
                                else if (weekDay === 6) workingDayUnits += 0.5
                            }

                            if (workingDayUnits > 0) {
                                statusText += ` (G\u00fcnde ~${Math.ceil(remaining / workingDayUnits)} cihaz)`
                            }
                        }
                    }
                }
            }

            const topModels = (res.modelStats || []).slice(0, 3)
                .map((model: any) => `${model.model}: ${model.totalCount}`)
                .join(' | ')

            card.innerHTML = `
                <div class="result-info">
                    <h3>${res.month}</h3>
                    <div class="result-stats">
                        <div class="stat-item">Mesai \u0130\u00e7i: <strong>${res.validCount}</strong></div>
                        <div class="stat-item">Mesai D\u0131\u015f\u0131: <strong>${res.overtimeCount}</strong></div>
                        <div class="stat-item">Toplam: <strong>${res.totalCount}</strong></div>
                    </div>
                    ${topModels ? `<div style="margin-top:10px; font-size:0.78rem; color:var(--text-muted);">${topModels}</div>` : ''}
                </div>
                <div class="status-badge ${statusClass}">${statusText}</div>
            `

            card.onclick = () => {
                bonusResults.querySelectorAll('.result-card').forEach((c: any) => c.classList.remove('active'))
                card.classList.add('active')
                showBonusAnalytics(res)
            }

            bonusResults.appendChild(card)
            if (index === 0) card.click()
        })
    }

    function showBonusAnalytics(res: any) {
        bonusAnalytics.style.display = 'block'
        bonusAnalytics.innerHTML = ''

        if (!res.dailyStats || res.dailyStats.length === 0) {
            bonusAnalytics.innerHTML = '<p style="color:var(--text-muted); text-align:center;">G\u00fcnl\u00fck veri yok</p>'
            return
        }

        const maxVal = Math.max(...res.dailyStats.map((d: any) => d.totalCount || (d.validCount + d.overtimeCount)), 1)
        const modelCards = (res.modelStats || []).slice(0, 12).map((model: any) => `
            <div style="background:rgba(255,255,255,0.04); border:1px solid var(--glass-border); border-radius:16px; padding:14px 16px;">
                <div style="font-size:0.88rem; font-weight:700; color:var(--text-main); margin-bottom:8px; word-break:break-word;">${model.model}</div>
                <div style="display:flex; justify-content:space-between; gap:12px; font-size:0.78rem; color:var(--text-muted);">
                    <span>Toplam <strong style="color:var(--text-main);">${model.totalCount}</strong></span>
                    <span>\u0130\u00e7i <strong style="color:var(--success);">${model.validCount}</strong></span>
                    <span>D\u0131\u015f\u0131 <strong style="color:var(--warning);">${model.overtimeCount}</strong></span>
                </div>
            </div>
        `).join('')

        bonusAnalytics.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; gap:16px; flex-wrap:wrap;">
                <div>
                    <h2 style="margin:0 0 6px 0;">${res.month} G\u00fcnl\u00fck Da\u011f\u0131l\u0131m</h2>
                    <div style="font-size:0.85rem; color:var(--text-muted);">Mesai i\u00e7i ve mesai d\u0131\u015f\u0131 cihaz giri\u015fleri ayn\u0131 grafik \u00fczerinde.</div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(4, minmax(110px, 1fr)); gap:12px; flex:1; min-width:320px;">
                    <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.18); border-radius:16px; padding:12px 14px;">
                        <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Mesai \u0130\u00e7i</div>
                        <div style="font-size:1.4rem; font-weight:800; color:var(--success);">${res.validCount}</div>
                    </div>
                    <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.18); border-radius:16px; padding:12px 14px;">
                        <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Mesai D\u0131\u015f\u0131</div>
                        <div style="font-size:1.4rem; font-weight:800; color:var(--warning);">${res.overtimeCount}</div>
                    </div>
                    <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.18); border-radius:16px; padding:12px 14px;">
                        <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Toplam</div>
                        <div style="font-size:1.4rem; font-weight:800; color:var(--accent);">${res.totalCount}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.04); border:1px solid var(--glass-border); border-radius:16px; padding:12px 14px;">
                        <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Model \u00c7e\u015fidi</div>
                        <div style="font-size:1.4rem; font-weight:800; color:var(--text-main);">${(res.modelStats || []).length}</div>
                    </div>
                </div>
            </div>
            <div id="bonus-chart" style="display:flex; align-items:flex-end; gap:6px; height:260px; border-bottom:2px solid var(--glass-border); position:relative; margin-bottom:18px;"></div>
            <div style="display:flex; gap:20px; margin-top:16px; justify-content:center; font-size:0.8rem; color:var(--text-muted);">
                <div style="display:flex; align-items:center; gap:6px;"><span style="width:12px; height:12px; border-radius:3px; background:var(--success);"></span> Mesai \u0130\u00e7i</div>
                <div style="display:flex; align-items:center; gap:6px;"><span style="width:12px; height:12px; border-radius:3px; background:var(--warning);"></span> Mesai D\u0131\u015f\u0131</div>
            </div>
            <div style="margin-top:28px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap;">
                    <h3 style="margin:0;">Model Bazl\u0131 Da\u011f\u0131l\u0131m</h3>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Toplam, mesai i\u00e7i ve mesai d\u0131\u015f\u0131 adetleri</div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
                    ${modelCards || '<div style="color:var(--text-muted);">Model verisi bulunamad\u0131.</div>'}
                </div>
            </div>
        `

        const chart = document.getElementById('bonus-chart')!
        res.dailyStats.forEach((day: any, i: number) => {
            const total = day.totalCount || (day.validCount + day.overtimeCount)
            const normalHeight = maxVal > 0 ? (day.validCount / maxVal) * 220 : 0
            const overtimeHeight = maxVal > 0 ? (day.overtimeCount / maxVal) * 220 : 0
            const dayNum = day.date.split('-')[2]

            const group = document.createElement('div')
            group.style.cssText = 'flex:1; min-width:16px; display:flex; flex-direction:column; align-items:center; gap:6px;'
            group.innerHTML = `
                <div title="${day.date} | Mesai \u0130\u00e7i: ${day.validCount} | Mesai D\u0131\u015f\u0131: ${day.overtimeCount} | Toplam: ${total}" style="width:100%; display:flex; flex-direction:column-reverse; align-items:center; border-radius:8px 8px 0 0; cursor:pointer; position:relative; height:0; transition:height 0.6s cubic-bezier(0.175,0.885,0.32,1.275);" class="bar-stack">
                    ${overtimeHeight > 0 ? `<div style="width:100%; height:${overtimeHeight}px; background:var(--warning); opacity:0.9;"></div>` : ''}
                    <div style="width:100%; height:${normalHeight}px; background:var(--success);"></div>
                    <span style="position:absolute; top:-18px; font-size:11px; font-weight:800; color:var(--text-main);">${total}</span>
                </div>
                <div style="font-size:11px; font-weight:600; color:var(--text-muted);">${dayNum}</div>
            `

            chart.appendChild(group)

            setTimeout(() => {
                const stack = group.querySelector('.bar-stack') as HTMLElement
                stack.style.height = `${normalHeight + overtimeHeight}px`
            }, 30 + i * 18)
        })

        bonusAnalytics.scrollIntoView({ behavior: 'smooth' })
    }
}
