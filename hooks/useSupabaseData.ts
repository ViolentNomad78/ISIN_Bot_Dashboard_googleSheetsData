
import { useState, useEffect } from 'react';
import { BondItem } from '../types';
import { supabase } from '../supabaseClient';
import { formatSheetDate, formatSheetTime } from '../utils';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../data';

export const useSupabaseData = (initialData: BondItem[]) => {
    const [data, setData] = useState<BondItem[]>(initialData);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // 1. Validation: Check if credentials are set
        if (!SUPABASE_URL || SUPABASE_URL.includes('your-project') || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('your-anon-key')) {
            console.warn("Supabase credentials are missing or placeholders. Using Initial/Mock Data.");
            return;
        }

        // 2. Fetch Initial Data
        const fetchInitialData = async () => {
            try {
                // Changed table from 'bonds' to 'bond_isins' based on error hint
                const { data: bonds, error } = await supabase
                    .from('bond_isins')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching Supabase data:', JSON.stringify(error, null, 2));
                    setIsConnected(false);
                    return;
                }

                if (bonds) {
                    const formattedData: BondItem[] = bonds.map((item: any) => ({
                        id: item.id,
                        isin: item.isin,
                        issuer: item.issuer,
                        amount: item.amount,
                        currency: item.currency || '€',
                        status: item.status || 'scraped',
                        type: item.type,
                        listingTrigger: item.listing_trigger,
                        time: formatSheetTime(item.email_time || item.email_at),
                        date: formatSheetDate(item.email_date || item.email_at),
                        minSize: item.min_size,
                        submissionPlace: item.submission_place,
                        turnaroundTime: formatSheetTime(item.turnaround_time),
                        triggeredDate: item.triggered_at ? new Date(item.triggered_at).toLocaleDateString() : undefined,
                        submittedDate: item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : undefined,
                    }));
                    
                    setData(formattedData);
                    setIsConnected(true);
                }
            } catch (err) {
                console.error('Unexpected error in Supabase client:', err);
                setIsConnected(false);
            }
        };

        fetchInitialData();

        // 3. Subscribe to Realtime Updates
        const channel = supabase
            .channel('public:bond_isins') // Update channel name
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bond_isins' }, (payload) => {
                console.log('Realtime update received, refreshing data...');
                fetchInitialData(); 
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Subscription active
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { data, setData, isConnected };
};
