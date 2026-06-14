import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Receipt, 
  CreditCard, 
  Plus, 
  FileSpreadsheet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Clock
} from 'lucide-react';

export const Dashboard = () => {
  // Static boilerplate metrics matching the Tricount philosophy (Clean, numbers-focused, high contrast)
  const metrics = [
    { name: 'Total Groups', value: '3 Active', detail: 'Flatmates, Paris, Office', icon: Users, color: 'text-violet-650 bg-violet-50 dark:bg-violet-950/20 dark:text-violet-400' },
    { name: 'Total Expenses', value: '$530.00', detail: '5 Transactions recorded', icon: Receipt, color: 'text-brand-650 bg-brand-50 dark:bg-brand-950/20 dark:text-brand-400' },
    { name: 'Pending Settlements', value: '2 Pending', detail: 'Alice ($45), Bob ($15)', icon: CreditCard, color: 'text-amber-650 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400' },
  ];

  const recentExpenses = [
    { id: 'exp-1', description: 'Hotel Booking', amount: 300.00, group: 'Trip to Paris', date: 'Today, 2:30 PM', paidBy: 'You', status: 'owed', change: '+$200.00' },
    { id: 'exp-2', description: 'Groceries', amount: 90.00, group: 'Flatmates', date: 'Yesterday, 6:10 PM', paidBy: 'Alice Smith', status: 'owe', change: '-$30.00' },
    { id: 'exp-3', description: 'Paris Metro Tickets', amount: 45.00, group: 'Trip to Paris', date: '13 June, 10:15 AM', paidBy: 'Alice Smith', status: 'owe', change: '-$15.00' },
    { id: 'exp-4', description: 'Dinner at Bistro', amount: 90.00, group: 'Trip to Paris', date: '12 June, 8:40 PM', paidBy: 'Bob Jones', status: 'owe', change: '-$30.00' },
    { id: 'exp-5', description: 'Office Pizza Lunch', amount: 80.00, group: 'Office Lunch', date: '10 June, 1:00 PM', paidBy: 'You', status: 'owed', change: '+$70.00' },
  ];

  const quickActions = [
    { name: 'Create Group', description: 'Start splitting bills', path: '/groups', icon: Plus, gradient: 'from-brand-600 to-violet-600' },
    { name: 'CSV Import', description: 'Upload spreadsheets', path: '/import', icon: FileSpreadsheet, gradient: 'from-emerald-600 to-teal-600' },
    { name: 'Expense History', description: 'View all logs', path: '/expenses', icon: Receipt, gradient: 'from-blue-600 to-indigo-600' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero standing summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-brand-700 to-brand-500 p-8 text-white shadow-xl shadow-brand-500/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 right-0 -mb-16 -mr-16 h-48 w-48 rounded-full bg-violet-400/20 blur-2xl"></div>

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-100">Overall Balance Standing</span>
            <h1 className="font-extrabold text-4xl sm:text-5xl tracking-tight text-white font-sans">+$195.00</h1>
            <p className="text-sm text-brand-100 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              You are owed money across all active expense groups
            </p>
          </div>

          <Link
            to="/groups"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 px-6 text-sm font-bold text-brand-600 hover:bg-brand-50 transition-all duration-200 shadow-lg active:scale-[0.98]"
          >
            Settle Balances
            <ArrowUpRight className="h-4.5 w-4.5" />
          </Link>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="flex items-start gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <span className={`rounded-2xl p-3 shrink-0 ${metric.color}`}>
              <metric.icon className="h-6 w-6" />
            </span>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-450 dark:text-dark-450 uppercase tracking-wider">{metric.name}</span>
              <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-dark-50 font-sans">{metric.value}</p>
              <p className="text-xs text-slate-500 dark:text-dark-405">{metric.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Recent Expenses List */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">Recent Group Expenses</h2>
              <Link to="/expenses" className="text-xs font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400">
                View All
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-dark-850">
              {recentExpenses.map((exp) => {
                const isOwed = exp.status === 'owed';
                return (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-slate-50/30 dark:hover:bg-dark-850/20 px-2 rounded-2xl transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-slate-100 p-2 dark:bg-dark-800 text-slate-550 dark:text-dark-350">
                        <Clock className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-dark-150">{exp.description}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-450 dark:text-dark-450">
                          <span className="font-semibold">{exp.group}</span>
                          <span>•</span>
                          <span>{exp.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800 dark:text-dark-100">${exp.amount.toFixed(2)}</p>
                      <p className={`text-xs font-bold mt-0.5 ${isOwed ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isOwed ? `Owed: ${exp.change}` : `You owe: ${exp.change.replace('-', '')}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions and Standings */}
        <div className="space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.path}
                  className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100 hover:border-brand-500/20 hover:bg-slate-50 dark:border-dark-800 dark:hover:border-brand-900/30 dark:hover:bg-dark-850 transition-all duration-200 group"
                >
                  <span className={`rounded-xl p-2.5 bg-gradient-to-tr ${action.gradient} text-white shadow-md shadow-brand-500/10`}>
                    <action.icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-850 dark:text-dark-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {action.name}
                    </p>
                    <p className="text-xs text-slate-450 dark:text-dark-450">{action.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {/* Tricount-style group card summary */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50 mb-3">Standing by Group</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-850">
                <span className="text-sm font-semibold text-slate-700 dark:text-dark-200">Trip to Paris</span>
                <span className="text-sm font-bold text-emerald-500">Owed $200.00</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-850">
                <span className="text-sm font-semibold text-slate-700 dark:text-dark-200">Flatmates</span>
                <span className="text-sm font-bold text-red-500">Owe $30.00</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-850">
                <span className="text-sm font-semibold text-slate-700 dark:text-dark-200">Office Lunch</span>
                <span className="text-sm font-bold text-emerald-500">Owed $25.00</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
