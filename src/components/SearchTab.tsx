import React from 'react';
import { Search } from 'lucide-react';
import { Mold, MoldComment, Customer } from '../types';
import { MoldRow } from './MoldRow';

interface SearchTabProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filteredMolds: Mold[];
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

export const SearchTab: React.FC<SearchTabProps> = ({
  searchQuery,
  onSearchChange,
  filteredMolds,
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
      {/* Search Input Box */}
      <div className="relative">
        <input
          id="searchInput"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Zadejte číslo formy, výrobu, pozici nebo zákazníka..."
          className="w-full pl-9 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-200 rounded-lg bg-white outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition shadow-xs"
          autoComplete="off"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      </div>

      {/* Stats bar */}
      <div className="flex justify-between items-center text-xs text-slate-500 px-1">
        <span id="searchStats">
          {searchQuery ? `Nalezeno výsledků: ${filteredMolds.length}` : ''}
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
            {!searchQuery ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400 text-sm">
                  Začněte psát do pole výše
                </td>
              </tr>
            ) : filteredMolds.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400 text-sm">
                  Nic nenalezeno
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
