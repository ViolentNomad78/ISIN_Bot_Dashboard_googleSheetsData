import React from 'react';
import { BondItem, Status } from '../types';
import { getHeaderColor } from '../utils';
import { BondCard } from './BondCard';

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

  return (
    <div 
      className={`flex flex-col rounded-xl transition-colors duration-200 bg-gray-100 ${className} h-auto xl:min-h-0 xl:h-full`}
    >
      <div className={`p-3 rounded-t-xl border-b flex justify-between items-center sticky top-0 z-10 ${getHeaderColor(status)}`}>
        <h2 className="font-bold text-sm uppercase tracking-wider">{title}</h2>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status === 'too_late' ? 'bg-red-500 text-white' : 'bg-white bg-opacity-50'}`}>
            {items.length}
        </span>
      </div>
      
      <div className="p-3 flex-1 xl:overflow-y-auto scrollbar-hide">
        {items.map(item => (
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
