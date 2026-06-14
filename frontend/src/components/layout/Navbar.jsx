import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, Bell, Menu } from 'lucide-react';

export const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-dark-800 dark:bg-dark-900/80">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-dark-450 dark:hover:bg-dark-800 lg:hidden"
            aria-label="Toggle Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-bold text-lg shadow-md shadow-brand-500/25">
              SB
            </span>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent dark:from-brand-400 dark:to-violet-300">
              ShareBill
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications Placeholder */}
          <button className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-dark-450 dark:hover:bg-dark-800 dark:hover:text-dark-100 transition-all duration-200">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-500 animate-ping"></span>
          </button>

          {/* User Profile Info */}
          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-dark-800">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800 dark:text-dark-100">{user.name}</p>
                <p className="text-xs text-slate-450 dark:text-dark-450">{user.email}</p>
              </div>
              
              <div className="group relative">
                <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 transition-all duration-200">
                  <User className="h-5 w-5 text-slate-600 dark:text-dark-300" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl border border-slate-150 bg-white p-1 shadow-lg ring-1 ring-black/5 dark:border-dark-800 dark:bg-dark-900 hidden group-hover:block transition-all duration-300">
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-all duration-150"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
