import { generatePDF } from './reportGenerator'

const dropZone = document.getElementById('drop-zone') as HTMLDivElement
const fileInput = document.getElementById('file-input') as HTMLInputElement
const resultsDiv = document.getElementById('results') as HTMLDivElement
const loading = document.getElementById('loading') as HTMLDivElement
const analyticsPanel = document.getElementById('analytics') as HTMLDivElement
const chartContainer = document.getElementById('day-chart') as HTMLDivElement
const chartTitle = document.getElementById('chart-title') as HTMLHeadingElement
const monthTotal = document.getElementById('month-total') as HTMLDivElement

const workStart = document.getElementById('work-start') as HTMLInputElement
const workEnd = document.getElementById('work-end') as HTMLInputElement

let currentResults: any[] = []
let lastFilePath: string = ''

dropZone.onclick = () => fileInput.click()

dropZone.ondragover = (e) => {
    e.preventDefault()
    dropZone.classList.add('dragover')
}

dropZone.ondragleave = () => dropZone.classList.remove('dragover')

dropZone.ondrop = async (e) => {
    e.preventDefault()
    dropZone.classList.remove('dragover')
    const file = e.dataTransfer?.files[0]
    if (file) {
        const path = await (window as any).electronAPI.getPathForFile(file)
        lastFilePath = path
        handleFile(path)
    }
}

fileInput.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
        const path = await (window as any).electronAPI.getPathForFile(file)
        lastFilePath = path
        handleFile(path)
    }
}

// Reactive recalculation
const triggerRecalculate = () => {
    if (lastFilePath) handleFile(lastFilePath)
}

workStart.onchange = triggerRecalculate
workEnd.onchange = triggerRecalculate

async function handleFile(path: string) {
    if (!path) return
    loading.style.display = 'flex'
    resultsDiv.innerHTML = ''
    analyticsPanel.style.display = 'none'

    try {
        const customHours = { start: workStart.value, end: workEnd.value }
        const results = await (window as any).electronAPI.calculateBonus(path, customHours)
        currentResults = results
        displayResults(results)
    } catch (err) {
        console.error(err)
        alert('Dosya okunurken bir hata oluştu. Lütfen formatı kontrol edin.')
    } finally {
        loading.style.display = 'none'
    }
}

function displayResults(results: any[]) {
    resultsDiv.innerHTML = ''
    if (results.length === 0) {
        resultsDiv.innerHTML = `<p style="text-align: center; color: var(--text-muted)">Geçerli veri bulunamadı.</p>`
        return
    }

    // Add PDF Export Button
    const headerAction = document.createElement('div')
    headerAction.className = 'flex justify-end mb-4'
    headerAction.innerHTML = `
        <button id="export-pdf" style="background: var(--accent); color: #0f172a; padding: 10px 20px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-bottom: 20px; margin-left: auto;">
            <span>📄</span> PDF Raporu Oluştur
        </button>
    `
    resultsDiv.appendChild(headerAction)

    const exportBtn = document.getElementById('export-pdf')!;
    exportBtn.onclick = (e) => {
        e.stopPropagation();
        const headers = ['Ay', 'Gecerli', 'Mesai Disi', 'Toplam', 'Durum']
        const rows = results.map(res => [
            res.month,
            res.validCount,
            res.overtimeCount,
            res.totalCount,
            res.isEligible ? 'TAMAM' : 'EKSIK'
        ])
        generatePDF({
            title: 'Personel Prim Hakedis Raporu',
            headers,
            rows,
            fileName: `Prim_Raporu_${new Date().toLocaleDateString('tr-TR')}.pdf`,
            monthlyData: results
        })
    }

    results.forEach((res, index) => {
        const card = document.createElement('div')
        card.className = 'result-card'
        card.style.animationDelay = `${index * 0.1}s`

        let statusText = ''
        let statusClass = ''

        if (res.isEligible) {
            statusText = '🏆 Prim Tamam'
            statusClass = 'status-eligible'
        } else {
            if (index === 0) {
                const remaining = 850 - res.validCount
                statusText = `Eksik: ${remaining}`
                statusClass = 'status-pending'
            } else {
                statusText = 'Prim tamamlanamadı'
                statusClass = 'status-pending'
            }
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
            <div class="status-badge ${statusClass}">
                ${statusText}
            </div>
        `

        card.onclick = () => {
            document.querySelectorAll('.result-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            showAnalytics(res);
        }

        resultsDiv.appendChild(card)

        // Auto-select first month
        if (index === 0) card.click();
    })
}

function showAnalytics(res: any) {
    analyticsPanel.style.display = 'block';
    chartTitle.textContent = `${res.month} Günlük Dağılım`;
    monthTotal.textContent = String(res.totalCount);

    chartContainer.innerHTML = '';

    if (!res.dailyStats || res.dailyStats.length === 0) {
        chartContainer.innerHTML = '<p style="color: var(--text-muted); width: 100%; text-align: center;">Veri yok</p>';
        return;
    }

    const maxVal = Math.max(...res.dailyStats.map((d: any) => d.validCount + d.overtimeCount));

    // ── Y-Axis Labels ──
    const yAxis = document.createElement('div');
    yAxis.style.cssText = 'display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;padding-right:8px;font-size:10px;font-weight:600;color:var(--text-muted);height:240px;';
    yAxis.innerHTML = `<span>${maxVal}</span><span>${Math.round(maxVal / 2)}</span><span>0</span>`;
    chartContainer.insertBefore(yAxis, chartContainer.firstChild);

    res.dailyStats.forEach((day: any, i: number) => {
        const dayTotal = day.validCount + day.overtimeCount;

        // Relative heights for stacked bars
        const normalHeight = maxVal > 0 ? (day.validCount / maxVal) * 240 : 0;
        const overtimeHeight = maxVal > 0 ? (day.overtimeCount / maxVal) * 240 : 0;

        const group = document.createElement('div');
        group.className = 'day-bar-group';

        const dayNum = day.date.split('-')[2];

        group.innerHTML = `
            <div class="bar-stack" data-total="${dayTotal}" style="height: 0px; position: relative;">
                ${overtimeHeight > 0 ? `<div class="day-bar bar-overtime" style="height: ${overtimeHeight}px"></div>` : ''}
                <div class="day-bar bar-normal" style="height: ${normalHeight}px"></div>
                <span class="bar-tooltip">${dayTotal}</span>
            </div>
            <div class="day-label">${dayNum}</div>
        `;

        chartContainer.appendChild(group);

        // Trigger animation
        setTimeout(() => {
            const stack = group.querySelector('.bar-stack') as HTMLElement;
            stack.style.height = `${normalHeight + overtimeHeight}px`;
        }, 30 + i * 20);
    });
    // ── Daily Target Reference Line ──
    const numDays = res.dailyStats.length;
    const dailyTarget = Math.ceil(850 / numDays);
    const targetPx = maxVal > 0 ? (dailyTarget / maxVal) * 240 : 0;

    if (targetPx > 0 && targetPx <= 300) {
        const line = document.createElement('div');
        line.className = 'target-line';
        line.style.bottom = `${targetPx}px`;
        line.innerHTML = `<span class="target-line-label">Hedef: ${dailyTarget}/gün</span>`;
        chartContainer.appendChild(line);
    }

    analyticsPanel.scrollIntoView({ behavior: 'smooth' });
}
