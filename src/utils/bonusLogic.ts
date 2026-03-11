export function initBonusLogic(api: any, elements: any) {
    const {
        bonusDropZone,
        bonusFileInput,
        bonusResults,
        bonusAnalytics,
        workStartInput,
        workEndInput
    } = elements

    let lastBonusFilePath = ''

    bonusDropZone.onclick = () => bonusFileInput.click()
    bonusDropZone.ondragover = (e: any) => { e.preventDefault(); bonusDropZone.classList.add('dragover') }
    bonusDropZone.ondragleave = () => bonusDropZone.classList.remove('dragover')
    bonusDropZone.ondrop = async (e: any) => {
        e.preventDefault()
        bonusDropZone.classList.remove('dragover')
        const file = e.dataTransfer?.files[0]
        if (file) {
            lastBonusFilePath = (file as any).path || file.name
            await handleBonusFile(lastBonusFilePath)
        }
    }

    bonusFileInput.onchange = async () => {
        if (bonusFileInput.files && bonusFileInput.files[0]) {
            lastBonusFilePath = (bonusFileInput.files[0] as any).path || bonusFileInput.files[0].name
            await handleBonusFile(lastBonusFilePath)
        }
    }

    workStartInput.onchange = () => { if (lastBonusFilePath) handleBonusFile(lastBonusFilePath) }
    workEndInput.onchange = () => { if (lastBonusFilePath) handleBonusFile(lastBonusFilePath) }

    async function handleBonusFile(path: string) {
        if (!path) return
        bonusResults.innerHTML = '<div style="text-align:center; color:var(--text-muted);">Hesaplanıyor...</div>'
        bonusAnalytics.style.display = 'none'
        try {
            const customHours = { start: workStartInput.value, end: workEndInput.value }
            const results = await api.calculateBonus(path, customHours)
            displayBonusResults(results)
        } catch (err) {
            bonusResults.innerHTML = '<div style="text-align:center; color:#ef4444;">Dosya okunurken hata oluştu.</div>'
        }
    }

    function displayBonusResults(results: any[]) {
        bonusResults.innerHTML = ''
        if (!results || results.length === 0) {
            bonusResults.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Geçerli veri bulunamadı.</p>'
            return
        }
        results.forEach((res: any, index: number) => {
            const card = document.createElement('div')
            card.className = 'result-card'
            card.style.animationDelay = `${index * 0.1}s`

            let statusText = ''
            let statusClass = ''
            if (res.isEligible) {
                statusText = '🏆 Prim Tamam'
                statusClass = 'status-eligible'
            } else {
                const remaining = 850 - res.validCount
                statusText = index === 0 ? `Eksik: ${remaining}` : 'Prim tamamlanamadı'
                statusClass = 'status-pending-badge'
            }

            card.innerHTML = `
                <div class="result-info">
                    <h3>${res.month}</h3>
                    <div class="result-stats">
                        <div class="stat-item">Geçerli: <strong>${res.validCount}</strong></div>
                        <div class="stat-item">Mesai Dışı: <strong>${res.overtimeCount}</strong></div>
                        <div class="stat-item">Toplam: ${res.totalCount}</div>
                    </div>
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
            bonusAnalytics.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Günlük veri yok</p>'
            return
        }
        const maxVal = Math.max(...res.dailyStats.map((d: any) => d.validCount + d.overtimeCount))
        bonusAnalytics.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <div><h2>${res.month} Günlük Dağılım</h2></div>
                <div style="text-align:right;"><div style="font-size:1.5rem; font-weight:800; color:var(--accent);">${res.totalCount}</div><div style="font-size:0.8rem; color:var(--text-muted);">TOPLAM CİHAZ</div></div>
            </div>
            <div id="bonus-chart" style="display:flex; align-items:flex-end; gap:6px; height:240px; border-bottom:2px solid var(--glass-border); position:relative;"></div>
            <div style="display:flex; gap:20px; margin-top:16px; justify-content:center; font-size:0.8rem; color:var(--text-muted);">
                <div style="display:flex; align-items:center; gap:6px;"><span style="width:12px; height:12px; border-radius:3px; background:var(--success);"></span> Mesai İçi</div>
                <div style="display:flex; align-items:center; gap:6px;"><span style="width:12px; height:12px; border-radius:3px; background:var(--warning);"></span> Fazla Mesai</div>
            </div>
        `
        const chart = document.getElementById('bonus-chart')!
        res.dailyStats.forEach((day: any, i: number) => {
            const total = day.validCount + day.overtimeCount
            const nH = maxVal > 0 ? (day.validCount / maxVal) * 220 : 0
            const oH = maxVal > 0 ? (day.overtimeCount / maxVal) * 220 : 0
            const dayNum = day.date.split('-')[2]
            const group = document.createElement('div')
            group.style.cssText = 'flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;'
            group.innerHTML = `
                <div style="width:100%; display:flex; flex-direction:column-reverse; align-items:center; border-radius:4px 4px 0 0; cursor:pointer; position:relative; height:0; transition:height 0.6s cubic-bezier(0.175,0.885,0.32,1.275);" class="bar-stack">
                    ${oH > 0 ? `<div style="width:100%; height:${oH}px; background:var(--warning); opacity:0.8;"></div>` : ''}
                    <div style="width:100%; height:${nH}px; background:var(--success);"></div>
                    <span style="position:absolute; top:-18px; font-size:11px; font-weight:800; color:var(--text-main);">${total}</span>
                </div>
                <div style="font-size:11px; font-weight:600; color:var(--text-muted);">${dayNum}</div>
            `
            chart.appendChild(group)
            setTimeout(() => {
                const stack = group.querySelector('.bar-stack') as HTMLElement
                stack.style.height = `${nH + oH}px`
            }, 30 + i * 20)
        })
        bonusAnalytics.scrollIntoView({ behavior: 'smooth' })
    }
}
