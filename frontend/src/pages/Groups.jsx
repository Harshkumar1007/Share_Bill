import React, { useState } from 'react';
import { Plus, Users, ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Groups = () => {
  const [showModal, setShowModal] = useState(false);
  const [groups, setGroups] = useState([
    { id: 'group-1', name: 'Flatmates', description: 'Shared house expenses', memberCount: 3, balance: -15.00 },
    { id: 'group-2', name: 'Trip to Paris', description: 'Travel expenses', memberCount: 4, balance: 60.00 },
    { id: 'group-3', name: 'Office Lunch', description: 'Friday pizzas', memberCount: 8, balance: 0.00 },
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-50">Expense Groups</h1>
          <p className="text-sm text-slate-500 dark:text-dark-450">Collaborate and split expenses with group members.</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-500 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Create New Group
        </button>
      </div>

      {/* Grid of Groups */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const isOwed = group.balance > 0;
          const isOwe = group.balance < 0;

          return (
            <div
              key={group.id}
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm hover:shadow-md transition-all duration-250"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-dark-400">
                    <Users className="h-5 w-5" />
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-450 dark:text-dark-450">
                    {group.memberCount} members
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-dark-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {group.name}
                </h2>
                <p className="text-sm text-slate-455 mt-2 dark:text-dark-450 line-clamp-2">
                  {group.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-dark-850 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Your Balance</p>
                  <p className={`text-base font-bold mt-1 ${isOwed ? 'text-emerald-500' : isOwe ? 'text-red-500' : 'text-slate-500'}`}>
                    {group.balance === 0 ? 'Settled Up' : isOwed ? `+$${group.balance.toFixed(2)}` : `-$${Math.abs(group.balance).toFixed(2)}`}
                  </p>
                </div>
                
                <Link
                  to={`/groups/${group.id}`}
                  className="rounded-xl bg-slate-50 p-2 text-slate-650 group-hover:bg-brand-50 group-hover:text-brand-605 dark:bg-dark-800 dark:text-dark-300 dark:group-hover:bg-brand-950/30 dark:group-hover:text-brand-400 transition-all duration-200"
                >
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Mockup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-dark-900 dark:border-dark-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-dark-50 mb-2">Create New Group</h3>
            <p className="text-xs text-slate-550 dark:text-dark-400 mb-6">Group lists make sharing trip and rental costs easy.</p>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ski Trip"
                  className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                <input
                  type="text"
                  placeholder="Optional details"
                  className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-dark-850">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-dark-400 dark:hover:bg-dark-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
