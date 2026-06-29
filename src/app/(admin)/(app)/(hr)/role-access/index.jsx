import { useEffect, useState } from 'react';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';
import { LuEllipsisVertical, LuX, LuSquarePen, LuTrash2 } from 'react-icons/lu';

const DASHBOARD_OPTIONS = [
  {
    value: '/index',
    label: 'Super Admin Dashboard'
  },
  {
    value: '/hr',
    label: 'HR Operations Dashboard'
  },
  {
    value: '/dashboard/managers/index',
    label: 'Manager Dashboard'
  },
  {
    value: '/dashboard',
    label: 'Employee Self-Service Dashboard'
  }
];

const ACCESS_LEVEL_OPTIONS = ['super-admin', 'hr-manager', 'hr-officer', 'department-manager', 'employee'];

const PERMISSION_OPTIONS = [
  // Core
  { value: 'dashboard.view', label: 'Dashboard Access' },
  { value: 'profile.view', label: 'View Profile' },
  { value: 'profile.edit', label: 'Edit Profile' },

  // Employees
  { value: 'staff.view', label: 'View Staff Bio Data' },
  { value: 'staff.create', label: 'Add Staff' },
  { value: 'staff.edit', label: 'Edit Staff' },
  { value: 'staff.delete', label: 'Delete Staff' },

  // Departments
  { value: 'departments.view', label: 'View Departments' },
  { value: 'departments.manage', label: 'Manage Departments' },

  // Leave
  { value: 'leave.apply', label: 'Apply Leave' },
  { value: 'leave.approve', label: 'Approve Leave' },
  { value: 'leave.manage', label: 'Manage Leave Policies' },

  // Attendance
  { value: 'attendance.view', label: 'View Attendance' },
  { value: 'attendance.manage', label: 'Manage Attendance' },

  // Reports
  { value: 'reports.view', label: 'View Reports' },

  // Calendar
  { value: 'calendar.view', label: 'View Calendar' },
  { value: 'calendar.manage', label: 'Manage Holidays' },

  // Admin
  { value: 'users.manage', label: 'User Administration' },
  { value: 'roles.manage', label: 'Role & Access Administration' }
];

const INITIAL_FORM = {
  name: '',
  description: '',
  accessLevel: 'employee',
  dashboardRoute: '/my-profile',
  permissions: []
};

const permissionLabelMap = PERMISSION_OPTIONS.reduce((accumulator, option) => {
  accumulator[option.value] = option.label;
  return accumulator;
}, {});

const dashboardLabelMap = DASHBOARD_OPTIONS.reduce((accumulator, option) => {
  accumulator[option.value] = option.label;
  return accumulator;
}, {});

