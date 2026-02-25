import * as XLSX from 'xlsx';
import { parse, format, isWithinInterval, setHours, setMinutes, startOfMonth, compareDesc } from 'date-fns';

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

    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const monthlyStats: { [key: string]: { total: number, valid: number, overtime: number, date: Date } } = {};

    rows.forEach(row => {
        const dateCell = row[14];

        if (dateCell && typeof dateCell === 'string') {
            try {
                // date-fns accepts various formats. CRM usually uses dd-MM-yyyy HH:mm or yyyy-MM-dd HH:mm
                // We'll try to parse it safely.
                const formatStr = dateCell.includes('/') ? 'dd/MM/yyyy HH:mm' : 'dd-MM-yyyy HH:mm';
                const date = parse(dateCell, formatStr, new Date());

                if (isNaN(date.getTime())) return; // Skip invalid dates

                const monthKey = format(date, 'MM-yyyy');

                if (!monthlyStats[monthKey]) {
                    monthlyStats[monthKey] = { total: 0, valid: 0, overtime: 0, date: startOfMonth(date) };
                }

                monthlyStats[monthKey].total++;

                // Work hours: 08:00 - 18:30
                const startLimit = setMinutes(setHours(new Date(date), 8), 0);
                const endLimit = setMinutes(setHours(new Date(date), 18), 30);

                if (isWithinInterval(date, { start: startLimit, end: endLimit })) {
                    monthlyStats[monthKey].valid++;
                } else {
                    monthlyStats[monthKey].overtime++;
                }
            } catch (e) {
                // Silently skip rows with unparseable dates
            }
        }
    });

    const results: BonusResult[] = Object.keys(monthlyStats).map(key => {
        const stats = monthlyStats[key];
        const monthNamesTr: { [key: string]: string } = {
            '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan', '05': 'Mayıs', '06': 'Haziran',
            '07': 'Temmuz', '08': 'Ağustos', '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'
        };
        const [m, y] = key.split('-');

        return {
            month: `${monthNamesTr[m]} ${y}`,
            totalCount: stats.total,
            validCount: stats.valid,
            overtimeCount: stats.overtime,
            isEligible: stats.valid >= 850
        };
    });

    // Sort by date descending using date-fns compareDesc
    const sortedKeys = Object.keys(monthlyStats).sort((a, b) =>
        compareDesc(monthlyStats[a].date, monthlyStats[b].date)
    );

    const finalResults = sortedKeys.map(key => {
        const res = results.find(r => {
            const [m, y] = key.split('-');
            const monthNamesTrInv: { [key: string]: string } = {
                'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04', 'Mayis': '05', 'Haziran': '06',
                'Temmuz': '07', 'Ağustos': '08', 'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12'
            };
            return r.month.includes(y) && key.startsWith(m);
        });
        return res!;
    });

    // Remove the oldest month as per the rule
    if (finalResults.length > 1) {
        finalResults.pop();
    }

    return finalResults;
}
