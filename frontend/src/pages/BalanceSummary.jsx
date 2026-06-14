import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CreditCard, CheckCircle, AlertCircle, ArrowRight, User, TrendingUp, DollarSign, Wallet, X } from 'lucide-react';
import groupService from '../services/group.service';
import expenseService from '../services/expense.service';

const CURRENCIES = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'C$', AUD: 'A$'
};

const getCurrencySymbol = (code) => CURRENCIES[code] || '$';

export const BalanceSummary = () => {
  const { id: groupId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Group and Balances state
  const [group, setGroup] = useState(null);
  const [balancesData, setBalancesData] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Settlement Modal state
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settlementFrom, setSettlementFrom] = useState(null);
  const [settlementTo, setSettlementTo] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const groupRes = await groupService.getGroupById(groupId);
      const balancesRes = await groupService.getGroupBalances(groupId);

      if (groupRes.success && groupRes.data) {
        setGroup(groupRes.data);
      }
      if (balancesRes.success && balancesRes.data) {
        setBalancesData(balancesRes.data);
        
        // Default to the group's default currency or first available currency
        const activeCurrencies = balancesRes.data.currencies || [];
        if (activeCurrencies.length > 0) {
          if (activeCurrencies.includes(balancesRes.data.defaultCurrency)) {
            setSelectedCurrency(balancesRes.data.defaultCurrency);
          } else {
            setSelectedCurrency(activeCurrencies[0]);
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch balance summary');
    } finally {
      setLoading(false);
    }
  };

  // Perform a settlement transaction
  const handleRecordSettlement = async (e) => {
    e.preventDefault();
    if (!settlementFrom || !settlementTo || !settlementAmount) return;

    try {
      setSettling(true);
      const payload = {
        fromUserId: settlementFrom.id,
        toUserId: settlementTo.id,
        amount: parseFloat(settlementAmount)
      };

      await expenseService.settleUp(groupId, payload);
      
      // Close modal and refresh calculations
      setShowSettleModal(false);
      setSettlementAmount('');
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record settlement payment');
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !group || !balancesData) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-dark-50">Error Loading Balances</h2>
        <p className="text-xs text-slate-550 dark:text-dark-400">{error || 'Could not load calculations.'}</p>
        <Link to={`/groups/${groupId}`} className="inline-block rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white">
          Back to Group
        </Link>
      </div>
    );
  }

  const activeCurrencies = balancesData.currencies || ['USD'];
  const currencyData = balancesData.balancesByCurrency?.[selectedCurrency] || {
    totalSpending: 0,
    netBalances: {},
    debts: []
  };

  const symbol = getCurrencySymbol(selectedCurrency);
  const debtsList = currencyData.debts || [];
  const netBalances = currencyData.netBalances || {};

  // CalculateSpent and Share dynamically on frontend for high-fidelity Tricount look
  const calculateSpentAndShare = (memberId) => {
    let spent = 0;
    let share = 0;

    if (group.expenses) {
      group.expenses.forEach(exp => {
        if (exp.currency !== selectedCurrency) return;
        
        // Sum spent
        if (exp.paidById === memberId) {
          spent += exp.amount;
        }

        // Sum share
        if (exp.splits) {
          const matchingSplit = exp.splits.find(s => s.userId === memberId);
          if (matchingSplit) {
            share += matchingSplit.amount;
          }
        }
      });
    }

    return { spent, share };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to={`/groups/${groupId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-550 hover:text-slate-900 dark:text-dark-450 dark:hover:text-dark-100 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {group.name}
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-dark-50">Balance Summary</h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-dark-450">Review who owes what and record settlement payments.</p>
        </div>

        <button
          onClick={fetchData}
          className="self-start sm:self-center inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-650 dark:bg-dark-900 dark:hover:bg-dark-800 dark:border-dark-800 dark:text-dark-200 shadow-sm transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Recalculate
        </button>
      </div>

      {/* Multi-Currency Selection Tab Selectors */}
      {activeCurrencies.length > 1 && (
        <div className="flex gap-2 border-b border-slate-200 dark:border-dark-800 pb-2 overflow-x-auto scrollbar-none">
          {activeCurrencies.map(cur => (
            <button
              key={cur}
              onClick={() => setSelectedCurrency(cur)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                selectedCurrency === cur
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-dark-950/40 dark:border-dark-800 dark:text-dark-400'
              }`}
            >
              {cur} ({getCurrencySymbol(cur)})
            </button>
          ))}
        </div>
      )}

      {/* Hero Overview Header stand */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/20 text-brand-650 dark:text-brand-405 shrink-0">
            <Wallet className="h-7 w-7" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Group Spending ({selectedCurrency})</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-dark-50 tracking-tight leading-none mt-1">
              {symbol}{currencyData.totalSpending.toFixed(2)}
            </h2>
          </div>
        </div>

        <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-dark-850 pt-4 sm:pt-0 sm:pl-8 flex-1 sm:flex-none">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Members standing</span>
          <p className="text-xs text-slate-500 mt-1 dark:text-dark-450">
            {debtsList.length === 0 ? 'Everything is fully settled up!' : `${debtsList.length} transactions suggested to settle.`}
          </p>
        </div>
      </div>

      {/* Main Grid: Balances List and Settlement Proposals */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Left Side: Standing Net Balances (Spent vs Share) */}
        <div className="bg-white border border-slate-200/80 dark:border-dark-800 dark:bg-dark-900 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-dark-50 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Member Standings
            </h3>
            <p className="text-xs text-slate-400">Tricount overview: Spent minus individual share.</p>

            <div className="space-y-4 mt-6">
              {group.members.map(member => {
                const balance = netBalances[member.id] || 0;
                const { spent, share } = calculateSpentAndShare(member.id);
                const isOwed = balance > 0.01;
                const isOwe = balance < -0.01;

                return (
                  <div key={member.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-dark-850 dark:bg-dark-950/20 flex flex-col gap-2">
                    {/* Header: Name and Net Standing */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 dark:text-dark-150">{member.name}</span>
                      <span className={`text-sm font-black font-sans ${isOwed ? 'text-emerald-500' : isOwe ? 'text-red-500' : 'text-slate-500'}`}>
                        {balance === 0 ? 'Settled Up' : isOwed ? `+${symbol}${balance.toFixed(2)}` : `-${symbol}${Math.abs(balance).toFixed(2)}`}
                      </span>
                    </div>

                    {/* Breakdown details */}
                    <div className="flex justify-between text-[11px] text-slate-400 font-semibold border-t border-slate-200/50 dark:border-dark-800 pt-2 mt-1">
                      <span>Paid: <span className="text-slate-650 dark:text-dark-300 font-bold">{symbol}{spent.toFixed(2)}</span></span>
                      <span>Share: <span className="text-slate-650 dark:text-dark-300 font-bold">{symbol}{share.toFixed(2)}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Who Owes Whom (Settlement suggestions) */}
        <div className="bg-white border border-slate-200/80 dark:border-dark-800 dark:bg-dark-900 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-dark-50 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-500" />
              Suggested Transactions
            </h3>
            <p className="text-xs text-slate-400">Minimal transactions calculated to balance out the group ledger.</p>

            {debtsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <CheckCircle className="h-10 w-10 text-emerald-500 mb-2 animate-pulse" />
                <p className="text-sm font-semibold text-slate-700 dark:text-dark-200">Everyone is fully settled!</p>
              </div>
            ) : (
              <div className="space-y-4 mt-6">
                {debtsList.map((debt, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-850">
                    <div className="text-xs font-semibold text-slate-800 dark:text-dark-200 flex items-center gap-2 max-w-[70%]">
                      <span className="font-bold text-slate-900 dark:text-dark-50 truncate max-w-[80px]">{debt.from}</span>
                      <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">owes</span>
                      <span className="font-bold text-slate-900 dark:text-dark-50 truncate max-w-[80px]">{debt.to}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-brand-650 dark:text-brand-400 font-sans">{symbol}{debt.amount.toFixed(2)}</span>
                      <button
                        onClick={() => {
                          const fromMember = group.members.find(m => m.id === debt.fromUserId);
                          const toMember = group.members.find(m => m.id === debt.toUserId);
                          setSettlementFrom(fromMember || { id: debt.fromUserId, name: debt.from });
                          setSettlementTo(toMember || { id: debt.toUserId, name: debt.to });
                          setSettlementAmount(debt.amount.toFixed(2));
                          setShowSettleModal(true);
                        }}
                        className="rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-650 px-3 py-1.5 text-xs font-bold dark:bg-brand-950/20 dark:hover:bg-brand-950/40 dark:text-brand-405 shadow-sm transition-all"
                      >
                        Settle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- QUICK RECORD SETTLEMENT MODAL --- */}
      {showSettleModal && settlementFrom && settlementTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-dark-900 dark:border-dark-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-dark-50">Record Settlement</h3>
              <button
                onClick={() => setShowSettleModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSettlement} className="space-y-5">
              
              {/* Flow display */}
              <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-850">
                <div className="text-center font-bold text-xs truncate max-w-[120px]">
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black mx-auto mb-1 text-slate-650">
                    {settlementFrom.name.charAt(0).toUpperCase()}
                  </div>
                  {settlementFrom.name}
                </div>
                <ArrowRight className="h-5 w-5 text-brand-500 animate-pulse shrink-0" />
                <div className="text-center font-bold text-xs truncate max-w-[120px]">
                  <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-black mx-auto mb-1 text-brand-650">
                    {settlementTo.name.charAt(0).toUpperCase()}
                  </div>
                  {settlementTo.name}
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Amount ({selectedCurrency})
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm pointer-events-none">
                    {symbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-8 pr-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50 font-bold"
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Confirm Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-dark-850">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-dark-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settling || parseFloat(settlementAmount) <= 0}
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {settling ? 'Recording...' : 'Record Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSummary;
