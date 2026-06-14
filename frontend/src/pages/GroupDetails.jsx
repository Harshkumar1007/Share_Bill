import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';

export const GroupDetails = () => {
  const { id } = useParams();
  
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'members' | 'expenses' | 'balances' | 'settlements'
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Group Details Stateful Mock
  const [group, setGroup] = useState({
    id: id || 'trip-paris',
    name: 'Trip to Paris',
    description: 'Summer getaway expenses including flights, hotels, food, and metro tickets.',
    createdAt: '2026-06-01',
    creator: 'You (Current User)',
    members: [
      { id: 'user-me', name: 'You', email: 'user@example.com', joinedAt: '2026-06-01' },
      { id: 'user-1', name: 'Alice Smith', email: 'alice@example.com', joinedAt: '2026-06-02' },
      { id: 'user-2', name: 'Bob Jones', email: 'bob@example.com', joinedAt: '2026-06-02' },
      { id: 'user-3', name: 'Charlie Green', email: 'charlie@example.com', joinedAt: '2026-06-03' }
    ]
  });

  const [expenses, setExpenses] = useState([
    { id: 'exp-1', description: 'Hotel Booking', amount: 1200.00, paidBy: 'You', date: '2026-06-05', splitType: 'EQUAL', splits: [
      { userId: 'user-me', name: 'You', amount: 300.00 },
      { userId: 'user-1', name: 'Alice Smith', amount: 300.00 },
      { userId: 'user-2', name: 'Bob Jones', amount: 300.00 },
      { userId: 'user-3', name: 'Charlie Green', amount: 300.00 }
    ]},
    { id: 'exp-2', description: 'Bistro Dinner', amount: 180.00, paidBy: 'Bob Jones', date: '2026-06-07', splitType: 'EQUAL', splits: [
      { userId: 'user-me', name: 'You', amount: 45.00 },
      { userId: 'user-1', name: 'Alice Smith', amount: 45.00 },
      { userId: 'user-2', name: 'Bob Jones', amount: 45.00 },
      { userId: 'user-3', name: 'Charlie Green', amount: 45.00 }
    ]},
    { id: 'exp-3', description: 'Museum Entry Tickets', amount: 100.00, paidBy: 'Alice Smith', date: '2026-06-09', splitType: 'EXACT', splits: [
      { userId: 'user-me', name: 'You', amount: 40.00 },
      { userId: 'user-1', name: 'Alice Smith', amount: 20.00 },
      { userId: 'user-2', name: 'Bob Jones', amount: 20.00 },
      { userId: 'user-3', name: 'Charlie Green', amount: 20.00 }
    ]}
  ]);

  const [settlements, setSettlements] = useState([
    { id: 'set-1', from: 'Alice Smith', to: 'You', amount: 200.00, date: '2026-06-10' }
  ]);

  // Form Field States for Adding Expense
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('user-me');
  const [expSplitType, setExpSplitType] = useState('EQUAL');
  
  // Detail splits inputs (e.g. percentages, amounts, shares)
  const [splitValues, setSplitValues] = useState({
    'user-me': '',
    'user-1': '',
    'user-2': '',
    'user-3': ''
  });

  // Form Field States for Settling Up
  const [settleFrom, setSettleFrom] = useState('user-1');
  const [settleTo, setSettleTo] = useState('user-me');
  const [settleAmount, setSettleAmount] = useState('');

  // Calculations
  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const averageShare = totalSpending / group.members.length;

  // Calculate Net Balances dynamically
  const getNetBalances = () => {
    const balances = {};
    group.members.forEach(m => { balances[m.id] = 0; });

    // Add paid amounts & Subtract splits
    expenses.forEach(exp => {
      // Find payer id
      const payerId = exp.paidBy === 'You' ? 'user-me' : group.members.find(m => m.name === exp.paidBy)?.id || 'user-me';
      balances[payerId] = (balances[payerId] || 0) + exp.amount;

      // Subtract split sizes
      exp.splits.forEach(split => {
        balances[split.userId] = (balances[split.userId] || 0) - split.amount;
      });
    });

    // Adjust for recorded settlements
    settlements.forEach(set => {
      const fromId = group.members.find(m => m.name === set.from || (set.from === 'You' && m.name === 'You'))?.id || 'user-me';
      const toId = group.members.find(m => m.name === set.to || (set.to === 'You' && m.name === 'You'))?.id || 'user-me';
      balances[fromId] = (balances[fromId] || 0) + set.amount;
      balances[toId] = (balances[toId] || 0) - set.amount;
    });

    return balances;
  };

  const netBalances = getNetBalances();

  // Who owes whom resolution (Simple debt model matching Tricount)
  const getWhoOwesWhom = () => {
    const list = [];
    const balances = { ...netBalances };

    // Separate debtors (negative balance) and creditors (positive balance)
    const debtors = [];
    const creditors = [];

    Object.keys(balances).forEach(id => {
      const bal = balances[id];
      const memberName = group.members.find(m => m.id === id)?.name || 'Unknown';
      if (bal < -0.01) {
        debtors.push({ id, name: memberName, balance: bal });
      } else if (bal > 0.01) {
        creditors.push({ id, name: memberName, balance: bal });
      }
    });

    // Match debts
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const oweAmount = Math.min(Math.abs(debtor.balance), creditor.balance);
      
      list.push({
        from: debtor.name,
        to: creditor.name,
        amount: oweAmount
      });

      debtor.balance += oweAmount;
      creditor.balance -= oweAmount;

      if (Math.abs(debtor.balance) < 0.01) dIdx++;
      if (creditor.balance < 0.01) cIdx++;
    }

    return list;
  };

  const debtsList = getWhoOwesWhom();

  // Split calculations based on type
  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(expAmount);
    if (isNaN(amount) || amount <= 0) return;

    let computedSplits = [];
    const payerName = expPaidBy === 'user-me' ? 'You' : group.members.find(m => m.id === expPaidBy)?.name || 'You';

    if (expSplitType === 'EQUAL') {
      const splitAmt = amount / group.members.length;
      computedSplits = group.members.map(m => ({
        userId: m.id,
        name: m.name,
        amount: splitAmt
      }));
    } else if (expSplitType === 'PERCENTAGE') {
      computedSplits = group.members.map(m => {
        const percent = parseFloat(splitValues[m.id]) || 0;
        return {
          userId: m.id,
          name: m.name,
          amount: (amount * percent) / 100,
          percentage: percent
        };
      });
    } else if (expSplitType === 'EXACT') {
      computedSplits = group.members.map(m => {
        const val = parseFloat(splitValues[m.id]) || 0;
        return {
          userId: m.id,
          name: m.name,
          amount: val
        };
      });
    } else if (expSplitType === 'SHARE') {
      const totalShares = group.members.reduce((sum, m) => sum + (parseFloat(splitValues[m.id]) || 0), 0);
      computedSplits = group.members.map(m => {
        const share = parseFloat(splitValues[m.id]) || 0;
        return {
          userId: m.id,
          name: m.name,
          amount: totalShares > 0 ? (amount * share) / totalShares : 0,
          shares: share
        };
      });
    }

    const newExp = {
      id: `exp-${Date.now()}`,
      description: expDesc.trim(),
      amount,
      paidBy: payerName,
      date: new Date().toISOString().split('T')[0],
      splitType: expSplitType,
      splits: computedSplits
    };

    setExpenses([...expenses, newExp]);
    setShowAddExpense(false);
    resetExpenseForm();
  };

  const handleSettleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) return;

    const fromName = settleFrom === 'user-me' ? 'You' : group.members.find(m => m.id === settleFrom)?.name || 'You';
    const toName = settleTo === 'user-me' ? 'You' : group.members.find(m => m.id === settleTo)?.name || 'You';

    const newSet = {
      id: `set-${Date.now()}`,
      from: fromName,
      to: toName,
      amount,
      date: new Date().toISOString().split('T')[0]
    };

    setSettlements([...settlements, newSet]);
    setShowSettleModal(false);
    setSettleAmount('');
  };

  const resetExpenseForm = () => {
    setExpDesc('');
    setExpAmount('');
    setExpPaidBy('user-me');
    setExpSplitType('EQUAL');
    setSplitValues({
      'user-me': '',
      'user-1': '',
      'user-2': '',
      'user-3': ''
    });
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
            <button
              onClick={() => { resetExpenseForm(); setShowAddExpense(true); }}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-500 transition-all duration-200"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              Add Expense
            </button>
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

      {/* Five Tabs Deck */}
      <div className="flex border-b border-slate-200 dark:border-dark-800 overflow-x-auto pr-2 scrollbar-none">
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
                  <p><span className="font-semibold text-slate-900 dark:text-dark-200">Created By:</span> {group.creator}</p>
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
          <div className="p-6 border-b border-slate-150 dark:border-dark-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">Members Registry ({group.members.length})</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-dark-850">
            {group.members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-6 hover:bg-slate-550/5 dark:hover:bg-dark-850/20">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex items-center justify-center text-sm font-bold shadow-inner">
                    {m.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-dark-100">{m.name}</h3>
                    <p className="text-xs text-slate-450 mt-1 dark:text-dark-450">{m.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-450 dark:text-dark-450">Joined {m.joinedAt}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold dark:bg-emerald-950/20 dark:text-emerald-400">
                    ACTIVE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. EXPENSES PANEL */}
      {activeTab === 'expenses' && (
        <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden dark:border-dark-800 dark:bg-dark-900 shadow-sm animate-fade-in">
          <div className="p-6 border-b border-slate-150 dark:border-dark-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">Expenses Log ({expenses.length})</h2>
            <button
              onClick={() => { resetExpenseForm(); setShowAddExpense(true); }}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-650 hover:text-brand-550 dark:text-brand-400"
            >
              <PlusCircle className="h-4 w-4" />
              Add Expense
            </button>
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
                        Paid by <span className="font-semibold text-slate-600 dark:text-dark-300">{exp.paidBy}</span> on {exp.date}
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
                      <p className="text-xs font-semibold text-slate-500 dark:text-dark-450 truncate">{split.name}</p>
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
          <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">Standing Net Balances</h2>
          
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
                      {balance === 0 ? 'Settled Up' : isOwed ? `+$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`}
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-500" />
              Suggested Transactions
            </h2>

            {debtsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2 animate-pulse" />
                <p className="text-sm font-semibold text-slate-700 dark:text-dark-200">Everyone is settled up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {debtsList.map((debt, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-dark-950/40 border border-slate-100 dark:border-dark-855">
                    <div className="text-sm font-semibold text-slate-800 dark:text-dark-150">
                      <span className="font-bold text-slate-900 dark:text-dark-50">{debt.from}</span>
                      <span className="text-slate-450 px-1 font-normal">owes</span>
                      <span className="font-bold text-slate-900 dark:text-dark-50">{debt.to}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-brand-650 dark:text-brand-405 font-sans">${debt.amount.toFixed(2)}</span>
                      <button
                        onClick={() => {
                          const fromId = group.members.find(m => m.name === debt.from)?.id || 'user-me';
                          const toId = group.members.find(m => m.name === debt.to)?.id || 'user-me';
                          setSettleFrom(fromId);
                          setSettleTo(toId);
                          setSettleAmount(debt.amount.toString());
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
              <p className="text-sm text-slate-450 py-8 text-center">No settlements recorded in this group yet.</p>
            ) : (
              <div className="space-y-4">
                {settlements.map((set) => (
                  <div key={set.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 dark:border-dark-850">
                    <div className="flex items-center gap-2 text-sm text-slate-650 dark:text-dark-350">
                      <span className="font-bold text-slate-800 dark:text-dark-100">{set.from}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800 dark:text-dark-100">{set.to}</span>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-500 font-sans">${set.amount.toFixed(2)}</span>
                      <p className="text-[10px] text-slate-450 mt-0.5">{set.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ADD EXPENSE MODAL --- */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-dark-900 dark:border-dark-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-dark-50">Add Expense</h3>
              <button onClick={() => setShowAddExpense(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Flight Tickets"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Paid By</label>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                    value={expPaidBy}
                    onChange={(e) => setExpPaidBy(e.target.value)}
                  >
                    <option value="user-me">You</option>
                    {group.members.filter(m => m.id !== 'user-me').map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Split Type</label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                  value={expSplitType}
                  onChange={(e) => setExpSplitType(e.target.value)}
                >
                  <option value="EQUAL">Split Equally</option>
                  <option value="PERCENTAGE">Split By Percentages (%)</option>
                  <option value="EXACT">Split By Exact Amounts ($)</option>
                  <option value="SHARE">Split By Shares (weights)</option>
                </select>
              </div>

              {/* Conditional Inputs based on split type selection */}
              {expSplitType !== 'EQUAL' && (
                <div className="space-y-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-dark-800 dark:bg-dark-950/20">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Assign Values</span>
                  
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {group.members.map(m => (
                      <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-slate-750">{m.name}</span>
                        <div className="relative w-32">
                          <input
                            type="number"
                            step="any"
                            placeholder={expSplitType === 'PERCENTAGE' ? '%' : expSplitType === 'EXACT' ? '$' : 'shares'}
                            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-700 dark:bg-dark-900 dark:text-dark-50"
                            value={splitValues[m.id]}
                            onChange={(e) => {
                              const updated = { ...splitValues };
                              updated[m.id] = e.target.value;
                              setSplitValues(updated);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-dark-850">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-dark-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
                >
                  Save Expense
                </button>
              </div>
            </form>
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
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950"
                  value={settleFrom}
                  onChange={(e) => setSettleFrom(e.target.value)}
                >
                  <option value="user-me">You</option>
                  {group.members.filter(m => m.id !== 'user-me').map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Recipient (Who Received)</label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950"
                  value={settleTo}
                  onChange={(e) => setSettleTo(e.target.value)}
                >
                  <option value="user-me">You</option>
                  {group.members.filter(m => m.id !== 'user-me').map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
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
    </div>
  );
};

export default GroupDetails;
