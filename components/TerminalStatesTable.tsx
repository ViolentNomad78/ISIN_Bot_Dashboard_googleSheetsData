import React from 'react';
import { BondItem } from '../types';

export const TerminalStatesTable = ({ items, onItemClick }: { items: BondItem[], onItemClick: (item: BondItem) => void }) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full min-h-[300px]">
       {/* Header mimics the spreadsheet style mostly, but cleaner */}
       <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed (Passed / Too Late)</h3>
            <span className="text-xs text-gray-400">{items.length} items</span>
       </div>
       {/* Use table-fixed and w-full to prevent horizontal scrolling */}
       <div className="overflow-hidden flex-1 relative">
         <div className="absolute inset-0 overflow-y-auto">
            <table className="w-full text-sm text-left border-collapse table-fixed">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                    <tr className="text-xs text-gray-500 border-b border-gray-200">
                        {/* Removed # Column */}
                        <th className="px-2 py-2 w-28 text-center">Status</th>
                        <th className="px-2 py-2 w-24">Date</th>
                        <th className="px-2 py-2 w-20">Time</th>
                        <th className="px-2 py-2 w-32">ISIN</th>
                        <th className="px-2 py-2 w-auto">Issuer</th>
                        <th className="px-2 py-2 w-24 text-right">Size</th>
                        <th className="px-2 py-2 w-20 text-center">Trigger</th>
                        <th className="px-2 py-2 w-12 text-center">Curr</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => {
                        const isTooLate = item.status === 'too_late';
                        const isPassed = item.status === 'passed';
                        return (
                            <tr 
                                key={item.id} 
                                onClick={() => isPassed && onItemClick(item)}
                                className={`
                                    border-b last:border-0 
                                    ${isTooLate ? 'bg-[#D32F2F] text-white border-[#B71C1C]' : 'bg-white text-gray-800 border-gray-200'}
                                    ${isPassed ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors' : ''}
                                `}
                            >
                                <td className="px-2 py-1.5 text-center">
                                    <div className={`
                                        text-xs px-2 py-0.5 rounded border inline-block w-full text-center
                                        ${isTooLate ? 'bg-[#B71C1C] border-[#8e1c1c] text-white shadow-inner' : 'bg-gray-100 border-gray-300 text-red-500'}
                                    `}>
                                        {isTooLate ? 'too late' : 'passed'}
                                    </div>
                                </td>
                                <td className={`px-2 py-1.5 whitespace-nowrap text-xs ${!isTooLate && 'text-red-500'}`}>{item.date}</td>
                                <td className={`px-2 py-1.5 whitespace-nowrap text-xs ${!isTooLate && 'text-red-500'}`}>{item.time}</td>
                                <td className={`px-2 py-1.5 font-mono text-xs ${!isTooLate && 'text-red-500'}`}>{item.isin}</td>
                                <td className={`px-2 py-1.5 font-medium text-xs truncate ${!isTooLate && 'text-red-500'}`} title={item.issuer}>{item.issuer}</td>
                                <td className={`px-2 py-1.5 text-right font-mono text-xs ${!isTooLate && 'text-red-500'}`}>
                                    {(item.amount || 0).toLocaleString()}
                                </td>
                                <td className="px-2 py-1.5 text-center font-medium text-xs">
                                    {isPassed ? '' : item.listingTrigger}
                                </td>
                                <td className="px-2 py-1.5 text-center font-mono text-xs">
                                    {item.currency}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
         </div>
       </div>
    </div>
  );
};
