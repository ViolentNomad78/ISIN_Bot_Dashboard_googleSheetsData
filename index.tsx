import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// --- Types ---

type Status = 'scraped' | 'triggered' | 'submitted' | 'passed' | 'too_late';

interface BondItem {
  id: string;
  isin: string;
  issuer: string;
  amount: number;
  currency: '€' | '$';
  status: Status;
  type: string;          // e.g. 'Reg S'
  listingTrigger: string; // e.g. 'MANUAL', 'AUTO'
  time: string;
  date: string;
  minSize: string;
  submissionPlace?: string; // e.g. '2', '4'
  turnaroundTime?: string;  // e.g. '04:21:19'
}

interface AutoTriggerRule {
    id: string;
    currency: string;
    maxSize: number;
}

interface SpecialistStat {
    id: string;
    name: string;
    usd: number;
    eur: number;
    aud: number;
    chf: number;
    gbp: number;
    nok: number;
    sek: number;
    totalBot: number;
    totalListed: number;
}

interface DailyStat {
    date: string;
    count: number;
}

// --- Mock Data ---

const INITIAL_DATA: BondItem[] = [
  { id: '1', isin: 'USY0606WCE85', issuer: 'Bangkok Bank PCL/Hong Kong (BBLTB)', amount: 200000, currency: '$', status: 'scraped', type: 'Reg S', listingTrigger: '', time: '19:59:18', date: '19.11.2025', minSize: '200k x 1k' },
  { id: '2', isin: 'XS3239976163', issuer: 'EP Infrastructure AS (ENAPHO)', amount: 100000, currency: '€', status: 'scraped', type: 'Reg S', listingTrigger: '', time: '18:03:53', date: '20.11.2025', minSize: '100k' },
  { id: '3', isin: 'XS3221808705', issuer: 'China Three Gorges International Ltd (YANTZE)', amount: 100000, currency: '€', status: 'triggered', type: 'Reg S', listingTrigger: 'MANUAL', time: '17:30:54', date: '20.11.2025', minSize: '100k' },
  { id: '4', isin: 'SE0020845592', issuer: 'Betsson AB (BETSBS)', amount: 100000, currency: '€', status: 'triggered', type: 'Reg S', listingTrigger: 'MANUAL', time: '17:55:09', date: '20.11.2025', minSize: '100k' },
  { id: '5', isin: 'XS3239889788', issuer: 'Colombia Government International Bond', amount: 100000, currency: '€', status: 'triggered', type: '', listingTrigger: 'AUTO', time: '18:18:44', date: '20.11.2025', minSize: '100k' },
  { id: '6', isin: 'XS3239172565', issuer: 'Ardagh Metal Packaging Finance USA LLC', amount: 100000, currency: '€', status: 'triggered', type: '', listingTrigger: 'AUTO', time: '18:49:30', date: '20.11.2025', minSize: '100k' },
  { id: '7', isin: 'USP46756BQ76', issuer: 'Genneia SA (GNNEIA)', amount: 1000, currency: '$', status: 'triggered', type: 'Reg S', listingTrigger: 'MANUAL', time: '21:11:26', date: '20.11.2025', minSize: '1k' },
  { id: '8', isin: 'XS3239891339', issuer: 'Colombia Government International Bond', amount: 100000, currency: '€', status: 'submitted', type: '', listingTrigger: 'MANUAL', time: '18:18:44', date: '20.11.2025', minSize: '100k', submissionPlace: '2', turnaroundTime: '04:21:19' },
  { id: '9', isin: 'XS3239891503', issuer: 'Colombia Government International Bond', amount: 100000, currency: '€', status: 'submitted', type: '', listingTrigger: 'AUTO', time: '18:18:44', date: '20.11.2025', minSize: '100k', submissionPlace: '4', turnaroundTime: '05:01:19' },
  { id: '10', isin: 'XS3195078251', issuer: 'Eroski S Coop (EROSKI)', amount: 100000, currency: '€', status: 'passed', type: 'Reg S', listingTrigger: 'passed', time: '16:30:09', date: '19.11.2025', minSize: '100k' },
  { id: '11', isin: 'SE0026842221', issuer: 'Betsson AB (BETSBS)', amount: 100000, currency: '€', status: 'passed', type: 'Reg S', listingTrigger: 'passed', time: '17:55:09', date: '20.11.2025', minSize: '100k' },
  { id: '12', isin: 'USP3063DAC67', issuer: 'Compañía General de Combustibles S.A.', amount: 1000, currency: '$', status: 'passed', type: 'Reg S', listingTrigger: 'passed', time: '21:24:04', date: '20.11.2025', minSize: '1k' },
  { id: '13', isin: 'US12527GAL77', issuer: 'CF Industries Inc (CF)', amount: 2000, currency: '$', status: 'too_late', type: '', listingTrigger: 'MANUAL', time: '18:18:08', date: '20.11.2025', minSize: '2k' },
  { id: '14', isin: 'XS3239211132', issuer: 'Banca Transilvania SA (TVLRO)', amount: 200000, currency: '€', status: 'too_late', type: '', listingTrigger: 'AUTO', time: '17:11:28', date: '20.11.2025', minSize: '200k' },
];

