
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { T7Instrument } from '../types';
import { Icons } from '../Icons';

// --- Simple SVG Pie Chart Component ---
const SimplePieChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    let currentAngle = 0;

    if (total === 0) return <div className="text-gray-400 text-xs text-center py-8">No data for chart</div>;

    return (
        <div className="flex flex-col items-center gap-4 w-full h-full justify-center">
            <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="-1 -1 2 2" className="w-full h-full rotate-[-90deg]">
                    {data.map((slice, i) => {
                        const sliceAngle = (slice.value / total) * 2 * Math.PI;
                        
                        // Handle single slice case (100%)
                        if (slice.value === total) {
                            return <circle key={i} cx="0" cy="0" r="1" fill={slice.color} />;
                        }

                        const x1 = Math.cos(currentAngle);
                        const y1 = Math.sin(currentAngle);
                        const x2 = Math.cos(currentAngle + sliceAngle);
                        const y2 = Math.sin(currentAngle + sliceAngle);

                        const largeArc = sliceAngle > Math.PI ? 1 : 0;

                        const pathData = `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArc} 1 ${x2} ${y2} Z`;
                        currentAngle += sliceAngle;
                        
                        return (
                            <path 
                                key={i} 
                                d={pathData} 
                                fill={slice.color} 
                                stroke="white" 
                                strokeWidth="0.05"
                            />
                        );
                    })}
                    {/* Inner circle for Donut effect */}
                    <circle cx="0" cy="0" r="0.6" fill="white" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
                    <span className="text-sm font-bold text-gray-800 leading-none">{total}</span>
                </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-col gap-1.5 w-full overflow-y-auto max-h-32 pr-2 scrollbar-hide">
                {data.map((slice, i) => (
                    <div key={i} className="flex items-center justify-between text-xs w-full">
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                            <span className="text-gray-600 truncate" title={slice.label}>{slice.label}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                             <span className="font-bold text-gray-700 w-8 text-right">{Math.round((slice.value / total) * 100)}%</span>
                             <span className="text-gray-400 min-w-[30px] text-right font-mono text-[10px]">({slice.value})</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const T7View = () => {
    const [data, setData] = useState<T7Instrument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [specialistOptions, setSpecialistOptions] = useState<string[]>([]);
    const [statusOptions, setStatusOptions] = useState<string[]>([]);
    
    // Stats State
    const [statsData, setStatsData] = useState<{ label: string; value: number; color: string }[]>([]);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    
    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(true);
    const [filters, setFilters] = useState({
        dateFrom: '', // First Trading Date From
        dateTo: '',   // First Trading Date To
        specialist: 'all', // Name or ID
        currency: 'all',
        instrumentStatus: 'all',
        // productStatus removed
    });

    // Sorting State
    const [sortField, setSortField] = useState<string>('updated_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Debounce search/filter triggers
    const [activeFilters, setActiveFilters] = useState(filters);
    const [activeSearch, setActiveSearch] = useState('');

    // Pagination state
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 50;

    // Fetch Unique Options (Specialists & Statuses) on Mount
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                // Fetch Specialists
                const { data: specData } = await supabase
                    .from('t7_ffm_instruments')
                    .select('specialist');
                
                if (specData) {
                    const uniqueSpecs = Array.from(new Set(
                        specData
                            .map((d: any) => d.specialist)
                            .filter((s: any): s is string => typeof s === 'string' && s.trim() !== '')
                    )).sort() as string[];
                    setSpecialistOptions(uniqueSpecs);
                }

                // Fetch Instrument Statuses
                const { data: statData } = await supabase
                    .from('t7_ffm_instruments')
                    .select('instrument_status');

                if (statData) {
                     const uniqueStats = Array.from(new Set(
                        statData
                            .map((d: any) => d.instrument_status)
                            .filter((s: any): s is string => typeof s === 'string' && s.trim() !== '')
                    )).sort() as string[];
                    setStatusOptions(uniqueStats);
                }
            } catch (e) {
                console.warn("Failed to fetch filter options", e);
            }
        };
        fetchOptions();
    }, []);

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
            // Fetch Table Data
            let query = supabase.from('t7_ffm_instruments').select('*', { count: 'exact' });
            
             // Re-apply filters logic locally
            if (activeSearch) query = query.or(`isin.ilike.%${activeSearch}%,instrument.ilike.%${activeSearch}%`);
            if (activeFilters.currency !== 'all') query = query.eq('currency', activeFilters.currency);
            if (activeFilters.instrumentStatus !== 'all') query = query.eq('instrument_status', activeFilters.instrumentStatus);
            if (activeFilters.specialist !== 'all') query = query.eq('specialist', activeFilters.specialist);
            if (activeFilters.dateFrom) query = query.gte('first_trading_date', activeFilters.dateFrom);
            if (activeFilters.dateTo) query = query.lte('first_trading_date', activeFilters.dateTo);

            // Sorting
            query = query.order(sortField, { ascending: sortDirection === 'asc' });
            if (sortField !== 'isin') query = query.order('isin', { ascending: true });

            // Pagination
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            
            const { data: instruments, error, count } = await query.range(from, to);

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
    }, [page, activeSearch, activeFilters, sortField, sortDirection]);

    // Fetch Stats (Distribution) whenever filters change
    const fetchStats = useCallback(async () => {
        setIsStatsLoading(true);
        try {
            // We only need the specialist column to calculate distribution
            // We reuse the same filters logic to ensure stats match the view
            let query = supabase.from('t7_ffm_instruments').select('specialist');
            
            if (activeSearch) query = query.or(`isin.ilike.%${activeSearch}%,instrument.ilike.%${activeSearch}%`);
            if (activeFilters.currency !== 'all') query = query.eq('currency', activeFilters.currency);
            if (activeFilters.instrumentStatus !== 'all') query = query.eq('instrument_status', activeFilters.instrumentStatus);
            // We deliberately KEEP the specialist filter if selected, 
            // so the chart correctly reflects that only 1 specialist is visible (100%).
            if (activeFilters.specialist !== 'all') query = query.eq('specialist', activeFilters.specialist);
            if (activeFilters.dateFrom) query = query.gte('first_trading_date', activeFilters.dateFrom);
            if (activeFilters.dateTo) query = query.lte('first_trading_date', activeFilters.dateTo);

            const { data: rawData, error } = await query;

            if (error) throw error;

            if (rawData) {
                const counts: Record<string, number> = {};
                rawData.forEach((row: any) => {
                    const s = row.specialist || 'Unknown';
                    counts[s] = (counts[s] || 0) + 1;
                });

                // Convert to array and sort
                const sorted = Object.entries(counts)
                    .map(([label, value]) => ({ label, value }))
                    .sort((a, b) => b.value - a.value);

                // Take Top 5 and group rest
                const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];
                let finalStats = sorted.slice(0, 5).map((item, i) => ({
                    ...item,
                    color: colors[i % colors.length]
                }));

                const othersCount = sorted.slice(5).reduce((acc, cur) => acc + cur.value, 0);
                if (othersCount > 0) {
                    finalStats.push({ label: 'Others', value: othersCount, color: '#9CA3AF' });
                }

                setStatsData(finalStats);
            }
        } catch (e) {
            console.warn("Error fetching stats", e);
        } finally {
            setIsStatsLoading(false);
        }
    }, [activeSearch, activeFilters]);

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [fetchData, fetchStats]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('de-DE');
    };

    const renderSortIcon = (field: string) => {
        if (sortField !== field) return <div className="w-4 h-4" />;
        return (
            <div className="text-gray-500">
                {sortDirection === 'asc' ? <Icons.ArrowUp /> : <Icons.ArrowDown />}
            </div>
        );
    };

    // Reusable Dropdown Arrow
    const SelectArrow = () => (
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
            <Icons.ChevronDown />
        </div>
    );

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
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                        {/* Column 1: Date Range */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">First Trading (From - To)</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="date" 
                                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-[#9F8A79] bg-white text-gray-900 cursor-pointer"
                                    value={filters.dateFrom}
                                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                />
                                <span className="text-gray-400 font-bold">-</span>
                                <input 
                                    type="date" 
                                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-[#9F8A79] bg-white text-gray-900 cursor-pointer"
                                    value={filters.dateTo}
                                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Column 2: Specialist & Currency */}
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1">Specialist</label>
                                <div className="relative">
                                    <select 
                                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-[#9F8A79] bg-white text-gray-900 cursor-pointer appearance-none pr-10"
                                        value={filters.specialist}
                                        onChange={(e) => handleFilterChange('specialist', e.target.value)}
                                    >
                                        <option value="all">All Specialists</option>
                                        {specialistOptions.map((spec, idx) => (
                                            <option key={idx} value={spec}>{spec}</option>
                                        ))}
                                    </select>
                                    <SelectArrow />
                                </div>
                            </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1">Currency</label>
                                <div className="relative">
                                    <select 
                                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-[#9F8A79] bg-white text-gray-900 cursor-pointer appearance-none pr-10"
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
                                    <SelectArrow />
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Status (Instrument Only) */}
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                <div className="relative">
                                    <select 
                                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-[#9F8A79] bg-white text-gray-900 cursor-pointer appearance-none pr-10"
                                        value={filters.instrumentStatus}
                                        onChange={(e) => handleFilterChange('instrumentStatus', e.target.value)}
                                    >
                                        <option value="all">Inst. Status (All)</option>
                                        {statusOptions.length > 0 ? (
                                            statusOptions.map((status, idx) => (
                                                <option key={idx} value={status}>{status}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="ACTV">Active (ACTV)</option>
                                                <option value="SUSP">Suspended (SUSP)</option>
                                                <option value="HALT">Halted (HALT)</option>
                                            </>
                                        )}
                                    </select>
                                    <SelectArrow />
                                </div>
                            </div>
                        </div>

                        {/* Column 4: Market Insights (Pie Chart) */}
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex flex-col h-full overflow-hidden">
                            <h4 className="text-xs font-bold text-gray-600 uppercase mb-2 flex items-center gap-1 shrink-0">
                                <Icons.BarChart /> Market Distribution
                            </h4>
                            <div className="flex-1 flex items-center justify-center min-h-0">
                                {isStatsLoading ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                                ) : (
                                    <SimplePieChart data={statsData} />
                                )}
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
                                <th onClick={() => handleSort('isin')} className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[120px] cursor-pointer hover:bg-gray-100 group select-none">
                                    <div className="flex items-center gap-1">ISIN {renderSortIcon('isin')}</div>
                                </th>
                                <th onClick={() => handleSort('wkn')} className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[100px] cursor-pointer hover:bg-gray-100 group select-none">
                                    <div className="flex items-center gap-1">WKN {renderSortIcon('wkn')}</div>
                                </th>
                                <th onClick={() => handleSort('instrument')} className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[250px] cursor-pointer hover:bg-gray-100 group select-none">
                                    <div className="flex items-center gap-1">Instrument Name {renderSortIcon('instrument')}</div>
                                </th>
                                <th onClick={() => handleSort('currency')} className="px-4 py-3 font-bold bg-gray-50 border-b text-center w-16 cursor-pointer hover:bg-gray-100 group select-none">
                                    <div className="flex items-center justify-center gap-1">Curr {renderSortIcon('currency')}</div>
                                </th>
                                <th onClick={() => handleSort('min_size')} className="px-4 py-3 font-bold bg-gray-50 border-b text-right min-w-[100px] cursor-pointer hover:bg-gray-100 group select-none">
                                    <div className="flex items-center justify-end gap-1">Min Size {renderSortIcon('min_size')}</div>
                                </th>
                                <th onClick={() => handleSort('instrument_status')} className="px-4 py-3 font-bold bg-gray-50 border-b text-center min-w-[80px] cursor-pointer hover:bg-gray-100 group select-none">
                                    <div className="flex items-center justify-center gap-1">Status {renderSortIcon('instrument_status')}</div>
                                </th>
                                <th onClick={() => handleSort('specialist')} className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[200px] cursor-pointer hover:bg-gray-100 group select-none">
                                    <div className="flex items-center gap-1">Specialist {renderSortIcon('specialist')}</div>
                                </th>
                                <th onClick={() => handleSort('issue_date')} className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[100px] cursor-pointer hover:bg-gray-100 group select-none">
                                    <div className="flex items-center gap-1">Issue Date {renderSortIcon('issue_date')}</div>
                                </th>
                                <th onClick={() => handleSort('first_trading_date')} className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[100px] cursor-pointer hover:bg-gray-100 group select-none">
                                    <div className="flex items-center gap-1">First Trading {renderSortIcon('first_trading_date')}</div>
                                </th>
                                <th onClick={() => handleSort('last_trading_date')} className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[100px] cursor-pointer hover:bg-gray-100 group select-none">
                                    <div className="flex items-center gap-1">Last Trading {renderSortIcon('last_trading_date')}</div>
                                </th>
                                <th onClick={() => handleSort('maturity_date')} className="px-4 py-3 font-bold bg-gray-50 border-b min-w-[100px] cursor-pointer hover:bg-gray-100 group select-none">
                                    <div className="flex items-center gap-1">Maturity {renderSortIcon('maturity_date')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9F8A79] mb-4"></div>
                                            <span>Loading market data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-20 text-center text-gray-500 bg-white">
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
                                        <td className="px-4 py-2 text-center text-sm text-gray-700">
                                            {item.instrumentStatus}
                                        </td>
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
