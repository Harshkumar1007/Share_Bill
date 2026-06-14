import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-100 via-slate-50 to-brand-50/20 px-4 dark:from-dark-950 dark:via-dark-900 dark:to-brand-950/10">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 mb-2 shadow-inner">
          <AlertTriangle className="h-8 w-8" />
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-dark-50">Page Not Found</h1>
        <p className="text-sm text-slate-455 max-w-sm mx-auto leading-relaxed dark:text-dark-405">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 py-3 px-6 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:from-brand-500 hover:to-brand-400 transition-all duration-200"
          >
            <Home className="h-4 w-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
