import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Receipt, CreditCard, FileSpreadsheet, Activity } from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Groups', path: '/groups', icon: Users },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'CSV Import', path: '/import', icon: FileSpreadsheet },
    { name: 'Activity Log', path: '/activities', icon: Activity },
  ];

  const sidebarClass = `
    fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200/80 bg-white pt-16 transition-transform duration-300 dark:border-dark-800 dark:bg-dark-900 lg:static lg:translate-x-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      <aside className={sidebarClass}>
        <div className="flex h-full flex-col justify-between px-4 py-6">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200
                  ${isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-dark-450 dark:hover:bg-dark-800 dark:hover:text-dark-100'
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Quick Stats Card placeholder in Sidebar */}
          <div className="rounded-2xl bg-gradient-to-tr from-brand-600/10 to-violet-500/10 p-4 border border-brand-500/10 dark:from-brand-950/20 dark:to-violet-950/20 dark:border-brand-900/20">
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400 font-semibold text-xs mb-1 uppercase tracking-wider">
              <CreditCard className="h-4 w-4" />
              Settle Balance
            </div>
            <p className="text-xs text-slate-500 dark:text-dark-400 leading-relaxed">
              Keep your debts clean! View individual group sheets to settle payments.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
