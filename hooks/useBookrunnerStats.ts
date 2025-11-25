
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookrunnerStat } from '../types';
import { BOOKRUNNER_MAPPINGS } from '../mappings';

// Helper to normalize currency strings (e.g. '€' -> 'EUR')
const normalizeCurrency = (c: string): string => {
    if (!c) return 'UNKNOWN';
    const upper = c.toUpperCase().trim();
    if (upper === '€' || upper.includes('EUR')) return 'EUR';
    if (upper === '$' || upper.includes('USD')) return 'USD';
    if (upper === '£' || upper.includes('GBP')) return 'GBP';
    if (upper === '¥' || upper.includes('JPY')) return 'JPY';
    if (upper.includes('CHF')) return 'CHF';
    if (upper.includes('AUD')) return 'AUD';
    if (upper.includes('NOK')) return 'NOK';
    if (upper.includes('SEK')) return 'SEK';
    return upper;
};

export const useBookrunnerStats = (startDate: Date | null, endDate: Date | null, currencyFilter: string) => {
    const [stats, setStats] = useState<BookrunnerStat[]>([]);
    const [currencies, setCurrencies] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBookrunners = async () => {
            setIsLoading(true);
            try {
                // Fetch bookrunners and their related bond_isins via the junction table bond_bookrunners
                const { data, error } = await supabase
                    .from('bookrunners')
                    .select(`
                        id,
                        name,
                        bond_bookrunners (
                            bond_isins (
                                isin,
                                created_at,
                                email_at,
                                issuer,
                                currency
                            )
                        )
                    `);

                if (error) {
                    console.error("Error fetching bookrunners:", JSON.stringify(error, null, 2));
                    setIsLoading(false);
                    return;
                }

                if (!data) {
                    setStats([]);
                    setCurrencies([]);
                    return;
                }

                const aggregatedMap = new Map<string, BookrunnerStat>();
                const foundCurrencies = new Set<string>();
                let totalDealsInPeriod = 0;

                data.forEach((br: any) => {
                    const junctionRows = br.bond_bookrunners || [];
                    
                    // 1. Normalize the Bookrunner Name
                    const rawNameLower = (br.name || '').toLowerCase().trim();
                    const standardName = BOOKRUNNER_MAPPINGS[rawNameLower] || br.name || 'Unknown';

                    // 2. Process Deals
                    const validDeals: any[] = [];

                    junctionRows.forEach((join: any) => {
                        const bond = join.bond_isins;
                        if (!bond) return;

                        // Check Date Filter First
                        let dealDate = new Date(bond.created_at);
                        if (bond.email_at) {
                            const d = new Date(bond.email_at);
                            if (!isNaN(d.getTime())) {
                                dealDate = d;
                            }
                        }

                        if (startDate) {
                            const start = new Date(startDate);
                            start.setHours(0,0,0,0);
                            if (dealDate < start) return;
                        }
                        
                        if (endDate) {
                            const end = new Date(endDate);
                            end.setHours(23, 59, 59, 999);
                            if (dealDate > end) return;
                        }

                        // Collect Currency (Normalized) - Capture ALL currencies present in this date range
                        const rawCurrency = bond.currency || '';
                        const normalizedCurr = normalizeCurrency(rawCurrency);
                        foundCurrencies.add(normalizedCurr);

                        // Check Currency Filter
                        if (currencyFilter !== 'all') {
                             if (normalizedCurr !== currencyFilter) return;
                        }

                        // If we passed filters, add to list
                        validDeals.push({
                            isin: bond.isin,
                            date: bond.email_at ? new Date(bond.email_at).toLocaleDateString('de-DE') : new Date(bond.created_at).toLocaleDateString('de-DE'),
                            issuer: bond.issuer || 'Unknown',
                            currency: rawCurrency === '€' ? 'EUR' : (rawCurrency === '$' ? 'USD' : normalizedCurr)
                        });
                    });

                    if (validDeals.length === 0) return;

                    totalDealsInPeriod += validDeals.length;

                    // 3. Aggregate into the Map
                    if (aggregatedMap.has(standardName)) {
                        const existing = aggregatedMap.get(standardName)!;
                        existing.deals.push(...validDeals);
                        existing.dealCount += validDeals.length;
                        
                        // Update lastActive if newer
                        if (validDeals[0].date && (!existing.lastActive || validDeals[0].date > existing.lastActive)) {
                             // Keep logic simple for now
                        }
                    } else {
                        aggregatedMap.set(standardName, {
                            id: standardName, // Use name as ID for aggregated row
                            name: standardName,
                            dealCount: validDeals.length,
                            marketShare: 0,
                            lastActive: validDeals.length > 0 ? validDeals[0].date : null,
                            deals: validDeals
                        });
                    }
                });

                // Convert Map to Array
                const activeStats = Array.from(aggregatedMap.values());
                
                // Calculate Market Share
                activeStats.forEach(stat => {
                    stat.marketShare = totalDealsInPeriod > 0 
                        ? (stat.dealCount / totalDealsInPeriod) * 100 
                        : 0;
                });

                // Sort Bookrunners by Deal Count descending
                activeStats.sort((a, b) => b.dealCount - a.dealCount);

                setStats(activeStats);
                setCurrencies(Array.from(foundCurrencies).sort());

            } catch (err) {
                console.error("Unexpected error fetching bookrunners:", err instanceof Error ? err.message : JSON.stringify(err));
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookrunners();

        const channel = supabase
            .channel('bookrunners_realtime_tracker')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bond_isins' }, () => fetchBookrunners())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bond_bookrunners' }, () => fetchBookrunners())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [startDate, endDate, currencyFilter]);

    return { stats, currencies, isLoading };
};
