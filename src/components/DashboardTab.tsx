import React from 'react';
import { PressMold, UserLog, SystemStatus } from '../types';
import { BarChart3, Activity, Wrench, AlertCircle, Archive, Github, ShieldCheck, Sparkles, Clock, CheckCircle2, UserCheck, HardDrive } from 'lucide-react';

interface DashboardTabProps {
  molds: PressMold[];
  logs: UserLog[];
  systemStatus: SystemStatus;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  molds,
  logs,
  systemStatus,
}) => {
  const activeMolds = molds.filter((m) => !m.inTrash);
  const inWorkCount = activeMolds.filter((m) => m.status === 'in_work').length;
  const maintenanceCount = activeMolds.filter((m) => m.status === 'maintenance').length;
  const repairCount = activeMolds.filter((m) => m.status === 'repair').length;
  const conservedCount = activeMolds.filter((m) => m.status === 'conserved').length;
  const trashCount = molds.filter((m) => m.inTrash).length;

  const totalCycles = activeMolds.reduce((sum, m) => sum + m.cyclesCount, 0);
  const avgWear = activeMolds.length > 0
    ? Math.round(
        activeMolds.reduce((sum, m) => sum + (m.cyclesCount / m.maxCycles) * 100, 0) / activeMolds.length
      )
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Stat Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Всего в реестре</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {activeMolds.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            + {trashCount} в корзине
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span>В работе</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {inWorkCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {Math.round((inWorkCount / Math.max(1, activeMolds.length)) * 100)}% от парка
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span>На ТО / Осмотр</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            {maintenanceCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Плановый регламент
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span>В ремонте</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">
            {repairCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Требуют шлифовки
          </div>
        </div>

        <div className="bg-slate-900 border border-sky-500/20 rounded-2xl p-4 shadow-lg col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-sky-400 mb-1">
            <span>Консервация</span>
            <Archive className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-sky-400 font-mono">
            {conservedCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Склад готовых форм
          </div>
        </div>

      </div>

      {/* Infrastructure Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* GitHub Source of Truth */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100 text-sm">GitHub Repository</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Единый источник правды
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Репозиторий подключен к новому рабочему аккаунту. Синхронизация кода активна.
          </p>
          <div className="text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
            Branch: <strong className="text-emerald-400">main</strong> | Commit: <span className="text-amber-400">a94f1b2</span>
          </div>
        </div>

        {/* Supabase Connection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-slate-100 text-sm">Supabase Storage</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Бесплатный режим
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Связка с облачным Supabase для онлайн-синхронизации записей и документов.
          </p>
          <div className="text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
            Статус: <strong className="text-sky-400">Подключено (24ms)</strong>
          </div>
        </div>

        {/* Gemini Vision & Billing Mode */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-slate-100 text-sm">Google Gemini AI</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Ручной ключ
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Биллинг Google Cloud отключен. Сканер работает с бесплатными токенами Gemini 3.8 Flash.
          </p>
          <div className="text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
            Модель: <strong className="text-amber-400">gemini-3.8-flash</strong>
          </div>
        </div>

      </div>

      {/* User Activity Audit Logs Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Лог действий пользователей (User Audit Logs)
            </h3>
            <p className="text-xs text-slate-400">
              Фиксация всех операций мастеров, оптического сканирования и списания
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Записей: {logs.length}
          </span>
        </div>

        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-200">{log.user}</span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400">
                      {log.moldCode}
                    </span>
                    <span className="text-slate-400 truncate">{log.moldName}</span>
                  </div>
                  <p className="text-slate-300 mt-1 font-mono text-[11px]">
                    {log.details}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 font-mono text-[11px] text-slate-500">
                {log.timestamp}
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
