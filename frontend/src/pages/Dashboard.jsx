import React from 'react';
import { ArrowUpRight, ArrowDownRight, Users, PlusCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  // Static boilerplate view data
  const stats = [
    { name: 'Total Balance', value: '+$45.00', icon: ArrowUpRight, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400' },
    { name: 'You Owe', value: '$15.00', icon: ArrowDownRight, color: 'text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400' },
    { name: 'You are Owed', value: '$60.00', icon: ArrowUpRight, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400' },
  ];

  const recentActivities = [
    { id: 1, desc: 'Alice added "Dinner at Pizzeria" in Flatmates', amount: '$90.00', date: 'Today, 2:30 PM', type: 'info' },
    { id: 2, desc: 'You paid Bob for "Uber ride" in Trip to Paris', amount: '$15.00', date: 'Yesterday, 8:15 PM', type: 'payment' },
    { id: 3, desc: 'Bob added "Groceries" in Flatmates', amount: '$45.00', date: '12 June, 4:00 PM', type: 'info' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-50">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-dark-450">Track balances, split bills, and manage expenses.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            to="/groups"
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-500 transition-all duration-200"
          >
            <PlusCircle className="h-4 w-4" />
            New Expense Group
          </Link>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-450 dark:text-dark-450">{stat.name}</span>
              <span className={`rounded-xl p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-50">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main activity list */}
        <div className="md:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50 mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-dark-850">
                <div className="flex gap-3">
                  <div className="rounded-xl bg-slate-100 p-2 dark:bg-dark-800 text-slate-500 dark:text-dark-350">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-dark-150">{act.desc}</p>
                    <p className="text-xs text-slate-450 mt-1 dark:text-dark-450">{act.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-800 dark:text-dark-100">{act.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions panel */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50 mb-2">My Groups</h2>
            <p className="text-xs text-slate-450 dark:text-dark-450 leading-relaxed mb-6">
              Organize group splits, balances, and settle-up records.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-dark-800 hover:bg-slate-50 dark:hover:bg-dark-850 transition-all duration-150">
                <span className="text-sm font-semibold text-slate-700 dark:text-dark-200">Flatmates</span>
                <span className="text-xs font-bold text-red-500">Owe $15.00</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-dark-800 hover:bg-slate-50 dark:hover:bg-dark-850 transition-all duration-150">
                <span className="text-sm font-semibold text-slate-700 dark:text-dark-200">Trip to Paris</span>
                <span className="text-xs font-bold text-emerald-500">Owed $60.00</span>
              </div>
            </div>
          </div>
          <Link
            to="/groups"
            className="flex items-center justify-center gap-1 mt-6 text-sm font-bold text-brand-650 hover:text-brand-550 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
          >
            View All Groups
            <Users className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
