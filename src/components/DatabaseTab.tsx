import React, { useState } from 'react';
import { PressMold } from '../types';
import { SwipeableRow } from './SwipeableRow';
import { Database, Plus, Trash2, RotateCcw, Download, Sparkles, Filter, Archive } from 'lucide-react';
import { triggerHaptic } from '../utils/haptic';

interface DatabaseTabProps {
  molds: PressMold[];
  onAddMold: () => void;
  onAddNote: (mold: PressMold) => void;
  onEdit: (mold: PressMold) => void;
  onDeleteToTrash: (mold: PressMold) => void;
  onRestoreFromTrash: (mold: PressMold) => void;
  onOpenPdf: (mold: PressMold) => void;
  onViewDetails: (mold: PressMold) => void;
  onOpenScanner: () => void;
}

export const DatabaseTab: React.FC<DatabaseTabProps> = ({
  molds,
  onAddMold,
  onAddNote,
  onEdit,
  onDeleteToTrash,
  onRestoreFromTrash,
  onOpenPdf,
  onViewDetails,
  onOpenScanner,
}) => {
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [filterShop, setFilterShop] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeMolds = molds.filter((m) => !m.inTrash);
  const trashMolds = molds.filter((m) => m.inTrash);

  const displayedMolds = (viewMode === 'active' ? activeMolds : trashMolds).filter((m) => {
    const matchesShop = filterShop === 'all' || m.shop === filterShop;
    const matchesQuery =
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.pressType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesShop && matchesQuery;
  });

  const handleExportData = () => {
    triggerHaptic('medium');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(molds, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `adis_formy_database_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        
        {/* Left Toggle active / trash */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                triggerHaptic('light');
                setViewMode('active');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'active'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Реестр ({activeMolds.length})</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setViewMode('trash');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'trash'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Корзина ({trashMolds.length})</span>
            </button>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Сканер бирки</span>
          </button>

          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all"
            title="Экспорт базы в JSON для бэкапа GitHub"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Экспорт JSON</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onAddMold();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Новая пресс-форма</span>
          </button>
        </div>

      </div>

      {/* Filter and Search Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Фильтр списка по шифру..."
            className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          <span className="text-xs font-mono text-slate-500 shrink-0">Цех:</span>
          {['all', 'Цех №1 (Штамповка)', 'Цех №2 (Литье под давлением)', 'Цех №3 (Механообработка)'].map((shop, idx) => (
            <button
              key={idx}
              onClick={() => {
                triggerHaptic('light');
                setFilterShop(shop);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                filterShop === shop
                  ? 'bg-slate-800 text-amber-400 border border-amber-500/30 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {shop === 'all' ? 'Все цеха' : shop.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Gmail-Style Swipeable Items List */}
      <div className="space-y-1">
        {displayedMolds.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
            <Archive className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-300 text-sm">
              {viewMode === 'active' ? 'Пресс-формы отсутствуют' : 'Корзина пуста'}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {viewMode === 'active'
                ? 'Нажмите "Новая пресс-форма" или отсканируйте бирку'
                : 'Удаленные пресс-формы отображаются в этом разделе'}
            </p>
          </div>
        ) : (
          displayedMolds.map((mold) => (
            <SwipeableRow
              key={mold.id}
              mold={mold}
              onAddNote={onAddNote}
              onEdit={onEdit}
              onDeleteToTrash={onDeleteToTrash}
              onRestoreFromTrash={onRestoreFromTrash}
              onOpenPdf={onOpenPdf}
              onViewDetails={onViewDetails}
            />
          ))
        )}
      </div>

    </div>
  );
};