const INITIAL_RULES: AutoTriggerRule[] = [
    { id: 'r1', currency: '€ (EUR)', maxSize: 99000 },
    { id: 'r2', currency: '$ (USD)', maxSize: 49000 },
];

const INITIAL_ISSUERS: string[] = ['BMW', 'Carfour', 'Facebook', 'Transilvania'];

const MOCK_SPECIALIST_STATS: SpecialistStat[] = [
    { id: 's1', name: 'BAADER BANK AG', usd: 69, eur: 92, aud: 14, chf: 3, gbp: 1, nok: 0, sek: 0, totalBot: 179, totalListed: 961 },
    { id: 's2', name: 'BANKHAUS SCHEICH WERTPAPIERSPEZ. AG', usd: 22, eur: 148, aud: 2, chf: 2, gbp: 0, nok: 0, sek: 0, totalBot: 174, totalListed: 187 },
    { id: 's3', name: 'ICF BANK AG WERTPAPIERHANDELSBANK', usd: 74, eur: 193, aud: 3, chf: 15, gbp: 10, nok: 2, sek: 2, totalBot: 299, totalListed: 851 },
    { id: 's4', name: 'ODDO BHF SE', usd: 181, eur: 231, aud: 0, chf: 4, gbp: 0, nok: 0, sek: 0, totalBot: 416, totalListed: 606 },
    { id: 's5', name: 'WALTER LUDWIG GMBH', usd: 186, eur: 284, aud: 10, chf: 2, gbp: 8, nok: 0, sek: 0, totalBot: 490, totalListed: 933 },
    { id: 's6', name: 'WOLFGANG STEUBING AG', usd: 317, eur: 633, aud: 1, chf: 1, gbp: 50, nok: 4, sek: 2, totalBot: 1008, totalListed: 1747 },
];

const generateMockDailyStats = (): DailyStat[] => {
    const stats: DailyStat[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        // Random count between 2 and 55, higher on weekdays
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const base = isWeekend ? 0 : 15;
        const count = Math.max(0, base + Math.floor(Math.random() * 40));
        stats.push({
            date: d.toLocaleDateString('de-DE'),
            count
        });
    }
    return stats;
};

const MOCK_DAILY_STATS = generateMockDailyStats();

// Configuration
// Prioritize Environment Variable (for Coolify/Production), fallback to hardcoded
const SHEET_API_URL = ((import.meta as any).env?.VITE_GOOGLE_SHEET_URL || 'https://script.google.com/macros/s/AKfycbxhYV14r-KZzP64VapIZVUezMlSFUa_5LfMGmU-g7iUV1fbIuzBoHVusk7OzOJQGBrOfQ/exec').trim();

// --- Components ---

