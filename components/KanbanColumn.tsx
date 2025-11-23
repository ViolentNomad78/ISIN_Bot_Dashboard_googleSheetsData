import React, { useState, useMemo } from 'react';
import { BondItem, Status } from '../types';
import { getHeaderColor, parseDisplayDateTime } from '../utils';
import { BondCard } from './BondCard';
import { Icons } from '../Icons';

export const KanbanColumn = ({ 
    title, 
    status, 
    items,
    onItemClick,
    className = ''
}: { 
    title: string, 
    status: Status, 
    items: BondItem[],
    onItemClick: (item: BondItem) => void,
    className?: string
}) => {
  // Default to newest first (descending)
  const [sortDesc, setSortDesc] = useState(true);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
        // determine effective date/time based on status (matching BondCard logic)
        const getEffectiveTime = (item: BondItem) => {
             let d = item.date;
             let t = item.time;
             if (status === 'triggered' && (item.triggeredDate || item.triggeredTime)) {
                 d = item.triggeredDate || d;
                 t = item.triggeredTime || '';
             } else if (status === 'submitted' && (item.submittedDate || item.submittedTime)) {
                 d = item.submittedDate || d;
                 t = item.submittedTime || '';
             }
             return parseDisplayDateTime(d, t);
        };

        const tA = getEffectiveTime(a);
        const tB = getEffectiveTime(b);
        return sortDesc ? tB - tA : tA - tB;
    });
  }, [items, sortDesc, status]);

  return (
    <div 
      className={`flex flex-col rounded-xl transition-colors duration-200 bg-gray-100 ${className} h-auto xl:min-h-0 xl:h-full`}
    >
      <div className={`p-3 rounded-t-xl border-b flex justify-between items-center sticky top-0 z-10 ${getHeaderColor(status)}`}>
        <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm uppercase tracking-wider">{title}</h2>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status === 'too_late' ? 'bg-red-500 text-white' : 'bg-white bg-opacity-50'}`}>
                {items.length}
            </span>
        </div>
        <button 
            onClick={() => setSortDesc(!sortDesc)} 
            className="p-1.5 hover:bg-black/10 rounded transition-colors text-current opacity-70 hover:opacity-100"
            title={sortDesc ? "Newest First" : "Oldest First"}
        >
            {sortDesc ? <Icons.ArrowDown /> : <Icons.ArrowUp />}
        </button>
      </div>
      
      <div className="p-3 flex-1 xl:overflow-y-auto scrollbar-hide">
        {sortedItems.map(item => (
          <BondCard key={item.id} item={item} onClick={onItemClick} />
        ))}
        {items.length === 0 && (
            <div className="h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                No Items
            </div>
        )}
      </div>
    </div>
  );
};