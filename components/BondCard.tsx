import React from 'react';
import { BondItem } from '../types';
import { Icons } from '../Icons';

export const BondCard = ({ item, onClick }: { item: BondItem, onClick: (item: BondItem) => void }) => {
  const isTooLate = item.status === 'too_late';
  
  return (
    <div 
      onClick={() => onClick(item)}
      className={`
        p-3 mb-3 rounded-lg border shadow-sm transition-all hover:shadow-md cursor-pointer hover:scale-[1.02] active:scale-100
        ${isTooLate ? 'bg-red-500 text-white border-red-600' : 'bg-white border-gray-200 hover:border-gray-300'}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-1">
            {/* Trigger First, then Status */}
            {item.listingTrigger && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isTooLate ? 'bg-red-700 text-white' : 'bg-blue-100 text-blue-700'}`}>
                    {item.listingTrigger}
                </span>
            )}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase ${isTooLate ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {(item.status || 'scraped').replace('_', ' ')}
            </span>
        </div>
        <span className={`flex items-center text-xs ${isTooLate ? 'text-red-100' : 'text-gray-400'}`}>
          <span className="mr-1"><Icons.Clock /></span>
          {item.time}
        </span>
      </div>
      
      <h3 className={`font-semibold text-sm mb-1 truncate ${isTooLate ? 'text-white' : 'text-gray-900'}`}>{item.isin}</h3>
      <p className={`text-xs mb-2 line-clamp-2 ${isTooLate ? 'text-red-50' : 'text-gray-600'}`}>{item.issuer}</p>
      
      <div className="flex justify-between items-end mt-auto">
        <div className="flex flex-col">
            <div className={`text-sm font-mono font-medium ${isTooLate ? 'text-white' : 'text-gray-800'}`}>
            {item.currency} {(item.amount || 0).toLocaleString()}
            </div>
            {/* Added Min Size Display */}
            <div className={`text-[10px] ${isTooLate ? 'text-red-200' : 'text-gray-400'}`}>
                Min: {item.minSize || '-'}
            </div>
        </div>
        
        {/* Render Submission Place if Submitted, otherwise status dot */}
        {item.status === 'submitted' && item.submissionPlace ? (
             <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Plc: {item.submissionPlace}
             </div>
        ) : (
             <div className={`w-2 h-2 rounded-full ${isTooLate ? 'bg-white' : 'bg-blue-400'}`}></div>
        )}
      </div>

      {/* Render Turnaround Time if present */}
      {item.turnaroundTime && (
        <div className={`mt-2 pt-2 border-t border-dashed flex justify-between items-center text-xs ${isTooLate ? 'border-red-400 text-red-100' : 'border-gray-100'}`}>
            <span className={isTooLate ? 'text-red-200' : 'text-gray-400'}>Turnaround</span>
            <span className={`font-mono font-medium ${isTooLate ? 'text-white' : 'text-gray-700'}`}>{item.turnaroundTime}</span>
        </div>
      )}
    </div>
  );
};
