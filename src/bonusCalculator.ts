import * as XLSX from 'xlsx';

export interface BonusResult {
    month: string;
    totalCount: number;
    validCount: number;
    overtimeCount: number;
    isEligible: boolean;
}

export function parseBonusData(buffer: Buffer): BonusResult[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Raw veri için array of arrays formatına çeviriyoruz
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const monthlyStats: { [key: string]: { total: number, valid: number, overtime: number } } = {};

    rows.forEach(row => {
        // "O" sütunu 14. indekstir. Doğrudan bu hücredeki veriyi kontrol ediyoruz.
        const dateCell = row[14]; 

        // Hücrenin string olduğundan ve beklenen tarih formatına uyduğundan emin oluyoruz
        if (dateCell && typeof dateCell === 'string' && /\d{2,4}[-/]\d{2}[-/]\d{2,4}\s\d{2}:\d{2}/.test(dateCell)) {
            const [datePart, timePart] = dateCell.split(' ');
            const [hours, minutes] = timePart.split(':').map(Number);

            // Tarihi "Ay-Yıl" (02-2026) şeklinde grupluyoruz
            const [day, month, year] = datePart.includes('-') ? datePart.split('-') : datePart.split('/');
            const monthKey = `${month}-${year}`;

            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = { total: 0, valid: 0, overtime: 0 };
            }

            monthlyStats[monthKey].total++;

            // Çalışma saatleri (İstediğiniz gibi değiştirilmedi): 08:00 - 18:30
            const minutesSinceMidnight = hours * 60 + minutes;
            const startLimit = 8 * 60; // 08:00
            const endLimit = 18 * 60 + 30; // 18:30

            if (minutesSinceMidnight >= startLimit && minutesSinceMidnight <= endLimit) {
                monthlyStats[monthKey].valid++;
            } else {
                monthlyStats[monthKey].overtime++;
            }
        }
    });

    const results: BonusResult[] = Object.keys(monthlyStats).map(key => {
        const stats = monthlyStats[key];
        const [m, y] = key.split('-');
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

        return {
            month: `${monthNames[parseInt(m) - 1]} ${y}`,
            totalCount: stats.total,
            validCount: stats.valid,
            overtimeCount: stats.overtime,
            isEligible: stats.valid >= 850
        };
    });

    // Tarihe göre sırala (Azalan)
    const sortedResults = results.sort((a, b) => {
        const dateA = new Date(parseInt(a.month.split(' ')[1]), monthToNum(a.month.split(' ')[0]));
        const dateB = new Date(parseInt(b.month.split(' ')[1]), monthToNum(b.month.split(' ')[0]));
        return dateB.getTime() - dateA.getTime();
    });

    // Eksik veri olma ihtimaline karşı en eski ayı listeden çıkar (TS mantığındaki kural)
    if (sortedResults.length > 1) {
        sortedResults.pop();
    }

    return sortedResults;
}

function monthToNum(monthName: string): number {
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    return months.indexOf(monthName);
}
