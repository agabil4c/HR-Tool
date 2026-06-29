import { apiDelete, apiGet, apiPost, apiPostForm, apiPut } from '@/services/apiClient';

export const hrApi = {
  login: payload => apiPost('/api/v1/auth/login', payload),
  getModuleData: (moduleKey, params = {}) => {
    const query = new URLSearchParams(params);
    const queryString = query.toString();
    return apiGet(`/api/v1/modules/${moduleKey}${queryString ? `?${queryString}` : ''}`);
  },
  getRoleAccessProfiles: () => apiGet('/api/v1/admin/role-access-profiles'),
  getRoleAccessProfileOptions: () => apiGet('/api/v1/admin/role-access-profiles/options'),
  createRoleAccessProfile: payload => apiPost('/api/v1/admin/role-access-profiles', payload),
  updateRoleAccessProfile: (roleProfileId, payload) => apiPut(`/api/v1/admin/role-access-profiles/${roleProfileId}`, payload),
  deleteRoleAccessProfile: roleProfileId => apiDelete(`/api/v1/admin/role-access-profiles/${roleProfileId}`),
  getUsers: ({ q, status, page, pageSize } = {}) => {
    const params = new URLSearchParams();
    if (q) {
      params.set('q', String(q));
    }
    if (status && status !== 'all') {
      params.set('status', String(status));
    }
    if (page) {
      params.set('page', String(page));
    }
    if (pageSize) {
      params.set('pageSize', String(pageSize));
    }

    const query = params.toString();
    return apiGet(`/api/v1/admin/users${query ? `?${query}` : ''}`);
  },
  getUserById: userId => apiGet(`/api/v1/admin/users/${userId}`),
  updateUser: (userId, payload) => apiPut(`/api/v1/admin/users/${userId}`, payload),
  deleteUser: userId => apiDelete(`/api/v1/admin/users/${userId}`),
  createUser: payload => apiPost('/api/v1/admin/users', payload),
  createEmployeeWithUser: payload => apiPost('/api/v1/hr/employees', payload),
  deleteEmployee: employeeId => apiDelete(`/api/v1/hr/employees/${employeeId}`),
  changePassword: payload => apiPut('/api/v1/auth/change-password', payload),
  uploadAttendanceExcel: payload => {
    const formData = new FormData();
    formData.append('employeeId', String(payload.employeeId));
    formData.append('staffName', payload.staffName || '');
    formData.append('fromDate', payload.fromDate);
    formData.append('toDate', payload.toDate);
    formData.append('file', payload.file);
    return apiPostForm('/api/v1/hr/attendance/upload', formData);
  },
  getDepartments: () => apiGet('/api/v1/admin/departments'),
  createDepartment: payload => apiPost('/api/v1/admin/departments', payload),
  updateDepartment: (departmentId, payload) => apiPut(`/api/v1/admin/departments/${departmentId}`, payload),
  deleteDepartment: departmentId => apiDelete(`/api/v1/admin/departments/${departmentId}`),

  getLeavePlannerCalendarCells: ({ year, month } = {}) => {
    const params = new URLSearchParams();
    if (year) {
      params.set('year', String(year));
    }
    if (month) {
      params.set('month', String(month));
    }

    const query = params.toString();
    return apiGet(`/api/v1/hr/leave-planner/calendar-cells${query ? `?${query}` : ''}`);
  },
  createPublicHoliday: payload => apiPost('/api/v1/hr/public-holidays', payload),
  updatePublicHoliday: (holidayId, payload) => apiPut(`/api/v1/hr/public-holidays/${holidayId}`, payload),
  deletePublicHoliday: holidayId => apiDelete(`/api/v1/hr/public-holidays/${holidayId}`),
  importAnnualPublicHolidays: payload => apiPost('/api/v1/hr/public-holidays/import-annual', payload),
  getDashboardUpcomingEvents: () => apiGet('/api/v1/dashboard/upcoming-events'),
  createCalendarEvent: payload => apiPost('/api/v1/calendar/events', payload),
  updateCalendarEvent: (eventId, payload) => apiPut(`/api/v1/calendar/events/${eventId}`, payload),
  deleteCalendarEvent: eventId => apiDelete(`/api/v1/calendar/events/${eventId}`),
  getLeavePlannerLeaves: () => apiGet('/api/v1/hr/leave-planner/leaves'),
  getLeaveBalance: () => apiGet('/api/v1/hr/leave-planner/balance'),
  createLeavePlannerLeave: payload => apiPost('/api/v1/hr/leave-planner/leaves', payload),
  cancelLeavePlannerLeave: leaveId => apiPost(`/api/v1/hr/leave-planner/leaves/${leaveId}/cancel`, {}),
  createDraftLeave: payload => apiPost('/api/v1/hr/leave-planner/draft', payload),
  getDraftLeaves: () => apiGet('/api/v1/hr/leave-planner/drafts'),
  deleteDraftLeave: leaveId => apiDelete(`/api/v1/hr/leave-planner/draft/${leaveId}`),
  submitLeaveApplication: (leaveId, payload) => apiPost(`/api/v1/hr/leave-planner/leaves/${leaveId}/submit`, payload),
  getStandInOptions: () => apiGet('/api/v1/hr/leave-planner/stand-in-options'),
  updatePendingLeave: (leaveId, payload) => apiPut(`/api/v1/hr/leave-planner/leaves/${leaveId}`, payload),
  deletePendingLeave: leaveId => apiDelete(`/api/v1/hr/leave-planner/leaves/${leaveId}`),
  submitLeaveHandoverReport: (leaveId, payload) => apiPost(`/api/v1/hr/leave-planner/leaves/${leaveId}/handover-report`, payload),

  getLeaveMarkedDates: () => apiGet('/api/v1/hr/leave-applications/marked-dates'),
  applyLeaveMarkedDates: markedId => apiPost(`/api/v1/hr/leave-applications/marked-dates/${markedId}/apply`, {}),
  getLeaveApprovals: () => apiGet('/api/v1/hr/leave-applications/approvals'),
  actionLeaveApproval: (approvalId, action) => apiPost(`/api/v1/hr/leave-applications/approvals/${approvalId}`, { action }),

  updateEmployeeSelf: payload => apiPut('/api/v1/hr/employees/self', payload),
  updateEmployeeByHR: (employeeId, payload) => apiPut(`/api/v1/hr/employees/${employeeId}`, payload),
  resetEmployeePassword: employeeId => apiPost(`/api/v1/hr/employees/${employeeId}/reset-password`, {}),
  submitProfileUpdateRequest: payload => apiPost('/api/v1/hr/profile-update-requests', payload),
  getProfileUpdateRequests: ({ status } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.set('status', String(status));
    }
    const query = params.toString();
    return apiGet(`/api/v1/hr/profile-update-requests${query ? `?${query}` : ''}`);
  },
  processProfileUpdateRequest: (requestId, payload) => apiPost(`/api/v1/hr/profile-update-requests/${requestId}/action`, payload),
  getProfileUpdateRequestEmployeeContext: requestId => apiGet(`/api/v1/hr/profile-update-requests/${requestId}/employee`),
  getDepartmentLeavePolicyAudit: ({ departmentId, limit } = {}) => {
    const params = new URLSearchParams();
    if (departmentId) {
      params.set('departmentId', String(departmentId));
    }
    if (limit) {
      params.set('limit', String(limit));
    }
    const query = params.toString();
    return apiGet(`/api/v1/admin/departments/leave-policy-audit${query ? `?${query}` : ''}`);
  },

  // Performance Review Cycles
  createReviewCycle: payload => apiPost('/api/v1/hr/review-cycles', payload),
  listReviewCycles: () => apiGet('/api/v1/hr/review-cycles'),
  getMyDepartmentCycles: () => apiGet('/api/v1/hr/review-cycles/my-department'),
  getReviewCycle: cycleId => apiGet(`/api/v1/hr/review-cycles/${cycleId}`),
  downloadReviewCycleDocument: cycleId => apiGet(`/api/v1/hr/review-cycles/${cycleId}/download`),
  closeReviewCycle: cycleId => apiPut(`/api/v1/hr/review-cycles/${cycleId}/close`, {}),
  deleteReviewCycle: cycleId => apiDelete(`/api/v1/hr/review-cycles/${cycleId}`),

  // Performance Review Submissions
  submitReview: (cycleId, payload) => apiPost(`/api/v1/hr/review-cycles/${cycleId}/submit`, payload),
  listCycleSubmissions: cycleId => apiGet(`/api/v1/hr/review-cycles/${cycleId}/submissions`),
  getMySubmissionForCycle: cycleId => apiGet(`/api/v1/hr/review-cycles/${cycleId}/submissions/my`),
  assessSubmission: (subId, payload) => apiPut(`/api/v1/hr/review-submissions/${subId}/assess`, payload),
  scoreSubmission: (subId, payload) => apiPut(`/api/v1/hr/review-submissions/${subId}/score`, payload),
  getMySubmissions: () => apiGet('/api/v1/hr/review-submissions/my'),
};
