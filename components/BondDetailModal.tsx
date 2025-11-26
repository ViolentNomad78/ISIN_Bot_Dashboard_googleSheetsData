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
                const { error } = await supabase
                    .from('scraped_bond_isins')
                    .upsert({ 
                        isin: updatedItem.isin,
                        status: action,
                        listing_trigger: updatedItem.listingTrigger,
                        triggered_at: action === 'triggered' ? new Date().toISOString() : undefined,
                        // Add other fields to ensure record is complete if it didn't exist
                        issuer: updatedItem.issuer,
                        amount: updatedItem.amount
                    }, { onConflict: 'isin' });

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Bond Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>
                
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">{formData.isin}</h2>
                        <p className="text-gray-500 text-sm">{formData.issuer}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                         <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                             <div className="text-xs text-gray-500 uppercase font-bold mb-1">Amount</div>
                             <div className="font-mono font-medium text-gray-800">
                                {formData.currency} {formatSize(formData.minSize, formData.amount)}
                             </div>
                         </div>
                         <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                             <div className="text-xs text-gray-500 uppercase font-bold mb-1">Status</div>
                             <div className={`inline-block px-2 py-0.5 text-xs font-bold rounded border ${getStatusColor(formData.status)}`}>
                                 {formData.status.toUpperCase()}
                             </div>
                         </div>
                    </div>
                    
                    <div className="space-y-2 mb-8 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Email Time:</span>
                            <span className="font-medium text-gray-900">{formData.date} {formData.time}</span>
                        </div>
                        <div className="flex justify-between">
                             <span>Trigger Type:</span>
                             <span className="font-medium text-gray-900">{formData.listingTrigger || '-'}</span>
                        </div>
                        {formData.status === 'submitted' && (
                            <>
                            <div className="flex justify-between">
                                 <span>Submission Place:</span>
                                 <span className="font-medium text-blue-600">{formData.submissionPlace || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                 <span>Turnaround Time:</span>
                                 <span className="font-medium text-gray-900">{formData.turnaroundTime || '-'}</span>
                            </div>
                            </>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                         {formData.status === 'scraped' && (
                             <>
                                <button 
                                    type="button"
                                    onClick={() => handleAction('passed')}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm border border-red-200 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    Pass
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleAction('triggered')}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm bg-[#9F8A79] hover:bg-[#8a7566] text-white rounded-md shadow-sm transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting ? 'Processing...' : 'Trigger Manual Listing'}
                                </button>
                             </>
                         )}
                         {formData.status !== 'scraped' && (
                             <button 
                                onClick={onClose}
                                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                             >
                                 Close
                             </button>
                         )}
                    </div>
                </div>
             </div>
        </div>
    );
};