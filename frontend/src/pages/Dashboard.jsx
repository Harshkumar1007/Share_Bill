import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Receipt, 
  CreditCard, 
  Plus, 
  FileSpreadsheet, 
  TrendingUp, 
  ArrowUpRight, 
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { groupService } from '../services/group.service';
import { expenseService } from '../services/expense.service';

export const Dashboard = () => {
  const { user: currentUser } = useAuth();
  
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [overallBalance, setOverallBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [groupsRes, expensesRes] = await Promise.all([
        groupService.getGroups(),
        expenseService.getAllExpenses()
      ]);

      let fetchedGroups = [];
      if (groupsRes && groupsRes.success) {
        fetchedGroups = groupsRes.data || [];
      } else if (Array.isArray(groupsRes)) {
        fetchedGroups = groupsRes;
      }
      setGroups(fetchedGroups);

      let fetchedExpenses = [];
      if (expensesRes && expensesRes.success) {
        fetchedExpenses = expensesRes.data || [];
      } else if (Array.isArray(expensesRes)) {
        fetchedExpenses = expensesRes;
      }
      setExpenses(fetchedExpenses);

      // Fetch balances for each group to aggregate net standing
      if (fetchedGroups.length > 0 && currentUser) {
        const balancesPromises = fetchedGroups.map(g => groupService.getGroupBalances(g.id));
        const balancesRes = await Promise.all(balancesPromises);
        
        let overallStanding = 0;
        balancesRes.forEach((res) => {
          if (res && res.success && res.data) {
            const balancesByCurrency = res.data.balancesByCurrency || {};
            const defaultCurrency = res.data.defaultCurrency || 'USD';
            const groupBal = balancesByCurrency[defaultCurrency]?.netBalances[currentUser.id] || 0;
            overallStanding += groupBal;
          }
        });
        setOverallBalance(overallStanding);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard statistics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  // Construct metrics data dynamically
  const metrics = [
    { 
      name: 'Total Groups', 
      value: `${groups.length} Active`, 
      detail: groups.slice(0, 3).map(g => g.name).join(', ') || 'No groups yet', 
      icon: Users, 
      color: 'text-violet-650 bg-violet-50 dark:bg-violet-950/20 dark:text-violet-400' 
    },
    { 
      name: 'Total Expenses', 
      value: `$${expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}`, 
      detail: `${expenses.length} Transactions recorded`, 
      icon: Receipt, 
      color: 'text-brand-650 bg-brand-50 dark:bg-brand-950/20 dark:text-brand-400' 
    },
    { 
      name: 'Overall Standing', 
      value: overallBalance >= 0 ? `+$${overallBalance.toFixed(2)}` : `-$${Math.abs(overallBalance).toFixed(2)}`, 
      detail: overallBalance >= 0 ? 'You are owed money' : 'You owe money', 
      icon: CreditCard, 
      color: overallBalance >= 0 
        ? 'text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400' 
        : 'text-red-650 bg-red-50 dark:bg-red-950/20 dark:text-red-400' 
    },
  ];

  // Map first 5 expenses to dashboard list
  const recentExpensesList = expenses.slice(0, 5).map(exp => {
    const didIPay = exp.paidById === currentUser?.id;
    const userSplit = exp.splits?.find(s => s.userId === currentUser?.id);
    const splitAmount = userSplit ? userSplit.amount : 0;
    
    return {
      id: exp.id,
      description: exp.description,
      amount: exp.amount,
      groupName: exp.group?.name || 'Shared Group',
      groupId: exp.groupId,
      date: new Date(exp.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      paidBy: didIPay ? 'You' : (exp.paidBy?.name || 'Someone'),
      status: didIPay ? 'owed' : 'owe',
      change: didIPay 
        ? `+$${(exp.amount - splitAmount).toFixed(2)}` 
        : `-$${splitAmount.toFixed(2)}`
    };
  });

  const quickActions = [
    { name: 'Create Group', description: 'Start splitting bills', path: '/groups', icon: Plus, gradient: 'from-brand-600 to-violet-600' },
    { name: 'CSV Import', description: 'Upload spreadsheets', path: '/import', icon: FileSpreadsheet, gradient: 'from-emerald-600 to-teal-600' },
    { name: 'Expense History', description: 'View all logs', path: '/expenses', icon: Receipt, gradient: 'from-blue-600 to-indigo-600' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero standing summary */}
      <div className={`relative overflow-hidden rounded-3xl p-8 text-white shadow-xl ${
        overallBalance >= 0 
          ? 'bg-gradient-to-tr from-brand-700 to-brand-500 shadow-brand-500/10' 
          : 'bg-gradient-to-tr from-red-700 to-red-500 shadow-red-500/10'
      }`}>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 right-0 -mb-16 -mr-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-100">Overall Balance Standing</span>
            <h1 className="font-extrabold text-4xl sm:text-5xl tracking-tight text-white font-sans">
              {overallBalance >= 0 ? `+$${overallBalance.toFixed(2)}` : `-$${Math.abs(overallBalance).toFixed(2)}`}
            </h1>
            <p className="text-sm text-brand-100 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {overallBalance >= 0 
                ? 'You are owed money across all active expense groups' 
                : 'You owe money to group participants'
              }
            </p>
          </div>

          <Link
            to="/groups"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 px-6 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all duration-200 shadow-lg active:scale-[0.98]"
          >
            Settle Balances
            <ArrowUpRight className="h-4.5 w-4.5 text-brand-600" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-650 flex items-center gap-2 dark:bg-red-950/20 dark:text-red-400 border border-red-200/40">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-brand-650" />
          <p className="text-sm font-semibold mt-4">Loading your dashboard...</p>
        </div>
      ) : (
        <>
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
                  <p className="text-xs text-slate-500 dark:text-dark-405 truncate max-w-[180px]">{metric.detail}</p>
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
                  {recentExpensesList.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No expenses logged recently.
                    </div>
                  ) : (
                    recentExpensesList.map((exp) => {
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
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-455 dark:text-dark-450">
                                <Link to={`/groups/${exp.groupId}`} className="font-semibold text-brand-600 hover:underline">
                                  {exp.groupName}
                                </Link>
                                <span>•</span>
                                <span>Paid by {exp.paidBy}</span>
                                <span>•</span>
                                <span>{exp.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-800 dark:text-dark-100">${exp.amount.toFixed(2)}</p>
                            <span className={`text-[10px] font-extrabold ${isOwed ? 'text-emerald-600' : 'text-red-500'}`}>
                              {exp.change}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50 mb-6">Quick Tools</h2>
                
                <div className="space-y-4">
                  {quickActions.map((action) => (
                    <Link
                      key={action.name}
                      to={action.path}
                      className="flex items-center gap-4 rounded-2xl border border-slate-150 p-4 hover:border-brand-500/30 hover:bg-slate-50/50 dark:border-dark-800 dark:hover:bg-dark-850/50 transition-all duration-200 group"
                    >
                      <span className={`rounded-xl bg-gradient-to-tr ${action.gradient} p-2.5 text-white group-hover:scale-105 transition-transform shrink-0`}>
                        <action.icon className="h-5 w-5" />
                      </span>
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-dark-150 group-hover:text-brand-655 dark:group-hover:text-brand-400 transition-colors">
                          {action.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-dark-450">{action.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