const Index = () => {
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingProfile, setEditingProfile] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(null);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfiles = async () => {
      try {
        const response = await hrApi.getRoleAccessProfiles();
        if (isMounted) {
          setProfiles(response);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage('Failed to load role and access profiles.');
        }
        console.error('Failed to load role/access profiles', error);
      }
    };

    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePermissionToggle = (permission) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission) ? current.permissions.filter(item => item !== permission) : [...current.permissions, permission]
    }));
  };

  const handleEditPermissionToggle = (permission) => {
    setEditForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter(item => item !== permission)
        : [...current.permissions, permission]
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!form.name.trim()) {
      setErrorMessage('Role name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const createdProfile = await hrApi.createRoleAccessProfile({
        name: form.name.trim(),
        description: form.description.trim(),
        accessLevel: form.accessLevel,
        dashboardRoute: form.dashboardRoute,
        permissions: form.permissions
      });

      setProfiles((current) => [createdProfile, ...current]);
      setForm(INITIAL_FORM);
    } catch (error) {
      setErrorMessage('Unable to create the role/access profile. Check for duplicate names and try again.');
      console.error('Failed to create role/access profile', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditProfile = (profile) => {
    if (profile.isSystem) {
      return;
    }

    setErrorMessage('');
    setEditingProfile(profile);
    setEditForm({
      name: profile.name || '',
      description: profile.description || '',
      accessLevel: profile.accessLevel || ACCESS_LEVEL_OPTIONS[0],
      dashboardRoute: profile.dashboardRoute || DASHBOARD_OPTIONS[0]?.value || '/my-profile',
      permissions: profile.permissions || []
    });
  };

  const closeEditProfile = () => {
    setEditingProfile(null);
    setEditForm(INITIAL_FORM);
  };

  const submitEditProfile = async (event) => {
    event.preventDefault();
    if (!editingProfile) {
      return;
    }

    if (!editForm.name.trim()) {
      setErrorMessage('Role name is required.');
      return;
    }

    try {
      setIsSavingEdit(true);
      setErrorMessage('');
      const updated = await hrApi.updateRoleAccessProfile(editingProfile.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        accessLevel: editForm.accessLevel,
        dashboardRoute: editForm.dashboardRoute,
        permissions: editForm.permissions,
      });

      setProfiles(current => current.map(item => (item.id === updated.id ? updated : item)));
      closeEditProfile();
    } catch (error) {
      setErrorMessage(error?.detail || error?.message || 'Unable to update role/access profile.');
      console.error('Failed to update role/access profile', error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openDeleteProfile = (profile) => {
    if (profile.isSystem) {
      return;
    }

    setErrorMessage('');
    setDeletingProfile(profile);
    setIsDeleteOpen(true);
  };

  const closeDeleteProfile = () => {
    setDeletingProfile(null);
    setIsDeleteOpen(false);
  };

  const confirmDeleteProfile = async () => {
    if (!deletingProfile) {
      return;
    }

    try {
      setIsDeletingProfile(true);
      setErrorMessage('');
      await hrApi.deleteRoleAccessProfile(deletingProfile.id);
      setProfiles(current => current.filter(item => item.id !== deletingProfile.id));
      closeDeleteProfile();
    } catch (error) {
      setErrorMessage(error?.detail || error?.message || 'Unable to delete role/access profile.');
      console.error('Failed to delete role/access profile', error);
    } finally {
      setIsDeletingProfile(false);
    }
  };

  return <>
      <PageMeta title="Roles & Permissions" />
      <main>
        <PageBreadcrumb title="Roles & Permissions" subtitle="Admin Settings" />

        <div className="mb-6 grid gap-6">
          <section className="rounded-2xl border border-default-200 bg-card p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-default-900">Roles and permissions configuration</h1>
                <p className="mt-1 text-sm text-default-500">Create the profiles that determine dashboard landing pages and section-level access for future users.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <IconifyIcon icon="solar:shield-user-bold-duotone" className="text-base" />
                Super Admin Controlled
              </span>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
              <div className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-default-800">Role name</label>
                    <input className="form-input" value={form.name} onChange={event => setForm(current => ({
                    ...current,
                    name: event.target.value
                  }))} placeholder="HR Manager" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-default-800">Access level</label>
                    <select className="form-input" value={form.accessLevel} onChange={event => setForm(current => ({
                    ...current,
                    accessLevel: event.target.value
                  }))}>
                      {ACCESS_LEVEL_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-default-800">Description</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={event => setForm(current => ({
                  ...current,
                  description: event.target.value
                }))} placeholder="What this profile should be allowed to manage" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-default-800">Default dashboard</label>
                  <select className="form-input" value={form.dashboardRoute} onChange={event => setForm(current => ({
                  ...current,
                  dashboardRoute: event.target.value
                }))}>
                    {DASHBOARD_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-default-800">Section access</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {PERMISSION_OPTIONS.map(option => <label key={option.value} className="flex items-center gap-3 rounded-xl border border-default-200 bg-default-50 px-4 py-3 text-sm font-medium text-default-700">
                      <input type="checkbox" className="form-checkbox" checked={form.permissions.includes(option.value)} onChange={() => handlePermissionToggle(option.value)} />
                      {option.label}
                    </label>)}
                </div>
              </div>

              {errorMessage && <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger xl:col-span-2">{errorMessage}</div>}

              <div className="flex items-center justify-end gap-3 xl:col-span-2">
                <button type="button" className="btn border border-default-200 bg-card text-default-700" onClick={() => {
                setForm(INITIAL_FORM);
                setErrorMessage('');
              }}>Reset</button>
                <button type="submit" disabled={isSubmitting} className="btn bg-primary text-white disabled:opacity-60">{isSubmitting ? 'Saving...' : 'Create Profile'}</button>
              </div>
            </form>
          </section>
        </div>

        <section className="mb-6 rounded-2xl border border-default-200 bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-default-900">Configured Roles and Permissions</h2>
              <p className="mt-1 text-sm text-default-500">All configured role/access profiles and the sections each one can access.</p>
            </div>
            <span className="rounded-full bg-default-100 px-3 py-1 text-xs font-semibold text-default-700">
              {profiles.length} Profile{profiles.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-default-200">
              <thead className="bg-default-100">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-default-600">
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Access Level</th>
                  <th className="px-4 py-3">Default Dashboard</th>
                  <th className="px-4 py-3">Section Access</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200 text-sm text-default-700">
                {profiles.length === 0 && <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-default-500">No role/access profiles found.</td>
                  </tr>}
                {profiles.map(profile => <tr key={profile.id}>
                    <td className="px-4 py-3 font-semibold text-default-900">{profile.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{profile.accessLevel}</span>
                    </td>
                    <td className="px-4 py-3">{dashboardLabelMap[profile.dashboardRoute] || profile.dashboardRoute}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(profile.permissions || []).map(permission => <span key={`${profile.id}-${permission}`} className="rounded-full bg-default-100 px-2.5 py-0.5 text-xs font-medium text-default-700">
                            {permission === '*' ? 'All Sections' : permissionLabelMap[permission] || permission}
                          </span>)}
                        {(!profile.permissions || profile.permissions.length === 0) && <span className="text-xs text-default-500">No sections</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {profile.isSystem ? <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">System</span> : <span className="inline-flex rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">Custom</span>}
                    </td>
                    <td className="px-4 py-3">
                      {profile.isSystem ? <span className="text-xs text-default-500">Protected</span> : <div className="hs-dropdown relative inline-flex">
                          <button type="button" className="hs-dropdown-toggle btn size-8 border border-default-200 bg-card text-default-700" aria-label="Role actions">
                            <LuEllipsisVertical className="size-4" />
                          </button>
                          <div className="hs-dropdown-menu min-w-[9.5rem] p-1" role="menu">
                            <button type="button" className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-start text-sm whitespace-nowrap text-default-700 hover:bg-default-100" onClick={() => openEditProfile(profile)}>
                              <LuSquarePen className="size-3.5 shrink-0" />
                              <span>Edit</span>
                            </button>
                            <button type="button" className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-start text-sm whitespace-nowrap text-danger hover:bg-danger/10" onClick={() => openDeleteProfile(profile)}>
                              <LuTrash2 className="size-3.5 shrink-0" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </section>

        {editingProfile && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-default-200 bg-card p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-default-900">Edit Role & Permissions</h3>
                <button type="button" className="btn size-8 border border-default-200 bg-card text-default-700" onClick={closeEditProfile} aria-label="Close edit dialog">
                  <LuX className="size-4" />
                </button>
              </div>

              <form onSubmit={submitEditProfile} className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-default-800">Role name</label>
                      <input className="form-input" value={editForm.name} onChange={event => setEditForm(current => ({
                      ...current,
                      name: event.target.value
                    }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-default-800">Access level</label>
                      <select className="form-input" value={editForm.accessLevel} onChange={event => setEditForm(current => ({
                      ...current,
                      accessLevel: event.target.value
                    }))}>
                        {ACCESS_LEVEL_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-default-800">Description</label>
                    <textarea className="form-input" rows={3} value={editForm.description} onChange={event => setEditForm(current => ({
                    ...current,
                    description: event.target.value
                  }))} />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-default-800">Default dashboard</label>
                    <select className="form-input" value={editForm.dashboardRoute} onChange={event => setEditForm(current => ({
                    ...current,
                    dashboardRoute: event.target.value
                  }))}>
                      {DASHBOARD_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-default-800">Section access</label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {PERMISSION_OPTIONS.map(option => <label key={option.value} className="flex items-center gap-3 rounded-xl border border-default-200 bg-default-50 px-4 py-3 text-sm font-medium text-default-700">
                        <input type="checkbox" className="form-checkbox" checked={editForm.permissions.includes(option.value)} onChange={() => handleEditPermissionToggle(option.value)} />
                        {option.label}
                      </label>)}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 xl:col-span-2">
                  <button type="button" className="btn border border-default-200 bg-card text-default-700" onClick={closeEditProfile}>Cancel</button>
                  <button type="submit" disabled={isSavingEdit} className="btn bg-primary text-white disabled:opacity-60">{isSavingEdit ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          </div>}

        {isDeleteOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-md rounded-2xl border border-default-200 bg-card p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-default-900">Delete Role Profile</h3>
                <button type="button" className="btn size-8 border border-default-200 bg-card text-default-700" onClick={closeDeleteProfile} aria-label="Close delete dialog">
                  <LuX className="size-4" />
                </button>
              </div>
              <p className="mt-2 text-sm text-default-600">Delete <span className="font-semibold">{deletingProfile?.name}</span>? This cannot be undone. Roles currently assigned to users cannot be deleted.</p>

              <div className="mt-5 flex justify-end gap-3">
                <button type="button" className="btn border border-default-200 bg-card text-default-700" onClick={closeDeleteProfile}>Cancel</button>
                <button type="button" className="btn border border-danger/30 bg-danger/5 text-danger disabled:opacity-60" onClick={confirmDeleteProfile} disabled={isDeletingProfile}>{isDeletingProfile ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>}
      </main>
    </>;
};

export default Index;