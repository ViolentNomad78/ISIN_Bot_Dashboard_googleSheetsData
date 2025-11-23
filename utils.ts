import { Status } from './types';

export const formatCurrency = (amount: number, currency: string) => {
  return `${currency} ${(amount || 0).toLocaleString()}`;
};

export const getStatusColor = (status: Status) => {
  switch (status) {
    case 'scraped': return 'bg-purple-50 border-purple-200 text-purple-900';
    case 'triggered': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    case 'submitted': return 'bg-blue-50 border-blue-200 text-blue-900';
    case 'passed': return 'bg-white border-red-200 text-red-600';
    case 'too_late': return 'bg-red-500 border-red-600 text-white';
    default: return 'bg-gray-50 border-gray-200 text-gray-900';
  }
};

export const getHeaderColor = (status: Status) => {
    switch (status) {
        case 'scraped': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'triggered': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'passed': return 'bg-white text-red-600 border-red-100';
        case 'too_late': return 'bg-red-600 text-white border-red-700';
        default: return 'bg-gray-100';
    }
};
