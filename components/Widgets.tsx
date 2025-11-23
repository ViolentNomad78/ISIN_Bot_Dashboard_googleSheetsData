import React, { useState } from 'react';
import { AutoTriggerRule } from '../types';
import { Icons } from '../Icons';

export const AutoTriggerWidget = ({ rules, onAdd, onRemove }: { rules: AutoTriggerRule[], onAdd: (rule: Omit<AutoTriggerRule, 'id'>) => void, onRemove: (id: string) => void }) => {
    const [newCurr, setNewCurr] = useState('€ (EUR)');
    const [newSize, setNewSize] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = () => {
        if (!newSize) return;
        onAdd({ currency: newCurr, maxSize: Number(newSize) });
        setNewSize('');
        setIsAdding(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Auto Trigger Req.</h3>
            </div>
            
            <table className="w-full text-sm mb-3">
                <thead className="bg-gray-50 text-gray-500">
                    <tr>
                        <th className="text-left p-2 rounded-l font-normal text-xs">Currency</th>
                        <th className="text-right p-2 font-normal text-xs">Max Size</th>
                        <th className="w-6 rounded-r"></th>
                    </tr>
                </thead>
                <tbody>
                    {rules.map(rule => (
                        <tr key={rule.id} className="border-b border-gray-100 group">
                            <td className="p-2 font-bold text-gray-700">{rule.currency}</td>
                            <td className="p-2 text-right font-mono font-bold text-gray-800">{(rule.maxSize || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                            <td className="p-2 text-right">
                                <button onClick={() => onRemove(rule.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                    <Icons.Trash />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isAdding ? (
                <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                     <select 
                        className="border rounded text-xs p-1 bg-white text-gray-900 outline-none focus:ring-1 ring-[#9F8A79]"
                        value={newCurr}
                        onChange={e => setNewCurr(e.target.value)}
                     >
                         <option value="€ (EUR)">€</option>
                         <option value="$ (USD)">$</option>
                         <option value="£ (GBP)">£</option>
                     </select>
                     <input 
                        type="number"
                        step="1"
                        placeholder="Size"
                        className="border rounded text-xs p-1 w-20 bg-white text-gray-900 outline-none focus:ring-1 ring-[#9F8A79]"
                        value={newSize}
                        onChange={e => setNewSize(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                     />
                     <button onClick={handleAdd} className="text-[#9F8A79] hover:text-[#8a7566] text-xs font-bold px-2">Add</button>
                     <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                        <Icons.X />
                     </button>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAdding(true)} 
                    className="w-full py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:text-[#9F8A79] hover:border-[#9F8A79] flex items-center justify-center gap-1 transition-colors"
                >
                    <Icons.Plus /> Add Rule
                </button>
            )}
        </div>
    );
};

export const FavoriteIssuersWidget = ({ issuers, onAdd, onRemove }: { issuers: string[], onAdd: (issuer: string) => void, onRemove: (issuer: string) => void }) => {
    const [newIssuer, setNewIssuer] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = () => {
        if (!newIssuer.trim()) return;
        onAdd(newIssuer.trim());
        setNewIssuer('');
        setIsAdding(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
             <div className="flex justify-between items-center mb-3 border-b pb-2">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Favorite Issuers</h3>
            </div>
            
            <ul className="space-y-1 mb-3">
                {issuers.map((issuer, idx) => (
                    <li key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer group">
                        <span className="text-sm text-gray-700 font-medium group-hover:text-[#9F8A79]">{issuer}</span>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                            <button onClick={(e) => { e.stopPropagation(); onRemove(issuer); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Icons.Trash />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {isAdding ? (
                <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                     <input 
                        type="text" 
                        placeholder="Issuer Name"
                        className="border rounded text-xs p-1.5 flex-1 outline-none focus:ring-1 ring-[#9F8A79]"
                        value={newIssuer}
                        onChange={e => setNewIssuer(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                     />
                     <button onClick={handleAdd} className="text-[#9F8A79] hover:text-[#8a7566] text-xs font-bold px-2">Add</button>
                     <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                         <Icons.X />
                     </button>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAdding(true)} 
                    className="w-full py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:text-[#9F8A79] hover:border-[#9F8A79] flex items-center justify-center gap-1 transition-colors"
                >
                    <Icons.Plus /> Add Issuer
                </button>
            )}
        </div>
    );
};

export const StatWidget = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b pb-2">{title}</h3>
        {children}
    </div>
);
