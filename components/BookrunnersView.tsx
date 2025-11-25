
import React, { useState } from 'react';
import { useBookrunnerStats } from '../hooks/useBookrunnerStats';
import { BookrunnerStat } from '../types';
import { Icons } from '../Icons';

export const BookrunnersView = () => {
    // Default Date Range: Start of current year to Today
    const [startDate, setStartDate] = useState<Date | null>(() => {
        const d = new Date();
        d.setMonth(0); // January
        d.setDate(1);
        return d;
    });
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    
    const [currency, setCurrency] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const [sortField, setSortField] = useState<keyof BookrunnerStat>('dealCount');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    
    const { stats, isLoading } = useBookrunnerStats(startDate, endDate, currency);

    const handleSort = (field: keyof BookrunnerStat) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // 1. Filter by Search Query
    const filteredStats = stats.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Sort
    const sortedStats = [...filteredStats].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (aVal === null) return 1;
        if (bVal === null) return -1;

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const maxDeals = Math.max(...stats.map(s => s.dealCount), 1);
    
    // Helper to handle date input changes (YYYY-MM-DD -> Date)
    const handleDateChange = (type: 'start' | 'end', val: string) => {
        const d = val ? new Date(val) : null;
        if (type === 'start') setStartDate(d);
        else setEndDate(d);
    };

    // Helper to format Date to YYYY-MM-DD for input value
    const formatDateForInput = (d: Date | null) => {
        if (!d) return '';
        return d.toISOString().split('T')[0];
    };

    return (
        <div className="bg-slate-50 min-h-full flex flex-col gap-6 p-4 lg:p-6 overflow-y-auto">
             {/* Header Controls */}
             <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Icons.Briefcase />
                        Bookrunner Activity
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Analyze market share and deal flow by bookrunner</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full xl:w-auto">
                    
                    {/* Search */}
                    <div className="relative group w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#9F8A79]">
                            <Icons.Search />
                        </div>
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#9F8A79] focus:border-transparent transition-all bg-white text-black placeholder-gray-400"
                            placeholder="Search Bookrunner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

                    {/* Currency Filter */}
                    <select 
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-black focus:ring-2 focus:ring-[#9F8A79] outline-none"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                    >
                        <option value="all" className="text-black">All Currencies</option>
                        <option value="EUR" className="text-black">EUR (€)</option>
                        <option value="USD" className="text-black">USD ($)</option>
                    </select>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
                        <div className="flex items-center gap-2 px-2">
                             <span className="text-gray-500"><Icons.Calendar /></span>
                             <input 
                                type="date" 
                                className="bg-transparent text-sm text-black outline-none w-32"
                                value={formatDateForInput(startDate)}
                                onChange={(e) => handleDateChange('start', e.target.value)}
                             />
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="px-2">
                             <input 
                                type="date" 
                                className="bg-transparent text-sm text-black outline-none w-32"
                                value={formatDateForInput(endDate)}
                                onChange={(e) => handleDateChange('end', e.target.value)}
                             />
                        </div>
                    </div>

                </div>
            </div>

            {/* Top Stats Overview */}
            {isLoading ? (
                 <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9F8A79] mx-auto mb-4"></div>
                    <span className="text-gray-500 font-medium">Analyzing Bookrunner Data...</span>
                 </div>
            ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Listings Found</span>
                        <div className="mt-2 text-3xl font-bold text-gray-800">
                             {stats.reduce((acc, curr) => acc + curr.dealCount, 0)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">In selected period</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Active Bookrunners</span>
                        <div className="mt-2 text-3xl font-bold text-blue-600">
                             {filteredStats.length}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Matches search criteria</div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-xl border border-slate-700 shadow-sm text-white relative overflow-hidden">
                         <div className="relative z-10">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Market Leader</span>
                            <div className="mt-2 text-2xl font-bold truncate">
                                {sortedStats[0]?.name || 'N/A'}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-xl font-bold text-emerald-400">{Math.round(sortedStats[0]?.marketShare || 0)}%</span>
                                <span className="text-xs text-slate-400">Market Share</span>
                            </div>
                         </div>
                         <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                             <Icons.Briefcase />
                         </div>
                    </div>
                </div>

                <div className="flex gap-6 flex-col xl:flex-row h-full min-h-0">
                    
                    {/* Left: Leaderboard Chart */}
                    <div className="w-full xl:w-1/3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                        <h3 className="font-bold text-gray-800 mb-6">Top Volume Leaders</h3>
                        <div className="space-y-6 overflow-y-auto pr-2 max-h-[500px] scrollbar-hide">
                            {sortedStats.slice(0, 10).map((stat, idx) => {
                                const pct = (stat.dealCount / maxDeals) * 100;
                                return (
                                    <div key={stat.id} className="group">
                                        <div className="flex justify-between text-sm mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="font-medium text-gray-700 truncate max-w-[150px]" title={stat.name}>{stat.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-800">{stat.dealCount}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-500 ${idx === 0 ? 'bg-[#9F8A79]' : 'bg-slate-400 opacity-50'}`}
                                                style={{ width: `${pct}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Detailed Table */}
                    <div className="w-full xl:w-2/3 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b sticky top-0 z-10">
                                    <tr>
                                        <th className="w-10 px-4 py-3"></th>
                                        <th onClick={() => handleSort('name')} className="px-6 py-3 font-bold cursor-pointer hover:bg-gray-100">Bookrunner</th>
                                        <th onClick={() => handleSort('dealCount')} className="px-6 py-3 text-right font-bold cursor-pointer hover:bg-gray-100">Deals</th>
                                        <th onClick={() => handleSort('marketShare')} className="px-6 py-3 text-right font-bold cursor-pointer hover:bg-gray-100">Share</th>
                                        <th className="px-6 py-3 text-right font-bold">Last Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedStats.map((stat) => {
                                        const isExpanded = expandedRowId === stat.id;
                                        return (
                                            <React.Fragment key={stat.id}>
                                                <tr 
                                                    onClick={() => setExpandedRowId(isExpanded ? null : stat.id)}
                                                    className={`border-b border-gray-100 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                                >
                                                    <td className="px-4 py-4 text-gray-400">
                                                        {isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-gray-800">{stat.name}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                                            {stat.dealCount}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-gray-600">
                                                        {stat.marketShare.toFixed(1)}%
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-xs text-gray-500">
                                                        {stat.lastActive || '-'}
                                                    </td>
                                                </tr>
                                                
                                                {/* Expanded Detail Row */}
                                                {isExpanded && (
                                                    <tr className="bg-gray-50/50 shadow-inner">
                                                        <td colSpan={5} className="p-0">
                                                            <div className="px-10 py-4">
                                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                                                    <Icons.List />
                                                                    Deal History ({stat.deals.length})
                                                                </h4>
                                                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                                                                    <table className="w-full text-xs">
                                                                        <thead className="bg-gray-50 text-gray-500 border-b">
                                                                            <tr>
                                                                                <th className="px-4 py-2 text-left">Date</th>
                                                                                <th className="px-4 py-2 text-left">ISIN</th>
                                                                                <th className="px-4 py-2 text-left">Issuer</th>
                                                                                <th className="px-4 py-2 text-right">Currency</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {stat.deals.map((deal, i) => (
                                                                                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                                                                    <td className="px-4 py-2 font-mono text-gray-500">{deal.date}</td>
                                                                                    <td className="px-4 py-2 font-mono text-blue-600">{deal.isin}</td>
                                                                                    <td className="px-4 py-2 font-medium text-gray-700">{deal.issuer}</td>
                                                                                    <td className="px-4 py-2 text-right font-bold text-gray-600">{deal.currency}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                    
                                    {sortedStats.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-gray-400">
                                                No bookrunners found matching your criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                </>
            )}
        </div>
    );
};