// Simple Icons
const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>,
  List: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Google: () => <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" y2="19"></line><line x1="5" y1="12" y2="19"></line><line x1="5" y1="12" y2="19"></line><line x1="5" y1="12" y2="19"></line><path d="M5 12h14"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  BarChart: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  Knot: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-[#9F8A79]">
        <path d="M6 12c0-1.7 1.3-3 3-3s3 1.3 3 3-1.3 3-3 3-3-1.3-3-3z" />
        <path d="M18 12c0-1.7-1.3-3-3-3s-3 1.3-3 3 1.3 3 3 3 3-1.3 3-3z" />
        <path d="M9 9c0-1.7 1.3-3 3-3s3 1.3 3 3" />
        <path d="M15 15c0 1.7-1.3 3-3 3s-3-1.3-3-3" />
        <path d="M9 15c-1.7 0-3-1.3-3-3" />
        <path d="M15 9c1.7 0 3 1.3 3 3" />
    </svg>
  )
};

const formatCurrency = (amount: number, currency: string) => {
  return `${currency} ${(amount || 0).toLocaleString()}`;
};

const getStatusColor = (status: Status) => {
  switch (status) {
    case 'scraped': return 'bg-purple-50 border-purple-200 text-purple-900';
    case 'triggered': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    case 'submitted': return 'bg-blue-50 border-blue-200 text-blue-900';
    case 'passed': return 'bg-white border-red-200 text-red-600';
    case 'too_late': return 'bg-red-500 border-red-600 text-white';
    default: return 'bg-gray-50 border-gray-200 text-gray-900';
  }
};

const getHeaderColor = (status: Status) => {
    switch (status) {
        case 'scraped': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'triggered': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'passed': return 'bg-white text-red-600 border-red-100';
        case 'too_late': return 'bg-red-600 text-white border-red-700';
        default: return 'bg-gray-100';
    }
};

// --- Logo Component (Robust Fallback) ---
const Logo = ({ className = "h-16 w-16" }: { className?: string }) => {
    const [error, setError] = useState(false);
    
    if (error) {
        return (
            <div className={`${className} p-1`}>
                <Icons.Knot />
            </div>
        );
    }

    return (
        <img 
            src="Icon.png" 
            alt="Monopoli Meier & Son's" 
            className={`${className} object-contain`}
            onError={() => setError(true)}
        />
    );
};

// --- Login Screen ---

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                <div className="flex justify-center mb-6">
                    <Logo className="h-20 w-auto" />
                </div>
                <h1 className="text-xl font-bold text-[#9F8A79] mb-2 font-serif tracking-wide">MONOPOLI.MEIER & SON'S.</h1>
                <p className="text-gray-500 mb-8 text-sm">Sign in to access the Dashboard</p>
                
                <button 
                    onClick={onLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-full transition-all duration-200 shadow-sm"
                >
                    <Icons.Google />
                    <span>Sign in with Google</span>
                </button>
                
                <div className="mt-8 text-xs text-gray-400">
                    Protected by MMS Security Systems
                </div>
            </div>
        </div>
    );
};

// --- Bond Detail Modal (View/Edit) ---

