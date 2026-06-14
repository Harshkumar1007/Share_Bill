import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2, AlertTriangle, ArrowLeft, Loader2, FileText, Copy } from 'lucide-react';
import { importService } from '../services/import.service';
import { groupService } from '../services/group.service';

export const ImportCSV = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // Fetch group options on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await groupService.getGroups();
        if (response.success) {
          setGroups(response.data || response.groups || []);
        }
      } catch (err) {
        console.error('Failed to load groups:', err);
      }
    };
    fetchGroups();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Only CSV files are supported.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Only CSV files are supported.');
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    if (!selectedGroupId) {
      setError('Please select a group first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await importService.previewImport(file, selectedGroupId);
      if (response.success) {
        setPreviewData(response);
      } else {
        setError(response.error || 'Failed to parse CSV file.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred during file import analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setError('');
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Valid
          </span>
        );
      case 'POSSIBLE_DUPLICATE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-250 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            Possible Duplicate
          </span>
        );
      case 'DUPLICATE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-dark-800 dark:text-dark-200 dark:border-dark-700">
            <Copy className="h-3.5 w-3.5 text-slate-505" />
            Duplicate
          </span>
        );
      case 'INVALID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-250 px-2.5 py-0.5 text-xs font-semibold text-rose-650 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/30">
            <AlertCircle className="h-3.5 w-3.5 text-rose-550" />
            Invalid
          </span>
        );
      default:
        return null;
    }
  };

  // Construct unified rows sorted by row number
  const allRows = previewData
    ? [
        ...(previewData.validRows || []),
        ...(previewData.duplicateRows || []),
        ...(previewData.suspiciousRows || []),
        ...(previewData.invalidRows || [])
      ].sort((a, b) => a.rowNumber - b.rowNumber)
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-50">CSV Expense Import</h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-dark-450">Upload your CSV spreadsheet bills and preview valid and invalid rows instantly.</p>
        </div>
        {previewData && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-2xl text-slate-600 hover:bg-slate-100 dark:text-dark-200 dark:hover:bg-dark-800 transition-colors border border-slate-200 dark:border-dark-750"
          >
            <ArrowLeft className="h-4 w-4" />
            Upload Another File
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-650 flex items-center gap-2 dark:bg-red-950/20 dark:text-red-400 border border-red-200/40">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Upload State */}
      {!previewData && (
        <div className="max-w-2xl mx-auto glass-card rounded-3xl p-8 border border-white/20 dark:border-dark-800 shadow-xl bg-white/70 dark:bg-dark-900/60">
          <form onSubmit={handleUpload} className="space-y-6">
            
            {/* Group Selector */}
            <div className="space-y-2">
              <label htmlFor="group-select" className="block text-sm font-semibold text-slate-700 dark:text-dark-200">
                Select Group
              </label>
              <select
                id="group-select"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-805 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-dark-750 dark:bg-dark-900 dark:text-dark-100 transition-colors"
                required
              >
                <option value="">-- Select a Group --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-12 text-center flex flex-col items-center justify-center transition-all duration-200 ${
                dragActive 
                  ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/10' 
                  : file 
                    ? 'border-emerald-500/50 bg-emerald-50/5 dark:bg-emerald-950/5' 
                    : 'border-slate-300 hover:border-brand-400 dark:border-dark-750 dark:hover:border-brand-800'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />
              
              {file ? (
                <FileSpreadsheet className="h-12 w-12 text-emerald-500 dark:text-emerald-400 mb-4 animate-pulse" />
              ) : (
                <Upload className="h-12 w-12 text-slate-400 dark:text-dark-450 mb-4" />
              )}

              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-dark-100">{file.name}</p>
                  <p className="text-xs text-slate-450 dark:text-dark-450">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-dark-200">
                    Drag and drop your CSV file here, or{' '}
                    <span className="text-brand-600 font-bold dark:text-brand-400">browse files</span>
                  </p>
                  <p className="text-xs text-slate-450 dark:text-dark-450">Supports spreadsheet files ending in .csv (max 5MB)</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {file && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-dark-950/50 border border-slate-100 dark:border-dark-850">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-dark-200 truncate max-w-xs">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={loading}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 dark:hover:bg-dark-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || !selectedGroupId || loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:from-brand-500 hover:to-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing CSV File & Searching Duplicates...
                </>
              ) : (
                'Upload and Preview'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Preview State */}
      {previewData && (
        <div className="space-y-8 animate-fade-in animate-duration-300">
          
          {/* Summary Cards (5-column Layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Rows */}
            <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-dark-800 shadow-md bg-white/70 dark:bg-dark-900/60 flex items-center gap-4">
              <div className="rounded-xl p-3 bg-slate-100 dark:bg-dark-800 text-slate-650 dark:text-dark-100">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-450 dark:text-dark-400 uppercase tracking-wider font-semibold">Total Rows</p>
                <p className="text-xl font-bold text-slate-800 dark:text-dark-50">{previewData.summary.totalRows}</p>
              </div>
            </div>

            {/* Valid Rows */}
            <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-dark-800 shadow-md bg-white/70 dark:bg-dark-900/60 flex items-center gap-4">
              <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-450 dark:text-dark-400 uppercase tracking-wider font-semibold">Valid Rows</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{previewData.summary.validCount}</p>
              </div>
            </div>

            {/* Possible Duplicates */}
            <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-dark-800 shadow-md bg-white/70 dark:bg-dark-900/60 flex items-center gap-4">
              <div className="rounded-xl p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-450 dark:text-dark-400 uppercase tracking-wider font-semibold">Possible Dups</p>
                <p className="text-xl font-bold text-amber-605 dark:text-amber-400">{previewData.summary.suspiciousCount || 0}</p>
              </div>
            </div>

            {/* Exact Duplicates */}
            <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-dark-800 shadow-md bg-white/70 dark:bg-dark-900/60 flex items-center gap-4">
              <div className="rounded-xl p-3 bg-slate-100 dark:bg-dark-800 text-slate-650 dark:text-dark-250">
                <Copy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-450 dark:text-dark-400 uppercase tracking-wider font-semibold">Exact Dups</p>
                <p className="text-xl font-bold text-slate-700 dark:text-dark-100">{previewData.summary.duplicateCount || 0}</p>
              </div>
            </div>

            {/* Invalid Rows */}
            <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-dark-800 shadow-md bg-white/70 dark:bg-dark-900/60 flex items-center gap-4">
              <div className="rounded-xl p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-650 dark:text-rose-450">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-450 dark:text-dark-400 uppercase tracking-wider font-semibold">Invalid Rows</p>
                <p className="text-xl font-bold text-rose-650 dark:text-rose-400">{previewData.summary.invalidCount}</p>
              </div>
            </div>
          </div>

          {/* Unified Preview Table */}
          {allRows.length > 0 ? (
            <div className="glass-card rounded-3xl border border-white/20 dark:border-dark-800 bg-white/70 dark:bg-dark-900/60 shadow-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 dark:text-dark-100 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-brand-500" />
                  CSV Import Preview Rows ({allRows.length})
                </h2>
                <span className="text-xs text-slate-450">Review spreadsheet row validity and detected duplicates before final import.</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-dark-950/30 text-xs font-bold uppercase text-slate-450 dark:text-dark-400 border-b border-slate-100 dark:border-dark-800">
                      <th className="px-6 py-4 w-16 text-center">Row</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 w-28">Amount</th>
                      <th className="px-6 py-4">Paid By</th>
                      <th className="px-6 py-4 w-44 text-center">Status</th>
                      <th className="px-6 py-4">Reason / Verification Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-sm">
                    {allRows.map((row) => (
                      <tr key={row.rowNumber} className="hover:bg-slate-50/20 dark:hover:bg-dark-800/10 text-slate-700 dark:text-dark-200">
                        <td className="px-6 py-4 text-slate-400 font-semibold text-center">{row.rowNumber}</td>
                        <td className="px-6 py-4 font-medium">
                          <div>{row.description || <span className="italic text-slate-400">No description</span>}</div>
                          {row.date && <div className="text-xs text-slate-400 dark:text-dark-450">{row.date}</div>}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-805 dark:text-dark-50">
                          {typeof row.amount === 'number' ? `$${row.amount.toFixed(2)}` : row.amount}
                        </td>
                        <td className="px-6 py-4 truncate max-w-xs">{row.paidBy}</td>
                        <td className="px-6 py-4 text-center">{renderStatusBadge(row.status)}</td>
                        <td className="px-6 py-4">
                          {row.status === 'INVALID' ? (
                            <div className="space-y-1">
                              {row.errors.map((err, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-red-650 dark:text-red-400 font-medium">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-dark-400 font-medium">{row.reason}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 glass-card rounded-3xl border border-white/20 dark:border-dark-800 bg-white/70 dark:bg-dark-900/60 shadow-md">
              <FileSpreadsheet className="h-12 w-12 text-slate-300 dark:text-dark-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-dark-400">No records found in the uploaded CSV.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportCSV;
