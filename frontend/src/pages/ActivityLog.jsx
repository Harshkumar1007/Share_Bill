import React, { useEffect, useState } from 'react';
import { Activity, Plus, Trash2, CreditCard, FileSpreadsheet, Search, RefreshCw, ChevronDown, ChevronUp, Calendar, Clock, Database, User } from 'lucide-react';
import { activityService } from '../services/activity.service';

export const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  
  // Track which timeline card IDs are expanded for details
  const [expandedIds, setExpandedIds] = useState(new Set());

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await activityService.getActivities();
      if (res && res.success) {
        setLogs(res.data || []);
      } else if (Array.isArray(res)) {
        setLogs(res);
      }
    } catch (err) {
      setError('Failed to fetch activity logs. Make sure the backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Helper to format timestamps nicely (e.g., "14 Jun 2026, 03:30 PM")
  const formatTimestamp = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return isoString;
    }
  };

  // Helper to resolve timeline icon & styling based on activity type
  const getActivityMeta = (type) => {
    switch (type) {
      case 'EXPENSE_CREATED':
        return {
          icon: Plus,
          colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/35 dark:text-emerald-400 border-emerald-200/30',
          badgeText: 'Expense Logged'
        };
      case 'EXPENSE_DELETED':
        return {
          icon: Trash2,
          colorClass: 'bg-red-50 text-red-600 dark:bg-red-950/35 dark:text-red-400 border-red-200/30',
          badgeText: 'Expense Removed'
        };
      case 'SETTLEMENT_ADDED':
        return {
          icon: CreditCard,
          colorClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/35 dark:text-blue-400 border-blue-200/30',
          badgeText: 'Settled Up'
        };
      case 'SETTLEMENT_DELETED':
        return {
          icon: Trash2,
          colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/35 dark:text-amber-400 border-amber-250/20',
          badgeText: 'Settlement Voided'
        };
      case 'CSV_IMPORTED':
        return {
          icon: FileSpreadsheet,
          colorClass: 'bg-violet-50 text-violet-600 dark:bg-violet-950/35 dark:text-violet-400 border-violet-200/30',
          badgeText: 'CSV Import'
        };
      default:
        return {
          icon: Activity,
          colorClass: 'bg-slate-50 text-slate-600 dark:bg-dark-800 dark:text-dark-200 border-slate-200/30',
          badgeText: 'System Action'
        };
    }
  };

  // Filter logs by search query and type selector
  const filteredLogs = logs.filter(log => {
    const matchesType = filterType === 'ALL' || log.type === filterType;
    const cleanQuery = searchQuery.toLowerCase().trim();
    
    const matchesSearch = !cleanQuery || 
      log.message.toLowerCase().includes(cleanQuery) ||
      (log.userName && log.userName.toLowerCase().includes(cleanQuery)) ||
      (log.groupName && log.groupName.toLowerCase().includes(cleanQuery));

    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-50 flex items-center gap-2">
            <Activity className="h-8 w-8 text-brand-600 dark:text-brand-400" />
            System Activity Log
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-dark-450">Reconstruct timeline trails of expenses, settlements, and spreadsheets.</p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-dark-750 dark:hover:bg-dark-850 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-dark-200 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-650 flex items-center gap-2 dark:bg-red-950/20 dark:text-red-400 border border-red-200/40">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-3xl p-5 border border-white/20 dark:border-dark-800 shadow-md bg-white/70 dark:bg-dark-900/60 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400 dark:text-dark-450" />
          <input
            type="text"
            placeholder="Search activities by log, user, or group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm rounded-2xl border border-slate-200 dark:border-dark-750 bg-transparent py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-dark-100 focus:border-brand-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm rounded-2xl border border-slate-200 dark:border-dark-750 bg-transparent py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-dark-100 focus:border-brand-500"
        >
          <option value="ALL" className="dark:bg-dark-900">All Event Types</option>
          <option value="EXPENSE_CREATED" className="dark:bg-dark-900">Expenses Logged</option>
          <option value="EXPENSE_DELETED" className="dark:bg-dark-900">Expenses Removed</option>
          <option value="SETTLEMENT_ADDED" className="dark:bg-dark-900">Settlements Added</option>
          <option value="SETTLEMENT_DELETED" className="dark:bg-dark-900">Settlements Voided</option>
          <option value="CSV_IMPORTED" className="dark:bg-dark-900">CSV Imports</option>
        </select>
      </div>

      {/* Timeline View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-brand-650" />
          <p className="text-sm font-semibold mt-4">Loading activity logs...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-250 dark:border-dark-800 p-16 text-center flex flex-col items-center justify-center bg-white/30 dark:bg-dark-900/10">
          <Activity className="h-12 w-12 text-slate-350 dark:text-dark-500 mb-4" />
          <p className="text-sm font-bold text-slate-700 dark:text-dark-200">No activities found</p>
          <p className="text-xs text-slate-450 dark:text-dark-450 mt-1">Try modifying your search queries or event type selection filter.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-dashed border-slate-200 dark:border-dark-800 ml-4 pl-8 space-y-8 py-2">
          {filteredLogs.map((log) => {
            const meta = getActivityMeta(log.type);
            const isExpanded = expandedIds.has(log.id);
            const hasDetails = log.details && Object.keys(log.details).length > 0;

            return (
              <div key={log.id} className="relative group animate-slide-up">
                {/* Timeline node icon */}
                <span className={`absolute -left-[45px] top-0 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-transform duration-200 group-hover:scale-110 ${meta.colorClass}`}>
                  <meta.icon className="h-4.5 w-4.5" />
                </span>

                {/* Timeline Card */}
                <div className="glass-card rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-dark-800 dark:bg-dark-900 shadow-sm transition-all duration-200 hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 dark:text-dark-450 mb-2 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTimestamp(log.timestamp)}
                    </span>
                    
                    <span className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-dark-800 dark:border-dark-750 dark:text-dark-300 font-bold uppercase tracking-wider">
                      {meta.badgeText}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800 dark:text-dark-150 leading-relaxed">
                    {log.message}
                  </p>

                  {/* Group & Payer context metadata footer */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-50 dark:border-dark-850 text-xs text-slate-450 dark:text-dark-450">
                    {log.userName && (
                      <span className="flex items-center gap-1 font-medium">
                        <User className="h-3.5 w-3.5" />
                        {log.userName}
                      </span>
                    )}
                    {log.groupName && (
                      <span className="flex items-center gap-1 font-medium">
                        <Database className="h-3.5 w-3.5" />
                        {log.groupName}
                      </span>
                    )}
                  </div>

                  {/* Details Toggle Button */}
                  {hasDetails && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-550 dark:text-brand-400 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            Hide log details
                            <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            Show log details
                            <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>

                      {/* Expandable JSON details card */}
                      {isExpanded && (
                        <div className="mt-2 p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-dark-950/40 dark:border-dark-850 overflow-x-auto text-[11px] font-mono text-slate-650 dark:text-dark-300">
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
