import { Status } from './types';

export const formatCurrency = (amount: number, currency: string) => {
  return `${currency} ${(amount || 0).toLocaleString()}`;
};

export const getTriggerColor = (trigger: string) => {
    if (!trigger) return 'bg-gray-100 text-gray-500';
    const t = trigger.toUpperCase();
    if (t.includes('MANUAL')) return 'bg-slate-800 text-white border border-slate-900';
    if (t.includes('AUTO')) return 'bg-slate-200 text-slate-700 border border-slate-300';
    if (t.includes('PASSED')) return 'bg-red-50 text-red-600 border border-red-100';
    return 'bg-gray-100 text-gray-600';
};

export const getStatusColor = (status: Status) => {
  switch (status) {
    case 'scraped': return 'bg-purple-100 border-purple-200 text-purple-900';
    case 'triggered': return 'bg-[#FFF9C4] border-[#FFF59D] text-yellow-900'; // Light Yellow/Amber
    case 'submitted': return 'bg-blue-100 border-blue-200 text-blue-900';
    case 'passed': return 'bg-red-50 border-red-100 text-red-600';
    case 'too_late': return 'bg-[#B71C1C] border-[#B71C1C] text-white';
    default: return 'bg-gray-50 border-gray-200 text-gray-900';
  }
};

export const getHeaderColor = (status: Status) => {
    switch (status) {
        case 'scraped': return 'bg-purple-50 text-purple-800 border-purple-200';
        case 'triggered': return 'bg-[#FFF9C4] text-yellow-900 border-[#FFF59D]';
        case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'passed': return 'bg-white text-red-600 border-red-100';
        case 'too_late': return 'bg-[#B71C1C] text-white border-[#B71C1C]';
        default: return 'bg-gray-100';
    }
};

export const formatSheetDate = (val: any): string => {
    if (!val) return '';
    try {
        // First try to parse as a standard date object to handle Timezone conversion correctly
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'Europe/Berlin'
            });
        }

        const strVal = String(val);
        // If it's already DD.MM.YYYY, return it (assume it's already formatted)
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(strVal)) return strVal;
        
        // Try to regex parse ISO date (YYYY-MM-DD) if Date() failed
        const isoMatch = strVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            const [_, y, m, d] = isoMatch;
            return `${d}.${m}.${y}`;
        }

        return String(val);
    } catch (e) {
        return String(val);
    }
};

export const formatSheetTime = (val: any): string => {
    if (!val) return '';
    try {
        // First try to parse as a standard date object to handle Timezone conversion correctly
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
            return d.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Europe/Berlin'
            });
        }

        const strVal = String(val);
        
        // Fallback: extract time directly if it looks like ISO but Date failed, 
        // or if it's just a time string.
        // This regex looks for T OR space followed by HH:MM:SS
        const isoTimeMatch = strVal.match(/[T\s](\d{2}):(\d{2}):(\d{2})/);
        if (isoTimeMatch) {
            const [_, h, m, s] = isoTimeMatch;
            return `${h}:${m}:${s}`;
        }

        // If it's just raw HH:MM:SS at start of string
        if (/^\d{2}:\d{2}:\d{2}/.test(strVal)) {
            return strVal.split('.')[0];
        }
        
        return strVal.split('.')[0];
    } catch (e) {
        return String(val);
    }
};

export const parseDisplayDateTime = (dateStr: string, timeStr: string): number => {
    if (!dateStr) return 0;
    // Expect DD.MM.YYYY
    const dParts = dateStr.split('.');
    if (dParts.length !== 3) return 0;
    
    const day = parseInt(dParts[0], 10);
    const month = parseInt(dParts[1], 10) - 1; // JS months are 0-based
    const year = parseInt(dParts[2], 10);
    
    let hour = 0, min = 0, sec = 0;
    if (timeStr) {
        const tParts = timeStr.split(':');
        if (tParts.length >= 2) {
            hour = parseInt(tParts[0], 10);
            min = parseInt(tParts[1], 10);
            if (tParts[2]) sec = parseInt(tParts[2], 10);
        }
    }
    
    return new Date(year, month, day, hour, min, sec).getTime();
};