import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PlusCircle, CreditCard, Calendar, User, ChevronRight } from 'lucide-react';

export const GroupDetails = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' or 'balances'
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Mock group details
  const group = {
    id,
    name: 'Trip to Paris',
    description: 'Travel expenses, hotel, dinners, and flight tickets.',
    members: [
      { id: 'creator-uuid', name: 'You (Current User)', email: 'user@example.com' },
      { id: 'user-1', name: 'Alice Smith', email: 'alice@example.com' },
      { id: 'user-2', name: 'Bob Jones', email: 'bob@example.com' }
    ]
  };

  const expenses = [
    { id: 'exp-1', description: 'Hotel Booking', amount: 300.00, paidBy: 'You', date: '14 June 2026', type: 'expense' },
    { id: 'exp-2', description: 'Paris Metro Tickets', amount: 45.00, paidBy: 'Alice Smith', date: '13 June 2026', type: 'expense' },
    { id: 'exp-3', description: 'Dinner at Bistro', amount: 90.00, paidBy: 'Bob Jones', date: '12 June 2026', type: 'expense' },
  ];

  const balances = [
    { debtor: 'Alice Smith', creditor: 'You', amount: 45.00 },
    { debtor: 'Bob Jones', creditor: 'You', amount: 15.00 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Navigation Header */}
      <div>
        <Link
          to="/groups"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-550 hover:text-slate-900 dark:text-dark-450 dark:hover:text-dark-100 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Groups
        </Link>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-50">{group.name}</h1>
            <p className="text-sm text-slate-500 mt-1 dark:text-dark-450">{group.description}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-500 transition-all duration-200"
            >
              <PlusCircle className="h-4 w-4" />
              Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-dark-800">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === 'expenses'
              ? 'border-brand-500 text-brand-600 dark:text-brand-450'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-dark-450 dark:hover:text-dark-250'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === 'balances'
              ? 'border-brand-500 text-brand-600 dark:text-brand-450'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-dark-450 dark:hover:text-dark-250'
          }`}
        >
          Balances / Settle Up
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'expenses' ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden dark:border-dark-800 dark:bg-dark-900 shadow-sm">
          <div className="divide-y divide-slate-100 dark:divide-dark-850">
            {expenses.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 dark:hover:bg-dark-850/30 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-650 dark:text-dark-300">
                    <Calendar className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-dark-100">{exp.description}</h3>
                    <p className="text-xs text-slate-450 mt-1 dark:text-dark-450">
                      Paid by <span className="font-semibold text-slate-600 dark:text-dark-300">{exp.paidBy}</span> on {exp.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-slate-900 dark:text-dark-50">${exp.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-450 dark:text-dark-450 mt-0.5">Split equally</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Debts list */}
          <div className="md:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50 mb-6">Who owes whom</h2>
            <div className="space-y-4">
              {balances.map((bal, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-850">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold">
                      {bal.debtor[0]}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-dark-100">
                      <span className="font-bold text-slate-900 dark:text-dark-50">{bal.debtor}</span> owes <span className="font-bold text-slate-900 dark:text-dark-50">{bal.creditor}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-base font-extrabold text-brand-600 dark:text-brand-400">${bal.amount.toFixed(2)}</span>
                    <button className="flex items-center gap-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-dark-800 dark:hover:bg-dark-750 dark:border-dark-700 dark:text-dark-200 transition-colors shadow-sm">
                      <CreditCard className="h-3.5 w-3.5" />
                      Settle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members list */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50 mb-4">Members</h2>
            <div className="space-y-4">
              {group.members.map((mem) => (
                <div key={mem.id} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-dark-400">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-dark-150">{mem.name}</p>
                    <p className="text-xs text-slate-450 dark:text-dark-450">{mem.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal Mockup */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-dark-900 dark:border-dark-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-dark-50 mb-2">Add New Expense</h3>
            <p className="text-xs text-slate-550 dark:text-dark-400 mb-6">Create splits automatically across all members.</p>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAddExpense(false); }}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Dinner"
                  className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Paid By</label>
                <select className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50">
                  <option value="me">You</option>
                  <option value="alice">Alice Smith</option>
                  <option value="bob">Bob Jones</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-dark-850">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-dark-400 dark:hover:bg-dark-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetails;