const BondDetailModal = ({ item, isOpen, onClose, onSave }: { item: BondItem | null, isOpen: boolean, onClose: () => void, onSave: (updatedItem: BondItem) => void }) => {
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

// --- Add ISIN Modal ---

const AddIsinModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (item: BondItem) => void }) => {
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
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#9F8A79] outline-none" 
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
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#9F8A79] outline-none" 
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
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#9F8A79] outline-none" 
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                            <select 
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#9F8A79] outline-none" 
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
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#9F8A79] outline-none" 
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

// --- Interactive Widgets ---

const AutoTriggerWidget = ({ rules, onAdd, onRemove }: { rules: AutoTriggerRule[], onAdd: (rule: Omit<AutoTriggerRule, 'id'>) => void, onRemove: (id: string) => void }) => {
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

const FavoriteIssuersWidget = ({ issuers, onAdd, onRemove }: { issuers: string[], onAdd: (issuer: string) => void, onRemove: (issuer: string) => void }) => {
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

const StatWidget = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b pb-2">{title}</h3>
        {children}
    </div>
);

// --- Stats View Components ---

const StatsView = () => {
    const [timeRange, setTimeRange] = useState<'ytd' | 'mtd' | '30d'>('ytd');
    const [currencyFilter, setCurrencyFilter] = useState<'all' | 'usd' | 'eur'>('all');
    const [sortField, setSortField] = useState<keyof SpecialistStat>('totalBot');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Filter and Sort Specialists
    const sortedSpecialists = useMemo(() => {
        let items = [...MOCK_SPECIALIST_STATS];
        
        // Simulating filters (mock data is static, but this shows intent)
        if (currencyFilter === 'usd') {
            // In a real app we'd filter rows or columns
        }

        return items.sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [sortField, sortDirection, currencyFilter]);

    const handleSort = (field: keyof SpecialistStat) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const maxDaily = Math.max(...MOCK_DAILY_STATS.map(d => d.count));

    return (
        <div className="bg-slate-50 min-h-full flex flex-col gap-6 p-4 lg:p-6 overflow-y-auto">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                    <span className="text-sm text-gray-500 font-medium">Total Bot ISINs (2025)</span>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">2,556</span>
                        <span className="text-sm font-semibold text-green-600">+12% yoy</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                     <span className="text-sm text-gray-500 font-medium">Daily Average</span>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">53</span>
                        <span className="text-sm text-gray-400">ISINs / Day</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                     <span className="text-sm text-gray-500 font-medium">Market Coverage</span>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">42%</span>
                        <span className="text-sm font-semibold text-blue-600">Active</span>
                    </div>
                     <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                         <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                </div>
            </div>

            {/* Daily Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 text-lg">Daily ISIN Volume</h3>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['ytd', 'mtd', '30d'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold uppercase transition-all ${
                                    timeRange === range ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="h-48 w-full flex items-end justify-between gap-1">
                    {MOCK_DAILY_STATS.slice(0, 30).reverse().map((day, idx) => {
                        const heightPct = (day.count / maxDaily) * 100;
                        return (
                            <div key={idx} className="flex flex-col items-center flex-1 group relative">
                                <div 
                                    className="w-full bg-blue-100 hover:bg-blue-300 rounded-t-sm transition-all relative"
                                    style={{ height: `${heightPct}%` }}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                                        {day.date}: {day.count}
                                    </div>
                                </div>
                                <div className="h-px w-full bg-gray-200 mt-0.5"></div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400 uppercase font-bold">
                    <span>{MOCK_DAILY_STATS[29].date}</span>
                    <span>{MOCK_DAILY_STATS[0].date}</span>
                </div>
            </div>

            {/* Main Stats Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-gray-800 text-lg">Specialist Performance</h3>
                    
                    <div className="flex items-center gap-3">
                         <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Filter Currency:</span>
                            <select 
                                className="border rounded-md text-xs px-2 py-1 bg-white outline-none focus:ring-1 ring-gray-300"
                                value={currencyFilter}
                                onChange={(e) => setCurrencyFilter(e.target.value as any)}
                            >
                                <option value="all">All Currencies</option>
                                <option value="eur">EUR Only</option>
                                <option value="usd">USD Only</option>
                            </select>
                         </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th onClick={() => handleSort('name')} className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100">Specialist</th>
                                <th onClick={() => handleSort('usd')} className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-gray-100">$</th>
                                <th onClick={() => handleSort('eur')} className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-gray-100">€</th>
                                <th onClick={() => handleSort('aud')} className="px-4 py-3 text-right font-medium text-gray-400 cursor-pointer hover:bg-gray-100">AUD</th>
                                <th onClick={() => handleSort('chf')} className="px-4 py-3 text-right font-medium text-gray-400 cursor-pointer hover:bg-gray-100">CHF</th>
                                <th onClick={() => handleSort('gbp')} className="px-4 py-3 text-right font-medium text-gray-400 cursor-pointer hover:bg-gray-100">GBP</th>
                                <th onClick={() => handleSort('totalBot')} className="px-6 py-3 text-right font-bold cursor-pointer hover:bg-gray-100 bg-orange-50 text-orange-800">Bot Total</th>
                                <th onClick={() => handleSort('totalListed')} className="px-6 py-3 text-right font-medium cursor-pointer hover:bg-gray-100">Listed Total</th>
                                <th className="px-6 py-3 font-medium w-48">Coverage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSpecialists.map((stat, idx) => {
                                const coverage = Math.round((stat.totalBot / stat.totalListed) * 100);
                                return (
                                    <tr key={stat.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-700">{stat.name}</td>
                                        <td className="px-4 py-4 text-right font-mono text-gray-600">{stat.usd}</td>
                                        <td className="px-4 py-4 text-right font-mono text-gray-600">{stat.eur}</td>
                                        <td className="px-4 py-4 text-right font-mono text-gray-400">{stat.aud || '-'}</td>
                                        <td className="px-4 py-4 text-right font-mono text-gray-400">{stat.chf || '-'}</td>
                                        <td className="px-4 py-4 text-right font-mono text-gray-400">{stat.gbp || '-'}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-orange-600 bg-orange-50">{stat.totalBot}</td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-800">{(stat.totalListed || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold w-8 text-right">{coverage}%</span>
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                                                    <div 
                                                        className={`h-2 rounded-full ${coverage > 50 ? 'bg-green-500' : coverage > 20 ? 'bg-blue-500' : 'bg-gray-400'}`} 
                                                        style={{ width: `${coverage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* Total Row */}
                            <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                <td className="px-6 py-4">TOTAL</td>
                                <td className="px-4 py-4 text-right">{sortedSpecialists.reduce((a,b) => a+(b.usd || 0), 0)}</td>
                                <td className="px-4 py-4 text-right">{sortedSpecialists.reduce((a,b) => a+(b.eur || 0), 0)}</td>
                                <td className="px-4 py-4 text-right" colSpan={3}></td>
                                <td className="px-6 py-4 text-right text-orange-700 bg-orange-100">{sortedSpecialists.reduce((a,b) => a+(b.totalBot || 0), 0)}</td>
                                <td className="px-6 py-4 text-right">{sortedSpecialists.reduce((a,b) => a+(b.totalListed || 0), 0).toLocaleString()}</td>
                                <td className="px-6 py-4"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- Board Components ---

const BondCard = ({ item, onClick }: { item: BondItem, onClick: (item: BondItem) => void }) => {
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
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase ${isTooLate ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {(item.status || 'scraped').replace('_', ' ')}
            </span>
            {item.listingTrigger && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isTooLate ? 'bg-red-700 text-white' : 'bg-blue-100 text-blue-700'}`}>
                    {item.listingTrigger}
                </span>
            )}
        </div>
        <span className={`flex items-center text-xs ${isTooLate ? 'text-red-100' : 'text-gray-400'}`}>
          <span className="mr-1"><Icons.Clock /></span>
          {item.time}
        </span>
      </div>
      
      <h3 className={`font-semibold text-sm mb-1 truncate ${isTooLate ? 'text-white' : 'text-gray-900'}`}>{item.isin}</h3>
      <p className={`text-xs mb-2 line-clamp-2 ${isTooLate ? 'text-red-50' : 'text-gray-600'}`}>{item.issuer}</p>
      
      <div className="flex justify-between items-end mt-auto">
        <div className={`text-sm font-mono font-medium ${isTooLate ? 'text-white' : 'text-gray-800'}`}>
          {item.currency} {(item.amount || 0).toLocaleString()}
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

const KanbanColumn = ({ 
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

// --- Terminal States Table Component ---

const TerminalStatesTable = ({ items, onItemClick }: { items: BondItem[], onItemClick: (item: BondItem) => void }) => {
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

// --- Table View ---

const ListView = ({ items }: { items: BondItem[] }) => {
    const [sortField, setSortField] = useState<keyof BondItem>('time');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: keyof BondItem) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedItems = [...items].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (aVal === undefined || bVal === undefined) return 0;
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-auto flex-1">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>Status</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date')}>Date</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('time')}>Time</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('isin')}>ISIN</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('issuer')}>Issuer</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('amount')}>Size</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100">Type</th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-gray-100">Trigger</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedItems.map((item) => (
                            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.status)}`}>
                                        {item.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.time}</td>
                                <td className="px-6 py-4 font-mono font-medium text-blue-600">{item.isin}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{item.issuer}</td>
                                <td className="px-6 py-4 text-right font-mono">
                                    {item.currency} {(item.amount || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded border border-gray-200">
                                        {item.type || '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-blue-50 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-200">
                                        {item.listingTrigger || '-'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Google Sheets Hooks ---

const useGoogleSheetData = (initialData: BondItem[]) => {
    const [data, setData] = useState<BondItem[]>(initialData);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!SHEET_API_URL) return;

        const fetchData = async () => {
            try {
                const url = SHEET_API_URL.trim();
                const response = await fetch(url, {
                    method: 'GET',
                    redirect: 'follow',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8',
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const json = await response.json();
                
                if (Array.isArray(json)) {
                    // Sanitize Data: Ensure amount is a number to prevent toLocaleString error
                    const sanitizedData = json.map((item: any) => {
                        let normalizedStatus = (item.status || 'scraped').toString().toLowerCase().trim();
                        
                        // Map common variations to strict Status type
                        if (normalizedStatus === 'too late') normalizedStatus = 'too_late';
                        if (normalizedStatus === 'pass') normalizedStatus = 'passed';
                        if (normalizedStatus === 'trigger') normalizedStatus = 'triggered';
                        if (normalizedStatus === 'submit') normalizedStatus = 'submitted';
                        
                        // Default fallback if status is completely unknown
                        const validStatuses = ['scraped', 'triggered', 'submitted', 'passed', 'too_late'];
                        if (!validStatuses.includes(normalizedStatus)) {
                             normalizedStatus = 'scraped';
                        }

                        return {
                            ...item,
                            amount: typeof item.amount === 'number' ? item.amount : (Number(item.amount) || 0),
                            id: item.id || Math.random().toString(36).substr(2, 9),
                            status: normalizedStatus,
                            currency: item.currency || '€',
                            isin: item.isin || 'Unknown',
                            issuer: item.issuer || 'Unknown',
                            listingTrigger: item.listingTrigger || item.trigger || '',
                            time: item.time || '',
                            date: item.date || '',
                            minSize: item.minSize || '',
                            type: item.type || ''
                        };
                    });
                    
                    // Filter out rows that are effectively empty (no ISIN or "Unknown" ISIN combined with 0 amount)
                    const filteredData = sanitizedData.filter((item: BondItem) => {
                         // If ISIN is "Unknown" AND Amount is 0, it's likely an empty row from the sheet
                         if (item.isin === 'Unknown' && item.amount === 0) return false;
                         // If ISIN is explicitly empty string
                         if (!item.isin) return false;
                         return true;
                    });
                    
                    setData(filteredData);
                    setIsConnected(true);
                } else {
                     console.warn('Google Sheet response is not an array:', json);
                }
            } catch (error) {
                console.error("Failed to fetch Google Sheet data. Ensure script is deployed as 'Anyone'.", error);
                setIsConnected(false);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5000);
        return () => clearInterval(intervalId);
    }, []);

    return { data, setData, isConnected };
};


// --- Main App ---

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<'board' | 'list' | 'stats'>('board');
  const { data: items, setData, isConnected } = useGoogleSheetData(INITIAL_DATA);
  
  // Widget State
  const [autoTriggerRules, setAutoTriggerRules] = useState<AutoTriggerRule[]>(INITIAL_RULES);
  const [favoriteIssuers, setFavoriteIssuers] = useState<string[]>(INITIAL_ISSUERS);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBond, setSelectedBond] = useState<BondItem | null>(null);

  const handleAddISIN = (newItem: BondItem) => {
      setData([newItem, ...items]);
  };
  
  const handleUpdateISIN = (updatedItem: BondItem) => {
      setData(items.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  // Widget Handlers
  const addTriggerRule = (rule: Omit<AutoTriggerRule, 'id'>) => {
      setAutoTriggerRules([...autoTriggerRules, { ...rule, id: Math.random().toString() }]);
  };
  const removeTriggerRule = (id: string) => {
      setAutoTriggerRules(autoTriggerRules.filter(r => r.id !== id));
  };
  
  const addIssuer = (issuer: string) => {
      if (!favoriteIssuers.includes(issuer)) {
          setFavoriteIssuers([...favoriteIssuers, issuer]);
      }
  };
  const removeIssuer = (issuer: string) => {
      setFavoriteIssuers(favoriteIssuers.filter(i => i !== issuer));
  };

  const getPageTitle = () => {
      switch(view) {
          case 'board': return 'ISIN Flow';
          case 'list': return 'Global ISIN Registry';
          case 'stats': return 'Bot Listing Statistics';
          default: return '';
      }
  };

  if (!isLoggedIn) {
      return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-50 overflow-hidden">
      
      {/* Sidebar - Higher Z-Index */}
      <aside className="w-full lg:w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-50 flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white flex flex-col gap-2">
             <div className="flex items-center gap-2">
                <Logo className="w-8 h-8 rounded-sm object-contain" />
             </div>
             <span className="font-serif tracking-wide text-lg">MONOPOLI.MEIER <br/> & SON'S.</span>
          </h1>
          <p className="text-xs text-slate-500 mt-2">Bond Trading Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 hidden lg:block">
          <button 
            onClick={() => setView('board')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'board' ? 'bg-[#9F8A79] text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <Icons.Dashboard />
            <span className="font-medium">Flow Board</span>
          </button>
          
          <button 
             onClick={() => setView('list')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'list' ? 'bg-[#9F8A79] text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <Icons.List />
            <span className="font-medium">All ISINs</span>
          </button>

          <button 
             onClick={() => setView('stats')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'stats' ? 'bg-[#9F8A79] text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <Icons.BarChart />
            <span className="font-medium">Statistics</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <Icons.Settings />
            <span className="font-medium">Settings</span>
          </button>
        </nav>
        
        {/* Mobile Nav Links (Simple) */}
        <div className="lg:hidden flex gap-2 p-2 overflow-x-auto">
             <button onClick={() => setView('board')} className={`px-4 py-2 rounded text-sm whitespace-nowrap ${view === 'board' ? 'bg-[#9F8A79] text-white' : 'text-slate-300'}`}>Flow Board</button>
             <button onClick={() => setView('list')} className={`px-4 py-2 rounded text-sm whitespace-nowrap ${view === 'list' ? 'bg-[#9F8A79] text-white' : 'text-slate-300'}`}>All ISINs</button>
             <button onClick={() => setView('stats')} className={`px-4 py-2 rounded text-sm whitespace-nowrap ${view === 'stats' ? 'bg-[#9F8A79] text-white' : 'text-slate-300'}`}>Stats</button>
        </div>

        <div className="p-4 border-t border-slate-800 hidden lg:block">
            <div className="text-xs text-slate-500 mb-2">Connected as</div>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">BT</div>
                <div className="text-sm font-medium text-slate-200">BondTrader78</div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Top Header - Higher Z-Index */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8 shadow-sm z-40 flex-shrink-0">
           <div className="flex items-center gap-3">
               <h2 className="text-lg font-semibold text-gray-800">
                   {getPageTitle()}
               </h2>
               {!isConnected && (
                   <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded animate-pulse font-medium">
                       Connection Error
                   </span>
               )}
           </div>
           <div className="flex items-center gap-2 lg:gap-4">
               <span className="text-xs hidden md:inline text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
               {view !== 'stats' && (
                   <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-[#9F8A79] hover:bg-[#8a7566] text-white px-3 py-1.5 lg:px-4 lg:py-2 rounded-md text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                   >
                       + Add New
                   </button>
               )}
           </div>
        </header>

        {/* Content Area - Refactored for Single Scroll on Mobile */}
        {view === 'stats' ? (
            <StatsView />
        ) : (
            // On XL: Flex Row, Overflow Hidden (Split Panes). On Mobile: Flex Col, Overflow Auto (Single Scroll).
            <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden relative">
                
                {/* Right Widget Panel - Reordered to First on Mobile */}
                {view === 'board' && (
                    <div className="order-first xl:order-last w-full xl:w-80 bg-white border-b xl:border-b-0 xl:border-l border-gray-200 p-6 flex-shrink-0 xl:overflow-y-auto z-20 relative">
                        <AutoTriggerWidget 
                            rules={autoTriggerRules} 
                            onAdd={addTriggerRule} 
                            onRemove={removeTriggerRule} 
                        />
                        <FavoriteIssuersWidget 
                            issuers={favoriteIssuers} 
                            onAdd={addIssuer} 
                            onRemove={removeIssuer} 
                        />
                        <StatWidget title="ISIN Statistics">
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <div className="bg-purple-50 p-2 rounded-lg border border-purple-100 text-center">
                                    <div className="text-2xl font-bold text-purple-700">{items.filter(i => i.status === 'scraped').length}</div>
                                    <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wide">Scraped</div>
                                </div>
                                <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100 text-center">
                                    <div className="text-2xl font-bold text-yellow-700">{items.filter(i => i.status === 'triggered').length}</div>
                                    <div className="text-[10px] uppercase font-bold text-yellow-400 tracking-wide">Triggered</div>
                                </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center mb-3">
                                <span className="text-xs uppercase font-bold text-blue-500 tracking-wide">Submitted</span>
                                <span className="text-xl font-bold text-blue-700">{items.filter(i => i.status === 'submitted').length}</span>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-gray-100">
                                <div className="flex justify-between text-xs items-center">
                                    <span className="text-gray-500">Passed</span>
                                    <span className="font-mono font-medium text-gray-700">{items.filter(i => i.status === 'passed').length}</span>
                                </div>
                                <div className="flex justify-between text-xs items-center">
                                    <span className="text-gray-500">Too Late</span>
                                    <span className="font-mono font-medium text-red-600">{items.filter(i => i.status === 'too_late').length}</span>
                                </div>
                            </div>
                        </StatWidget>
                        <StatWidget title="System Status">
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Bot Status</span>
                                    <span className="text-green-600 font-bold">Active</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Scraper Latency</span>
                                    <span className="text-gray-800 font-mono">24ms</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                                </div>
                                <div className="text-xs text-right text-gray-400">92% Daily Quota</div>
                            </div>
                        </StatWidget>
                    </div>
                )}

                {/* Center Panel (Board or List) */}
                <div className="flex-1 xl:overflow-y-auto p-4 lg:p-6 min-w-0">
                    {view === 'board' ? (
                    <div className="flex flex-col gap-6">
                            {/* Top: Active Flow (Grid) - Mobile: Stacked, Auto Height. Desktop: Grid. */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                                <KanbanColumn 
                                    title="Scraped" 
                                    status="scraped" 
                                    items={items.filter(i => i.status === 'scraped')} 
                                    onItemClick={setSelectedBond}
                                />
                                <KanbanColumn 
                                    title="Triggered" 
                                    status="triggered" 
                                    items={items.filter(i => i.status === 'triggered')} 
                                    onItemClick={setSelectedBond}
                                />
                                <KanbanColumn 
                                    title="Submitted" 
                                    status="submitted" 
                                    items={items.filter(i => i.status === 'submitted')} 
                                    onItemClick={setSelectedBond}
                                />
                            </div>

                            {/* Bottom: Terminal States (Full Width Table) */}
                            <div className="flex flex-col shrink-0">
                                <TerminalStatesTable 
                                    items={items.filter(i => i.status === 'passed' || i.status === 'too_late')}
                                    onItemClick={setSelectedBond}
                                />
                            </div>
                    </div>
                    ) : (
                        <ListView items={items} />
                    )}
                </div>

            </div>
        )}
        
        {/* Modals */}
        <AddIsinModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
            onSave={handleAddISIN}
        />
        
        <BondDetailModal 
            item={selectedBond}
            isOpen={!!selectedBond}
            onClose={() => setSelectedBond(null)}
            onSave={handleUpdateISIN}
        />
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);