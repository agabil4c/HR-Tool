import { useCallback, useEffect, useMemo, useState } from 'react';
import { hrApi } from '@/services/hrApi';
import { PermissionButton } from '@/components/AccessControl';
import { Link } from 'react-router';
import { LuChevronLeft, LuChevronRight, LuCircleCheck, LuCircleX, LuDownload, LuEllipsis, LuEye, LuLoader, LuPlus, LuSearch, LuSlidersHorizontal, LuSquarePen, LuTrash2 } from 'react-icons/lu';

const initialEditState = {
  email: '',
  fullName: '',
  department: '',
  role: '',
  accessLevel: '',
  dashboardRoute: '',
  allowedSectionsText: '',
  isActive: true
};

const DEFAULT_PAGE_SIZE = 20;

const UserListTabel = () => {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleProfiles, setRoleProfiles] = useState([]);

  const [overviewUser, setOverviewUser] = useState(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editState, setEditState] = useState(initialEditState);

  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [actionMessage, setActionMessage] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await hrApi.getUsers({
        q: query,
        status: statusFilter,
        page,
        pageSize,
      });

      const items = Array.isArray(response) ? response : response?.items || [];
      setUsers(items);
      setTotalUsers(Array.isArray(response) ? items.length : Number(response?.total || 0));
    } catch (loadError) {
      setError(loadError?.detail || loadError?.message || 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, [query, statusFilter, page, pageSize]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setPage(1);
      setQuery(queryInput);
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [queryInput]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    loadUsers().catch(() => {
      // Error already handled in loadUsers.
    });
  }, [loadUsers]);

  useEffect(() => {
    const loadRoleProfiles = async () => {
      try {
        const profiles = await hrApi.getRoleAccessProfiles();
        setRoleProfiles(Array.isArray(profiles) ? profiles.filter(item => (item.name || '').trim().toLowerCase() !== 'super-admin') : []);
      } catch {
        setRoleProfiles([]);
      }
    };

    loadRoleProfiles().catch(() => {
      // Best effort for edit dropdowns.
    });
  }, []);

  const normalizedUsers = useMemo(() => users.map(user => ({
    rawId: user.id,
    id: `#USR${String(user.id).padStart(6, '0')}`,
    name: user.fullName,
    role: user.role,
    location: user.department,
    email: user.email,
    phone: '-',
    joiningDate: '-',
    status: user.isActive ? 'Verified' : 'Rejected',
    avatar: null,
    initials: user.fullName?.split(' ').map(p => p[0]).join('').slice(0, 2) || 'NA',
    raw: user
  })), [users]);

  const totalPages = Math.max(1, Math.ceil((totalUsers || 0) / pageSize));
  const roleOptions = useMemo(() => roleProfiles.map(item => item.name).filter(Boolean), [roleProfiles]);

  const closeOverview = () => {
    setIsOverviewOpen(false);
    setOverviewUser(null);
  };

  const handleOverview = async user => {
    try {
      setActionMessage('');
      setIsOverviewOpen(true);
      setIsOverviewLoading(true);
      const details = await hrApi.getUserById(user.rawId);
      setOverviewUser(details);
    } catch (overviewError) {
      setActionMessage(overviewError?.detail || overviewError?.message || 'Failed to load user overview.');
      closeOverview();
    } finally {
      setIsOverviewLoading(false);
    }
  };

  const handleOpenEdit = user => {
    setActionMessage('');
    const matchingProfile = roleProfiles.find(item => item.name === user.raw.role);
    setEditingUser(user.raw);
    setEditState({
      email: user.raw.email || '',
      fullName: user.raw.fullName || '',
      department: user.raw.department || 'General',
      role: matchingProfile?.name || roleOptions[0] || '',
      accessLevel: matchingProfile?.accessLevel || user.raw.accessLevel || '',
      dashboardRoute: matchingProfile?.dashboardRoute || user.raw.dashboardRoute || '',
      allowedSectionsText: Array.isArray(user.raw.allowedSections) ? user.raw.allowedSections.join(', ') : '',
      isActive: !!user.raw.isActive
    });
    setIsEditOpen(true);
  };

  const handleRoleChange = roleValue => {
    const matchingProfile = roleProfiles.find(item => item.name === roleValue);
    setEditState(prev => ({
      ...prev,
      role: roleValue,
      accessLevel: matchingProfile?.accessLevel || prev.accessLevel,
      dashboardRoute: matchingProfile?.dashboardRoute || prev.dashboardRoute,
      allowedSectionsText: Array.isArray(matchingProfile?.permissions)
        ? matchingProfile.permissions
            .map(permission => permission.split('.')[0])
            .filter((value, index, arr) => value && arr.indexOf(value) === index)
            .join(', ')
        : prev.allowedSectionsText
    }));
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditingUser(null);
    setEditState(initialEditState);
  };

  const submitEdit = async () => {
    if (!editingUser) {
      return;
    }

    try {
      setIsSavingEdit(true);
      setActionMessage('');

      const allowedSections = editState.allowedSectionsText
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

      await hrApi.updateUser(editingUser.id, {
        email: editState.email,
        fullName: editState.fullName,
        department: editState.department,
        role: editState.role,
        accessLevel: editState.accessLevel,
        dashboardRoute: editState.dashboardRoute,
        allowedSections,
        isActive: editState.isActive
      });

      await loadUsers();
      closeEdit();
      setActionMessage('User updated successfully.');
    } catch (saveError) {
      setActionMessage(saveError?.detail || saveError?.message || 'Failed to update user.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOpenDelete = user => {
    setActionMessage('');
    setDeletingUser(user.raw);
    setIsDeleteOpen(true);
  };

  const closeDelete = () => {
    setIsDeleteOpen(false);
    setDeletingUser(null);
  };

  const confirmDelete = async () => {
    if (!deletingUser) {
      return;
    }

    try {
      setIsDeleting(true);
      setActionMessage('');
      await hrApi.deleteUser(deletingUser.id);
      await loadUsers();
      closeDelete();
      setActionMessage('User deleted successfully.');
    } catch (deleteError) {
      setActionMessage(deleteError?.detail || deleteError?.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const visiblePageNumbers = useMemo(() => {
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, start + 2);
    const pages = [];
    for (let value = start; value <= end; value += 1) {
      pages.push(value);
    }
    return pages;
  }, [page, totalPages]);

  return <div className="card">
      <div className="card-header">
        <h6 className="card-title">Users List</h6>
        <PermissionButton permissionKey="user-admin" className="btn btn-sm bg-default-200 text-default-700 pointer-events-none" disabled>
          <LuPlus className="size-4 me-1" />
          Add user (Use Staff Bio Data)
        </PermissionButton>
      </div>

      <div className="card-header pt-0">
        <p className="text-xs text-default-500">
          User accounts are created via Staff Bio Data onboarding to guarantee each system user is linked to an employee profile.
        </p>
      </div>

      <div className="card-header">
        <div className="md:flex items-center md:space-y-0 space-y-4 gap-3">
          <div className="relative">
            <input type="text" className="form-input form-input-sm ps-9" placeholder="Search by name, email, role" value={queryInput} onChange={event => setQueryInput(event.target.value)} />
            <div className="absolute inset-y-0 start-0 flex items-center ps-3">
              <LuSearch className="size-3.5 flex items-center text-default-500 fill-default-100" />
            </div>
          </div>

          <select className="form-input form-input-sm" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <button type="button" className="btn btn-sm bg-transparent border border-dashed border-primary  text-primary hover:bg-primary/10">
            <LuDownload className="size-4" />
            Import
          </button>

          <button type="button" className="btn btn-sm size-7.5 bg-default-100 text-default-500 hover:bg-default-1500  hover:text-white">
            <LuSlidersHorizontal className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {actionMessage && <div className="px-4 pt-3 text-sm text-default-600">{actionMessage}</div>}
        {error && <div className="px-4 pt-3 text-sm text-danger">{error}</div>}
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-default-200">
                <thead className="bg-default-150">
                  <tr className="text-sm font-normal text-default-700 whitespace-nowrap">
                    <th className="ps-4 text-start">
                      <input id="checkbox-all" type="checkbox" className="form-checkbox" />
                    </th>
                    <th className="px-3.5 py-3 text-start">User ID</th>
                    <th className="px-3.5 py-3 text-start">Name</th>
                    <th className="px-3.5 py-3 text-start">Location</th>
                    <th className="px-3.5 py-3 text-start">Email</th>
                    <th className="px-3.5 py-3 text-start">Phone Number</th>
                    <th className="px-3.5 py-3 text-start">Joining Date</th>
                    <th className="px-3.5 py-3 text-start">Status</th>
                    <th className="px-3.5 py-3 text-start">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && <tr>
                      <td colSpan={9} className="px-3.5 py-6 text-center text-sm text-default-500">Loading users...</td>
                    </tr>}
                  {!isLoading && normalizedUsers.length === 0 && <tr>
                      <td colSpan={9} className="px-3.5 py-6 text-center text-sm text-default-500">No users matched the selected filters.</td>
                    </tr>}
                  {normalizedUsers.map(user => <tr key={user.id} className="text-default-800 font-normal text-sm whitespace-nowrap">
                      <td className="py-3 ps-4">
                        <input type="checkbox" className="form-checkbox" />
                      </td>
                      <td className="px-3.5 py-3 text-primary">{user.id}</td>
                      <td className="flex py-3 px-3.5 items-center gap-3">
                        {user.avatar ? <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 flex items-center justify-center rounded-full bg-default-200 font-semibold">
                            {user.initials}
                          </div>}
                        <div>
                          <h6 className="mb-1.5 font-semibold">
                            <Link to="#" className="text-default-800">
                              {user.name}
                            </Link>
                          </h6>
                          <p className="text-default-500">{user.role}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">{user.location}</td>
                      <td className="py-3 px-3.5">{user.email}</td>
                      <td className="py-3 px-3.5">{user.phone}</td>
                      <td className="py-3 px-3.5">{user.joiningDate}</td>
                      <td className="px-3.5 py-3">
                        {user.status === 'Verified' && <span className="py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium bg-success/10 text-success rounded">
                            <LuCircleCheck className="size-3" />
                            Verified
                          </span>}
                        {user.status === 'Waiting' && <span className="py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium bg-default-200 text-default-600 rounded">
                            <LuLoader className="size-3" />
                            Waiting
                          </span>}
                        {user.status === 'Rejected' && <span className="py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium bg-danger/10 text-danger rounded">
                            <LuCircleX className="size-3" />
                            Rejected
                          </span>}
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="hs-dropdown relative inline-flex">
                          <button type="button" className="hs-dropdown-toggle btn size-7.5 bg-default-200 hover:bg-default-600 text-default-500">
                            <LuEllipsis className="size-4" />
                          </button>
                          <div className="hs-dropdown-menu" role="menu">
                            <button type="button" onClick={() => handleOverview(user)} className="w-full text-start flex items-center gap-1.5 py-1.5 px-3 text-default-500 hover:bg-default-150 rounded">
                              <LuEye className="size-3" /> Overview
                            </button>
                            <button type="button" onClick={() => handleOpenEdit(user)} className="w-full text-start flex items-center gap-1.5 py-1.5 px-3 text-default-500 hover:bg-default-150 rounded">
                              <LuSquarePen className="size-3" /> Edit
                            </button>
                            <button type="button" onClick={() => handleOpenDelete(user)} className="w-full text-start flex items-center gap-1.5 py-1.5 px-3 text-danger hover:bg-danger/10 rounded">
                              <LuTrash2 className="size-3" /> Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="card-footer">
          <p className="text-default-500 text-sm">
            Showing <b>{normalizedUsers.length}</b> of <b>{totalUsers}</b> Results
          </p>
          <nav className="flex items-center gap-2" aria-label="Pagination">
            <button type="button" onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page <= 1} className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10 disabled:opacity-50 disabled:cursor-not-allowed">
              <LuChevronLeft className="size-4 me-1" /> Prev
            </button>

            {visiblePageNumbers.map(pageNumber => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`btn size-7.5 ${pageNumber === page ? 'bg-primary text-white' : 'bg-transparent border border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10'}`}>
                {pageNumber}
              </button>)}

            <button type="button" onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} disabled={page >= totalPages} className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
              <LuChevronRight className="size-4 ms-1" />
            </button>
          </nav>
        </div>
      </div>

      {isOverviewOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl dark:bg-default-50">
            <div className="flex items-center justify-between border-b border-default-200 px-5 py-4">
              <h3 className="text-base font-semibold text-default-900">User Overview</h3>
              <button type="button" className="text-sm text-default-500" onClick={closeOverview}>Close</button>
            </div>
            <div className="px-5 py-4 text-sm text-default-700">
              {isOverviewLoading && <p>Loading overview...</p>}
              {!isOverviewLoading && overviewUser && <div className="space-y-2">
                  <p><span className="font-semibold">Name:</span> {overviewUser.fullName}</p>
                  <p><span className="font-semibold">Email:</span> {overviewUser.email}</p>
                  <p><span className="font-semibold">Department:</span> {overviewUser.department}</p>
                  <p><span className="font-semibold">Role:</span> {overviewUser.role}</p>
                  <p><span className="font-semibold">Access Level:</span> {overviewUser.accessLevel}</p>
                  <p><span className="font-semibold">Dashboard Route:</span> {overviewUser.dashboardRoute}</p>
                  <p><span className="font-semibold">Status:</span> {overviewUser.isActive ? 'Active' : 'Inactive'}</p>
                  <p><span className="font-semibold">Employee Link:</span> {overviewUser.linkedToEmployee ? `Yes (${overviewUser.employeeName || 'Linked'})` : 'No'}</p>
                  <div className="pt-2">
                    <p className="font-semibold">Recent Audit Logs</p>
                    <div className="mt-2 space-y-2">
                      {(overviewUser.recentAuditLogs || []).length === 0 && <p className="text-xs text-default-500">No audit logs yet.</p>}
                      {(overviewUser.recentAuditLogs || []).map(log => <div key={log.id} className="rounded border border-default-200 p-2">
                          <p className="text-xs"><span className="font-semibold">{log.action}</span> by {log.actor_email || 'system'} on {log.created_at}</p>
                        </div>)}
                    </div>
                  </div>
                </div>}
            </div>
          </div>
        </div>}

      {isEditOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl dark:bg-default-50">
            <div className="flex items-center justify-between border-b border-default-200 px-5 py-4">
              <h3 className="text-base font-semibold text-default-900">Edit User</h3>
              <button type="button" className="text-sm text-default-500" onClick={closeEdit}>Close</button>
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2">
              <input className="form-input" placeholder="Full name" value={editState.fullName} onChange={event => setEditState(prev => ({ ...prev, fullName: event.target.value }))} />
              <input className="form-input" placeholder="Email" value={editState.email} onChange={event => setEditState(prev => ({ ...prev, email: event.target.value }))} />
              <input className="form-input" placeholder="Department" value={editState.department} onChange={event => setEditState(prev => ({ ...prev, department: event.target.value }))} />
              <select className="form-input" value={editState.role} onChange={event => handleRoleChange(event.target.value)}>
                {roleOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
              <input className="form-input bg-default-100" placeholder="Access level" value={editState.accessLevel} readOnly disabled />
              <input className="form-input bg-default-100 md:col-span-2" placeholder="Dashboard route" value={editState.dashboardRoute} readOnly disabled />
              <div className="md:col-span-2">
                <input className="form-input bg-default-100" placeholder="Allowed sections" value={editState.allowedSectionsText} readOnly disabled />
              </div>
              <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-default-700">
                <input type="checkbox" className="form-checkbox" checked={editState.isActive} onChange={event => setEditState(prev => ({ ...prev, isActive: event.target.checked }))} />
                Active account
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-default-200 px-5 py-4">
              <button type="button" className="btn btn-sm bg-default-200 text-default-700" onClick={closeEdit}>Cancel</button>
              <button type="button" className="btn btn-sm bg-primary text-white" onClick={submitEdit} disabled={isSavingEdit}>
                {isSavingEdit ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>}

      {isDeleteOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-default-50">
            <div className="border-b border-default-200 px-5 py-4">
              <h3 className="text-base font-semibold text-default-900">Delete User</h3>
            </div>
            <div className="px-5 py-4 text-sm text-default-700">
              Are you sure you want to delete <span className="font-semibold">{deletingUser?.fullName}</span>? This action cannot be undone.
            </div>
            <div className="flex justify-end gap-2 border-t border-default-200 px-5 py-4">
              <button type="button" className="btn btn-sm bg-default-200 text-default-700" onClick={closeDelete}>Cancel</button>
              <button type="button" className="btn btn-sm bg-danger text-white" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete user'}
              </button>
            </div>
          </div>
        </div>}
    </div>;
};
export default UserListTabel;