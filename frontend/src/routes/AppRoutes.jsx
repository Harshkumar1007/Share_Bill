import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import Layout from '../components/layout/Layout';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Groups from '../pages/Groups';
import GroupDetails from '../pages/GroupDetails';
import AddExpense from '../pages/AddExpense';
import BalanceSummary from '../pages/BalanceSummary';
import Expenses from '../pages/Expenses';
import ImportCSV from '../pages/ImportCSV';
import ImportReport from '../pages/ImportReport';
import AnomalyReview from '../pages/AnomalyReview';
import ImportSummaryReport from '../pages/ImportSummaryReport';
import ActivityLog from '../pages/ActivityLog';
import NotFound from '../pages/NotFound';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetails />} />
          <Route path="/groups/:id/expenses/add" element={<AddExpense />} />
          <Route path="/groups/:id/balances" element={<BalanceSummary />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/import" element={<ImportCSV />} />
          <Route path="/import/report" element={<ImportReport />} />
          <Route path="/import/anomalies" element={<AnomalyReview />} />
          <Route path="/import/summary" element={<ImportSummaryReport />} />
          <Route path="/activities" element={<ActivityLog />} />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
