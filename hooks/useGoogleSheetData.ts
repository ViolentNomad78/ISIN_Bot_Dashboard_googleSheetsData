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
                    const sanitizedData = json.map((item: any) => {
                        // Helper to safely get value from multiple possible key casing/variations
                        const getVal = (keys: string[]) => {
                            for (const k of keys) {
                                // Check exact match
                                if (item[k] !== undefined && item[k] !== null && item[k] !== '') return item[k];
                                // Check lowercase match
                                const lowerKey = Object.keys(item).find(key => key.toLowerCase() === k.toLowerCase());
                                if (lowerKey && item[lowerKey] !== undefined && item[lowerKey] !== null && item[lowerKey] !== '') return item[lowerKey];
                            }
                            return undefined;
                        };

                        let normalizedStatus = (getVal(['status', 'Status', 'STATUS']) || 'scraped').toString().toLowerCase().trim();
                        
                        // Map common variations to strict Status type
                        if (normalizedStatus === 'too late') normalizedStatus = 'too_late';
                        if (normalizedStatus === 'pass') normalizedStatus = 'passed';
                        if (normalizedStatus === 'trigger') normalizedStatus = 'triggered';
                        if (normalizedStatus === 'submit') normalizedStatus = 'submitted';
                        
                        // Default fallback
                        const validStatuses = ['scraped', 'triggered', 'submitted', 'passed', 'too_late'];
                        if (!validStatuses.includes(normalizedStatus)) {
                             normalizedStatus = 'scraped';
                        }

                        // Get raw Min Size string
                        const minSizeStr = getVal(['Minimum Size', 'MinimumSize', 'minSize', 'min_size', 'Min Size']) || '';

                        // Parse amount: Try explicit Amount column first, fallback to parsing Minimum Size
                        let amount = 0;
                        const rawAmount = getVal(['amount', 'Amount', 'AMOUNT', 'size', 'Size']);
                        
                        if (rawAmount) {
                            amount = typeof rawAmount === 'number' ? rawAmount : (Number(rawAmount) || 0);
                        } else if (minSizeStr) {
                            // Parse "100.000" or "100k" or "100k x 1k"
                            let cleanStr = String(minSizeStr).toLowerCase().split('x')[0].trim(); // Take first part of "100k x 1k"
                            cleanStr = cleanStr.replace(/\./g, '').replace(/,/g, ''); // Remove separators
                            if (cleanStr.includes('k')) {
                                amount = parseFloat(cleanStr) * 1000;
                            } else {
                                amount = parseFloat(cleanStr) || 0;
                            }
                        }

                        return {
                            ...item,
                            id: getVal(['id', 'ID', 'Id']) || Math.random().toString(36).substr(2, 9),
                            isin: getVal(['isin', 'ISIN', 'Isin']) || 'Unknown',
                            issuer: getVal(['issuer', 'Issuer', 'ISSUER']) || 'Unknown',
                            amount: amount,
                            currency: getVal(['currency', 'Currency', 'Curr']) || '€',
                            status: normalizedStatus,
                            type: getVal(['Type', 'type', 'TYPE']) || '',
                            listingTrigger: getVal(['Listing Trigger', 'ListingTrigger', 'listingTrigger', 'trigger', 'Trigger']) || '',
                            time: getVal(['Email Time', 'EmailTime', 'email_time', 'time', 'Time']) || '',
                            date: getVal(['Email Date', 'EmailDate', 'email_date', 'date', 'Date']) || '',
                            minSize: minSizeStr,
                            submissionPlace: getVal(['Submission Place', 'SubmissionPlace', 'submissionPlace', 'Place']) || undefined,
                            turnaroundTime: getVal(['Turnaround und Time for Listing', 'TurnaroundTime', 'turnaroundTime', 'Turnaround']) || undefined
                        };
                    });
                    
                    // Filter out empty rows
                    const filteredData = sanitizedData.filter((item: BondItem) => {
                         if ((!item.isin || item.isin === 'Unknown') && item.amount === 0) return false;
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