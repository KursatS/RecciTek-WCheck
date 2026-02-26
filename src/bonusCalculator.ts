import * as XLSX from 'xlsx';
import { parse, format, isWithinInterval, setHours, setMinutes, startOfMonth, compareDesc } from 'date-fns';

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

    // Read rows as JSON to handle column index issues more robustly if needed
    // But we stay with header: 1 for performance if format is fixed
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const monthlyStats: {
        [key: string]: {
            total: number,
            valid: number,
            overtime: number,
            date: Date,
            days: { [day: string]: { valid: number, overtime: number } }
        }
    } = {};

    const [startH, startM] = workingHours.start.split(':').map(Number);
    const [endH, endM] = workingHours.end.split(':').map(Number);

    rows.forEach(row => {
        let dateCell = row[14]; // Adjust index if necessary based on CRM export

        if (dateCell) {
            let date: Date;
            try {
                if (dateCell instanceof Date) {
                    date = dateCell;
                } else if (typeof dateCell === 'string') {
                    const formatStr = dateCell.includes('/') ? 'dd/MM/yyyy HH:mm' : 'dd-MM-yyyy HH:mm';
                    date = parse(dateCell, formatStr, new Date());
                } else if (typeof dateCell === 'number') {
                    // Excel serial date
                    date = XLSX.SSF.parse_date_code(dateCell) as any;
                    date = new Date(Date.UTC((date as any).y, (date as any).m - 1, (date as any).d, (date as any).H, (date as any).M, (date as any).S));
                } else {
                    return;
                }

                if (isNaN(date.getTime())) return;

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

                // Work hours limits
                const startLimit = setMinutes(setHours(new Date(date), startH), startM);
                const endLimit = setMinutes(setHours(new Date(date), endH), endM);

                if (isWithinInterval(date, { start: startLimit, end: endLimit })) {
                    monthlyStats[monthKey].valid++;
                    monthlyStats[monthKey].days[dayKey].valid++;
                } else {
                    monthlyStats[monthKey].overtime++;
                    monthlyStats[monthKey].days[dayKey].overtime++;
                }
            } catch (e) {
                // Silently skip
            }
        }
    });

    const monthNamesTr: { [key: string]: string } = {
        '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan', '05': 'Mayıs', '06': 'Haziran',
        '07': 'Temmuz', '08': 'Ağustos', '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'
    };

    // Build results list sorted by date descending
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

    // Remove the oldest month rule
    if (results.length > 1) {
        results.pop();
    }

    return results;
}
