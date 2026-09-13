import React, { useState } from 'react';
import { PressMold } from '../types';
import { Search, ScanLine, Filter, Factory, Wrench, PackageCheck, FileText, ChevronRight, Activity, Zap } from 'lucide-react';
import { triggerHaptic } from '../utils/haptic';

interface SearchTabProps {
  molds: PressMold[];
  onSelectMold: (mold: PressMold) => void;
  onOpenScanner: () => void;
  onOpenPdf: (mold: PressMold) => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({
  molds,
  onSelectMold,
  onOpenScanner,
  onOpenPdf,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const shops = [
    { id: 'all', label: 'Все цеха' },
    { id: 'Цех №1 (Штамповка)', label: 'Цех №1' },
    { id: 'Цех №2 (Литье под давлением)', label: 'Цех №2' },
    { id: 'Цех №3 (Механообработка)', label: 'Цех №3' },
  ];

  const statuses = [
    { id: 'all', label: 'Все статусы' },
    { id: 'in_work', label: 'В работе' },
    { id: 'maintenance', label: 'На ТО' },
    { id: 'repair', label: 'В ремонте' },
    { id: 'conserved', label: 'Консервация' },
  ];

  const filteredMolds = molds.filter((m) => {
    if (m.inTrash) return false;

    const matchesQuery =
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.pressType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesShop = selectedShop === 'all' || m.shop === selectedShop;
    const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;

    return matchesQuery && matchesShop && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Hero Search Section */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Быстрый поиск цеха
            </span>
            <span className="text-xs text-slate-400">
              Мгновенная локализация пресс-форм
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Поиск прессующих форм завода
          </h2>

          {/* Large Search Input */}
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Введите артикул (PF-2024-88A), наименование, тип пресса или заводской №..."
              className="w-full pl-12 pr-32 py-4 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
            />
            
            <button
              onClick={() => {
                triggerHaptic('medium');
                onOpenScanner();
              }}
              className="absolute right-2.5 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <ScanLine className="w-4 h-4" />
              <span className="hidden sm:inline">AI Сканер</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Фильтр цеха:
            </span>
            {shops.map((shop) => (
              <button
                key={shop.id}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedShop(shop.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedShop === shop.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {shop.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Статус:
            </span>
            {statuses.map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedStatus(st.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedStatus === st.id
                    ? 'bg-slate-700 text-slate-100 font-bold border border-slate-600'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Search Results Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">
            Найдено форм: {filteredMolds.length}
          </h3>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedShop('all');
                setSelectedStatus('all');
              }}
              className="text-xs text-amber-400 hover:underline"
            >
              Сбросить поисковый запрос
            </button>
          )}
        </div>

        {filteredMolds.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <PackageCheck className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-base font-semibold text-slate-300">Пресс-формы не найдены</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Попробуйте изменить поисковый запрос или отсканировать бирку через камера-сканер
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMolds.map((mold) => {
              const wear = Math.min(100, Math.round((mold.cyclesCount / mold.maxCycles) * 100));
              return (
                <div
                  key={mold.id}
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectMold(mold);
                  }}
                  className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-amber-400">
                        {mold.code}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {mold.shop}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-100 text-base group-hover:text-amber-300 transition-colors line-clamp-2">
                      {mold.name}
                    </h4>

                    <div className="space-y-1 text-xs text-slate-400 mt-3 font-mono">
                      <div>Тип пресса: <span className="text-slate-200">{mold.pressType}</span></div>
                      <div>Габариты: <span className="text-slate-200">{mold.dimensions}</span></div>
                      <div>Масса: <span className="text-slate-200">{mold.weightKg} кг</span></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 font-mono">Ресурс: {wear}%</div>
                      <div className="w-24 h-1.5 bg-slate-950 rounded-full overflow-hidden mt-0.5 border border-slate-800">
                        <div
                          className={`h-full ${wear > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${wear}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {mold.navodkaTitle && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            onOpenPdf(mold);
                          }}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                          title="Просмотр Návodka PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      <span className="text-xs text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Карточка <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
