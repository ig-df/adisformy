import React from 'react';
import { User, ShieldAlert, Users, Plus, History } from 'lucide-react';

interface HeaderProps {
  currentUser: string | null;
  isSuperUser: boolean;
  hasActiveIn24h: boolean;
  onAuthClick: () => void;
  onSuperuserClick: () => void;
  onToggleOnlineUsers: () => void;
  onOpenAddModal: () => void;
  onOpenLogsModal: () => void;
  onReload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isSuperUser,
  hasActiveIn24h,
  onAuthClick,
  onSuperuserClick,
  onToggleOnlineUsers,
  onOpenAddModal,
  onOpenLogsModal,
  onReload,
}) => {
  return (
    <header className="relative bg-white border-b border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between">
      {/* Left Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          id="authCornerBtn"
          onClick={onAuthClick}
          title={currentUser ? `Přihlášen jako: ${currentUser} (Odhlásit)` : "Přihlášení uživatele"}
          className={`h-9 px-2.5 sm:px-3 rounded-lg border text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
            currentUser
              ? 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{currentUser ? currentUser : "Přihlásit"}</span>
        </button>

        {isSuperUser && (
          <button
            id="superuserBadgeBtn"
            onClick={onSuperuserClick}
            title="Helios Superuser Panel"
            className="superuser-badge-btn w-9 h-9 rounded-lg bg-red-600 border border-red-700 flex items-center justify-center text-white cursor-pointer hover:bg-red-700 transition"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        )}

        {isSuperUser && (
          <button
            id="onlineUsersToggleBtn"
            onClick={onToggleOnlineUsers}
            title="Aktivní uživatelé"
            className="relative w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 transition shadow-xs"
          >
            <Users className="w-4 h-4" />
            {hasActiveIn24h && (
              <span
                id="onlineCountBadge"
                className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"
              />
            )}
          </button>
        )}
      </div>

      {/* Center Logo / Branding */}
      <div className="flex items-center justify-center cursor-pointer select-none" onClick={onReload} title="Aktualizovat">
        <img
          src="/logo.png"
          alt="Adis Logo"
          id="siteLogo"
          className="h-10 sm:h-11 max-h-[46px] w-auto object-contain cursor-pointer transition-all hover:opacity-85 active:scale-95"
          onError={(e) => {
            // Fallback if image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          id="btnOpenAddModal"
          onClick={onOpenAddModal}
          title="Přidat formu"
          className="top-icon-btn w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 transition shadow-xs"
        >
          <img src="/icon3.png" alt="Přidat" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
        </button>
        <button
          id="btnOpenLogsModal"
          onClick={onOpenLogsModal}
          title="Historie změn"
          className="top-icon-btn w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 transition shadow-xs"
        >
          <img src="/icon2.png" alt="Historie" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
        </button>
      </div>
    </header>
  );
};
