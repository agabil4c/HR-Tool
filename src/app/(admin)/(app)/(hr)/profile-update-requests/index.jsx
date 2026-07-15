import { useEffect, useMemo, useState } from 'react';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const fieldBinding = {
  'First Name': { key: 'firstName', label: 'First Name', type: 'text' },
  'Last Name': { key: 'lastName', label: 'Last Name', type: 'text' },
  Gender: { key: 'gender', label: 'Gender', type: 'text' },
  'Date of Birth': { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
  Nationality: { key: 'nationality', label: 'Nationality', type: 'text' },
  'Marital Status': { key: 'maritalStatus', label: 'Marital Status', type: 'text' },
  'National ID': { key: 'nationalId', label: 'National ID', type: 'text' },
  'Profile Photo': { key: 'profilePhoto', label: 'Profile Photo', type: 'text' },
  'Personal Email': { key: 'personalEmail', label: 'Personal Email', type: 'email' },
  'Phone Number': { key: 'phone', label: 'Phone Number', type: 'text' },
  'Emergency Contact Name': { key: 'emergencyContactName', label: 'Emergency Contact Name', type: 'text' },
  'Emergency Contact Phone': { key: 'emergencyContactPhone', label: 'Emergency Contact Phone', type: 'text' },
  'Emergency Contact Relationship': { key: 'emergencyContactRelationship', label: 'Emergency Contact Relationship', type: 'text' },
  'Address Line 1': { key: 'addressLine1', label: 'Address Line 1', type: 'text' },
  'Address City': { key: 'addressCity', label: 'Address City', type: 'text' },
  'Address District': { key: 'addressDistrict', label: 'Address District', type: 'text' },
  'Address Country': { key: 'addressCountry', label: 'Address Country', type: 'text' },
  'Work Location': { key: 'workLocation', label: 'Work Location', type: 'text' },
  'Bank Account': { key: 'bankAccount', label: 'Bank Account', type: 'text' },
  'Account Names': { key: 'accountNames', label: 'Account Names', type: 'text' },
  'Bank Name': { key: 'bankName', label: 'Bank Name', type: 'text' },
  'Bank Details': { key: 'bankDetails', label: 'Bank Details', type: 'text' },
  'Tax ID': { key: 'taxId', label: 'Tax ID', type: 'text' },
  'NSSF Number': { key: 'nssfNumber', label: 'NSSF Number', type: 'text' },

  // Backward compatibility
  'Emergency Contact': [
    { key: 'emergencyContactName', label: 'Emergency Contact Name', type: 'text' },
    { key: 'emergencyContactPhone', label: 'Emergency Contact Phone', type: 'text' },
    { key: 'emergencyContactRelationship', label: 'Emergency Contact Relationship', type: 'text' },
  ],
  'Address Details': [
    { key: 'addressCity', label: 'Address City', type: 'text' },
    { key: 'addressDistrict', label: 'Address District', type: 'text' },
    { key: 'addressCountry', label: 'Address Country', type: 'text' },
    { key: 'addressLine1', label: 'Address Line', type: 'text' },
  ],
};

const flattenRequestedFields = (requestedFields) => {
  const rows = [];
  for (const field of requestedFields || []) {
    const binding = fieldBinding[field];
    if (!binding) {
      continue;
    }
    if (Array.isArray(binding)) {
      rows.push(...binding);
    } else {
      rows.push(binding);
    }
  }
  return rows;
};

const Index = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedContext, setSelectedContext] = useState(null);
  const [isContextLoading, setIsContextLoading] = useState(false);
  const [applyFieldsForm, setApplyFieldsForm] = useState({});
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const loadRequests = async (status = statusFilter) => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const data = await hrApi.getProfileUpdateRequests({ status });
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load profile update requests', error);
      setErrorMessage(error?.detail || error?.message || 'Failed to load profile update requests.');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  const counts = useMemo(() => {
    const payload = {
      pending: 0,
      inProgress: 0,
      approved: 0,
      rejected: 0,
    };

    for (const item of requests) {
      const status = String(item.status || '').toLowerCase();
      if (status === 'pending') {
        payload.pending += 1;
      } else if (status === 'in progress') {
        payload.inProgress += 1;
      } else if (status === 'approved') {
        payload.approved += 1;
      } else if (status === 'rejected') {
        payload.rejected += 1;
      }
    }

    return payload;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return requests;
    }

    return requests.filter(item => {
      const text = [
        item.requesterName,
        item.requesterDepartment,
        item.status,
        item.note,
        ...(item.requestedFields || []),
        String(item.id || ''),
      ].join(' ').toLowerCase();
      return text.includes(query);
    });
  }, [requests, searchQuery]);

  const totalPages = Math.max(Math.ceil(filteredRequests.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const pagedRequests = filteredRequests.slice((safePage - 1) * pageSize, safePage * pageSize);

  const loadRequestContext = async (requestId) => {
    try {
      setIsContextLoading(true);
      const context = await hrApi.getProfileUpdateRequestEmployeeContext(requestId);
      setSelectedContext(context || null);

      const employee = context?.employee || {};
      const nextForm = {};
      for (const field of flattenRequestedFields(context?.request?.requestedFields || [])) {
        nextForm[field.key] = employee[field.key] || '';
      }
      setApplyFieldsForm(nextForm);
    } catch (error) {
      setErrorMessage(error?.detail || error?.message || 'Failed to load employee details for this request.');
      setSelectedContext(null);
      setApplyFieldsForm({});
    } finally {
      setIsContextLoading(false);
    }
  };

  const handleTakeAction = async (action) => {
    if (!selectedRequest) {
      return;
    }

    try {
      setIsSubmittingAction(true);
      await hrApi.processProfileUpdateRequest(selectedRequest.id, {
        action,
        reviewNote: reviewNote.trim(),
      });
      setSelectedRequest(null);
      setReviewNote('');
      await loadRequests(statusFilter);
    } catch (error) {
      setErrorMessage(error?.detail || error?.message || 'Failed to process request action.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleApproveAndApply = async () => {
    if (!selectedRequest) {
      return;
    }

    try {
      setIsSubmittingAction(true);

      if (selectedContext?.employee?.employeeDbId) {
        const updatePayload = {};
        for (const field of flattenRequestedFields(selectedRequest.requestedFields || [])) {
          updatePayload[field.key] = applyFieldsForm[field.key] ?? '';
        }
        if (Object.keys(updatePayload).length > 0) {
          await hrApi.updateEmployeeByHR(selectedContext.employee.employeeDbId, updatePayload);
        }
      }

      await hrApi.processProfileUpdateRequest(selectedRequest.id, {
        action: 'approve',
        reviewNote: reviewNote.trim(),
      });

      setSelectedRequest(null);
      setSelectedContext(null);
      setApplyFieldsForm({});
      setReviewNote('');
      await loadRequests(statusFilter);
    } catch (error) {
      setErrorMessage(error?.detail || error?.message || 'Failed to approve and apply changes.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <>
      <PageMeta title="Profile Update Requests" />
      <main className="font-display p-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Profile Update Requests</h1>
            <p className="text-slate-500 dark:text-slate-400">Review and process profile data update requests submitted by staff.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="Requester, field, status..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Rows</label>
              <select
                value={String(pageSize)}
                onChange={event => setPageSize(Number(event.target.value))}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status Filter</label>
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{counts.pending}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">In Progress</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{counts.inProgress}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approved</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{counts.approved}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rejected</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{counts.rejected}</p>
          </div>
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{errorMessage}</p>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Requester</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Requested Fields</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Submitted</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">Loading requests...</td>
                  </tr>
                )}
                {!isLoading && filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">No profile update requests found.</td>
                  </tr>
                )}
                {!isLoading && pagedRequests.map(item => {
                  const status = String(item.status || 'Pending');
                  const normalizedStatus = status.toLowerCase();
                  const statusTone = normalizedStatus === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : normalizedStatus === 'rejected'
                      ? 'bg-rose-100 text-rose-700'
                      : normalizedStatus === 'in progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.requesterName || 'Unknown user'}</p>
                        <p className="text-xs text-slate-500">User ID: {item.requesterUserId || '-'}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{item.requesterDepartment || '-'}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(item.requestedFields || []).map(field => (
                            <span key={`${item.id}-${field}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {field}
                            </span>
                          ))}
                        </div>
                        {item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">{item.createdAt || '-'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusTone}`}>{status}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(item);
                            setReviewNote(item.reviewNote || '');
                            void loadRequestContext(item.id);
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {filteredRequests.length === 0 ? 0 : (safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, filteredRequests.length)} of {filteredRequests.length}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(value => Math.max(value - 1, 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">Page {safePage} / {totalPages}</span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(value => Math.min(value + 1, totalPages))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      </main>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedRequest(null)}>
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900" onClick={event => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review Request #{selectedRequest.id}</h3>
                <p className="text-xs text-slate-500">{selectedRequest.requesterName} • {selectedRequest.requesterDepartment}</p>
              </div>
              <button type="button" onClick={() => setSelectedRequest(null)} className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <IconifyIcon icon="solar:close-circle-outline" className="text-xl" />
              </button>
            </div>

            <div className="mb-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Requested Fields</p>
              <div className="flex flex-wrap gap-1.5">
                {(selectedRequest.requestedFields || []).map(field => (
                  <span key={`modal-${selectedRequest.id}-${field}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {field}
                  </span>
                ))}
              </div>
              {selectedRequest.note && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{selectedRequest.note}</p>}
            </div>

            <div className="mb-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Linked Employee</p>
              {isContextLoading && <p className="text-sm text-slate-500">Loading employee details...</p>}
              {!isContextLoading && !selectedContext?.employee && <p className="text-sm text-slate-500">No linked employee record found for this requester.</p>}
              {!isContextLoading && selectedContext?.employee && <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedContext.employee.name}</p>
                  <p className="text-xs text-slate-500">Employee ID: {selectedContext.employee.employeeDbId}</p>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {flattenRequestedFields(selectedRequest.requestedFields || []).map(field => <div key={field.key}>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">{field.label}</label>
                        <input
                          type={field.type || 'text'}
                          value={applyFieldsForm[field.key] || ''}
                          onChange={event => setApplyFieldsForm(current => ({ ...current, [field.key]: event.target.value }))}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>)}
                  </div>
                </div>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Review Note (optional)</label>
              <textarea
                rows={4}
                value={reviewNote}
                onChange={event => setReviewNote(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
                placeholder="Add notes for the requester or HR team."
              />
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => void handleTakeAction('in-progress')}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-60"
              >
                Mark In Progress
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => void handleTakeAction('reject')}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => void handleApproveAndApply()}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                Approve & Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Index;
