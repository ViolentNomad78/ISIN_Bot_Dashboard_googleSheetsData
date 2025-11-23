import { useState, useEffect } from 'react';
import { BondItem } from '../types';
import { SHEET_API_URL } from '../data';

export const useGoogleSheetData = (initialData: BondItem[]) => {
    const [data, setData] = useState<BondItem[]>(initialData);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!SHEET_API_URL) return;

        const fetchData = async () => {
            try {
                const response = await fetch(SHEET_API_URL);
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
                }
            } catch (error) {
                console.error("Failed to fetch Google Sheet data", error);
                setIsConnected(false);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5000);
        return () => clearInterval(intervalId);
    }, []);

    return { data, setData, isConnected };
};
