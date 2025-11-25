import React, { useState } from 'react';
import { BondItem } from '../types';

export const AddIsinModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (item: BondItem) => void }) => {
    const [formData, setFormData] = useState<Partial<BondItem>>({
        isin: '',
        issuer: '',
        amount: 100000,
        currency: '€',
        type: 'Reg S',
        listingTrigger: 'MANUAL',
        status: 'scraped',
        date: new Date().toLocaleDateString('de-DE'),
        time: new Date().toLocaleTimeString('de-DE'),
        minSize: '100k'
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: Math.random().toString(36).substr(2, 9),
        } as BondItem);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Add New ISIN</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">ISIN</label>
                            <input 
                                required 
                                type="text" 
                                className="w-full border rounded-md px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#9F8A79] outline-none" 
                                value={formData.isin}
                                onChange={e => setFormData({...formData, isin: e.target.value})}
                                placeholder="XS..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Issuer</label>
                            <input 
                                required 
                                type="text" 
                                className="w-full border rounded-md px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#9F8A79] outline-none" 
                                value={formData.issuer}
                                onChange={e => setFormData({...formData, issuer: e.target.value})}
                                placeholder="Issuer Name"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                         <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                            <input 
                                required 
                                type="number" 
                                step="1"
                                className="w-full border rounded-md px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#9F8A79] outline-none" 
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                            <select 
                                className="w-full border rounded-md px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#9F8A79] outline-none" 
                                value={formData.currency}
                                onChange={e => setFormData({...formData, currency: e.target.value as any})}
                            >
                                <option value="€">EUR (€)</option>
                                <option value="$">USD ($)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Trigger</label>
                            <select 
                                className="w-full border rounded-md px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#9F8A79] outline-none" 
                                value={formData.listingTrigger}
                                onChange={e => setFormData({...formData, listingTrigger: e.target.value})}
                            >
                                <option value="MANUAL">MANUAL</option>
                                <option value="AUTO">AUTO</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm bg-[#9F8A79] hover:bg-[#8a7566] text-white rounded-md shadow-sm">Add ISIN</button>
                    </div>
                </form>
            </div>
        </div>
    );
};