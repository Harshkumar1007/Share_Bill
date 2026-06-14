import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, DollarSign, Filter, Search, User, Eye, X, Trash2, Info, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import expenseService from '../services/expense.service';
import { useAuth } from '../hooks/useAuth';

const CURRENCIES = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'C$', AUD: 'A$'
};

const getCurrencySymbol = (code) => CURRENCIES[code] || '$';

export const Expenses = () => {
  const { user: currentUser } = useAuth();
  
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected expense details modal state
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expenseService.getAllExpenses();
      if (res.success && res.data) {
        setExpenses(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch expenses history');
    } finally {
      setLoading(false);
    }
  };

  // Compile a unique list of members across all expenses to populate the dropdown
  const getUniqueMembers = () => {
    const registry = {};
    expenses.forEach(exp => {
      if (exp.paidBy) {
        registry[exp.paidBy.id] = exp.paidBy.name;
      }
      if (exp.splits) {
        exp.splits.forEach(s => {
          if (s.user) {
            registry[s.user.id] = s.user.name;
          }
        });
      }
    });
    return Object.entries(registry).map(([id, name]) => ({ id, name }));
  };

  const uniqueMembers = getUniqueMembers();

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMemberId('');
    setStartDate('');
    setEndDate('');
  };

  // Delete handler
  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    try {
      setDeleting(true);
      await expenseService.deleteExpense(selectedExpense.groupId, selectedExpense.id);
      
      // Update local state list
      setExpenses(prev => prev.filter(e => e.id !== selectedExpense.id));
      setSelectedExpense(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  // Filter logic on client-side
  const filteredExpenses = expenses.filter(exp => {
    // Description search match
    if (searchQuery && !exp.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Member match: must be either payer OR participant
    if (selectedMemberId) {
      const isPayer = exp.paidById === selectedMemberId;
      const isParticipant = exp.splits && exp.splits.some(s => s.userId === selectedMemberId);
      if (!isPayer && !isParticipant) {
        return false;
      }
    }

    // Date range start match
    if (startDate) {
      const start = new Date(startDate);
      const expDate = new Date(exp.date);
      // Normalize time to compare only dates
      start.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);
      if (expDate < start) return false;
    }

    // Date range end match
    if (endDate) {
      const end = new Date(endDate);
      const expDate = new Date(exp.date);
      end.setHours(23, 59, 59, 999);
      expDate.setHours(0, 0, 0, 0);
      if (expDate > end) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Title Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-dark-50">Expenses History</h1>
          <p className="text-sm text-slate-500 dark:text-dark-450">Review and filter all logged bills across your active groups.</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 border border-red-200 text-sm font-bold text-red-650 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Advanced Filter Deck */}
      <div className="bg-white border border-slate-200/80 dark:border-dark-800 dark:bg-dark-900 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-sm font-bold text-slate-700 dark:text-dark-200 uppercase tracking-wider">Search & Filters</h2>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by description..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Member Selection Dropdown */}
          <div>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
            >
              <option value="">All Group Members</option>
              {uniqueMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold shrink-0">From</span>
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold shrink-0">To</span>
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || selectedMemberId || startDate || endDate) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear active filters
            </button>
          </div>
        )}
      </div>

      {/* Tabular Expense List */}
      <div className="bg-white border border-slate-200/80 dark:border-dark-800 dark:bg-dark-900 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:border-dark-850 dark:bg-dark-950/20 dark:text-dark-400">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6">Group</th>
                <th className="py-4 px-6">Paid By</th>
                <th className="py-4 px-6">Split Strategy</th>
                <th className="py-4 px-6 text-right">Total Amount</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 dark:divide-dark-850 dark:text-dark-300">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-medium dark:text-dark-450">
                    No expense records found matching active filter parameters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const symbol = getCurrencySymbol(exp.currency);
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-dark-850/30 transition-all duration-200"
                    >
                      {/* Date */}
                      <td className="py-4.5 px-6 whitespace-nowrap font-medium text-slate-500 dark:text-dark-400">
                        {new Date(exp.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      {/* Description */}
                      <td className="py-4.5 px-6 font-bold text-slate-900 dark:text-dark-50">
                        {exp.description}
                      </td>

                      {/* Group Link */}
                      <td className="py-4.5 px-6 whitespace-nowrap">
                        <Link
                          to={`/groups/${exp.group?.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-brand-650 hover:text-brand-500 dark:text-brand-400 hover:underline"
                        >
                          <Tag className="h-3 w-3 text-slate-400" />
                          {exp.group?.name || 'Unknown Group'}
                        </Link>
                      </td>

                      {/* Paid By */}
                      <td className="py-4.5 px-6 whitespace-nowrap font-semibold">
                        {exp.paidById === currentUser?.id ? 'You' : exp.paidBy?.name}
                      </td>

                      {/* Split Type */}
                      <td className="py-4.5 px-6 whitespace-nowrap font-semibold">
                        <span className="inline-flex items-center rounded-xl bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-550 border border-slate-100 dark:bg-dark-950/40 dark:border-dark-800 dark:text-dark-400 uppercase tracking-wide">
                          {exp.splitType}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4.5 px-6 whitespace-nowrap text-right font-black text-slate-900 dark:text-dark-50">
                        {symbol}{exp.amount.toFixed(2)}
                      </td>

                      {/* View Button */}
                      <td className="py-4.5 px-6 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedExpense(exp)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-650 hover:text-brand-500 dark:text-brand-400 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/20 dark:hover:bg-brand-950/40 px-3 py-1.5 rounded-xl transition-all duration-200"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DETAIL OVERLAY MODAL --- */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-dark-900 dark:border-dark-800 max-h-[85vh] overflow-y-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-850">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-dark-50 tracking-tight">
                  Expense Details
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">ID: {selectedExpense.id}</p>
              </div>
              <button
                onClick={() => { setSelectedExpense(null); setShowDeleteConfirm(false); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Core Card Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-dark-950/30 border border-slate-100 dark:border-dark-850 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Paid</span>
                <p className="text-2xl font-black text-slate-900 dark:text-dark-100">
                  {getCurrencySymbol(selectedExpense.currency)}{selectedExpense.amount.toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                  Paid by: {selectedExpense.paidById === currentUser?.id ? 'You' : selectedExpense.paidBy?.name}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-dark-950/30 border border-slate-100 dark:border-dark-850 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Details info</span>
                <div className="text-xs font-semibold text-slate-700 dark:text-dark-200 space-y-1">
                  <p className="truncate"><span className="text-slate-400 font-medium">Group:</span> {selectedExpense.group?.name}</p>
                  <p><span className="text-slate-400 font-medium">Strategy:</span> {selectedExpense.splitType}</p>
                  <p>
                    <span className="text-slate-400 font-medium">Date:</span>{' '}
                    {new Date(selectedExpense.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Description Text */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Description</span>
              <p className="text-sm font-bold text-slate-800 dark:text-dark-100 bg-slate-50 dark:bg-dark-950/20 border border-slate-100 dark:border-dark-850 rounded-xl p-3">
                {selectedExpense.description}
              </p>
            </div>

            {/* Splits Breakdown table list */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Info className="h-4.5 w-4.5 text-brand-600" />
                Splits Allocation Breakdown ({selectedExpense.splits?.length || 0} participants)
              </span>

              <div className="border border-slate-200/70 dark:border-dark-850 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-dark-850">
                {selectedExpense.splits?.map(s => {
                  const isCurParticipant = s.userId === currentUser?.id;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3.5 bg-white dark:bg-dark-900 text-xs"
                    >
                      <div className="truncate">
                        <p className="font-bold text-slate-800 dark:text-dark-150 truncate">
                          {isCurParticipant ? 'You (Current User)' : s.user?.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{s.user?.email}</p>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        {/* Dynamic share labels (percentages or shares) */}
                        {selectedExpense.splitType === 'PERCENTAGE' && s.percentage !== null && (
                          <span className="text-[10px] font-bold text-slate-450 border border-slate-100 dark:border-dark-800 rounded px-1.5 py-0.5 bg-slate-50 dark:bg-dark-950/20">
                            {s.percentage}%
                          </span>
                        )}
                        {selectedExpense.splitType === 'SHARE' && s.shares !== null && (
                          <span className="text-[10px] font-bold text-slate-450 border border-slate-100 dark:border-dark-800 rounded px-1.5 py-0.5 bg-slate-50 dark:bg-dark-950/20">
                            {s.shares} shares
                          </span>
                        )}

                        <span className="font-black text-slate-900 dark:text-dark-50 text-sm">
                          {getCurrencySymbol(selectedExpense.currency)}{s.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: Delete trigger */}
            <div className="pt-4 border-t border-slate-100 dark:border-dark-850 flex items-center justify-between">
              {/* Only Allow Payee/Payer to delete this expense */}
              {selectedExpense.paidById === currentUser?.id ? (
                <div>
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-xl border border-red-200 hover:border-red-500 hover:bg-red-50 bg-white py-2 px-4 text-xs font-bold text-red-650 dark:bg-dark-900 dark:border-dark-800 dark:hover:bg-red-950/15 dark:hover:border-red-900/40 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Expense
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <span className="text-[11px] font-bold text-red-550 flex items-center gap-1 dark:text-red-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Confirm?
                      </span>
                      <button
                        type="button"
                        onClick={handleDeleteExpense}
                        disabled={deleting}
                        className="rounded-xl bg-red-600 hover:bg-red-500 py-1.5 px-3 text-xs font-bold text-white transition-colors"
                      >
                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-xl bg-slate-100 hover:bg-slate-200 py-1.5 px-3 text-xs font-bold text-slate-650 dark:bg-dark-800 dark:hover:bg-dark-750 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic">
                  * Only the payer can delete this expense.
                </span>
              )}

              <button
                type="button"
                onClick={() => { setSelectedExpense(null); setShowDeleteConfirm(false); }}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-5 dark:bg-dark-800 dark:hover:bg-dark-750 transition-colors ml-auto"
              >
                Close
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
