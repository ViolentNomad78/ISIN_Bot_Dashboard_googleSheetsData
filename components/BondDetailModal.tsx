import React, { useState, useEffect } from 'react';
import { BondItem } from '../types';
import { getStatusColor } from '../utils';
import { SHEET_API_URL, N8N_WEBHOOK_URL } from '../data';
import { supabase } from '../supabaseClient';

export const BondDetailModal = ({ item, isOpen, onClose, onSave }: { item: BondItem | null, isOpen: boolean, onClose: () => void, onSave: (updatedItem: BondItem) => void }) => {
    const [formData, setFormData] = useState<BondItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (item) setFormData(item);
    }, [item]);

    if (!isOpen || !formData) return null;

    // Trigger Google Sheet Webhook (Backup Method)
    const triggerGoogleSheetWebhook = async (item: BondItem, action: string) => {
        if (!SHEET_API_URL) return;

        const payload = {
            sheetName: 'ISINs',
            searchColumn: 'E',
            searchValue: item.isin,
            targetColumn: action === 'TRIGGER_MANUAL' ? 'A' : 'B',
            value: 'TRUE',
            action: 'UPDATE_ROW',
            n8nWebhook: N8N_WEBHOOK_URL,
            actionType: action,
            user_email: 'novadani78@gmail.com',
            user_nickname: 'novadani78',
            timestamp: new Date().toISOString()
        };

        try {
            const formBody = new URLSearchParams(payload).toString();
            await fetch(SHEET_API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formBody
            });
            console.log(`[Backup] Google Sheet webhook triggered.`);
        } catch (error) {
            console.error("Failed to trigger backup webhook", error);
        }
    };

    const handleAction = async (action: 'triggered' | 'passed') => {
        if (formData && !isSubmitting) {
            setIsSubmitting(true);
            
            // 1. Optimistic Update in UI
            let updatedItem = { ...formData, status: action };
            if (action === 'triggered') {
                updatedItem.listingTrigger = 'MANUAL';
            }
            
            try {
                // 2. Update Supabase
                // Using 'upsert' to handle both existing IDs (from DB) and ephemeral ones
                // Changed table from 'bonds' to 'bond_isins'
                const { error } = await supabase
                    .from('bond_isins')
                    .upsert({ 
                        isin: updatedItem.isin,
                        status: action,
                        listing_trigger: updatedItem.listingTrigger,
                        triggered_at: action === 'triggered' ? new Date().toISOString() : undefined,
                        // Add other fields to ensure record is complete if it didn't exist
                        issuer: updatedItem.issuer,
                        amount: updatedItem.amount
                    }, { onConflict: 'isin' }); // Assuming ISIN is unique constraint, otherwise use ID

                if (error) throw error;

                // 3. Trigger Google Sheet (Backup/N8N trigger)
                const webhookAction = action === 'triggered' ? 'TRIGGER_MANUAL' : 'PASS';
                await triggerGoogleSheetWebhook(formData, webhookAction);

                // 4. Save and Close
                onSave(updatedItem);
                onClose();
            } catch (err) {
                console.error('Action failed:', err);
                alert('Failed to update status. Check console.');
            } finally {
                setIsSubmitting(false);
            }
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
                                 {formData.type && <span>Type: {formData.type}</span>}
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
                        
                        {(isScraped || isPassed) && (
                            <button 
                                type="button" 
                                onClick={() => handleAction('triggered')}
                                disabled={isSubmitting}
                                className={`flex-1 px-3 py-2 text-sm font-bold text-yellow-900 bg-yellow-400 hover:bg-yellow-500 rounded-md transition-colors shadow-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? 'Sending...' : 'Trigger'}
                            </button>
                        )}

                        {isScraped && (
                            <button 
                                type="button" 
                                onClick={() => handleAction('passed')}
                                disabled={isSubmitting}
                                className={`flex-1 px-3 py-2 text-sm font-bold text-red-900 bg-red-200 hover:bg-red-300 rounded-md transition-colors shadow-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? 'Sending...' : 'Pass'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};