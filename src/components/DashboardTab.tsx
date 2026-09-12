import React from 'react';
import { Mold, MoldComment, Customer } from '../types';
import { MoldRow } from './MoldRow';

interface DashboardTabProps {
  currentDashboardFilter: string;
  onFilterDashboard: (status: string) => void;
  filteredMolds: Mold[];
  counts: {
    all: number;
    fronteUdrzbu: number;
    fronteOpravu: number;
    naUdrzbe: number;
    opravePryc: number;
  };
  comments: MoldComment[];
  customers: Customer[];
  isSuperUser: boolean;
  currentUser: string | null;
  onEditPosition: (moldId: string, currentPos: string) => void;
  onEditCustomer: (moldId: string, currentCust: string) => void;
  onOpenCommentModal: (moldId: string) => void;
  onOpenFullEdit: (moldId: string, currentPos: string, currentStatus: string, currentProdName: string) => void;
  onOpenPhotoModal: (url: string, title: string) => void;
  onOpenPdfModal: (url: string, title: string) => void;
  onOpenViewComment: (comment: MoldComment) => void;
  onCommentRightClick: (e: React.MouseEvent, commentId: string | number) => void;
  onRowRightClick: (e: React.MouseEvent, moldId: string) => void;
  onCustomerRightClick: (e: React.MouseEvent, customerName: string) => void;
  onSaveAccordionChanges: (
    moldId: string,
    newProductName: string,
    newPhotos: string[],
    newNavodkaUrl: string
  ) => Promise<void>;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  currentDashboardFilter,
  onFilterDashboard,
  filteredMolds,
  counts,
  comments,
  customers,
  isSuperUser,
  currentUser,
  onEditPosition,
  onEditCustomer,
  onOpenCommentModal,
  onOpenFullEdit,
  onOpenPhotoModal,
  onOpenPdfModal,
  onOpenViewComment,
  onCommentRightClick,
  onRowRightClick,
  onCustomerRightClick,
  onSaveAccordionChanges,
}) => {
  return (
    <div className="flex flex-col h-full space-y-2.5">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 select-none">
        {/* All Active Status */}
        <div
          onClick={() => onFilterDashboard('ALL')}
          className={`col-span-2 sm:col-span-1 p-2.5 rounded-lg border cursor-pointer transition flex flex-col justify-center gap-0.5 shadow-2xs ${
            currentDashboardFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400/30'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-semibold opacity-80 leading-tight">
            Formy ke kontrole
          </span>
          <span className="text-xl font-extrabold">{counts.all}</span>
        </div>

        {/* Ve frontě na údržbu */}
        <div
          onClick={() => onFilterDashboard('Ve frontě na údržbu')}
          className={`p-2 sm:p-2.5 rounded-lg border cursor-pointer transition flex flex-col justify-center gap-0.5 shadow-2xs ${
            currentDashboardFilter === 'Ve frontě na údržbu'
              ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200 text-slate-900'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 truncate leading-tight">
            <span className="status-dot dot-orange" />
            <span className="truncate">Na údržbu</span>
          </div>
          <span className="text-lg font-bold">{counts.fronteUdrzbu}</span>
        </div>

        {/* Ve frontě na opravu */}
        <div
          onClick={() => onFilterDashboard('Ve frontě na opravu')}
          className={`p-2 sm:p-2.5 rounded-lg border cursor-pointer transition flex flex-col justify-center gap-0.5 shadow-2xs ${
            currentDashboardFilter === 'Ve frontě na opravu'
              ? 'bg-red-50 border-red-400 ring-2 ring-red-200 text-slate-900'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 truncate leading-tight">
            <span className="status-dot dot-red" />
            <span className="truncate">Na opravu</span>
          </div>
          <span className="text-lg font-bold">{counts.fronteOpravu}</span>
        </div>

        {/* Na údržbě / Na opravě */}
        <div
          onClick={() => onFilterDashboard('Na údržbě / Na opravě')}
          className={`p-2 sm:p-2.5 rounded-lg border cursor-pointer transition flex flex-col justify-center gap-0.5 shadow-2xs ${
            currentDashboardFilter === 'Na údržbě / Na opravě'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200 text-slate-900'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 truncate leading-tight">
            <span className="status-dot dot-yellow" />
            <span className="truncate">V procesu</span>
          </div>
          <span className="text-lg font-bold">{counts.naUdrzbe}</span>
        </div>

        {/* Na opravě pryč */}
        <div
          onClick={() => onFilterDashboard('Na opravě pryč')}
          className={`p-2 sm:p-2.5 rounded-lg border cursor-pointer transition flex flex-col justify-center gap-0.5 shadow-2xs ${
            currentDashboardFilter === 'Na opravě pryč'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200 text-slate-900'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 truncate leading-tight">
            <span className="status-dot dot-red" />
            <span className="truncate">Externě</span>
          </div>
          <span className="text-lg font-bold">{counts.opravePryc}</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex justify-between items-center text-xs text-slate-500 px-1">
        <span id="dashStats">
          Zobrazeno forem ke kontrole: {filteredMolds.length}
        </span>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-xs max-h-[520px]">
        <table className="w-full border-collapse text-left table-fixed">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            <tr>
              <th className="p-2 sm:p-3 w-[40%] text-left">Číslo formy</th>
              <th className="p-2 sm:p-3 w-[30%] text-center">Zákazník</th>
              <th className="p-2 sm:p-3 w-[30%] text-right">Pozice</th>
            </tr>
          </thead>
          <tbody>
            {filteredMolds.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400 text-sm">
                  V tomto stavu nejsou žádné formy
                </td>
              </tr>
            ) : (
              filteredMolds.map(mold => (
                <MoldRow
                  key={mold.id}
                  mold={mold}
                  comments={comments.filter(c => String(c.mold_id) === String(mold.id))}
                  customers={customers}
                  isSuperUser={isSuperUser}
                  currentUser={currentUser}
                  onEditPosition={onEditPosition}
                  onEditCustomer={onEditCustomer}
                  onOpenCommentModal={onOpenCommentModal}
                  onOpenFullEdit={onOpenFullEdit}
                  onOpenPhotoModal={onOpenPhotoModal}
                  onOpenPdfModal={onOpenPdfModal}
                  onOpenViewComment={onOpenViewComment}
                  onCommentRightClick={onCommentRightClick}
                  onRowRightClick={onRowRightClick}
                  onCustomerRightClick={onCustomerRightClick}
                  onSaveAccordionChanges={onSaveAccordionChanges}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
