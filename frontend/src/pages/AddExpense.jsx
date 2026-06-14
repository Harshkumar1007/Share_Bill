import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, DollarSign, Calendar, FileText, User, Users, Percent, Calculator, Hash } from 'lucide-react';
import groupService from '../services/group.service';
import expenseService from '../services/expense.service';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export const AddExpense = () => {
  const { id: groupId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Group context
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]); // All members (including inactive)
  const [activeMembers, setActiveMembers] = useState([]); // Filtered active members

  // Form Fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paidById, setPaidById] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitType, setSplitType] = useState('EQUAL');

  // Selected participants list
  const [selectedParticipants, setSelectedParticipants] = useState({});

  // Individual inputs for splits (stored as strings to allow natural typing e.g. decimals)
  const [splitInputs, setSplitInputs] = useState({});

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        const res = await groupService.getGroupById(groupId);
        if (res.success && res.data) {
          const groupData = res.data;
          setGroupName(groupData.name);
          
          // Filter to get only active members (leftAt is null)
          const activeMems = groupData.members.filter(m => !m.leftAt);
          setMembers(groupData.members);
          setActiveMembers(activeMems);

          // Default paidBy to first active member
          if (activeMems.length > 0) {
            setPaidById(activeMems[0].id);
          }

          // Default checklist: check all active members
          const initialParticipants = {};
          activeMems.forEach(m => {
            initialParticipants[m.id] = true;
          });
          setSelectedParticipants(initialParticipants);

          // Initialize split input fields
          const initialInputs = {};
          activeMems.forEach(m => {
            initialInputs[m.id] = '';
          });
          setSplitInputs(initialInputs);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch group details');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);

  // Handle participant checkbox toggling
  const handleParticipantToggle = (memberId) => {
    setSelectedParticipants(prev => {
      const next = { ...prev, [memberId]: !prev[memberId] };
      // Check if we have at least one participant left
      const activeCount = Object.values(next).filter(Boolean).length;
      if (activeCount === 0) {
        // Prevent deselecting last member
        return prev;
      }
      return next;
    });
  };

  // Handle individual split input changes
  const handleSplitInputChange = (memberId, val) => {
    setSplitInputs(prev => ({
      ...prev,
      [memberId]: val
    }));
  };

  // Get list of checked active members
  const checkedMembers = activeMembers.filter(m => selectedParticipants[m.id]);
  const checkedCount = checkedMembers.length;
  const numericAmount = parseFloat(amount) || 0;

  // Live split calculations to display to the user
  const getLiveSplits = () => {
    if (numericAmount <= 0 || checkedCount === 0) return {};

    const splits = {};

    if (splitType === 'EQUAL') {
      const splitVal = numericAmount / checkedCount;
      checkedMembers.forEach(m => {
        splits[m.id] = splitVal;
      });
    } else if (splitType === 'PERCENTAGE') {
      checkedMembers.forEach(m => {
        const pct = parseFloat(splitInputs[m.id]) || 0;
        splits[m.id] = (numericAmount * pct) / 100;
      });
    } else if (splitType === 'EXACT') {
      checkedMembers.forEach(m => {
        const amt = parseFloat(splitInputs[m.id]) || 0;
        splits[m.id] = amt;
      });
    } else if (splitType === 'SHARE') {
      const totalShares = checkedMembers.reduce((sum, m) => sum + (parseFloat(splitInputs[m.id]) || 0), 0);
      checkedMembers.forEach(m => {
        const shares = parseFloat(splitInputs[m.id]) || 0;
        splits[m.id] = totalShares > 0 ? (numericAmount * shares) / totalShares : 0;
      });
    }

    return splits;
  };

  const liveSplits = getLiveSplits();
  const selectedCurrencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  // Summarize status/validations
  const getValidationErrors = () => {
    if (numericAmount <= 0) return '';
    if (checkedCount === 0) return 'Please select at least one participant';

    if (splitType === 'PERCENTAGE') {
      const totalPercent = checkedMembers.reduce((sum, m) => sum + (parseFloat(splitInputs[m.id]) || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        return `Percentages must sum to 100% (currently ${totalPercent.toFixed(1)}%)`;
      }
    } else if (splitType === 'EXACT') {
      const totalExact = checkedMembers.reduce((sum, m) => sum + (parseFloat(splitInputs[m.id]) || 0), 0);
      const diff = numericAmount - totalExact;
      if (Math.abs(diff) > 0.01) {
        return `Exact amounts must sum to ${selectedCurrencySymbol}${numericAmount.toFixed(2)} (currently off by ${selectedCurrencySymbol}${diff.toFixed(2)})`;
      }
    } else if (splitType === 'SHARE') {
      const totalShares = checkedMembers.reduce((sum, m) => sum + (parseFloat(splitInputs[m.id]) || 0), 0);
      if (totalShares <= 0) {
        return 'Please input shares for participants';
      }
    }
    return '';
  };

  const validationError = getValidationErrors();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    if (numericAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (checkedCount === 0) {
      setError('Please select at least one participant');
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    // Construct splits payload
    const splitsPayload = checkedMembers.map(m => {
      const base = { userId: m.id };
      if (splitType === 'PERCENTAGE') {
        base.percentage = parseFloat(splitInputs[m.id]) || 0;
      } else if (splitType === 'EXACT') {
        base.amount = parseFloat(splitInputs[m.id]) || 0;
      } else if (splitType === 'SHARE') {
        base.shares = parseFloat(splitInputs[m.id]) || 0;
      }
      return base;
    });

    const expenseData = {
      description: description.trim(),
      amount: numericAmount,
      currency,
      paidById,
      splitType,
      date,
      splits: splitsPayload
    };

    try {
      setSubmitting(true);
      await expenseService.createExpense(groupId, expenseData);
      setSuccess('Expense added successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/groups/${groupId}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Back Button */}
      <div>
        <Link
          to={`/groups/${groupId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-550 hover:text-slate-900 dark:text-dark-455 dark:hover:text-dark-100 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {groupName || 'Group Details'}
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-dark-50">Add Expense</h1>
        <p className="text-sm text-slate-500 mt-1 dark:text-dark-450">Log a new bill and split it among group members.</p>
      </div>

      {/* Message Banners */}
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 border border-red-200 text-sm font-bold text-red-650 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-sm font-bold text-emerald-650 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400">
          {success}
        </div>
      )}

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 dark:border-dark-800 dark:bg-dark-900 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
        
        {/* Core Info Fields */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Expense Description</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <FileText className="h-5 w-5" />
              </span>
              <input
                type="text"
                required
                placeholder="e.g. Flight Tickets, Lunch, Uber"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Amount and Currency Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Amount</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                  {selectedCurrencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-8 pr-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50 font-semibold"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Currency</label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid By */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Paid By</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <User className="h-5 w-5" />
              </span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
              >
                {activeMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Calendar className="h-5 w-5" />
              </span>
              <input
                type="date"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Participants Selection Checklist */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-dark-850">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            1. Select Participants ({checkedCount} checked)
          </label>
          <p className="text-xs text-slate-400">Uncheck members who did not participate in this specific expense.</p>
          
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-h-48 overflow-y-auto pr-1">
            {activeMembers.map(m => (
              <label
                key={m.id}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer select-none transition-all duration-200 ${
                  selectedParticipants[m.id]
                    ? 'border-brand-500/50 bg-brand-50/20 dark:bg-brand-950/10 text-brand-700 dark:text-brand-400 font-semibold shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-dark-800 dark:bg-dark-950 dark:hover:bg-dark-850 text-slate-600 dark:text-dark-400'
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-dark-800 dark:bg-dark-950"
                  checked={!!selectedParticipants[m.id]}
                  onChange={() => handleParticipantToggle(m.id)}
                />
                <div className="text-sm truncate">
                  <p className="truncate font-bold text-slate-800 dark:text-dark-100">{m.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Split Type Selector */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-dark-850">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calculator className="h-4.5 w-4.5" />
            2. Choose Split Strategy
          </label>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { id: 'EQUAL', label: 'Equally', icon: Users, desc: 'Split 1/N' },
              { id: 'PERCENTAGE', label: 'Percentage', icon: Percent, desc: 'Input % share' },
              { id: 'EXACT', label: 'Exact Amount', icon: DollarSign, desc: 'Input specific cash' },
              { id: 'SHARE', label: 'Shares', icon: Hash, desc: 'Weighted splits' },
            ].map((strategy) => {
              const Icon = strategy.icon;
              return (
                <button
                  type="button"
                  key={strategy.id}
                  onClick={() => setSplitType(strategy.id)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all duration-200 ${
                    splitType === strategy.id
                      ? 'border-brand-500 bg-brand-50/20 text-brand-650 dark:bg-brand-950/15 dark:text-brand-400 font-semibold shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-dark-800 dark:bg-dark-950 dark:hover:bg-dark-850 text-slate-650 dark:text-dark-400'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1 text-slate-450 dark:text-dark-350" />
                  <span className="text-xs font-bold leading-tight">{strategy.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 leading-none">{strategy.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamically Generated Split Input Fields */}
        {checkedCount > 0 && (
          <div className="space-y-4 rounded-2xl bg-slate-50/50 dark:bg-dark-950/30 border border-slate-200/50 dark:border-dark-850 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Split Breakdown</h4>
              {validationError && (
                <span className="text-[11px] font-semibold text-red-500 dark:text-red-400">{validationError}</span>
              )}
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {checkedMembers.map(m => {
                const calculatedShare = liveSplits[m.id] || 0;
                return (
                  <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-white border border-slate-200/60 dark:bg-dark-900 dark:border-dark-800/80 rounded-2xl shadow-sm">
                    {/* Member Profile */}
                    <div className="flex items-center gap-2.5 truncate max-w-xs">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-dark-350 font-bold text-sm">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs truncate">
                        <p className="font-bold text-slate-800 dark:text-dark-100 truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="flex items-center justify-end gap-3 ml-auto sm:ml-0">
                      {/* Strategic inputs depending on Split Type */}
                      {splitType === 'PERCENTAGE' && (
                        <div className="relative w-24">
                          <input
                            type="number"
                            step="any"
                            placeholder="0"
                            className="w-full text-right rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs font-bold text-slate-800 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                            value={splitInputs[m.id] || ''}
                            onChange={(e) => handleSplitInputChange(m.id, e.target.value)}
                          />
                          <span className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 font-bold text-xs pointer-events-none">
                            %
                          </span>
                        </div>
                      )}

                      {splitType === 'EXACT' && (
                        <div className="relative w-28">
                          <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400 font-bold text-xs pointer-events-none">
                            {selectedCurrencySymbol}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full text-right rounded-xl border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-xs font-bold text-slate-800 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                            value={splitInputs[m.id] || ''}
                            onChange={(e) => handleSplitInputChange(m.id, e.target.value)}
                          />
                        </div>
                      )}

                      {splitType === 'SHARE' && (
                        <div className="relative w-24">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="0"
                            className="w-full text-right rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-10 text-xs font-bold text-slate-800 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                            value={splitInputs[m.id] || ''}
                            onChange={(e) => handleSplitInputChange(m.id, e.target.value)}
                          />
                          <span className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 font-medium text-[10px] pointer-events-none">
                            shares
                          </span>
                        </div>
                      )}

                      {/* Display Computed Cash Share */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-[10px] text-slate-400 block font-medium uppercase leading-none">Share</span>
                        <span className="text-sm font-black text-slate-850 dark:text-dark-100">
                          {selectedCurrencySymbol}{calculatedShare.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3.5 pt-6 border-t border-slate-100 dark:border-dark-850">
          <Link
            to={`/groups/${groupId}`}
            className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-dark-400 dark:hover:bg-dark-850 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !!validationError || numericAmount <= 0}
            className="rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {submitting ? 'Adding...' : 'Save Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExpense;
