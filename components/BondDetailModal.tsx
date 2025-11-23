import React, { useState, useEffect } from 'react';
import { BondItem } from '../types';
import { getStatusColor } from '../utils';
import { SHEET_API_URL } from '../data';

export const BondDetailModal = ({ item, isOpen, onClose, onSave }: { item: BondItem | null, isOpen: boolean, onClose: () => void, onSave: (updatedItem: BondItem) => void }) => {
    const [formData, setFormData] = useState<BondItem | null>(null);

    useEffect(() => {
        if (item) setFormData(item);
    }, [item]);

    if (!isOpen || !formData) return null;

    // Trigger Google Sheet Webhook (doPost)
    const triggerGoogleSheetWebhook = async (item: BondItem, action: string) => {
        if (!SHEET_API_URL) {
             console.log(`[Mock Action] ${action} for ${item.isin}`);
             return;
        }

        const payload = {
            action: action, // 'TRIGGER_MANUAL' or 'PASS'
            isin: item.isin,
            id: item.id,
            timestamp: new Date().toISOString()
        };

        try {
            console.log(`Sending ${action} to Google Sheet...`);
            // We use no-cors to avoid CORS errors from GAS, but this means we don't get a readable response
            await fetch(SHEET_API_URL, {
                method: 'POST',
                mode: 'no-cors', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            console.log(`[Google Sheet] Sent action: ${action}`);
        } catch (error) {
            console.error("Failed to trigger webhook", error);
        }
    };

    const handleAction = async (action: 'triggered' | 'passed') => {
        if (formData) {
            let updatedItem = { ...formData, status: action };
            
            // If action is trigger, set MANUAL badge
            if (action === 'triggered') {
                updatedItem.listingTrigger = 'MANUAL';
                await triggerGoogleSheetWebhook(formData, 'TRIGGER_MANUAL');
            } else {
                await triggerGoogleSheetWebhook(formData, 'PASS');
            }

            onSave(updatedItem);
            onClose();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onClose();
    };

    const isScraped = formData.status === 'scraped';
    const isPassed = formData.status === 'passed';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${getStatusColor(formData.status)}`}>
                             {formData.status.replace('_', ' ')}
                         </span>
                         <h3 className="font-semibold text-gray-800">ISIN Details</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">ISIN</label>
                            <input 
                                readOnly 
                                type="text" 
                                className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600 focus:outline-none font-mono" 
                                value={formData.isin}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Issuer</label>
                            <input 
                                readOnly 
                                type="text" 
                                className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600 focus:outline-none" 
                                value={formData.issuer}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                         <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                            <input 
                                readOnly 
                                type="text" 
                                className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600 focus:outline-none font-mono" 
                                value={(formData.amount || 0).toLocaleString()}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                            <input 
                                readOnly 
                                type="text" 
                                className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600 focus:outline-none" 
                                value={formData.currency === '€' ? 'EUR (€)' : 'USD ($)'}
                            />
                        </div>
                        {/* Only show Trigger field if not in Scraped status */}
                        {formData.status !== 'scraped' && (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Trigger</label>
                                <input 
                                    readOnly 
                                    type="text" 
                                    className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600 focus:outline-none font-bold" 
                                    value={formData.listingTrigger || '-'}
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 border border-gray-100">
                             <span className="block font-medium mb-1">Email Time</span>
                             <div className="flex gap-2 font-mono">
                                 <span>{formData.date}</span>
                                 <span>{formData.time}</span>
                             </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 border border-gray-100">
                             <span className="block font-medium mb-1">Constraints</span>
                             <div className="flex gap-2">
                                 <span>Min: {formData.minSize}</span>
                                 <span>Type: {formData.type}</span>
                             </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-2 border-t mt-4">
                        <button 
                            type="button" 
                            className="flex-1 px-3 py-2 text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                        >
                            DES
                        </button>
                        <button 
                            type="button" 
                            className="flex-1 px-3 py-2 text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                        >
                            ALLQ
                        </button>
                        
                        {/* Trigger Button: Show for Scraped OR Passed items */}
                        {(isScraped || isPassed) && (
                            <button 
                                type="button" 
                                onClick={() => handleAction('triggered')}
                                className="flex-1 px-3 py-2 text-sm font-bold text-yellow-900 bg-yellow-400 hover:bg-yellow-500 rounded-md transition-colors shadow-sm"
                            >
                                Trigger
                            </button>
                        )}

                        {/* Pass Button: Show ONLY for Scraped items */}
                        {isScraped && (
                            <button 
                                type="button" 
                                onClick={() => handleAction('passed')}
                                className="flex-1 px-3 py-2 text-sm font-bold text-red-900 bg-red-200 hover:bg-red-300 rounded-md transition-colors shadow-sm"
                            >
                                Pass
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
