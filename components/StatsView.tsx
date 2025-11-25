import React, { useState, useMemo } from 'react';
import { SpecialistStat } from '../types';
import { MOCK_SPECIALIST_STATS, MOCK_DAILY_STATS } from '../data';

export const StatsView = () => {
    const [timeRange, setTimeRange] = useState<'ytd' | 'mtd' | '30d'>('ytd');
    const [currencyFilter, setCurrencyFilter] = useState<'all' | 'usd' | 'eur'>('all');
    const [sortField, setSortField] = useState<keyof SpecialistStat>('totalBot');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Filter and Sort Specialists
    const sortedSpecialists = useMemo(() => {
        let items = [...MOCK_SPECIALIST_STATS];
        
        // Simulating filters (mock data is static, but this shows intent)
        if (currencyFilter === 'usd') {
            // In a real app we'd filter rows or columns
        }

        return items.sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [sortField, sortDirection, currencyFilter]);

    const handleSort = (field: keyof SpecialistStat) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const maxDaily = Math.max(...MOCK_DAILY_STATS.map(d => d.count));

    return (
        <div className="bg-slate-50 min-h-full flex flex-col gap-6 p-4 lg:p-6 overflow-y-auto">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                    <span className="text-sm text-gray-500 font-medium">Total Bot ISINs (2025)</span>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">2,556</span>
                        <span className="text-sm font-semibold text-green-600">+12% yoy</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                     <span className="text-sm text-gray-500 font-medium">Daily Average</span>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">53</span>
                        <span className="text-sm text-gray-400">ISINs / Day</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                     <span className="text-sm text-gray-500 font-medium">Market Coverage</span>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">42%</span>
                        <span className="text-sm font-semibold text-blue-600">Active</span>
                    </div>
                     <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                         <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                </div>
            </div>

            {/* Daily Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 text-lg">Daily ISIN Volume</h3>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['ytd', 'mtd', '30d'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold uppercase transition-all ${
                                    timeRange === range ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="h-48 w-full flex items-end justify-between gap-1">
                    {MOCK_DAILY_STATS.slice(0, 30).reverse().map((day, idx) => {
                        const heightPct = (day.count / maxDaily) * 100;
                        return (
                            <div key={idx} className="flex flex-col items-center flex-1 group relative">
                                <div 
                                    className="w-full bg-blue-100 hover:bg-blue-300 rounded-t-sm transition-all relative"
                                    style={{ height: `${heightPct}%` }}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                                        {day.date}: {day.count}
                                    </div>
                                </div>
                                <div className="h-px w-full bg-gray-200 mt-0.5"></div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400 uppercase font-bold">
                    <span>{MOCK_DAILY_STATS[29].date}</span>
                    <span>{MOCK_DAILY_STATS[0].date}</span>
                </div>
            </div>

            {/* Main Stats Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-gray-800 text-lg">Specialist Performance</h3>
                    
                    <div className="flex items-center gap-3">
                         <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Filter Currency:</span>
                            <select 
                                className="border rounded-md text-xs px-2 py-1 bg-white text-gray-900 outline-none focus:ring-1 ring-gray-300"
                                value={currencyFilter}
                                onChange={(e) => setCurrencyFilter(e.target.value as any)}
                            >
                                <option value="all">All Currencies</option>
                                <option value="eur">EUR Only</option>
                                <option value="usd">USD Only</option>
                            </select>
                         </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th onClick={() => handleSort('name')} className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100">Specialist</th>
                                <th onClick={() => handleSort('usd')} className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-gray-100">$</th>
                                <th onClick={() => handleSort('eur')} className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-gray-100">€</th>
                                <th onClick={() => handleSort('aud')} className="px-4 py-3 text-right font-medium text-gray-400 cursor-pointer hover:bg-gray-100">AUD</th>
                                <th onClick={() => handleSort('chf')} className="px-4 py-3 text-right font-medium text-gray-400 cursor-pointer hover:bg-gray-100">CHF</th>
                                <th onClick={() => handleSort('gbp')} className="px-4 py-3 text-right font-medium text-gray-400 cursor-pointer hover:bg-gray-100">GBP</th>
                                <th onClick={() => handleSort('totalBot')} className="px-6 py-3 text-right font-bold cursor-pointer hover:bg-gray-100 bg-orange-50 text-orange-800">Bot Total</th>
                                <th onClick={() => handleSort('totalListed')} className="px-6 py-3 text-right font-medium cursor-pointer hover:bg-gray-100">Listed Total</th>
                                <th className="px-6 py-3 font-medium w-48">Coverage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSpecialists.map((stat, idx) => {
                                const coverage = Math.round((stat.totalBot / stat.totalListed) * 100);
                                return (
                                    <tr key={stat.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-700">{stat.name}</td>
                                        <td className="px-4 py-4 text-right font-mono text-gray-600">{stat.usd}</td>
                                        <td className="px-4 py-4 text-right font-mono text-gray-600">{stat.eur}</td>
                                        <td className="px-4 py-4 text-right font-mono text-gray-400">{stat.aud || '-'}</td>
                                        <td className="px-4 py-4 text-right font-mono text-gray-400">{stat.chf || '-'}</td>
                                        <td className="px-4 py-4 text-right font-mono text-gray-400">{stat.gbp || '-'}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-orange-600 bg-orange-50">{stat.totalBot}</td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-800">{(stat.totalListed || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold w-8 text-right">{coverage}%</span>
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                                                    <div 
                                                        className={`h-2 rounded-full ${coverage > 50 ? 'bg-green-500' : coverage > 20 ? 'bg-blue-500' : 'bg-gray-400'}`} 
                                                        style={{ width: `${coverage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* Total Row */}
                            <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                <td className="px-6 py-4">TOTAL</td>
                                <td className="px-4 py-4 text-right">{sortedSpecialists.reduce((a,b) => a+(b.usd || 0), 0)}</td>
                                <td className="px-4 py-4 text-right">{sortedSpecialists.reduce((a,b) => a+(b.eur || 0), 0)}</td>
                                <td className="px-4 py-4 text-right" colSpan={3}></td>
                                <td className="px-6 py-4 text-right text-orange-700 bg-orange-100">{sortedSpecialists.reduce((a,b) => a+(b.totalBot || 0), 0)}</td>
                                <td className="px-6 py-4 text-right">{sortedSpecialists.reduce((a,b) => a+(b.totalListed || 0), 0).toLocaleString()}</td>
                                <td className="px-6 py-4"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};