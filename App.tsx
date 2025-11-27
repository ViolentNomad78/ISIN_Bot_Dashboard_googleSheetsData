
import React, { useState } from 'react';
import { BondItem, AutoTriggerRule } from './types';
import { INITIAL_DATA, INITIAL_RULES, INITIAL_ISSUERS } from './data';
import { Icons } from './Icons';
import { Logo } from './components/Logo';
import { LoginScreen } from './components/LoginScreen';
import { BondDetailModal } from './components/BondDetailModal';
import { AddIsinModal } from './components/AddIsinModal';
import { AutoTriggerWidget, FavoriteIssuersWidget, StatWidget } from './components/Widgets';
import { StatsView } from './components/StatsView';
import { BookrunnersView } from './components/BookrunnersView';
import { T7View } from './components/T7View';
import { KanbanColumn } from './components/KanbanColumn';
import { TerminalStatesTable } from './components/TerminalStatesTable';
import { ListView } from './components/ListView';
import { useSupabaseData } from './hooks/useSupabaseData';
// import { useGoogleSheetData } from './hooks/useGoogleSheetData'; // Deprecated

export const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<'board' | 'list' | 'stats' | 'bookrunners' | 't7'>('board');
  
  // Use Supabase for Realtime Data
  const { data: items, setData, isConnected } = useSupabaseData(INITIAL_DATA);
  
  // Widget State
  const [autoTriggerRules, setAutoTriggerRules] = useState<AutoTriggerRule[]>(INITIAL_RULES);
  const [favoriteIssuers, setFavoriteIssuers] = useState<string[]>(INITIAL_ISSUERS);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBond, setSelectedBond] = useState<BondItem | null>(null);

  const handleAddISIN = (newItem: BondItem) => {
      setData([newItem, ...items]);
  };
  
  const handleUpdateISIN = (updatedItem: BondItem) => {
      setData(items.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  // Widget Handlers
  const addTriggerRule = (rule: Omit<AutoTriggerRule, 'id'>) => {
      setAutoTriggerRules([...autoTriggerRules, { ...rule, id: Math.random().toString() }]);
  };
  const removeTriggerRule = (id: string) => {
      setAutoTriggerRules(autoTriggerRules.filter(r => r.id !== id));
  };
  
  const addIssuer = (issuer: string) => {
      if (!favoriteIssuers.includes(issuer)) {
          setFavoriteIssuers([...favoriteIssuers, issuer]);
      }
  };
  const removeIssuer = (issuer: string) => {
      setFavoriteIssuers(favoriteIssuers.filter(i => i !== issuer));
  };

  const getPageTitle = () => {
      switch(view) {
          case 'board': return 'ISIN Flow';
          case 'list': return 'Scraped ISINs';
          case 'stats': return 'Bot Listing Statistics';
          case 'bookrunners': return 'Bookrunner Analytics';
          case 't7': return 'T7 FFM Instruments';
          default: return '';
      }
  };

  if (!isLoggedIn) {
      return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-50 overflow-hidden">
      
      {/* Sidebar - Higher Z-Index */}
      <aside className="w-full lg:w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-50 flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white flex flex-col gap-2">
             <div className="flex items-center gap-2">
                <Logo className="w-8 h-8 rounded-sm object-contain" />
             </div>
             <span className="font-serif tracking-wide text-lg">MONOPOLI.MEIER <br/> & SON'S.</span>
          </h1>
          <p className="text-xs text-slate-500 mt-2">Bond Trading Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 hidden lg:block">
          <button 
            onClick={() => setView('board')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'board' ? 'bg-[#9F8A79] text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <Icons.Dashboard />
            <span className="font-medium">Flow Board</span>
          </button>
          
          <button 
             onClick={() => setView('list')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'list' ? 'bg-[#9F8A79] text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <Icons.List />
            <span className="font-medium">Scraped ISINs</span>
          </button>

          <button 
             onClick={() => setView('t7')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 't7' ? 'bg-[#9F8A79] text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <Icons.Database />
            <span className="font-medium">T7 Instruments</span>
          </button>

          <button 
             onClick={() => setView('stats')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'stats' ? 'bg-[#9F8A79] text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <Icons.BarChart />
            <span className="font-medium">Statistics</span>
          </button>

          <button 
             onClick={() => setView('bookrunners')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'bookrunners' ? 'bg-[#9F8A79] text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <Icons.Briefcase />
            <span className="font-medium">Bookrunners</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
            <Icons.Settings />
            <span className="font-medium">Settings</span>
          </button>
        </nav>
        
        {/* Mobile Nav Links (Simple) */}
        <div className="lg:hidden flex gap-2 p-2 overflow-x-auto">
             <button onClick={() => setView('board')} className={`px-4 py-2 rounded text-sm whitespace-nowrap ${view === 'board' ? 'bg-[#9F8A79] text-white' : 'text-slate-300'}`}>Flow Board</button>
             <button onClick={() => setView('list')} className={`px-4 py-2 rounded text-sm whitespace-nowrap ${view === 'list' ? 'bg-[#9F8A79] text-white' : 'text-slate-300'}`}>Scraped ISINs</button>
             <button onClick={() => setView('t7')} className={`px-4 py-2 rounded text-sm whitespace-nowrap ${view === 't7' ? 'bg-[#9F8A79] text-white' : 'text-slate-300'}`}>T7</button>
             <button onClick={() => setView('stats')} className={`px-4 py-2 rounded text-sm whitespace-nowrap ${view === 'stats' ? 'bg-[#9F8A79] text-white' : 'text-slate-300'}`}>Stats</button>
             <button onClick={() => setView('bookrunners')} className={`px-4 py-2 rounded text-sm whitespace-nowrap ${view === 'bookrunners' ? 'bg-[#9F8A79] text-white' : 'text-slate-300'}`}>Bookrunners</button>
        </div>

        <div className="p-4 border-t border-slate-800 hidden lg:block">
            <div className="text-xs text-slate-500 mb-2">System Status</div>
            <div className="flex items-center justify-between mb-3">
                 <span className="text-sm font-medium text-slate-200">Supabase Feed</span>
                 <div className="flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></span>
                     <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-orange-400'}`}>
                        {isConnected ? 'Supabase Live' : 'Demo Mode'}
                     </span>
                 </div>
            </div>
            
            <div className="text-xs text-slate-500 mb-2 mt-4">Connected as</div>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">BT</div>
                <div className="text-sm font-medium text-slate-200">BondTrader78</div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Top Header - Higher Z-Index */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8 shadow-sm z-40 flex-shrink-0">
           <h2 className="text-lg font-semibold text-gray-800">
               {getPageTitle()}
           </h2>
           <div className="flex items-center gap-2 lg:gap-4">
               <span className="text-xs hidden md:inline text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
               {view !== 'stats' && view !== 'bookrunners' && view !== 't7' && (
                   <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-[#9F8A79] hover:bg-[#8a7566] text-white px-3 py-1.5 lg:px-4 lg:py-2 rounded-md text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                   >
                       + Add New
                   </button>
               )}
           </div>
        </header>

        {/* Content Area */}
        {view === 'stats' ? (
            <StatsView />
        ) : view === 'bookrunners' ? (
            <BookrunnersView />
        ) : view === 't7' ? (
            <T7View />
        ) : (
            <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden relative">
                
                {/* Right Widget Panel */}
                {view === 'board' && (
                    <div className="order-first xl:order-last w-full xl:w-80 bg-white border-b xl:border-b-0 xl:border-l border-gray-200 p-6 flex-shrink-0 xl:overflow-y-auto z-20 relative">
                        <AutoTriggerWidget 
                            rules={autoTriggerRules} 
                            onAdd={addTriggerRule} 
                            onRemove={removeTriggerRule} 
                        />
                        <FavoriteIssuersWidget 
                            issuers={favoriteIssuers} 
                            onAdd={addIssuer} 
                            onRemove={removeIssuer} 
                        />
                        <StatWidget title="ISIN Statistics">
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <div className="bg-purple-50 p-2 rounded-lg border border-purple-100 text-center">
                                    <div className="text-2xl font-bold text-purple-700">{items.filter(i => i.status === 'scraped').length}</div>
                                    <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wide">Scraped</div>
                                </div>
                                <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100 text-center">
                                    <div className="text-2xl font-bold text-yellow-700">{items.filter(i => i.status === 'triggered').length}</div>
                                    <div className="text-[10px] uppercase font-bold text-yellow-400 tracking-wide">Triggered</div>
                                </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center mb-3">
                                <span className="text-xs uppercase font-bold text-blue-500 tracking-wide">Submitted</span>
                                <span className="text-xl font-bold text-blue-700">{items.filter(i => i.status === 'submitted').length}</span>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-gray-100">
                                <div className="flex justify-between text-xs items-center">
                                    <span className="text-gray-500">Passed</span>
                                    <span className="font-mono font-medium text-gray-700">{items.filter(i => i.status === 'passed').length}</span>
                                </div>
                                <div className="flex justify-between text-xs items-center">
                                    <span className="text-gray-500">Too Late</span>
                                    <span className="font-mono font-medium text-red-600">{items.filter(i => i.status === 'too_late').length}</span>
                                </div>
                            </div>
                        </StatWidget>
                        <StatWidget title="System Status">
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Bot Status</span>
                                    <span className="text-green-600 font-bold">Active</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Scraper Latency</span>
                                    <span className="text-gray-800 font-mono">24ms</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                                </div>
                                <div className="text-xs text-right text-gray-400">92% Daily Quota</div>
                            </div>
                        </StatWidget>
                    </div>
                )}

                {/* Center Panel (Board or List) */}
                <div className="flex-1 xl:overflow-y-auto p-4 lg:p-6 min-w-0">
                    {view === 'board' ? (
                    <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                                <KanbanColumn 
                                    title="Scraped" 
                                    status="scraped" 
                                    items={items.filter(i => i.status === 'scraped')} 
                                    onItemClick={setSelectedBond}
                                />
                                <KanbanColumn 
                                    title="Triggered" 
                                    status="triggered" 
                                    items={items.filter(i => i.status === 'triggered')} 
                                    onItemClick={setSelectedBond}
                                />
                                <KanbanColumn 
                                    title="Submitted" 
                                    status="submitted" 
                                    items={items.filter(i => i.status === 'submitted')} 
                                    onItemClick={setSelectedBond}
                                />
                            </div>

                            <div className="flex flex-col shrink-0">
                                <TerminalStatesTable 
                                    items={items.filter(i => i.status === 'passed' || i.status === 'too_late')}
                                    onItemClick={setSelectedBond}
                                />
                            </div>
                    </div>
                    ) : (
                        <ListView items={items} />
                    )}
                </div>

            </div>
        )}
        
        {/* Modals */}
        <AddIsinModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
            onSave={handleAddISIN}
        />
        
        <BondDetailModal 
            item={selectedBond}
            isOpen={!!selectedBond}
            onClose={() => setSelectedBond(null)}
            onSave={handleUpdateISIN}
        />
      </main>
    </div>
  );
};
