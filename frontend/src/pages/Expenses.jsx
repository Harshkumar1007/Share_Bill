import React from 'react';
import { Calendar, Tag, DollarSign, Filter } from 'lucide-react';

export const Expenses = () => {
  // Mock listing items
  const expenses = [
    { id: 'exp-1', description: 'Hotel Booking', amount: 300.00, group: 'Trip to Paris', date: '14 June 2026', paidBy: 'You' },
    { id: 'exp-2', description: 'Groceries', amount: 90.00, group: 'Flatmates', date: '13 June 2026', paidBy: 'Alice Smith' },
    { id: 'exp-3', description: 'Paris Metro Tickets', amount: 45.00, group: 'Trip to Paris', date: '13 June 2026', paidBy: 'Alice Smith' },
    { id: 'exp-4', description: 'Dinner at Bistro', amount: 90.00, group: 'Trip to Paris', date: '12 June 2026', paidBy: 'Bob Jones' },
    { id: 'exp-5', description: 'Office Pizza Lunch', amount: 80.00, group: 'Office Lunch', date: '10 June 2026', paidBy: 'You' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-50">Expenses History</h1>
          <p className="text-sm text-slate-500 dark:text-dark-450">Review history of all your bills and payments.</p>
        </div>
        
        {/* Mock Filter Controls */}
        <button className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 dark:bg-dark-900 dark:hover:bg-dark-800 dark:border-dark-800 dark:text-dark-200 transition-colors shadow-sm">
          <Filter className="h-4.5 w-4.5" />
          Filter Logs
        </button>
      </div>

      {/* Expense list */}
      <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden dark:border-dark-800 dark:bg-dark-900 shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-dark-850">
          {expenses.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 dark:hover:bg-dark-850/30 transition-all duration-200">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-150 dark:bg-dark-850 text-slate-600 dark:text-dark-350 font-extrabold">
                  $
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-dark-100">{exp.description}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-450 dark:text-dark-450">
                      <Tag className="h-3 w-3" />
                      {exp.group}
                    </span>
                    <span className="text-slate-300 dark:text-dark-850">•</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-450 dark:text-dark-450">
                      <Calendar className="h-3 w-3" />
                      {exp.date}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-slate-900 dark:text-dark-50">${exp.amount.toFixed(2)}</p>
                <p className="text-xs text-slate-450 dark:text-dark-450 mt-0.5">Paid by {exp.paidBy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
