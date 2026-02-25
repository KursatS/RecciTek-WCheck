import { generatePDF } from './reportGenerator'

const dropZone = document.getElementById('drop-zone') as HTMLDivElement
const fileInput = document.getElementById('file-input') as HTMLInputElement
const resultsDiv = document.getElementById('results') as HTMLDivElement
const loading = document.getElementById('loading') as HTMLDivElement

let currentResults: any[] = []

dropZone.onclick = () => fileInput.click()

dropZone.ondragover = (e) => {
    e.preventDefault()
    dropZone.classList.add('dragover')
}

dropZone.ondragleave = () => dropZone.classList.remove('dragover')

dropZone.ondrop = (e) => {
    e.preventDefault()
    dropZone.classList.remove('dragover')
    const file = e.dataTransfer?.files[0]
    if (file) handleFile((file as any).path)
}

fileInput.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) handleFile((file as any).path)
}

async function handleFile(path: string) {
    loading.style.display = 'flex'
    try {
        const results = await (window as any).electronAPI.calculateBonus(path)
        currentResults = results
        displayResults(results)
    } catch (err) {
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
        <button id="export-pdf" class="bg-accent text-slate-900 px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2">
            📄 PDF Raporu Oluştur
        </button>
    `
    resultsDiv.appendChild(headerAction)

    document.getElementById('export-pdf')!.onclick = () => {
        const headers = ['Ay', 'Geçerli', 'Mesai Dışı', 'Toplam', 'Durum']
        const rows = results.map(res => [
            res.month,
            res.validCount,
            res.overtimeCount,
            res.totalCount,
            res.isEligible ? 'TAMAM' : 'EKSİK'
        ])
        generatePDF({
            title: 'Personel Prim Hakediş Raporu',
            headers,
            rows,
            fileName: `Prim_Raporu_${new Date().toLocaleDateString('tr-TR')}.pdf`
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
                <h3 class="text-white font-bold">${res.month}</h3>
                <div class="result-stats flex gap-4 text-sm text-slate-400">
                    <div class="stat-item">Geçerli: <strong class="text-white">${res.validCount}</strong></div>
                    <div class="stat-item">Mesai Dışı: <strong class="text-white">${res.overtimeCount}</strong></div>
                    <div class="stat-item">Toplam: ${res.totalCount}</div>
                </div>
            </div>
            <div class="status-badge ${statusClass} px-4 py-2 rounded-xl font-bold text-xs uppercase">
                ${statusText}
            </div>
        `
        resultsDiv.appendChild(card)
    })
}
