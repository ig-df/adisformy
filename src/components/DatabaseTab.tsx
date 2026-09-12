import React, { useRef, useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Mold, MoldComment, Customer } from '../types';
import { MoldRow } from './MoldRow';

interface DatabaseTabProps {
  currentCustomerFilter: string;
  onFilterCustomer: (customerName: string) => void;
  onOpenAddCustomerModal: () => void;
  customers: Customer[];
  filteredMolds: Mold[];
  totalActiveCount: number;
  comments: MoldComment[];
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

export const DatabaseTab: React.FC<DatabaseTabProps> = ({
  currentCustomerFilter,
  onFilterCustomer,
  onOpenAddCustomerModal,
  customers,
  filteredMolds,
  totalActiveCount,
  comments,
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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [customers]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
    checkScroll();
  };

  const handleMouseUpOrLeave = () => {
    isMouseDownRef.current = false;
    // Keep hasDraggedRef true for a short moment so click handlers know not to fire
    if (hasDraggedRef.current) {
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 50);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (e.deltaY !== 0) {
      el.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const scrollByAmount = (amount: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 250);
  };

  const handleTagClick = (action: () => void) => {
    if (hasDraggedRef.current) return;
    action();
  };

  return (
    <div className="flex flex-col h-full space-y-2.5">
      {/* Customer Filter Chips Bar */}
      <div className="relative flex items-center group">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByAmount(-180)}
            className="hidden sm:flex absolute left-0 z-20 w-6 h-6 items-center justify-center rounded-full bg-white/95 shadow-md border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors -translate-x-1"
            title="Posunout doleva"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onWheel={handleWheel}
          onScroll={checkScroll}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none select-none cursor-grab active:cursor-grabbing"
        >
          <button
            onClick={() => handleTagClick(() => onFilterCustomer('ALL'))}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition shrink-0 ${
              currentCustomerFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Vše
          </button>

          <span className="w-px h-5 bg-slate-200 shrink-0 mx-0.5" />

          {customers.map((c) => {
            const isActive = currentCustomerFilter === c.name;
            return (
              <button
                key={c.name}
                onClick={() => handleTagClick(() => onFilterCustomer(c.name))}
                onContextMenu={(e) => onCustomerRightClick(e, c.name)}
                style={{ backgroundColor: c.bg }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border text-slate-950 transition shrink-0 hover:scale-105 ${
                  isActive
                    ? 'border-slate-900 ring-2 ring-slate-400/40 shadow-xs'
                    : 'border-slate-300'
                }`}
              >
                {c.name}
              </button>
            );
          })}

          <button
            onClick={() => handleTagClick(onOpenAddCustomerModal)}
            title="Přidat nového zákazníka"
            className="w-7 h-7 rounded-lg border border-dashed border-slate-300 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByAmount(180)}
            className="hidden sm:flex absolute right-0 z-20 w-6 h-6 items-center justify-center rounded-full bg-white/95 shadow-md border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors translate-x-1"
            title="Posunout doprava"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex justify-between items-center text-xs text-slate-500 px-1">
        <span id="dbStats">
          Zobrazeno forem: {filteredMolds.length} z {totalActiveCount}
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
                  Žádné formy v databázi pro tento filtr
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
