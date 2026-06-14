import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ArrowLeft, Trash2, Check, AlertCircle, Loader2, DollarSign, Calendar, Users, Globe, FileText } from 'lucide-react';
import { importService } from '../services/import.service';
import { groupService } from '../services/group.service';

export const AnomalyReview = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Load report data from location state or fallback to defaults
  const fileData = location.state || {
    fileName: 'expenses.csv',
    report: {
      fileName: 'expenses.csv',
      expenses: [],
      anomalies: []
    }
  };

  const { report, fileName } = fileData;

  const [groups, setGroups] = useState([]);
  const [groupMembersMap, setGroupMembersMap] = useState({});
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // State containing all items (parsed expenses) with their interactive fields
  const [items, setItems] = useState([]);
  const [discardedIds, setDiscardedIds] = useState(new Set());

  // Map initial expenses on load
  useEffect(() => {
    if (report && Array.isArray(report.expenses)) {
      const formattedItems = report.expenses.map((exp, idx) => {
        // Ensure date is formatted for input type="date"
        let dateVal = '';
        if (exp.date) {
          const d = new Date(exp.date);
          if (!isNaN(d.getTime())) {
            dateVal = d.toISOString().split('T')[0];
          }
        }
        return {
          id: idx, // unique local identifier
          description: exp.description || '',
          amount: exp.amount !== null && exp.amount !== undefined ? exp.amount : '',
          currency: exp.currency || '',
          date: dateVal,
          groupId: exp.groupId || '',
          paidById: exp.paidById || '',
          line: exp.line || (idx + 2),
          originalAnomalies: report.anomalies.filter(a => a.expenseIndex === idx)
        };
      });
      setItems(formattedItems);
    }
  }, [report]);

  // Fetch groups and dynamic member cache
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await groupService.getGroups();
        let fetchedGroups = [];
        if (res && res.success) {
          fetchedGroups = res.data || [];
        } else if (Array.isArray(res)) {
          fetchedGroups = res;
        }
        setGroups(fetchedGroups);

        // Pre-fetch members for any groupIds referenced
        if (report && Array.isArray(report.expenses)) {
          const referencedGroupIds = [...new Set(report.expenses.map(e => e.groupId).filter(Boolean))];
          for (const gid of referencedGroupIds) {
            await fetchMembersForGroup(gid);
          }
        }
      } catch (err) {
        console.error('Error loading groups:', err);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, [report]);

  const fetchMembersForGroup = async (groupId) => {
    if (!groupId || groupMembersMap[groupId]) return;
    try {
      const res = await groupService.getGroupById(groupId);
      if (res && res.success && res.data && res.data.members) {
        const membersList = res.data.members.map(m => m.user).filter(Boolean);
        setGroupMembersMap(prev => ({
          ...prev,
          [groupId]: membersList
        }));
      }
    } catch (err) {
      console.error(`Error loading members for group ${groupId}:`, err);
    }
  };

  const handleFieldChange = async (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));

    if (field === 'groupId' && value) {
      await fetchMembersForGroup(value);
    }
  };

  const handleDiscard = (id) => {
    setDiscardedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Perform Live Validation Check on each Item
  const validateItem = (item) => {
    const itemErrors = [];

    // 1. Negative or Invalid Amount
    const parsedAmt = parseFloat(item.amount);
    if (item.amount === '' || isNaN(parsedAmt)) {
      itemErrors.push('Amount is missing or non-numeric');
    } else if (parsedAmt <= 0) {
      itemErrors.push('Amount must be positive');
    }

    // 2. Invalid Date
    if (!item.date || isNaN(new Date(item.date).getTime())) {
      itemErrors.push('Date is missing or invalid');
    }

    // 3. Missing Payer
    if (!item.paidById || item.paidById.trim() === '') {
      itemErrors.push('Payer is required');
    }

    // 4. Missing Currency
    if (!item.currency || item.currency.trim() === '') {
      itemErrors.push('Currency is required');
    }

    // 5. Missing Group / Membership Conflicts
    if (!item.groupId || item.groupId.trim() === '') {
      itemErrors.push('Group is required');
    } else {
      const groupExists = groups.some(g => g.id === item.groupId);
      if (!groupExists) {
        itemErrors.push('Group does not exist');
      } else {
        const members = groupMembersMap[item.groupId] || [];
        const payerIsMember = members.some(m => m.id === item.paidById);
        // If members are loaded and payer is not in list, it is a conflict
        if (members.length > 0 && !payerIsMember) {
          itemErrors.push('Payer is not a member of this group');
        }
      }
    }

    // 6. Duplicate checking within local edit state
    const duplicateCount = items.filter(other => {
      if (other.id === item.id || discardedIds.has(other.id)) return false;
      const isSameDesc = item.description.toLowerCase().trim() === other.description.toLowerCase().trim();
      const isSameAmount = Math.abs(parseFloat(item.amount) - parseFloat(other.amount)) < 0.01;
      const isSameGroup = item.groupId === other.groupId;
      const isSameDate = item.date === other.date;
      return isSameDesc && isSameAmount && isSameGroup && isSameDate;
    }).length;

    if (duplicateCount > 0) {
      itemErrors.push('Duplicate expense rows detected within the batch');
    }

    // Check if the backend also flagged it as a duplicate in database
    const dbDuplicate = item.originalAnomalies.some(an => an.type === 'DUPLICATE_EXPENSE');
    if (dbDuplicate && duplicateCount === 0) {
      itemErrors.push('Potential duplicate of an existing expense in database');
    }

    return itemErrors;
  };

  // Filter items that have anomalies
  const activeItems = items.filter(item => !discardedIds.has(item.id));
  
  // Calculate validation stats
  const itemsWithErrors = activeItems.map(item => ({
    ...item,
    errors: validateItem(item)
  }));

  const totalUnresolved = itemsWithErrors.filter(item => item.errors.length > 0).length;

  const handleSaveAndCommit = async () => {
    if (totalUnresolved > 0) {
      setError('Please resolve all validation errors or discard invalid rows before importing.');
      return;
    }

    if (activeItems.length === 0) {
      setError('No expenses to import. All rows discarded.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const cleanExpenses = activeItems.map(item => ({
        description: item.description,
        amount: parseFloat(item.amount),
        currency: item.currency,
        date: new Date(item.date),
        groupId: item.groupId,
        paidById: item.paidById
      }));

      const res = await importService.commitImport(cleanExpenses);
      if (res.success) {
        // Calculate correction metrics
        const isItemCorrected = (item) => {
          const original = report.expenses[item.id];
          if (!original) return true;
          const originalDate = original.date ? new Date(original.date).toISOString().split('T')[0] : '';
          return item.description !== original.description ||
                 Math.abs(parseFloat(item.amount) - (original.amount || 0)) > 0.01 ||
                 item.currency !== (original.currency || '') ||
                 item.date !== originalDate ||
                 item.groupId !== original.groupId ||
                 item.paidById !== original.paidById;
        };

        const correctedCount = activeItems.filter(item => isItemCorrected(item)).length;
        const discardedCount = discardedIds.size;
        const flaggedCount = items.filter(item => item.originalAnomalies.length > 0).length;

        navigate('/import/summary', {
          state: {
            fileName: fileName,
            totalRows: items.length,
            importedCount: res.count,
            flaggedCount: flaggedCount,
            discardedCount: discardedCount,
            correctedCount: correctedCount,
            anomalies: report.anomalies,
            actions: [
              `Successfully resolved anomalies and imported ${res.count} expenses.`,
              ...(correctedCount > 0 ? [`Corrected details on ${correctedCount} rows.`] : []),
              ...(discardedCount > 0 ? [`Discarded ${discardedCount} rows from the batch.`] : [])
            ]
          }
        });
      } else {
        setError(res.error || 'Failed to commit imported expenses.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'An error occurred during import transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Navigation */}
      <div>
        <button
          onClick={() => navigate('/import')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-dark-450 dark:hover:text-dark-105 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel and Upload Again
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-50">Anomaly Resolution Workspace</h1>
            <p className="text-sm text-slate-500 mt-1 dark:text-dark-450">
              CSV: <span className="font-semibold text-slate-700 dark:text-dark-200">{fileName}</span> — Review and edit rows with errors before importing.
            </p>
          </div>

          <button
            onClick={handleSaveAndCommit}
            disabled={isSubmitting || totalUnresolved > 0 || activeItems.length === 0}
            className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Check className="h-4.5 w-4.5" />
                Approve and Import ({activeItems.length} Cleaned)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Warning Banners */}
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-650 flex items-center gap-2 dark:bg-red-950/20 dark:text-red-400 border border-red-200/40">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Workspace Summary Dashboard */}
      <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Rows</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-dark-50 mt-1">{items.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Batch</p>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{activeItems.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Discarded Rows</p>
          <p className="text-3xl font-extrabold text-slate-400 dark:text-dark-400 mt-1">{discardedIds.size}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-bold text-brand-650 dark:text-brand-400">Unresolved Errors</p>
          <p className={`text-3xl font-extrabold mt-1 ${totalUnresolved > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
            {totalUnresolved}
          </p>
        </div>
      </div>

      {/* List of Rows to Resolve */}
      <div className="space-y-6">
        {items.map((item) => {
          const isDiscarded = discardedIds.has(item.id);
          const errors = validateItem(item);
          const hasErrors = errors.length > 0;
          const matchedMembers = groupMembersMap[item.groupId] || [];

          return (
            <div
              key={item.id}
              className={`rounded-3xl border transition-all duration-300 shadow-md p-6 bg-white dark:bg-dark-900 ${
                isDiscarded 
                  ? 'opacity-40 border-slate-200 dark:border-dark-850 bg-slate-50/20' 
                  : hasErrors 
                    ? 'border-red-200 dark:border-red-900/30 ring-1 ring-red-500/10' 
                    : 'border-emerald-250/60 dark:border-emerald-900/20'
              }`}
            >
              {/* Row Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-dark-850 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 dark:bg-dark-800 text-sm font-bold text-slate-700 dark:text-dark-200">
                    #{item.line}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-dark-100">
                      {item.description || <span className="italic text-slate-400">Untitled Expense</span>}
                    </h3>
                    <p className="text-xs text-slate-450 dark:text-dark-450">Parsed from CSV row data</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isDiscarded && (
                    hasErrors ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-750 dark:bg-red-950/20 dark:text-red-400 border border-red-200/40">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {errors.length} issue{errors.length > 1 ? 's' : ''} remaining
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-250/20">
                        <Check className="h-3.5 w-3.5" />
                        Clean & Ready
                      </span>
                    )
                  )}

                  <button
                    onClick={() => handleDiscard(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                      isDiscarded
                        ? 'border-slate-300 hover:border-slate-400 text-slate-600 dark:border-dark-750 dark:text-dark-200 hover:bg-slate-100 dark:hover:bg-dark-800'
                        : 'border-red-200 hover:border-red-300 text-red-650 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20 dark:text-red-400'
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {isDiscarded ? 'Restore Row' : 'Discard Row'}
                  </button>
                </div>
              </div>

              {/* Warnings Checklist */}
              {!isDiscarded && hasErrors && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50/30 dark:bg-red-950/5 border border-red-100 dark:border-red-900/20 space-y-2">
                  <p className="text-xs font-bold text-red-750 dark:text-red-400 uppercase tracking-wider">Anomalies Screened:</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-red-700 dark:text-red-405">
                    {errors.map((err, i) => (
                      <li key={i} className="flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Inline Form Grid */}
              <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${isDiscarded ? 'pointer-events-none opacity-50' : ''}`}>
                {/* Description input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-dark-400 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleFieldChange(item.id, 'description', e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-dark-750 bg-transparent py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-dark-100 focus:border-brand-500"
                    placeholder="Enter description"
                  />
                </div>

                {/* Amount input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-dark-400 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" /> Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => handleFieldChange(item.id, 'amount', e.target.value)}
                    className={`w-full text-sm rounded-xl border bg-transparent py-2 px-3 focus:outline-none focus:ring-1 dark:text-dark-100 ${
                      item.amount === '' || parseFloat(item.amount) <= 0 
                        ? 'border-red-300 dark:border-red-900/40 focus:ring-red-500 focus:border-red-500' 
                        : 'border-slate-200 dark:border-dark-750 focus:ring-brand-500 focus:border-brand-500'
                    }`}
                    placeholder="0.00"
                  />
                </div>

                {/* Currency selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-dark-400 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" /> Currency
                  </label>
                  <select
                    value={item.currency}
                    onChange={(e) => handleFieldChange(item.id, 'currency', e.target.value)}
                    className={`w-full text-sm rounded-xl border bg-transparent py-2 px-3 focus:outline-none focus:ring-1 dark:text-dark-100 ${
                      !item.currency 
                        ? 'border-red-300 dark:border-red-900/40 focus:ring-red-500 focus:border-red-500' 
                        : 'border-slate-200 dark:border-dark-750 focus:ring-brand-500 focus:border-brand-500'
                    }`}
                  >
                    <option value="" disabled className="dark:bg-dark-900 text-slate-400">Select currency</option>
                    <option value="USD" className="dark:bg-dark-900">USD ($)</option>
                    <option value="EUR" className="dark:bg-dark-900">EUR (€)</option>
                    <option value="GBP" className="dark:bg-dark-900">GBP (£)</option>
                    <option value="INR" className="dark:bg-dark-900">INR (₹)</option>
                  </select>
                </div>

                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-dark-400 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Date
                  </label>
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => handleFieldChange(item.id, 'date', e.target.value)}
                    className={`w-full text-sm rounded-xl border bg-transparent py-2 px-3 focus:outline-none focus:ring-1 dark:text-dark-100 ${
                      !item.date 
                        ? 'border-red-300 dark:border-red-900/40 focus:ring-red-500 focus:border-red-500' 
                        : 'border-slate-200 dark:border-dark-750 focus:ring-brand-500 focus:border-brand-500'
                    }`}
                  />
                </div>

                {/* Group Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-dark-400 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Group
                  </label>
                  <select
                    value={item.groupId}
                    onChange={(e) => handleFieldChange(item.id, 'groupId', e.target.value)}
                    className={`w-full text-sm rounded-xl border bg-transparent py-2 px-3 focus:outline-none focus:ring-1 dark:text-dark-100 ${
                      !item.groupId 
                        ? 'border-red-300 dark:border-red-900/40 focus:ring-red-500 focus:border-red-500' 
                        : 'border-slate-200 dark:border-dark-750 focus:ring-brand-500 focus:border-brand-500'
                    }`}
                  >
                    <option value="" disabled className="dark:bg-dark-900 text-slate-400">Select expense group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id} className="dark:bg-dark-900">
                        {g.name} ({g.id.slice(0, 6)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payer Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-dark-400 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Paid By (Payer)
                  </label>
                  <select
                    value={item.paidById}
                    onChange={(e) => handleFieldChange(item.id, 'paidById', e.target.value)}
                    disabled={!item.groupId}
                    className={`w-full text-sm rounded-xl border bg-transparent py-2 px-3 focus:outline-none focus:ring-1 dark:text-dark-100 disabled:opacity-40 disabled:cursor-not-allowed ${
                      !item.paidById 
                        ? 'border-red-300 dark:border-red-900/40 focus:ring-red-500 focus:border-red-500' 
                        : 'border-slate-200 dark:border-dark-750 focus:ring-brand-500 focus:border-brand-500'
                    }`}
                  >
                    <option value="" disabled className="dark:bg-dark-900 text-slate-400">
                      {!item.groupId ? 'Select group first' : 'Select payer'}
                    </option>
                    {matchedMembers.map((m) => (
                      <option key={m.id} value={m.id} className="dark:bg-dark-900">
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnomalyReview;
