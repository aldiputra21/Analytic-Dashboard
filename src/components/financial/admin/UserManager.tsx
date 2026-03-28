// UserManager.tsx - Admin component for user management
// Requirements: 9.1, 9.5

import React, { useState, useEffect, useCallback } from 'react';
import { useSubsidiaries } from '../../../hooks/financial/useSubsidiaries';
import { FRSUser, UserRole } from '../../../types/financial/user';

const API_BASE = '/api/frs';

function getToken(): string {
  return localStorage.getItem('frs_token') ?? '';
}

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  bod: 'Board of Directors',
  subsidiary_manager: 'Subsidiary Manager',
};

const ROLE_COLORS: Record<UserRole, string> = {
  owner: 'bg-purple-100 text-purple-700',
  bod: 'bg-blue-100 text-blue-700',
  subsidiary_manager: 'bg-green-100 text-green-700',
};

interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
}

const emptyForm: UserFormData = {
  username: '',
  email: '',
  password: '',
  role: 'bod',
  fullName: '',
};

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<FRSUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [accessUserId, setAccessUserId] = useState<string | null>(null);
  const [selectedSubsidiaryIds, setSelectedSubsidiaryIds] = useState<string[]>([]);
  const [accessSaving, setAccessSaving] = useState(false);

  const { subsidiaries } = useSubsidiaries();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(user: FRSUser) {
    setForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      fullName: user.fullName,
    });
    setEditingId(user.id);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const url = editingId ? `${API_BASE}/users/${editingId}` : `${API_BASE}/users`;
      const method = editingId ? 'PUT' : 'POST';
      const body: any = { ...form };
      if (editingId && !body.password) delete body.password;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Failed to save user');

      setShowForm(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(user: FRSUser) {
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error?.message ?? 'Failed to update status');
        return;
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function openAccessManager(user: FRSUser) {
    setAccessUserId(user.id);
    setSelectedSubsidiaryIds([]);
  }

  async function handleSaveAccess() {
    if (!accessUserId) return;
    setAccessSaving(true);
    try {
      const res = await fetch(`${API_BASE}/users/${accessUserId}/subsidiary-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ subsidiaryIds: selectedSubsidiaryIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Failed to assign access');
      setAccessUserId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAccessSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">User Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage system users and access permissions</p>
        </div>
        <button
          onClick={openCreate}
          className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          + Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {/* User list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-slate-400">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Username</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{user.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{user.username}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Edit
                      </button>
                      {user.role === 'subsidiary_manager' && (
                        <button
                          onClick={() => openAccessManager(user)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Access
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* User form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingId ? 'Edit User' : 'Add User'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Username *</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="bod">Board of Directors</option>
                    <option value="subsidiary_manager">Subsidiary Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Password {editingId ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required={!editingId}
                  minLength={12}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Min 12 chars, upper/lower/number/special"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subsidiary access modal */}
      {accessUserId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Assign Subsidiary Access</h3>
              <button onClick={() => setAccessUserId(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-500">Select subsidiaries this user can access:</p>
              {subsidiaries.map((sub) => (
                <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSubsidiaryIds.includes(sub.id)}
                    onChange={(e) => {
                      setSelectedSubsidiaryIds((prev) =>
                        e.target.checked
                          ? [...prev, sub.id]
                          : prev.filter((id) => id !== sub.id)
                      );
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">{sub.name}</span>
                  <span className="text-xs text-slate-400">({sub.industrySector})</span>
                </label>
              ))}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setAccessUserId(null)}
                  className="flex-1 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAccess}
                  disabled={accessSaving}
                  className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {accessSaving ? 'Saving...' : 'Save Access'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
