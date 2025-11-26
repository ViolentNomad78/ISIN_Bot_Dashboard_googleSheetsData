
import { useState, useEffect } from 'react';
import { BondItem } from '../types';
import { supabase } from '../supabaseClient';
import { formatSheetDate, formatSheetTime } from '../utils';
import { SUPABASE_URL } from '../data';

// Helper to map raw DB row to application type
const mapSupabaseItemToBondItem = (item: any): BondItem => ({
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
});

export const useSupabaseData = (initialData: BondItem[]) => {
    const [data, setData] = useState<BondItem[]>(initialData);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!SUPABASE_URL || SUPABASE_URL.includes('your-project')) {
            console.warn("Supabase credentials missing.");
            return;
        }

        const fetchInitialData = async () => {
            try {
                // CHANGED: Updated to scraped_bond_isins
                const { data: bonds, error } = await supabase
                    .from('scraped_bond_isins')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching data:', error);
                    setIsConnected(false);
                    return;
                }

                if (bonds) {
                    setData(bonds.map(mapSupabaseItemToBondItem));
                    setIsConnected(true);
                }
            } catch (err) {
                console.error(err);
                setIsConnected(false);
            }
        };

        fetchInitialData();

        // Subscribe to Realtime Changes
        // CHANGED: Updated to scraped_bond_isins
        const channel = supabase
            .channel('bond_isins_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scraped_bond_isins' }, (payload) => {
                console.log('Realtime INSERT received:', payload);
                const newItem = mapSupabaseItemToBondItem(payload.new);
                setData(prev => [newItem, ...prev]);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scraped_bond_isins' }, (payload) => {
                console.log('Realtime UPDATE received:', payload);
                const updatedItem = mapSupabaseItemToBondItem(payload.new);
                setData(prev => prev.map(item => item.isin === updatedItem.isin ? updatedItem : item));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'scraped_bond_isins' }, (payload) => {
                console.log('Realtime DELETE received');
                // For delete, we might need ID. If ID is present in payload.old (requires full replica identity), use it.
                // Otherwise, simple refetch to be safe.
                if (payload.old && (payload.old as any).id) {
                     setData(prev => prev.filter(item => item.id !== (payload.old as any).id));
                } else {
                    fetchInitialData();
                }
            })
            .subscribe((status) => {
                console.log('Supabase Subscription Status:', status);
                if (status === 'SUBSCRIBED') setIsConnected(true);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { data, setData, isConnected };
};
