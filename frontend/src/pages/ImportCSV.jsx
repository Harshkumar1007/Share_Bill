import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';

export const ImportCSV = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    setLoading(true);
    setError('');

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Navigate to reports view page passing the report simulation payload
      navigate('/import/report', {
        state: {
          fileName: file.name,
          fileSize: file.size,
          report: {
            fileName: file.name,
            totalProcessed: 8,
            totalAmount: 1420.50,
            anomalyCount: 2,
            riskScore: 35,
            anomalies: [
              { description: 'Hotel Paris Luxury', type: 'OUTLIER', severity: 'HIGH', message: 'High amount detected ($1200.00). Please verify details.' },
              { description: 'Bistro Lunch', type: 'POTENTIAL_DUPLICATE', severity: 'MEDIUM', message: 'Potential duplicate found with expense at index 4 ("Bistro Lunch" - $45.00) within 24 hours.' }
            ],
            parseErrors: [],
            expenses: [
              { description: 'Hotel Paris Luxury', amount: 1200.00, date: '2026-06-14', groupId: 'trip-1', paidById: 'user-1' },
              { description: 'Bistro Lunch', amount: 45.00, date: '2026-06-13', groupId: 'trip-1', paidById: 'user-2' },
              { description: 'Taxi cab', amount: 35.00, date: '2026-06-13', groupId: 'trip-1', paidById: 'user-1' },
              { description: 'Bistro Lunch', amount: 45.00, date: '2026-06-13', groupId: 'trip-1', paidById: 'user-2' },
              { description: 'Museum tickets', amount: 40.00, date: '2026-06-12', groupId: 'trip-1', paidById: 'user-1' },
              { description: 'Groceries', amount: 25.50, date: '2026-06-11', groupId: 'trip-1', paidById: 'user-2' },
              { description: 'Coffee & desserts', amount: 18.00, date: '2026-06-11', groupId: 'trip-1', paidById: 'user-1' },
              { description: 'Souvenirs', amount: 17.00, date: '2026-06-10', groupId: 'trip-1', paidById: 'user-1' }
            ]
          }
        }
      });
    } catch (err) {
      setError('An error occurred during file import analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-50 font-sans">CSV Expense Import</h1>
        <p className="text-sm text-slate-500 mt-1 dark:text-dark-450">Bulk upload your spreadsheet bills and screen them for abnormalities automatically.</p>
      </div>

      <div className="glass-card rounded-3xl p-8 border border-white/20 dark:border-dark-800 shadow-xl bg-white/70 dark:bg-dark-900/60">
        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-650 flex items-center gap-2 dark:bg-red-950/20 dark:text-red-400 border border-red-200/40">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
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
                <span className="text-xs font-semibold text-slate-750 dark:text-dark-200 truncate max-w-xs">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 dark:hover:bg-dark-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:from-brand-500 hover:to-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing CSV File...' : 'Upload and Analyze'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ImportCSV;
