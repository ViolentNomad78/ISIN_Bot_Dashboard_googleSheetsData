import { useState, useEffect } from 'react';
import { BondItem } from '../types';
import { SHEET_API_URL } from '../data';
import { formatSheetDate, formatSheetTime } from '../utils';

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
                        // Helper to safely get value using flexible key matching
                        // Handles: Exact match, case-insensitive, and ignores whitespace/newlines/underscores
                        const getVal = (targetKeys: string[]) => {
                            // 1. Try exact match first
                            for (const key of targetKeys) {
                                if (item[key] !== undefined && item[key] !== null && item[key] !== '') return item[key];
                            }

                            // 2. fuzzy match: normalize keys (lowercase, remove spaces/newlines/underscores)
                            const normalize = (str: string) => str.toLowerCase().replace(/[\s\n\r_]+/g, '');
                            const normalizedTargets = targetKeys.map(normalize);
                            
                            const itemKeys = Object.keys(item);
                            const foundKey = itemKeys.find(k => normalizedTargets.includes(normalize(k)));
                            
                            if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null && item[foundKey] !== '') {
                                return item[foundKey];
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

                        // Get raw date/time
                        const rawTime = getVal(['Email Time', 'EmailTime', 'time']);
                        const rawDate = getVal(['Email Date', 'EmailDate', 'date']);
                        
                        // Specific logic for Column T (Turnaround Time)
                        // Header in screenshot: "Turnaro\nund\nTime for\nListing"
                        let rawTurnaround = undefined;
                        const allKeys = Object.keys(item);
                        // Find key that contains "turnaro" (or turnaround) AND "listing" to be specific
                        const turnaroundKey = allKeys.find(k => {
                            const lower = k.toLowerCase();
                            return (lower.includes('turnaro') || lower.includes('turnaround')) && lower.includes('listing');
                        });
                        
                        if (turnaroundKey) {
                            rawTurnaround = item[turnaroundKey];
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
                            time: formatSheetTime(rawTime),
                            date: formatSheetDate(rawDate),
                            // Map Triggered and Submitted timestamps
                            triggeredDate: formatSheetDate(getVal(['Trigger Date', 'TriggerDate', 'trigger_date'])),
                            triggeredTime: formatSheetTime(getVal(['Trigger Time', 'TriggerTime', 'trigger_time'])),
                            submittedDate: formatSheetDate(getVal(['Submitted Date', 'Submission Date', 'submitted_date', 'Listed Date'])),
                            submittedTime: formatSheetTime(getVal(['Submitted Time', 'Submission Time', 'submitted_time'])),
                            
                            minSize: minSizeStr,
                            submissionPlace: getVal(['Submission Place', 'SubmissionPlace', 'submissionPlace', 'Place']) || undefined,
                            turnaroundTime: formatSheetTime(rawTurnaround) 
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