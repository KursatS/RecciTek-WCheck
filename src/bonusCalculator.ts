import * as XLSX from 'xlsx';
import { compareDesc, format, isValid, isWithinInterval, parse, startOfMonth } from 'date-fns';

export interface DailyStat {
    date: string;
    validCount: number;
    overtimeCount: number;
    totalCount: number;
}

export interface ModelStat {
    model: string;
    totalCount: number;
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
    modelStats: ModelStat[];
}

interface MonthlyAccumulator {
    total: number;
    valid: number;
    overtime: number;
    date: Date;
    days: Record<string, { valid: number; overtime: number }>;
    models: Record<string, { total: number; valid: number; overtime: number }>;
}

const MONTH_NAMES_TR: Record<string, string> = {
    '01': 'Ocak',
    '02': '\u015eubat',
    '03': 'Mart',
    '04': 'Nisan',
    '05': 'May\u0131s',
    '06': 'Haziran',
    '07': 'Temmuz',
    '08': 'A\u011fustos',
    '09': 'Eyl\u00fcl',
    '10': 'Ekim',
    '11': 'Kas\u0131m',
    '12': 'Aral\u0131k'
}

const DATE_FORMATS = [
    'dd-MM-yyyy HH:mm:ss',
    'dd-MM-yyyy HH:mm',
    'dd.MM.yyyy HH:mm:ss',
    'dd.MM.yyyy HH:mm',
    'dd/MM/yyyy HH:mm:ss',
    'dd/MM/yyyy HH:mm',
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd HH:mm',
    'yyyy/MM/dd HH:mm:ss',
    'yyyy/MM/dd HH:mm',
    'dd-MM-yyyy',
    'dd.MM.yyyy',
    'dd/MM/yyyy',
    'yyyy-MM-dd',
    'yyyy/MM/dd'
];

function normalizeHeader(value: unknown): string {
    return String(value || '')
        .toLocaleLowerCase('tr-TR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function findColumnIndex(headers: any[], variants: string[], fallbackIndex: number): number {
    const normalizedHeaders = headers.map(normalizeHeader);

    for (const variant of variants) {
        const exactIndex = normalizedHeaders.findIndex(header => header === variant);
        if (exactIndex >= 0) return exactIndex;
    }

    for (const variant of variants) {
        const tokens = variant.split(' ').filter(Boolean);
        const partialIndex = normalizedHeaders.findIndex(header => tokens.every(token => header.includes(token)));
        if (partialIndex >= 0) return partialIndex;
    }

    return fallbackIndex;
}

function extractDate(cell: any): Date | null {
    if (cell === null || cell === undefined || cell === '') return null;

    let parsedDate: Date | null = null;

    if (cell instanceof Date) {
        parsedDate = cell;
    } else if (typeof cell === 'number') {
        if (cell <= 0) return null;
        const parsed = XLSX.SSF.parse_date_code(cell);
        if (!parsed || !parsed.y) return null;
        parsedDate = new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0);
    } else if (typeof cell === 'string') {
        const clean = cell.trim();
        if (!clean || clean.length < 8) return null;

        for (const dateFormat of DATE_FORMATS) {
            const candidate = parse(clean, dateFormat, new Date());
            if (isValid(candidate)) {
                parsedDate = candidate;
                break;
            }
        }

        if (!parsedDate) {
            const nativeParsed = new Date(clean);
            if (isValid(nativeParsed)) {
                parsedDate = nativeParsed;
            }
        }
    }

    if (!parsedDate || !isValid(parsedDate)) return null;

    const currentYear = new Date().getFullYear();
    if (parsedDate.getFullYear() < 2020 || parsedDate.getFullYear() > currentYear + 1) {
        return null;
    }

    return parsedDate;
}

function ensureMonthAccumulator(monthlyStats: Record<string, MonthlyAccumulator>, key: string, date: Date): MonthlyAccumulator {
    if (!monthlyStats[key]) {
        monthlyStats[key] = {
            total: 0,
            valid: 0,
            overtime: 0,
            date: startOfMonth(date),
            days: {},
            models: {}
        };
    }

    return monthlyStats[key];
}

function ensureDayAccumulator(stats: MonthlyAccumulator, dayKey: string) {
    if (!stats.days[dayKey]) {
        stats.days[dayKey] = { valid: 0, overtime: 0 };
    }

    return stats.days[dayKey];
}

function ensureModelAccumulator(stats: MonthlyAccumulator, modelName: string) {
    if (!stats.models[modelName]) {
        stats.models[modelName] = { total: 0, valid: 0, overtime: 0 };
    }

    return stats.models[modelName];
}

export function parseBonusData(buffer: Buffer, workingHours: { start: string, end: string }): BonusResult[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    if (!rows.length) return [];

    const headers = rows[0] || [];
    const dateIndex = findColumnIndex(headers, ['kayit tarihi', 'kayit zamani', 'olusturma tarihi', 'olusturma zamani'], 14);
    const modelIndex = findColumnIndex(headers, ['model', 'urun modeli', 'cihaz modeli'], 2);

    const [startH, startM] = workingHours.start.split(':').map(Number);
    const [endH, endM] = workingHours.end.split(':').map(Number);

    const monthlyStats: Record<string, MonthlyAccumulator> = {};

    rows.forEach((row, rowIndex) => {
        if (rowIndex === 0 || !row) return;

        const date = extractDate(row[dateIndex]);
        if (!date) return;

        const monthKey = format(date, 'MM-yyyy');
        const dayKey = format(date, 'yyyy-MM-dd');
        const stats = ensureMonthAccumulator(monthlyStats, monthKey, date);
        const dayStats = ensureDayAccumulator(stats, dayKey);

        const modelName = String(row[modelIndex] || 'Model belirtilmedi').trim() || 'Model belirtilmedi';
        const modelStats = ensureModelAccumulator(stats, modelName);

        stats.total++;
        modelStats.total++;

        const startLimit = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startH, startM, 0);
        const endLimit = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endH, endM, 59);
        const isWorkingHours = isWithinInterval(date, { start: startLimit, end: endLimit });

        if (isWorkingHours) {
            stats.valid++;
            dayStats.valid++;
            modelStats.valid++;
        } else {
            stats.overtime++;
            dayStats.overtime++;
            modelStats.overtime++;
        }
    });

    const sortedMonthKeys = Object.keys(monthlyStats).sort((a, b) =>
        compareDesc(monthlyStats[a].date, monthlyStats[b].date)
    );

    return sortedMonthKeys.map(key => {
        const stats = monthlyStats[key];
        const [monthNumber, year] = key.split('-');

        const dailyStats: DailyStat[] = Object.keys(stats.days)
            .sort()
            .map(dayKey => ({
                date: dayKey,
                validCount: stats.days[dayKey].valid,
                overtimeCount: stats.days[dayKey].overtime,
                totalCount: stats.days[dayKey].valid + stats.days[dayKey].overtime
            }));

        const modelStats: ModelStat[] = Object.entries(stats.models)
            .map(([model, modelStats]) => ({
                model,
                totalCount: modelStats.total,
                validCount: modelStats.valid,
                overtimeCount: modelStats.overtime
            }))
            .sort((a, b) => b.totalCount - a.totalCount || b.validCount - a.validCount || a.model.localeCompare(b.model, 'tr'));

        return {
            month: `${MONTH_NAMES_TR[monthNumber] || monthNumber} ${year}`,
            totalCount: stats.total,
            validCount: stats.valid,
            overtimeCount: stats.overtime,
            isEligible: stats.valid >= 850,
            dailyStats,
            modelStats
        };
    });
}
