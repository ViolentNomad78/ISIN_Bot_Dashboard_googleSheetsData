import React, { useState } from 'react';
import { BondItem } from '../types';
import { getStatusColor } from '../utils';

export const ListView = ({ items }: { items: BondItem[] }) => {
    const [sortField, setSortField] = useState<keyof BondItem>('time');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: keyof BondItem) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Helper to format the size with dots (de-DE) if it is a plain number
    const formatSize = (val: string | number | undefined, fallback: number) => {
        // If we have a valid minSize string/number, use it
        if (val !== undefined && val !== null && String(val).trim() !== '') {
             const strVal = String(val);
             // If the string is purely numeric (digits, optionally a dot for decimals), format it.
             // This avoids messing up strings like "100k" or "100k x 1k".
             if (/^\d+(\.\d+)?$/.test(strVal)) {
                 return parseFloat(strVal).toLocaleString('de-DE');
             }
             return strVal;
        }
        // Fallback to amount if minSize is missing
        if (fallback !== undefined && fallback !== null) {
            return fallback.toLocaleString('de-DE');
        }
        return '';
    };

    const sortedItems = [...items].sort((a, b) => {
        // Special handling for sorting by Date when Date and Time are combined conceptually
        if (sortField === 'date') {
            // Parse DD.MM.YYYY to YYYY-MM-DD for string comparison
            const parseDate = (d: string) => d.split('.').reverse().join('-');
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            
            if (dateA !== dateB) {
                return sortDirection === 'asc' ? (dateA < dateB ? -1 : 1) : (dateA > dateB ? -1 : 1);
            }
            // If dates match, sort by time
            return sortDirection === 'asc' ? (a.time < b.time ? -1 : 1) : (a.time > b.time ? -1 : 1);
        }

        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (aVal === undefined && bVal === undefined) return 0;
        if (aVal === undefined) return 1;
        if (bVal === undefined) return -1;

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-auto flex-1">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>Status</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date')}>Email Date/Time</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('isin')}>ISIN</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('issuer')}>Issuer</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('currency')}>Currency</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('minSize')}>Min. Size</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100">Type</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100">Trigger</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedItems.map((item) => (
                            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.status)}`}>
                                        {item.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{item.date}</span>
                                        <span className="text-xs text-gray-400">{item.time}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono font-medium text-blue-600">{item.isin}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{item.issuer}</td>
                                <td className="px-6 py-4 font-mono text-gray-900">{item.currency}</td>
                                <td className="px-6 py-4 text-right font-mono text-gray-900">
                                    {formatSize(item.minSize, item.amount)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded border border-gray-200">
                                        {item.type || '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-blue-50 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-200">
                                        {item.listingTrigger || '-'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};