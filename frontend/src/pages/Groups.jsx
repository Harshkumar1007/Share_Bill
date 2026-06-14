import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { groupService } from '../services/group.service';

export const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Control States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form Field States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emails, setEmails] = useState(['']); // Multiple members emails array
  const [selectedGroup, setSelectedGroup] = useState(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await groupService.getGroups();
      if (res && res.success) {
        setGroups(res.data || []);
      } else if (Array.isArray(res)) {
        setGroups(res);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch groups. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

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
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (name.trim() === '') {
      setError('Group name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanEmails = emails.filter(email => email.trim() !== '');
      const res = await groupService.createGroup({
        name: name.trim(),
        description: description.trim(),
        memberEmails: cleanEmails
      });

      if (res.success && res.data) {
        await fetchGroups();
        resetForm();
        setIsCreateOpen(false);
      } else {
        setError(res.error || 'Failed to create group.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (group) => {
    setSelectedGroup(group);
    setName(group.name);
    setDescription(group.description || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (name.trim() === '') {
      setError('Group name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await groupService.updateGroup(selectedGroup.id, {
        name: name.trim(),
        description: description.trim()
      });

      if (res.success) {
        await fetchGroups();
        resetForm();
        setIsEditOpen(false);
      } else {
        setError(res.error || 'Failed to update group.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (group) => {
    setSelectedGroup(group);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await groupService.deleteGroup(selectedGroup.id);
      if (res.success) {
        setGroups(prev => prev.filter(g => g.id !== selectedGroup.id));
        setIsDeleteOpen(false);
        setSelectedGroup(null);
      } else {
        setError(res.error || 'Failed to delete group.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete group.');
    } finally {
      setIsSubmitting(false);
    }
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

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-650 flex items-center gap-2 dark:bg-red-950/20 dark:text-red-400 border border-red-200/40 animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Grid of Groups */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-brand-650" />
          <p className="text-sm font-semibold mt-4">Loading your groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-250 dark:border-dark-800 p-16 text-center flex flex-col items-center justify-center bg-white/30 dark:bg-dark-900/10">
          <Users className="h-12 w-12 text-slate-350 dark:text-dark-600 mb-4" />
          <p className="text-sm font-bold text-slate-700 dark:text-dark-200">No groups found</p>
          <p className="text-xs text-slate-450 dark:text-dark-450 mt-1">Create your first group to start logging shared expenses!</p>
        </div>
      ) : (
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
                  <span className="font-extrabold text-slate-800 dark:text-dark-150">{new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-dark-850 pt-4">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditClick(group)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-650 dark:hover:bg-dark-800/60 dark:hover:text-dark-100 transition-colors"
                    title="Edit group"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(group)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors"
                    title="Delete group"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <Link
                  to={`/groups/${group.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-650 hover:text-brand-550 dark:text-brand-400 transition-colors"
                >
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-dark-900 dark:border-dark-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-850 pb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-dark-50">Create New Group</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-dark-405 uppercase tracking-wider">Group Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-750 bg-transparent py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-dark-100"
                  placeholder="e.g. Summer Holiday 2026"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-dark-405 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-750 bg-transparent py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-dark-100 resize-none"
                  placeholder="e.g. Shared flight, lodging, and dining bills..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 dark:text-dark-405 uppercase tracking-wider flex items-center justify-between">
                  <span>Group Members Emails (Optional)</span>
                  <button
                    type="button"
                    onClick={handleAddEmailField}
                    className="text-xs font-bold text-brand-650 dark:text-brand-400 hover:underline"
                  >
                    + Add member
                  </button>
                </label>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {emails.map((email, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 dark:border-dark-750 bg-transparent py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-dark-100"
                        placeholder="member@example.com"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEmailField(index)}
                        className="rounded-xl border border-slate-200 p-2 hover:bg-red-50 hover:text-red-650 dark:border-dark-750 dark:hover:bg-red-950/20"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-dark-850">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-dark-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {isEditOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-dark-900 dark:border-dark-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-850 pb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-dark-50">Edit Group Details</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-dark-405 uppercase tracking-wider">Group Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-750 bg-transparent py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-dark-100"
                  placeholder="e.g. Summer Holiday 2026"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-dark-405 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-750 bg-transparent py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-dark-100 resize-none"
                  placeholder="e.g. Shared flight, lodging, and dining bills..."
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
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
            <p className="text-xs text-slate-550 leading-relaxed dark:text-dark-405">
              Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-dark-150">"{selectedGroup.name}"</span>? All historical transaction records and balances will be lost permanently.
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
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-red-650 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
