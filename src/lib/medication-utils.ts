import { MasterUnit, MasterUsageInstruction } from '@/services/master-data.service';

interface MedicationUsage {
    amount: string;
    unit?: MasterUnit | null;
    frequency?: MasterUsageInstruction | null;
    time?: MasterUsageInstruction | null;
    morning?: boolean;
    noon?: boolean;
    evening?: boolean;
    night?: boolean;
    remark?: string;
}

export function formatMedicationUsage(usage: MedicationUsage, lang: 'th' | 'en' = 'th'): string {
    const { amount, unit, frequency, time, morning, noon, evening, night, remark } = usage;

    if (lang === 'en') {
        let text = `Take ${amount || ''} ${unit?.nameEn || unit?.nameTh || ''}`;

        if (frequency) {
            text += ` ${frequency.nameEn || frequency.nameTh}`;
        }

        const periods = [];
        if (morning) periods.push('Morning');
        if (noon) periods.push('Noon');
        if (evening) periods.push('Evening');
        if (night) periods.push('Before Bed');

        if (periods.length > 0) {
            text += ` (${periods.join(', ')})`;
        }

        if (time) {
            text += ` ${time.nameEn || time.nameTh}`;
        }

        if (remark) {
            text += ` - Note: ${remark}`;
        }

        return text;
    } else {
        // Thai version
        let text = `รับประทานครั้งละ ${amount || ''} ${unit?.nameTh || ''}`;

        if (frequency) {
            text += ` ${frequency.nameTh}`;
        }

        const periods = [];
        if (morning) periods.push('เช้า');
        if (noon) periods.push('กลางวัน');
        if (evening) periods.push('เย็น');
        if (night) periods.push('ก่อนนอน');

        if (periods.length > 0) {
            text += ` (${periods.join(', ')})`;
        }

        if (time) {
            text += ` ${time.nameTh}`;
        }

        if (remark) {
            text += ` - หมายเหตุ: ${remark}`;
        }

        return text;
    }
}
