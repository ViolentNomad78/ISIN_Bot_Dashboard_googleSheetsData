import React from 'react';
import { BondItem } from '../types';
import { getStatusColor, getTriggerColor } from '../utils';

export const BondCard: React.FC<{ item: BondItem, onClick: (item: BondItem) => void }> = ({ item, onClick }) => {
  const isTooLate = item.status === 'too_late';
  
  // Logic to determine which date/time to display based on Status
  let displayDate = item.date;
  let displayTime = item.time;

  if (item.status === 'triggered') {
      if (item.triggeredTime || item.triggeredDate) {
          displayDate = item.triggeredDate || item.date;
          displayTime = item.triggeredTime || '';
      }
  } else if (item.status === 'submitted') {
      if (item.submittedTime || item.submittedDate) {
          displayDate = item.submittedDate || item.date;
          displayTime = item.submittedTime || '';
      }
  }

  // Helper to format the size with dots (de-DE) if it is a plain number
  const formatSize = (val: string | number | undefined, fallback: number) => {
      if (val !== undefined && val !== null && val !== '') {
           const strVal = String(val);
           // If the string is purely numeric (digits, optionally a dot for decimals), format it.
           // This avoids messing up strings like "100k" or "100k x 1k".
           if (/^\d+(\.\d+)?$/.test(strVal)) {
               return parseFloat(strVal).toLocaleString('de-DE');
           }
           return strVal;
      }
      return (fallback || 0).toLocaleString('de-DE');
  };

  const handleBloombergAction = (e: React.MouseEvent, action: string) => {
      e.stopPropagation();
      console.log(`Calling Bloomberg Macro: ${action} for ${item.isin}`);
      // Integration point for Bloomberg Terminal macros
  };

  return (
    <div 
      onClick={() => onClick(item)}
      className={`
        p-3 mb-3 rounded-lg border shadow-sm transition-all hover:shadow-md cursor-pointer hover:scale-[1.02] active:scale-100
        ${isTooLate ? 'bg-[#B71C1C] text-white border-[#B71C1C]' : 'bg-white border-gray-200 hover:border-gray-300'}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-1 flex-shrink-0">
            {/* Trigger First, then Status */}
            {item.listingTrigger && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border ${getTriggerColor(item.listingTrigger)}`}>
                    {item.listingTrigger}
                </span>
            )}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border ${getStatusColor(item.status)}`}>
            {(item.status || 'scraped').replace('_', ' ')}
            </span>
        </div>
        <div className={`text-[10px] ml-2 whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-right min-w-0 ${isTooLate ? 'text-red-100' : 'text-gray-400'}`}>
             {displayDate} {displayTime}
        </div>
      </div>
      
      <h3 className={`font-semibold text-sm mb-1 truncate ${isTooLate ? 'text-white' : 'text-gray-900'}`}>{item.isin}</h3>
      <p className={`text-xs mb-2 line-clamp-2 ${isTooLate ? 'text-red-100' : 'text-gray-600'}`}>{item.issuer}</p>
      
      {/* Bloomberg Action Buttons */}
      <div className="flex gap-2 mb-3">
          <button 
            onClick={(e) => handleBloombergAction(e, 'ALLQ')}
            className={`
                px-2 py-0.5 text-[10px] font-bold rounded border transition-colors
                ${isTooLate 
                    ? 'bg-red-900/40 border-red-400/30 text-white hover:bg-red-900/60' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300'}
            `}
          >
            ALLQ
          </button>
          <button 
            onClick={(e) => handleBloombergAction(e, 'DES')}
            className={`
                px-2 py-0.5 text-[10px] font-bold rounded border transition-colors
                ${isTooLate 
                    ? 'bg-red-900/40 border-red-400/30 text-white hover:bg-red-900/60' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300'}
            `}
          >
            DES
          </button>
      </div>

      <div className="flex justify-between items-end mt-auto">
        <div className="flex flex-col">
            <div className={`text-sm font-mono font-medium ${isTooLate ? 'text-white' : 'text-gray-800'}`}>
            {item.currency} {formatSize(item.minSize, item.amount)}
            </div>
        </div>
        
        {/* Render Submission Info if Submitted, otherwise status dot */}
        {item.status === 'submitted' ? (
             <div className="flex flex-col items-end gap-1">
                 {item.turnaroundTime && (
                    <span className={`text-[10px] font-mono whitespace-nowrap ${isTooLate ? 'text-red-100' : 'text-gray-500'}`}>
                        {item.turnaroundTime}
                    </span>
                 )}
                 {item.submissionPlace && (
                    <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                        Plc: {item.submissionPlace}
                    </div>
                 )}
             </div>
        ) : (
             <div className={`w-2 h-2 rounded-full ${isTooLate ? 'bg-white' : 'bg-blue-400'}`}></div>
        )}
      </div>
    </div>
  );
};