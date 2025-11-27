
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { T7Instrument } from '../types';
import { Icons } from '../Icons';

export const T7View = () => {
    const [data, setData] = useState<T7Instrument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    
    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        dateFrom: '', // First Trading Date From
        dateTo: '',   // First Trading Date To
        specialist: '', // Name or ID
        currency: 'all',
        instrumentStatus: 'all',
        productStatus: 'all'
    });

    // Debounce search/filter triggers
    const [activeFilters, setActiveFilters] = useState(filters);
    const [activeSearch, setActiveSearch] = useState('');

    // Pagination state
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 50;

    // Apply filters with a delay or on enter
    useEffect(() => {
        const timer = setTimeout(() => {
            setActiveSearch(searchQuery);
            setActiveFilters(filters);
            setPage(0); // Reset to page 0 on filter change
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, filters]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('t7_ffm_instruments')
                .select('*', { count: 'exact' });

            // 1. Global Search (ISIN or Instrument Name)
            if (activeSearch) {
                // Using generic search on text columns
                query = query.or(`isin.ilike.%${activeSearch}%,instrument.ilike.%${activeSearch}%`);
            }

            // 2. Advanced Filters
            if (activeFilters.currency !== 'all') {
                query = query.eq('currency', activeFilters.currency);
            }
            if (activeFilters.instrumentStatus !== 'all') {
                query = query.eq('instrument_status', activeFilters.instrumentStatus);
            }
            if (activeFilters.productStatus !== 'all') {
                query = query.eq('product_status', activeFilters.productStatus);
            }
            
            // Specialist: Search in Name OR Member ID
            if (activeFilters.specialist) {
                query = query.or(`specialist.ilike.%${activeFilters.specialist}%,specialist_member_id.ilike.%${activeFilters.specialist}%`);
            }

            // Date Range (Targeting First Trading Date usually, or we could add logic for others)
            if (activeFilters.dateFrom) {
                query = query.gte('first_trading_date', activeFilters.dateFrom);
            }
            if (activeFilters.dateTo) {
                query = query.lte('first_trading_date', activeFilters.dateTo);
            }

            // Pagination
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            
            const { data: instruments, error, count } = await query
                .order('updated_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (count !== null) setTotalCount(count);

            if (instruments) {
                const mapped: T7Instrument[] = instruments.map(i => ({
                    isin: i.isin,
                    instrumentName: i.instrument,
                    wkn: i.wkn,
                    productStatus: i.product_status,
                    instrumentStatus: i.instrument_status,
                    issueDate: i.issue_date,
                    maturityDate: i.maturity_date,
                    minTradableUnit: i.min_size,
                    specialistId: i.specialist_member_id,
                    specialistName: i.specialist,
                    currency: i.currency,
                    firstTradingDate: i.first_trading_date,
                    lastTradingDate: i.last_trading_date,
                    updatedAt: i.updated_at
                }));
                setData(mapped);
            }
        } catch (err: any) {
            console.error('Error fetching T7 data:', err);
            let errMsg = 'An unexpected error occurred';
            if (typeof err === 'object' && err !== null) {
                const msg = err.message || err.error_description || err.details;
                if (msg) errMsg = String(msg);
            }
            setError(errMsg);
        } finally {
            setIsLoading(false);
        }
    }, [page, activeSearch, activeFilters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('de-DE');
    };

    return (
        <div className="bg-slate-50 min-h-full flex flex-col gap-6 p-4 lg:p-6 overflow-hidden h-full">
             {/* Header Controls */}
             <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Icons.Database />
                            T7 FFM Instruments
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {totalCount.toLocaleString()} instruments found
                        </p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                        <div className="relative group w-full md:w-80">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#9F8A79]">
                                <Icons.Search />
                            </div>
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#9F8A79] focus:border-transparent transition-all bg-white text-black placeholder-gray-400"
                                placeholder="Search ISIN or Instrument Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${showFilters ? 'bg-[#9F8A79] text-white border-[#9F8A79]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Icons.Settings />
                            Filters
                            {showFilters ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                        </button>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">First Trading (From - To)</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="date" 
                                    className="w-full border rounded px-2 py-1.5 text-sm outline-none focus:ring-1 ring-[#9F8A79] bg-white text-gray-900"
                                    value={filters.dateFrom}
                                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                />
                                <span className="text-gray-400">-</span>
                                <input 
                                    type="date" 
                                    className="w-full border rounded px-2 py-1.5 text-sm outline-none focus:ring-1 ring-[#9F8A79] bg-white text-gray-900"
                                    value={filters.dateTo}
                                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Specialist (Name/ID)</label>
                            <input 
                                type="text" 
                                placeholder="e.g. SEYFR or Baader"
                                className="w-full border rounded px-2 py-1.5 text-sm outline-none focus:ring-1 ring-[#9F8A79] bg-white text-gray-900"
                                value={filters.specialist}
                                onChange={(e) => handleFilterChange('specialist', e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Currency</label>
                            <select 
                                className="w-full border rounded px-2 py-1.5 text-sm outline-none focus:ring-1 ring-[#9F8A79] bg-white text-gray-900"
                                value={filters.currency}
                                onChange={(e) => handleFilterChange('currency', e.target.value)}
                            >
                                <option value="all">All Currencies</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="GBP">GBP</option>
                                <option value="CHF">CHF</option>
                                <option value="AUD">AUD</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                            <div className="flex gap-2">
                                <select 
                                    className="w-full border rounded px-2 py-1.5 text-sm outline-none focus:ring-1 ring-[#9F8A79] bg-white text-gray-900"
                                    value={filters.instrumentStatus}
                                    onChange={(e) => handleFilterChange('instrumentStatus', e.target.value)}
                                >
                                    <option value="all">Inst. Status (All)</option>
                                    <option value="ACTV">Active (ACTV)</option>
                                    <option value="SUSP">Suspended (SUSP)</option>
                                    <option value="HALT">Halted (HALT)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative shrink-0" role="alert">
                    <strong className="font-bold">Database Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
                <div className="overflow-auto flex-1 w-full relative">
                    <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[120px]">ISIN</th>
                                <th className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[100px]">WKN</th>
                                <th className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[250px]">Instrument Name</th>
                                <th className="px-4 py-3 font-bold bg-gray-50 border-b text-center w-16">Curr</th>
                                <th className="px-4 py-3 font-bold bg-gray-50 border-b text-right min-w-[100px]">Min Size</th>
                                <th className="px-4 py-3 font-bold bg-gray-50 border-b text-center min-w-[80px]">Status</th>
                                <th className="px-4 py-3 font-bold bg-gray-50 border-b text-center min-w-[80px]">Prod. Stat</th>
                                <th className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[200px]">Specialist</th>
                                <th className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[100px]">Issue Date</th>
                                <th className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[100px]">First Trading</th>
                                <th className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[100px]">Last Trading</th>
                                <th className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[100px]">Maturity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={12} className="px-6 py-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9F8A79] mb-4"></div>
                                            <span>Loading market data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="px-6 py-20 text-center text-gray-500 bg-white">
                                        {error ? 'Could not load data.' : 'No instruments found matching your criteria.'}
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.isin} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-2 font-mono text-blue-600 font-medium sticky left-0 bg-white group-hover:bg-gray-50">{item.isin}</td>
                                        <td className="px-4 py-2 font-mono text-gray-600">{item.wkn || '-'}</td>
                                        <td className="px-4 py-2 font-medium text-gray-800 truncate max-w-[300px]" title={item.instrumentName}>{item.instrumentName}</td>
                                        <td className="px-4 py-2 text-center font-mono font-bold text-gray-600">{item.currency}</td>
                                        <td className="px-4 py-2 text-right font-mono text-gray-600">
                                            {item.minTradableUnit?.toLocaleString('de-DE')}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                                item.instrumentStatus === 'ACTV' 
                                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                                    : item.instrumentStatus === 'SUSP'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                                {item.instrumentStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center text-xs text-gray-500">{item.productStatus}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-gray-700 truncate max-w-[180px]" title={item.specialistName}>{item.specialistName}</span>
                                                <span className="text-[10px] font-mono text-gray-400">{item.specialistId}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 text-xs">{formatDate(item.issueDate)}</td>
                                        <td className="px-4 py-2 text-gray-600 text-xs">{formatDate(item.firstTradingDate)}</td>
                                        <td className="px-4 py-2 text-gray-600 text-xs">{formatDate(item.lastTradingDate)}</td>
                                        <td className="px-4 py-2 text-gray-600 text-xs">{formatDate(item.maturityDate)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 border-t border-gray-200 p-3 flex justify-between items-center text-xs text-gray-500 shrink-0">
                    <span>
                        Showing {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                        >
                            Previous
                        </button>
                        <button 
                            disabled={(page + 1) * PAGE_SIZE >= totalCount}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
