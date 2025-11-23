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
        // If it's already DD.MM.YYYY, return it
        if (typeof val === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(val)) return val;
        
        // Handle ISO string or Date object
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);

        return d.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return String(val);
    }
};

export const formatSheetTime = (val: any): string => {
    if (!val) return '';
    try {
        // Handle ISO string (often 1899-12-30T... from Sheets time columns)
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
            return d.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
        
        // If it's a raw string like "14:30:00", just return it
        return String(val).split('.')[0]; // remove milliseconds if present in string
    } catch (e) {
        return String(val);
    }
};