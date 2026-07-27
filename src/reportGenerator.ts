import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export interface ReportData {
    title: string
    headers: string[]
    rows: any[][]
    fileName: string
    monthlyData?: any[] // For chart drawing
}

// Turkish character map for transliteration (jsPDF default fonts lack Turkish glyphs)
function trSafe(text: string): string {
    const map: Record<string, string> = {
        'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G',
        'ü': 'u', 'Ü': 'U', 'ş': 's', 'Ş': 'S',
        'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
    }
    return text.replace(/[ıİğĞüÜşŞöÖçÇ]/g, c => map[c] || c)
}

export function generatePDF(data: ReportData) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // ── Header Bar ──
    doc.setFillColor(15, 23, 42) // Dark navy
    doc.rect(0, 0, pageWidth, 40, 'F')

    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(trSafe(data.title), pageWidth / 2, 18, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184) // Muted
    doc.text(trSafe(`Olusturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`), pageWidth / 2, 30, { align: 'center' })

    // ── Summary Statistics ──
    if (data.monthlyData && data.monthlyData.length > 0) {
        const totalDevices = data.monthlyData.reduce((a: number, m: any) => a + m.totalCount, 0)
        const totalValid = data.monthlyData.reduce((a: number, m: any) => a + m.validCount, 0)
        const totalOvertime = data.monthlyData.reduce((a: number, m: any) => a + m.overtimeCount, 0)
        const eligibleCount = data.monthlyData.filter((m: any) => m.isEligible).length

        const statsY = 50
        const boxW = (pageWidth - 28) / 4 // 4 stat boxes
        const boxH = 28

        const stats = [
            { label: 'TOPLAM CIHAZ', value: String(totalDevices), color: [56, 189, 248] },
            { label: 'MESAI ICI', value: String(totalValid), color: [16, 185, 129] },
            { label: 'FAZLA MESAI', value: String(totalOvertime), color: [245, 158, 11] },
            { label: 'PRIM AYI', value: `${eligibleCount}/${data.monthlyData.length}`, color: [139, 92, 246] },
        ]

        stats.forEach((stat, i) => {
            const x = 14 + i * (boxW + 2)
            doc.setFillColor(30, 41, 59)
            doc.roundedRect(x, statsY, boxW - 2, boxH, 4, 4, 'F')

            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(stat.color[0], stat.color[1], stat.color[2])
            doc.text(stat.value, x + (boxW - 2) / 2, statsY + 12, { align: 'center' })

            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(148, 163, 184)
            doc.text(stat.label, x + (boxW - 2) / 2, statsY + 20, { align: 'center' })
        })

        // ── Mini Bar Chart ──
        const chartY = statsY + boxH + 10
        const chartW = pageWidth - 28
        const chartH = 50
        const barCount = data.monthlyData.length
        const barW = Math.min(30, chartW / barCount - 4)
        const maxVal = Math.max(...data.monthlyData.map((m: any) => m.totalCount))

        doc.setFillColor(30, 41, 59)
        doc.roundedRect(14, chartY, chartW, chartH + 20, 4, 4, 'F')

        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(trSafe('Aylik Performans Grafigi'), 20, chartY + 10)

        data.monthlyData.forEach((m: any, i: number) => {
            const x = 20 + i * (chartW / barCount)
            const barMaxH = chartH - 5

            // Valid bar (green)
            const validH = maxVal > 0 ? (m.validCount / maxVal) * barMaxH : 0
            doc.setFillColor(16, 185, 129)
            doc.rect(x, chartY + 15 + (barMaxH - validH), barW * 0.45, validH, 'F')

            // Overtime bar (orange)
            const otH = maxVal > 0 ? (m.overtimeCount / maxVal) * barMaxH : 0
            doc.setFillColor(245, 158, 11)
            doc.rect(x + barW * 0.5, chartY + 15 + (barMaxH - otH), barW * 0.45, otH, 'F')

            // Month label
            doc.setFontSize(7)
            doc.setTextColor(148, 163, 184)
            const monthShort = trSafe(m.month.split(' ')[0].substring(0, 3))
            doc.text(monthShort, x + barW * 0.25, chartY + chartH + 12, { align: 'center' })
        })

            // Table starts after chart
            ; (doc as any).autoTable({
                startY: chartY + chartH + 25,
                head: [data.headers.map(trSafe)],
                body: data.rows.map(row => row.map((cell: any) => trSafe(String(cell)))),
                theme: 'grid',
                headStyles: {
                    fillColor: [15, 23, 42],
                    textColor: [56, 189, 248],
                    fontStyle: 'bold',
                    halign: 'center',
                    fontSize: 10
                },
                bodyStyles: {
                    halign: 'center',
                    fontSize: 9
                },
                alternateRowStyles: {
                    fillColor: [241, 245, 249]
                },
                columnStyles: {
                    4: {
                        fontStyle: 'bold'
                    }
                }
            })
    } else {
        // Fallback: simple table
        ; (doc as any).autoTable({
            startY: 50,
            head: [data.headers.map(trSafe)],
            body: data.rows.map(row => row.map((cell: any) => trSafe(String(cell)))),
            theme: 'striped',
            headStyles: { fillColor: [56, 189, 248] },
            styles: { font: 'helvetica', fontSize: 10 },
        })
    }

    // ── Footer ──
    const pageH = doc.internal.pageSize.getHeight()
    doc.setFillColor(15, 23, 42)
    doc.rect(0, pageH - 12, pageWidth, 12, 'F')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text('RecciTek WCheck - Prim Raporu', pageWidth / 2, pageH - 4, { align: 'center' })

    doc.save(data.fileName)
}
