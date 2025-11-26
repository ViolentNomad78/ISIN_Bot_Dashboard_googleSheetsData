import React, { useState } from 'react';
import { BondItem } from '../types';
import { getStatusColor } from '../utils';
import { Icons } from '../Icons';

export const ListView = ({ items }: { items: BondItem[] }) => {
    // Default to 'date' descending (newest first)
    const [sortField, setSortField] = useState<keyof BondItem>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: keyof BondItem) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
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

    const renderSortIndicator = (field: keyof BondItem) => {
        if (sortField !== field) return <div className="w-4 h-4" />;
        return (
            <div className="text-gray-500">
                {sortDirection === 'asc' ? <Icons.ArrowUp /> : <Icons.ArrowDown />}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-auto flex-1">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('status')}>
                                <div className="flex items-center gap-1">
                                    Status {renderSortIndicator('status')}
                                </div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('date')}>
                                <div className="flex items-center gap-1">
                                    Email Date/Time {renderSortIndicator('date')}
                                </div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('isin')}>
                                <div className="flex items-center gap-1">
                                    ISIN {renderSortIndicator('isin')}
                                </div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('issuer')}>
                                <div className="flex items-center gap-1">
                                    Issuer {renderSortIndicator('issuer')}
                                </div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('currency')}>
                                <div className="flex items-center gap-1">
                                    Currency {renderSortIndicator('currency')}
                                </div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none text-right" onClick={() => handleSort('minSize')}>
                                <div className="flex items-center justify-end gap-1">
                                    Min. Size {renderSortIndicator('minSize')}
                                </div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('type')}>
                                <div className="flex items-center gap-1">
                                    Type {renderSortIndicator('type')}
                                </div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('listingTrigger')}>
                                <div className="flex items-center gap-1">
                                    Trigger {renderSortIndicator('listingTrigger')}
                                </div>
                            </th>
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
