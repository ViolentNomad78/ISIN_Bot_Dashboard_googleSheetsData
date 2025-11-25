

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookrunnerStat } from '../types';
import { BOOKRUNNER_MAPPINGS } from '../mappings';

export const useBookrunnerStats = (startDate: Date | null, endDate: Date | null, currencyFilter: string) => {
    const [stats, setStats] = useState<BookrunnerStat[]>([]);
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
                    return;
                }

                // Temporary Map to aggregate normalized banks
                // Key = Standardized Name, Value = BookrunnerStat object
                const aggregatedMap = new Map<string, BookrunnerStat>();

                let totalDealsInPeriod = 0;

                data.forEach((br: any) => {
                    const junctionRows = br.bond_bookrunners || [];
                    
                    // 1. Normalize the Bookrunner Name
                    const rawNameLower = (br.name || '').toLowerCase().trim();
                    const standardName = BOOKRUNNER_MAPPINGS[rawNameLower] || br.name || 'Unknown';

                    // 2. Filter Deals
                    const validDeals = junctionRows
                        .map((join: any) => join.bond_isins)
                        .filter((bond: any) => !!bond)
                        .filter((bond: any) => {
                             // Currency Filter
                             if (currencyFilter !== 'all') {
                                 const c = (bond.currency || '').toUpperCase();
                                 if (currencyFilter === 'EUR' && !c.includes('EUR') && c !== '€') return false;
                                 if (currencyFilter === 'USD' && !c.includes('USD') && c !== '$') return false;
                             }

                             // Date Filter
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
                                if (dealDate < start) return false;
                             }
                             
                             if (endDate) {
                                 const end = new Date(endDate);
                                 end.setHours(23, 59, 59, 999);
                                 if (dealDate > end) return false;
                             }

                             return true;
                        })
                        .map((bond: any) => ({
                            isin: bond.isin,
                            date: bond.email_at ? new Date(bond.email_at).toLocaleDateString('de-DE') : new Date(bond.created_at).toLocaleDateString('de-DE'),
                            issuer: bond.issuer || 'Unknown',
                            currency: bond.currency || '-'
                        }));

                    if (validDeals.length === 0) return;

                    totalDealsInPeriod += validDeals.length;

                    // 3. Aggregate into the Map
                    if (aggregatedMap.has(standardName)) {
                        const existing = aggregatedMap.get(standardName)!;
                        existing.deals.push(...validDeals);
                        existing.dealCount += validDeals.length;
                        
                        // Update lastActive if newer
                        // (Simplified string comparison, ideally parse dates)
                        if (existing.deals[0].date && (!existing.lastActive || existing.deals[0].date > existing.lastActive)) {
                            // existing.lastActive = existing.deals[0].date;
                            // Note: We'll resort deals later anyway
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
                
                // Calculate Market Share & Sort
                activeStats.forEach(stat => {
                    stat.marketShare = totalDealsInPeriod > 0 
                        ? (stat.dealCount / totalDealsInPeriod) * 100 
                        : 0;
                    
                    // Sort deals by date desc (simple string comparison for DE format DD.MM.YYYY works poorly, 
                    // ideally we keep raw date objects, but for now relying on insertion order or simple reverse)
                    // We simply take the first one as "lastActive" based on DB order usually being chronological
                });

                // Sort Bookrunners by Deal Count descending
                activeStats.sort((a, b) => b.dealCount - a.dealCount);

                setStats(activeStats);
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

    return { stats, isLoading };
};