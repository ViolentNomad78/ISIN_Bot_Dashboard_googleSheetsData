
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookrunnerStat } from '../types';

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

                let totalDealsInPeriod = 0;

                const aggregated: BookrunnerStat[] = data.map((br: any) => {
                    const junctionRows = br.bond_bookrunners || [];
                    
                    const validDeals = junctionRows
                        .map((join: any) => join.bond_isins)
                        .filter((bond: any) => !!bond)
                        .filter((bond: any) => {
                             // 1. Currency Filter
                             if (currencyFilter !== 'all') {
                                 // Basic normalization: '$' -> 'USD', '€' -> 'EUR' check
                                 const c = (bond.currency || '').toUpperCase();
                                 if (currencyFilter === 'EUR' && !c.includes('EUR') && c !== '€') return false;
                                 if (currencyFilter === 'USD' && !c.includes('USD') && c !== '$') return false;
                             }

                             // 2. Date Filter
                             // Prefer email_at if available, else created_at
                             let dealDate = new Date(bond.created_at);
                             if (bond.email_at) {
                                 const d = new Date(bond.email_at);
                                 if (!isNaN(d.getTime())) {
                                    dealDate = d;
                                 }
                             }
                             
                             if (startDate) {
                                // Reset startDate time to 00:00:00 for accurate comparison
                                const start = new Date(startDate);
                                start.setHours(0,0,0,0);
                                if (dealDate < start) return false;
                             }
                             
                             if (endDate) {
                                 // Set endDate to end of day
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

                    totalDealsInPeriod += validDeals.length;

                    return {
                        id: br.id,
                        name: br.name,
                        dealCount: validDeals.length,
                        marketShare: 0, 
                        lastActive: validDeals.length > 0 ? validDeals[0].date : null, // Approx last active from list
                        deals: validDeals
                    };
                });

                // Filter out bookrunners with 0 deals in the selected period
                const activeStats = aggregated.filter(s => s.dealCount > 0);
                
                // Calculate Market Share
                activeStats.forEach(stat => {
                    stat.marketShare = totalDealsInPeriod > 0 
                        ? (stat.dealCount / totalDealsInPeriod) * 100 
                        : 0;
                });

                // Sort by Deal Count descending
                activeStats.sort((a, b) => b.dealCount - a.dealCount);

                setStats(activeStats);
            } catch (err) {
                console.error("Unexpected error fetching bookrunners:", err instanceof Error ? err.message : JSON.stringify(err));
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookrunners();
    }, [startDate, endDate, currencyFilter]); // Re-run when filters change

    return { stats, isLoading };
};
