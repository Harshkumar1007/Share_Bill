import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  PlusCircle, 
  CreditCard, 
  Calendar, 
  User, 
  Info, 
  DollarSign, 
  Users, 
  TrendingUp, 
  FileText, 
  X, 
  AlertCircle,
  Clock,
  ArrowRight,
  Trash2,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import groupService from '../services/group.service';
import expenseService from '../services/expense.service';
import { useAuth } from '../hooks/useAuth';

const getCurrencySymbol = (code) => {
  const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'C$', AUD: 'A$' };
  return symbols[code] || '$';
};

export const GroupDetails = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'members' | 'expenses' | 'balances' | 'settlements'
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Group Details Stateful DB states
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [balancesData, setBalancesData] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Field States for Settling Up
  const [settleFrom, setSettleFrom] = useState('');
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settling, setSettling] = useState(false);

  // Form Field States for Member Timeline
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemName, setNewMemName] = useState('');
  const [newMemEmail, setNewMemEmail] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const groupRes = await groupService.getGroupById(id);
      if (groupRes.success && groupRes.data) {
        setGroup(groupRes.data);
        setExpenses(groupRes.data.expenses || []);
        setSettlements(groupRes.data.settlements || []);
        
        // Default paidBy inputs
        const activeMems = groupRes.data.members.filter(m => !m.leftAt);
        if (activeMems.length > 0) {
          setSettleFrom(activeMems[0].id);
          setSettleTo(activeMems[0].id);
        }
      }
      
      const balancesRes = await groupService.getGroupBalances(id);
      if (balancesRes.success && balancesRes.data) {
        setBalancesData(balancesRes.data);
        const currencies = balancesRes.data.currencies || [];
        if (currencies.length > 0) {
          if (currencies.includes(balancesRes.data.defaultCurrency)) {
            setSelectedCurrency(balancesRes.data.defaultCurrency);
          } else {
            setSelectedCurrency(currencies[0]);
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  // Member CRUD handlers
  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newMemEmail.trim()) return;

    try {
      setLoading(true);
      await groupService.addMember(id, newMemEmail.trim().toLowerCase());
      setNewMemName('');
      setNewMemEmail('');
      setShowAddMember(false);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member to group');
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      setLoading(true);
      await groupService.removeMember(id, memberId);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
      setLoading(false);
    }
  };

  const handleRejoinMember = async (email) => {
    try {
      setLoading(true);
      await groupService.addMember(id, email);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to rejoin member');
      setLoading(false);
    }
  };

  // Settle form submit
  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!settleFrom || !settleTo) return;

    try {
      setSettling(true);
      const payload = {
        fromUserId: settleFrom,
        toUserId: settleTo,
        amount
      };

      await expenseService.settleUp(id, payload);
      setShowSettleModal(false);
      setSettleAmount('');
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record settlement payment');
    } finally {
      setSettling(false);
    }
  };

  if (loading && !group) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-dark-50">Error Loading Group</h2>
        <p className="text-xs text-slate-500 dark:text-dark-450">{error}</p>
        <Link to="/groups" className="inline-block rounded-xl bg-brand-650 px-4 py-2 text-xs font-bold text-white">
          Back to Groups
        </Link>
      </div>
    );
  }

  // Calculations derived from database state
  const totalSpending = expenses
    .filter(e => e.currency === selectedCurrency)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const activeMembersCount = group.members.filter(m => !m.leftAt).length;
  const averageShare = activeMembersCount > 0 ? totalSpending / activeMembersCount : 0;

  const currencyData = balancesData?.balancesByCurrency?.[selectedCurrency] || {
    totalSpending: 0,
    netBalances: {},
    debts: []
  };

  const netBalances = currencyData.netBalances || {};
  const debtsList = currencyData.debts || [];

  const resetExpenseForm = () => {
    // Boilerplate cleanup, unused since we route to AddExpense
  };

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
            <p className="text-sm text-slate-500 mt-1 dark:text-dark-455">{group.description}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to={`/groups/${group.id}/expenses/add`}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-500 transition-all duration-200"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              Add Expense
            </Link>
            <button
              onClick={() => setShowSettleModal(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:bg-dark-900 dark:hover:bg-dark-800 dark:border-dark-800 dark:text-dark-200 transition-all duration-200 shadow-sm"
            >
              <CreditCard className="h-4.5 w-4.5" />
              Record Settle
            </button>
          </div>
        </div>
      </div>

      {/* Five Tabs Deck and Currency Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-dark-800 pb-2">
        <div className="flex overflow-x-auto pr-2 scrollbar-none">
          {[
            { id: 'info', name: 'Group Info' },
            { id: 'members', name: 'Members' },
            { id: 'expenses', name: 'Expenses' },
            { id: 'balances', name: 'Balances' },
            { id: 'settlements', name: 'Settlements' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3.5 text-sm font-bold border-b-2 whitespace-nowrap transition-all duration-205 ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-650 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-dark-450 dark:hover:text-dark-250'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Currency Selector dropdown */}
        {balancesData?.currencies && balancesData.currencies.length > 1 && (
          <div className="flex items-center gap-2 px-4 sm:px-0">
            <span className="text-xs font-semibold text-slate-400 dark:text-dark-455 whitespace-nowrap">View in Currency:</span>
            <select
              className="rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-700 dark:bg-dark-900 dark:border-dark-800 dark:text-dark-200 focus:outline-none"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
            >
              {balancesData.currencies.map(cur => (
                <option key={cur} value={cur}>
                  {cur} ({getCurrencySymbol(cur)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab Panels */}
      
      {/* 1. GROUP INFO PANEL */}
      {activeTab === 'info' && (
        <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
          <div className="md:col-span-2 space-y-6">
            {/* Meta Details */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-brand-500" />
                Group Details
              </h2>
              <div className="space-y-4 text-sm text-slate-600 dark:text-dark-350">
                <p><span className="font-semibold text-slate-900 dark:text-dark-200">Description:</span> {group.description}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <p><span className="font-semibold text-slate-900 dark:text-dark-200">Created Date:</span> {group.createdAt}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-dark-200">Created By:</span> {group.creator?.name || 'Unknown'}</p>
                </div>
              </div>
            </div>
            
            {/* Stat Cards */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
                <span className="text-xs font-semibold text-slate-450 dark:text-dark-450 uppercase tracking-wider">Total Group Spending</span>
                <p className="text-3xl font-extrabold text-brand-650 dark:text-brand-400 mt-2 font-sans">${totalSpending.toFixed(2)}</p>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
                <span className="text-xs font-semibold text-slate-450 dark:text-dark-450 uppercase tracking-wider">Average Share / Member</span>
                <p className="text-3xl font-extrabold text-slate-850 dark:text-dark-150 mt-2 font-sans">${averageShare.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">Members Overview</h2>
            <div className="space-y-3">
              {group.members.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-xs font-bold text-slate-500">
                    {m.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-dark-150">{m.name}</p>
                    <p className="text-xs text-slate-450 dark:text-dark-450">Joined {m.joinedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. MEMBERS ROSTER PANEL */}
      {activeTab === 'members' && (
        <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden dark:border-dark-800 dark:bg-dark-900 shadow-sm animate-fade-in">
          <div className="p-6 border-b border-slate-150 dark:border-dark-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">Members Registry ({group.members.length})</h2>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1 text-xs font-bold text-brand-650 hover:text-brand-550 dark:text-brand-405"
            >
              <PlusCircle className="h-4 w-4" />
              Add Member
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-dark-850">
            {group.members.map(m => {
              const isActive = !m.leftAt;
              return (
                <div key={m.id} className="flex items-center justify-between p-6 hover:bg-slate-550/5 dark:hover:bg-dark-850/20">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-inner ${
                      isActive 
                        ? 'bg-brand-55 text-brand-650 dark:bg-brand-950/40 dark:text-brand-400' 
                        : 'bg-slate-100 text-slate-400 dark:bg-dark-800 dark:text-dark-450'
                    }`}>
                      {m.name[0]}
                    </div>
                    <div>
                      <h3 className={`font-bold ${isActive ? 'text-slate-800 dark:text-dark-100' : 'text-slate-450 dark:text-dark-450 line-through'}`}>{m.name}</h3>
                      <p className="text-xs text-slate-450 mt-1 dark:text-dark-450">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-450 dark:text-dark-450 font-semibold">Joined: {m.joinedAt}</p>
                      {m.leftAt && (
                        <p className="text-[10px] text-red-500 font-semibold mt-0.5">Left: {m.leftAt}</p>
                      )}
                    </div>
                    
                    {isActive ? (
                      m.id !== currentUser?.id && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-550 dark:hover:bg-red-950/20 transition-all duration-150"
                          title="Remove member (Timeline preserve)"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleRejoinMember(m.id)}
                        className="rounded-xl border border-slate-200 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-200 transition-colors shadow-sm"
                      >
                        Rejoin
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. EXPENSES PANEL */}
      {activeTab === 'expenses' && (
        <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden dark:border-dark-800 dark:bg-dark-900 shadow-sm animate-fade-in">
          <div className="p-6 border-b border-slate-150 dark:border-dark-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">Expenses Log ({expenses.length})</h2>
            <Link
              to={`/groups/${group.id}/expenses/add`}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-650 hover:text-brand-550 dark:text-brand-400"
            >
              <PlusCircle className="h-4 w-4" />
              Add Expense
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-dark-850">
            {expenses.map((exp) => (
              <div key={exp.id} className="p-6 hover:bg-slate-550/5 dark:hover:bg-dark-850/20 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-dark-350">
                      <Clock className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-dark-100 text-base">{exp.description}</h3>
                      <p className="text-xs text-slate-450 mt-1 dark:text-dark-450">
                        Paid by <span className="font-semibold text-slate-600 dark:text-dark-300">{exp.paidBy?.name || 'Unknown'}</span> on {exp.date}
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 text-[10px] font-bold dark:bg-brand-950/20 dark:text-brand-400">
                        SPLIT: {exp.splitType}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-slate-900 dark:text-dark-50 font-sans">${exp.amount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Splits detailed breakdown drawer */}
                <div className="mt-4 pl-16 grid gap-4 grid-cols-2 sm:grid-cols-4">
                  {exp.splits.map((split, sidx) => (
                    <div key={sidx} className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 dark:bg-dark-950/20 dark:border-dark-850">
                      <p className="text-xs font-semibold text-slate-500 dark:text-dark-450 truncate">{split.user?.name || 'Unknown'}</p>
                      <p className="text-sm font-extrabold text-slate-800 dark:text-dark-150 mt-0.5 font-sans">${split.amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. BALANCES PANEL */}
      {activeTab === 'balances' && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">Standing Net Balances ({selectedCurrency})</h2>
            <Link
              to={`/groups/${group.id}/balances`}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-650 hover:text-brand-550 dark:text-brand-405"
            >
              View Full Summary Page
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {group.members.map((m) => {
              const balance = netBalances[m.id] || 0;
              const isOwed = balance > 0.01;
              const isOwe = balance < -0.01;

              return (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-dark-850 dark:bg-dark-950/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-150 dark:bg-dark-800 flex items-center justify-center text-xs font-bold text-slate-500">
                      {m.name[0]}
                    </div>
                    <span className="text-sm font-bold text-slate-850 dark:text-dark-150">{m.name}</span>
                  </div>
                  
                  <div className="text-right">
                    <span className={`text-base font-extrabold font-sans ${isOwed ? 'text-emerald-500' : isOwe ? 'text-red-500' : 'text-slate-500'}`}>
                      {balance === 0 ? 'Settled Up' : isOwed ? `+${getCurrencySymbol(selectedCurrency)}${balance.toFixed(2)}` : `-${getCurrencySymbol(selectedCurrency)}${Math.abs(balance).toFixed(2)}`}
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      {isOwed ? 'Owed' : isOwe ? 'Owes' : 'Settle'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. SETTLEMENTS PANEL */}
      {activeTab === 'settlements' && (
        <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
          {/* Active debts minimizations */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-500" />
                Suggested Matches ({selectedCurrency})
              </h2>
              <Link
                to={`/groups/${group.id}/balances`}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-650 hover:text-brand-550 dark:text-brand-405"
              >
                View Balances Page
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            {debtsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2 animate-pulse" />
                <p className="text-sm font-semibold text-slate-700 dark:text-dark-200">Everyone is settled up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {debtsList.map((debt, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-855">
                    <div className="text-xs font-semibold text-slate-850 dark:text-dark-200 max-w-[65%] truncate">
                      <span className="font-bold text-slate-900 dark:text-dark-50">{debt.from}</span>
                      <span className="text-slate-450 px-1 font-normal uppercase text-[9px] tracking-wider">owes</span>
                      <span className="font-bold text-slate-900 dark:text-dark-50">{debt.to}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-brand-650 dark:text-brand-405 font-sans">
                        {getCurrencySymbol(selectedCurrency)}{debt.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          setSettleFrom(debt.fromUserId);
                          setSettleTo(debt.toUserId);
                          setSettleAmount(debt.amount.toFixed(2));
                          setShowSettleModal(true);
                        }}
                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-dark-800 dark:hover:bg-dark-750 dark:border-dark-700 dark:text-dark-200 transition-colors shadow-sm"
                      >
                        Settle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settlements Payment logs */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">Settlement Logs</h2>
            
            {settlements.length === 0 ? (
              <p className="text-sm text-slate-455 py-8 text-center">No settlements recorded in this group yet.</p>
            ) : (
              <div className="space-y-4">
                {settlements.map((set) => (
                  <div key={set.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 dark:border-dark-850">
                    <div className="flex items-center gap-2 text-xs text-slate-650 dark:text-dark-350">
                      <span className="font-bold text-slate-800 dark:text-dark-100">{set.fromUser?.name || 'Unknown'}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800 dark:text-dark-100">{set.toUser?.name || 'Unknown'}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-500 font-sans">
                          {getCurrencySymbol(balancesData?.defaultCurrency)}{set.amount.toFixed(2)}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(set.date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          if (window.confirm('Delete this settlement payment record? Outstanding balance debt will be restored.')) {
                            try {
                              setLoading(true);
                              await expenseService.deleteSettlement(id, set.id);
                              await fetchData();
                            } catch (err) {
                              alert(err.response?.data?.error || 'Failed to delete settlement');
                              setLoading(false);
                            }
                          }
                        }}
                        className="rounded-xl p-2 text-slate-450 hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-955/20 transition-all duration-150"
                        title="Delete settlement"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* --- RECORD SETTLE MODAL --- */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-dark-900 dark:border-dark-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-dark-50">Record Settlement</h3>
              <button onClick={() => setShowSettleModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Payer (Who Paid)</label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                  value={settleFrom}
                  onChange={(e) => setSettleFrom(e.target.value)}
                >
                  {group.members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.id === currentUser?.id ? 'You' : m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Recipient (Who Received)</label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                  value={settleTo}
                  onChange={(e) => setSettleTo(e.target.value)}
                >
                  {group.members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.id === currentUser?.id ? 'You' : m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Settle Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-dark-850">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- ADD MEMBER MODAL --- */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-dark-900 dark:border-dark-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-dark-50">Add Group Member</h3>
              <button onClick={() => setShowAddMember(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Member Name</label>
                <input
                  type="text"
                  placeholder="e.g. David Brown"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                  value={newMemName}
                  onChange={(e) => setNewMemName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. david@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                  value={newMemEmail}
                  onChange={(e) => setNewMemEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-dark-850">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-dark-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
                >
                  Add Member
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
