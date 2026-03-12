import * as XLSX from 'xlsx';
import { format, isWithinInterval, startOfMonth, compareDesc, isValid, parse } from 'date-fns';

export interface DailyStat {
    date: string;
    validCount: number;
    overtimeCount: number;
}

export interface BonusResult {
    month: string;
    totalCount: number;
    validCount: number;
    overtimeCount: number;
    isEligible: boolean;
    dailyStats: DailyStat[];
}

export function parseBonusData(buffer: Buffer, workingHours: { start: string, end: string }): BonusResult[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    const monthlyStats: {
        [key: string]: {
            total: number,
            valid: number,
            overtime: number,
            date: Date,
            days: { [day: string]: { valid: number, overtime: number } }
        }
    } = {};

    const headers = rows[0] || [];
    let dateIndex = 14; // Default fallback: 'Kayıt Tarihi'

    // Öncelik sırasıyla ara: 1) 'kayıt tarihi' tam eşleşme, 2) 'oluşturma' / 'zaman', 3) col 14 fallback
    const priority1 = headers.findIndex((h: any) => h && h.toString().toLowerCase() === 'kayıt tarihi');
    const priority2 = headers.findIndex((h: any) => h && (h.toString().toLowerCase().includes('kayıt') && h.toString().toLowerCase().includes('tarih')));
    const priority3 = headers.findIndex((h: any) => h && (h.toString().toLowerCase().includes('oluşturma') || h.toString().toLowerCase().includes('zaman')));

    if (priority1 >= 0) dateIndex = priority1;
    else if (priority2 >= 0) dateIndex = priority2;
    else if (priority3 >= 0) dateIndex = priority3;

    const [startH, startM] = workingHours.start.split(':').map(Number);
    const [endH, endM] = workingHours.end.split(':').map(Number);

    rows.forEach((row, rowIndex) => {
        if (rowIndex === 0 || !row) return;

        let date: Date | null = null;

        // Tarih çözümleme fonksiyonu
        const extractDate = (cell: any): Date | null => {
            if (cell === null || cell === undefined || cell === '') return null;

            let d: Date | undefined;

            if (cell instanceof Date) {
                d = cell;
            } else if (typeof cell === 'number') {
                if (cell <= 0) return null;
                const parsed = XLSX.SSF.parse_date_code(cell);
                if (!parsed || !parsed.y) return null;
                d = new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0);
            } else if (typeof cell === 'string') {
                const clean = cell.trim();
                if (!clean || clean.length < 8) return null;

                const parts = clean.split(' ');
                const datePart = parts[0];
                const timePart = parts[1] || '00:00';

                let dateFmt = 'dd.MM.yyyy';
                if (datePart.includes('/')) dateFmt = 'dd/MM/yyyy';
                else if (datePart.includes('-')) dateFmt = 'dd-MM-yyyy';

                const timeFmt = timePart.split(':').length === 3 ? 'HH:mm:ss' : 'HH:mm';
                const fullFmt = `${dateFmt} ${timeFmt}`;

                d = parse(`${datePart} ${timePart}`, fullFmt, new Date());
            } else {
                return null;
            }

            if (!d || !isValid(d) || d.getFullYear() < 2000) return null;
            return d;
        };

        // SADECE 'Kayit Tarihi' kolonuna bak
        date = extractDate(row[dateIndex]);

        if (date) {
            const monthKey = format(date, 'MM-yyyy');
            const dayKey = format(date, 'yyyy-MM-dd');

            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = {
                    total: 0,
                    valid: 0,
                    overtime: 0,
                    date: startOfMonth(date),
                    days: {}
                };
            }

            if (!monthlyStats[monthKey].days[dayKey]) {
                monthlyStats[monthKey].days[dayKey] = { valid: 0, overtime: 0 };
            }

            monthlyStats[monthKey].total++;

            // Çalışma saatleri kontrolü (Aynı günün sınırları içinde)
            const checkDate = new Date(date);
            const startLimit = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate(), startH, startM, 0);
            const endLimit = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate(), endH, endM, 0);

            if (isWithinInterval(date, { start: startLimit, end: endLimit })) {
                monthlyStats[monthKey].valid++;
                monthlyStats[monthKey].days[dayKey].valid++;
            } else {
                monthlyStats[monthKey].overtime++;
                monthlyStats[monthKey].days[dayKey].overtime++;
            }
        }
    });

    const monthNamesTr: { [key: string]: string } = {
        '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan', '05': 'Mayıs', '06': 'Haziran',
        '07': 'Temmuz', '08': 'Ağustos', '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'
    };

    const sortedMonthKeys = Object.keys(monthlyStats).sort((a, b) =>
        compareDesc(monthlyStats[a].date, monthlyStats[b].date)
    );

    const results: BonusResult[] = sortedMonthKeys.map(key => {
        const stats = monthlyStats[key];
        const [m, y] = key.split('-');

        const dailyStats: DailyStat[] = Object.keys(stats.days)
            .sort()
            .map(dKey => ({
                date: dKey,
                validCount: stats.days[dKey].valid,
                overtimeCount: stats.days[dKey].overtime
            }));

        return {
            month: `${monthNamesTr[m]} ${y}`,
            totalCount: stats.total,
            validCount: stats.valid,
            overtimeCount: stats.overtime,
            isEligible: stats.valid >= 850,
            dailyStats
        };
    });

    // Sadece gerçekten birden fazla ay varsa ve en eski veri hatalıysa pop yapın.
    // Ancak 1900 filtresi eklediğimiz için bu pop artık verinizi bozmayacaktır.
    if (results.length > 1) {
        // results.pop(); // Eğer en eski ayı silmek istemiyorsanız burayı yorum satırı yapın.
    }

    return results;
}
