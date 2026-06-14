import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Info, ArrowLeft, Check, Trash2 } from 'lucide-react';

export const ImportReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Retrieve passed file details or use default mockup report structures
  const fileData = location.state || {
    fileName: 'expenses_upload.csv',
    fileSize: 1024,
    report: {
      fileName: 'expenses_upload.csv',
      totalProcessed: 5,
      totalAmount: 320.00,
      anomalyCount: 1,
      riskScore: 15,
      anomalies: [
        { description: 'Dinner expense', type: 'POTENTIAL_DUPLICATE', severity: 'MEDIUM', message: 'Potential duplicate entries matching "Dinner expense" - $45.00 within same group.' }
      ],
      parseErrors: [],
      expenses: [
        { description: 'Grocery shopping', amount: 80.00, date: '2026-06-12', groupId: 'group-1', paidById: 'user-1' },
        { description: 'Dinner expense', amount: 45.00, date: '2026-06-11', groupId: 'group-1', paidById: 'user-2' },
        { description: 'Taxi fare', amount: 25.00, date: '2026-06-10', groupId: 'group-1', paidById: 'user-1' },
      ]
    }
  };

  const { report } = fileData;

  const handleApprove = () => {
    // Boilerplate redirect with mock success notification
    navigate('/');
  };

  const handleDiscard = () => {
    navigate('/import');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          to="/import"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-dark-450 dark:hover:text-dark-100 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Link>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-50">Import Audit Report</h1>
            <p className="text-sm text-slate-500 mt-1 dark:text-dark-450">Review parsed rows and screened anomalies before finalizing.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscard}
              className="flex items-center gap-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-red-650 dark:border-dark-800 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" />
              Discard Batch
            </button>
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-500 transition-all duration-200"
            >
              <Check className="h-4 w-4" />
              Approve and Import
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">File Name</p>
          <p className="text-lg font-bold text-slate-800 dark:text-dark-105 mt-2 truncate">{report.fileName}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rows Processed</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-dark-50 mt-1">{report.totalProcessed}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Value</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-dark-50 mt-1">${report.totalAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Screening Risk Score</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-dark-50">{report.riskScore}</span>
            <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${
              report.riskScore > 60 
                ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                : report.riskScore > 30 
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' 
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
            }`}>
              {report.riskScore > 60 ? 'HIGH' : report.riskScore > 30 ? 'MEDIUM' : 'LOW'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Warnings List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-550" />
              Flagged Anomalies ({report.anomalyCount})
            </h2>

            {report.anomalies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-dark-200">No anomalies found</p>
                <p className="text-xs mt-1 text-slate-450 dark:text-dark-450">Everything matches expected parameters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {report.anomalies.map((anom, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border text-sm space-y-1.5 ${
                      anom.severity === 'HIGH'
                        ? 'bg-red-50/50 border-red-200/60 dark:bg-red-950/15 dark:border-red-900/30'
                        : 'bg-amber-50/50 border-amber-250/60 dark:bg-amber-950/15 dark:border-amber-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-dark-150 truncate max-w-[150px]">{anom.description}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        anom.severity === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                      }`}>
                        {anom.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-550 dark:text-dark-400 leading-relaxed">{anom.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Parsed Expenses Grid */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50 mb-6 flex items-center gap-2">
            <Info className="h-5 w-5 text-brand-500" />
            Parsed Data Rows
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-150 dark:border-dark-800 text-slate-400 dark:text-dark-450 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Group</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-850">
                {report.expenses.map((exp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-dark-850/20">
                    <td className="py-4 font-semibold text-slate-850 dark:text-dark-100">{exp.description}</td>
                    <td className="py-4 text-slate-450 dark:text-dark-450 text-xs">{exp.date}</td>
                    <td className="py-4 text-slate-450 dark:text-dark-450 text-xs">{exp.groupId}</td>
                    <td className="py-4 font-extrabold text-slate-900 dark:text-dark-50 text-right">${exp.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportReport;
