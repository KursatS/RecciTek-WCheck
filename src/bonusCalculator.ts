import * as XLSX from 'xlsx';
import { format, isValid, parse } from 'date-fns';

export interface ZReportModelDetail {
    model: string;
    count: number;
}

export interface ZReportPersonnelDetail {
    name: string;
    count: number;
}

export interface ZReportDayResult {
    date: string;
    totalCount: number;
    models: ZReportModelDetail[];
    personnel: ZReportPersonnelDetail[];
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

export function parseZReportData(buffer: Buffer): ZReportDayResult[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    if (!rows.length) return [];

    const headers = rows[0] || [];
    const dateIndex = findColumnIndex(headers, ['kayit tarihi', 'kayit zamani', 'olusturma tarihi', 'olusturma zamani'], 14);
    const modelIndex = findColumnIndex(headers, ['model', 'urun modeli', 'cihaz modeli'], 2);
    const personnelIndex = findColumnIndex(headers, ['kayd a an', 'kaydi acan', 'kaydi acan personel', 'kullanici', 'created_by'], 15);

    const dailyAccumulator: Record<string, { total: number; models: Record<string, number>; personnel: Record<string, number> }> = {};

    rows.forEach((row, rowIndex) => {
        if (rowIndex === 0 || !row) return;

        const date = extractDate(row[dateIndex]);
        if (!date) return;

        const dayKey = format(date, 'yyyy-MM-dd');
        let rawModelName = String(row[modelIndex] || 'Model belirtilmedi').trim() || 'Model belirtilmedi';
        const modelName = rawModelName
            .replace(/^ROBOROCK\s+/i, '')
            .replace(/^ROBOROCK$/i, '')
            .replace(/QREVO/gi, 'Q REVO')
            .trim();
        const personnelName = String(row[personnelIndex] || 'Bilinmiyor').trim() || 'Bilinmiyor';

        if (!dailyAccumulator[dayKey]) {
            dailyAccumulator[dayKey] = {
                total: 0,
                models: {},
                personnel: {}
            };
        }

        dailyAccumulator[dayKey].total++;
        dailyAccumulator[dayKey].models[modelName] = (dailyAccumulator[dayKey].models[modelName] || 0) + 1;
        dailyAccumulator[dayKey].personnel[personnelName] = (dailyAccumulator[dayKey].personnel[personnelName] || 0) + 1;
    });

    const sortedDays = Object.keys(dailyAccumulator).sort((a, b) => b.localeCompare(a));
    const last5Days = sortedDays.slice(0, 5);

    return last5Days.map(dayKey => {
        const data = dailyAccumulator[dayKey];
        
        const modelsArray: ZReportModelDetail[] = Object.entries(data.models)
            .map(([model, count]) => ({ model, count }))
            .sort((a, b) => b.count - a.count || a.model.localeCompare(b.model, 'tr'));

        const personnelArray: ZReportPersonnelDetail[] = Object.entries(data.personnel)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr'));

        const parsedDate = parse(dayKey, 'yyyy-MM-dd', new Date());
        const displayDate = isValid(parsedDate) ? format(parsedDate, 'dd.MM.yyyy') : dayKey;

        return {
            date: displayDate,
            totalCount: data.total,
            models: modelsArray,
            personnel: personnelArray
        };
    });
}
