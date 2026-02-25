import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export interface ReportData {
    title: string
    headers: string[]
    rows: any[][]
    fileName: string
}

export function generatePDF(data: ReportData) {
    const doc = new jsPDF()

    // Add Title
    doc.setFontSize(18)
    doc.text(data.title, 14, 22)

    // Add Date
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`, 14, 30)

        // Generate Table
        ; (doc as any).autoTable({
            startY: 35,
            head: [data.headers],
            body: data.rows,
            theme: 'striped',
            headStyles: { fillColor: [56, 189, 248] }, // Accent color
            styles: { font: 'helvetica', fontSize: 10 },
        })

    doc.save(data.fileName)
}
