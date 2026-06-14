import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, ArrowRight, Upload, Database, FileText, Check, Trash2, Edit2, ShieldAlert } from 'lucide-react';

export const ImportSummaryReport = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Load stats from navigation state, or fallback to default summary
  const summary = location.state || {
    fileName: 'expenses_upload.csv',
    totalRows: 8,
    importedCount: 6,
    flaggedCount: 2,
    discardedCount: 2,
    correctedCount: 0,
    anomalies: [
      { description: 'Taxi cab ride', type: 'DUPLICATE_EXPENSE', severity: 'MEDIUM', message: 'Duplicate expense row detected within the batch.' },
      { description: 'Bistro Dinner', type: 'MEMBERSHIP_CONFLICT', severity: 'HIGH', message: 'Payer is not a member of this group.' }
    ],
    actions: [
      'Imported 6 valid expenses successfully.',
      'Discarded 2 rows that failed group or amount validation check.'
    ]
  };

  const {
    fileName,
    totalRows,
    importedCount,
    flaggedCount,
    discardedCount,
    correctedCount,
    anomalies,
    actions
  } = summary;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-250/20 shadow-inner">
          <CheckCircle className="h-10 w-10 animate-bounce" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-dark-50">CSV Import Completed</h1>
          <p className="text-sm text-slate-500 dark:text-dark-450">
            Successfully parsed, screened, and processed <span className="font-semibold text-slate-700 dark:text-dark-200">{fileName}</span>
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 grid-cols-2 md:grid-cols-5">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-dark-800 dark:bg-dark-900 shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Rows</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-dark-100 mt-1">{totalRows}</p>
        </div>
        <div className="rounded-3xl border border-emerald-250/60 bg-emerald-50/5 p-5 dark:border-emerald-900/20 dark:bg-emerald-950/5 shadow-sm text-center">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Imported</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{importedCount}</p>
        </div>
        <div className="rounded-3xl border border-amber-250 bg-amber-50/5 p-5 dark:border-amber-900/20 dark:bg-amber-950/5 shadow-sm text-center">
          <p className="text-[10px] font-bold text-amber-550 uppercase tracking-wider">Flagged Warnings</p>
          <p className="text-2xl font-extrabold text-amber-550 mt-1">{flaggedCount}</p>
        </div>
        <div className="rounded-3xl border border-blue-200 bg-blue-50/5 p-5 dark:border-blue-900/20 dark:bg-blue-950/5 shadow-sm text-center">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Corrected</p>
          <p className="text-2xl font-extrabold text-blue-500 mt-1">{correctedCount}</p>
        </div>
        <div className="rounded-3xl border border-red-200 bg-red-50/5 p-5 dark:border-red-900/20 dark:bg-red-950/5 shadow-sm text-center col-span-2 md:col-span-1">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Discarded</p>
          <p className="text-2xl font-extrabold text-red-500 mt-1">{discardedCount}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Actions Taken Audit Logs */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-dark-50 flex items-center gap-2 border-b border-slate-100 dark:border-dark-850 pb-3">
            <Database className="h-5 w-5 text-brand-500" />
            Actions Log History
          </h3>

          {actions && actions.length > 0 ? (
            <ul className="space-y-3">
              {actions.map((act, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm font-semibold text-slate-700 dark:text-dark-250 leading-relaxed">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-250/20 mt-0.5">
                    <Check className="h-3 w-3" />
                  </span>
                  {act}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-450 dark:text-dark-450 italic">No historical actions logged.</p>
          )}
        </div>

        {/* Screened Anomaly Summary */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-dark-50 flex items-center gap-2 border-b border-slate-100 dark:border-dark-850 pb-3">
            <ShieldAlert className="h-5 w-5 text-amber-550" />
            Anomaly Audit Summary
          </h3>

          {anomalies && anomalies.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-64 pr-2">
              {anomalies.map((anom, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                    anom.severity === 'HIGH'
                      ? 'bg-red-50/40 border-red-200/60 dark:bg-red-950/10 dark:border-red-900/20'
                      : 'bg-amber-50/40 border-amber-250/60 dark:bg-amber-950/10 dark:border-amber-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-dark-150 truncate max-w-[180px]">{anom.description}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      anom.severity === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-350' : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-350'
                    }`}>
                      {anom.type}
                    </span>
                  </div>
                  <p className="text-slate-550 dark:text-dark-400 font-medium leading-relaxed">{anom.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-dark-200">No anomalies flagged</p>
              <p className="text-xs text-slate-450 dark:text-dark-450 mt-1">This file met all sanity check constraints.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-slate-100 dark:border-dark-850 pt-6">
        <button
          onClick={() => navigate('/import')}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 hover:bg-slate-50 dark:border-dark-750 dark:hover:bg-dark-800/50 px-6 py-3.5 text-sm font-bold text-slate-700 dark:text-dark-200 transition-all duration-200 w-full sm:w-auto justify-center"
        >
          <Upload className="h-4.5 w-4.5" />
          Upload Another CSV
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-500 active:scale-[0.98] transition-all duration-200 w-full sm:w-auto justify-center"
        >
          Go to Dashboard
          <ArrowRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
};

export default ImportSummaryReport;
