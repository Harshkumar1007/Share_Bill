import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  ChevronRight, 
  Calendar, 
  DollarSign, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle 
} from 'lucide-react';

export const Groups = () => {
  // Groups State loaded with baseline data
  const [groups, setGroups] = useState([
    { id: 'group-1', name: 'Flatmates', description: 'Shared house rent, utility bills, and food supplies', memberCount: 3, totalExpenses: 340.00, createdAt: '2026-05-15', balance: -15.00 },
    { id: 'group-2', name: 'Trip to Paris', description: 'Summer holiday flight tickets, hotels, and dinners', memberCount: 4, totalExpenses: 1800.00, createdAt: '2026-06-01', balance: 60.00 },
    { id: 'group-3', name: 'Office Lunch', description: 'Friday pizzas, coffee runs, and team event costs', memberCount: 8, totalExpenses: 120.00, createdAt: '2026-06-10', balance: 0.00 },
  ]);

  // Modal Control States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form Field States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emails, setEmails] = useState(['']); // Multiple members emails array
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [error, setError] = useState('');

  // Handle member email additions in form
  const handleAddEmailField = () => {
    setEmails([...emails, '']);
  };

  const handleEmailChange = (index, value) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };

  const handleRemoveEmailField = (index) => {
    const updated = emails.filter((_, idx) => idx !== index);
    setEmails(updated.length > 0 ? updated : ['']);
  };

  // CRUD Operations
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (name.trim() === '') {
      setError('Group name is required');
      return;
    }

    const newGroup = {
      id: `group-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      memberCount: emails.filter(email => email.trim() !== '').length + 1, // +1 for the creator
      totalExpenses: 0,
      createdAt: new Date().toISOString().split('T')[0],
      balance: 0
    };

    setGroups([...groups, newGroup]);
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEditClick = (group) => {
    setSelectedGroup(group);
    setName(group.name);
    setDescription(group.description || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (name.trim() === '') {
      setError('Group name is required');
      return;
    }

    setGroups(groups.map(g => {
      if (g.id === selectedGroup.id) {
        return { ...g, name: name.trim(), description: description.trim() };
      }
      return g;
    }));

    resetForm();
    setIsEditOpen(false);
  };

  const handleDeleteClick = (group) => {
    setSelectedGroup(group);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    setGroups(groups.filter(g => g.id !== selectedGroup.id));
    setIsDeleteOpen(false);
    setSelectedGroup(null);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setEmails(['']);
    setSelectedGroup(null);
    setError('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-50">Expense Groups</h1>
          <p className="text-sm text-slate-500 dark:text-dark-450 font-sans">Organize bills and balances for trips, rent, or events.</p>
        </div>
        
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-500 transition-all duration-200"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Group
        </button>
      </div>

      {/* Grid of Groups */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.id}
            className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-dark-800 dark:bg-dark-900 shadow-sm hover:shadow-md hover:border-brand-500/25 transition-all duration-200"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/30 text-brand-650 dark:text-brand-405">
                  <Users className="h-5 w-5" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-dark-800 dark:text-dark-400">
                  {group.memberCount} members
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="text-xl font-bold text-slate-900 dark:text-dark-50 tracking-tight leading-tight">
                {group.name}
              </h2>
              <p className="text-sm text-slate-455 mt-2 dark:text-dark-450 line-clamp-2 min-h-[40px]">
                {group.description || 'No description provided.'}
              </p>
            </div>

            {/* Middle Stats Section */}
            <div className="mt-6 space-y-2.5 border-t border-slate-100 dark:border-dark-850 pt-4 text-xs text-slate-500 dark:text-dark-450">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  Total Spending
                </span>
                <span className="font-extrabold text-sm text-slate-800 dark:text-dark-150">${group.totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Created Date
                </span>
                <span className="font-bold text-slate-700 dark:text-dark-300">{group.createdAt}</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-dark-850 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleEditClick(group)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-dark-800 transition-colors"
                  aria-label="Edit group"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(group)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-950/20 transition-colors"
                  aria-label="Delete group"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <Link
                to={`/groups/${group.id}`}
                className="inline-flex items-center gap-1 text-sm font-bold text-brand-650 hover:text-brand-550 dark:text-brand-400 dark:hover:text-brand-300 transition-all duration-150 group"
              >
                View Splits
                <ChevronRight className="h-4.5 w-4.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* --- CREATE MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-dark-900 dark:border-dark-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-dark-50 tracking-tight">Create New Group</h3>
              <button onClick={() => setIsCreateOpen(false)} className="rounded-lg p-1.5 text-slate-450 hover:bg-slate-100 dark:hover:bg-dark-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 p-3.5 text-sm font-semibold text-red-600 border border-red-200/50">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paris Getaway 2026"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</label>
                <textarea
                  placeholder="What is this group for?"
                  rows="2"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Members Emails Fields */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Group Members Emails</label>
                <p className="text-[11px] text-slate-450 mb-2">Add email addresses to send split alerts.</p>
                
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {emails.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="email"
                        placeholder="member@example.com"
                        className="flex-1 rounded-2xl border border-slate-200 bg-white py-2 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                        value={email}
                        onChange={(e) => handleEmailChange(idx, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEmailField(idx)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-dark-800"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddEmailField}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-650 hover:text-brand-550 dark:text-brand-400 mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Member
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-dark-850">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-dark-400 dark:hover:bg-dark-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-dark-900 dark:border-dark-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-dark-50 tracking-tight">Edit Group Details</h3>
              <button onClick={() => setIsEditOpen(false)} className="rounded-lg p-1.5 text-slate-450 hover:bg-slate-100 dark:hover:bg-dark-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 p-3.5 text-sm font-semibold text-red-650 border border-red-200/50">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Group Name</label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</label>
                <textarea
                  rows="3"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-dark-800 dark:bg-dark-950 dark:text-dark-50 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-dark-850">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-dark-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION --- */}
      {isDeleteOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-dark-900 dark:border-dark-800 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-dark-50">Delete Group?</h3>
            <p className="text-xs text-slate-500 leading-relaxed dark:text-dark-405">
              Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-dark-100">"{selectedGroup.name}"</span>? All historical transaction records and balances will be lost permanently.
            </p>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-dark-850">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-slate-550 hover:bg-slate-50 dark:text-dark-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-xl bg-red-650 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
