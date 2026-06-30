import { apiDelete, apiGet, apiPost, apiPostForm, apiPut } from '@/services/apiClient';

export const hrApi = {
  login: payload => apiPost('/v1/auth/login', payload),
  getModuleData: (moduleKey, params = {}) => {
    const query = new URLSearchParams(params);
    const queryString = query.toString();
    return apiGet(`/v1/modules/${moduleKey}${queryString ? `?${queryString}` : ''}`);
  },
  getRoleAccessProfiles: () => apiGet('/v1/admin/role-access-profiles'),
  getRoleAccessProfileOptions: () => apiGet('/v1/admin/role-access-profiles/options'),
  createRoleAccessProfile: payload => apiPost('/v1/admin/role-access-profiles', payload),
  updateRoleAccessProfile: (roleProfileId, payload) => apiPut(`/v1/admin/role-access-profiles/${roleProfileId}`, payload),
  deleteRoleAccessProfile: roleProfileId => apiDelete(`/v1/admin/role-access-profiles/${roleProfileId}`),
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
    return apiGet(`/v1/admin/users${query ? `?${query}` : ''}`);
  },
  getUserById: userId => apiGet(`/v1/admin/users/${userId}`),
  updateUser: (userId, payload) => apiPut(`/v1/admin/users/${userId}`, payload),
  deleteUser: userId => apiDelete(`/v1/admin/users/${userId}`),
  createUser: payload => apiPost('/v1/admin/users', payload),
  createEmployeeWithUser: payload => apiPost('/v1/hr/employees', payload),
  deleteEmployee: employeeId => apiDelete(`/v1/hr/employees/${employeeId}`),
  changePassword: payload => apiPut('/v1/auth/change-password', payload),
  uploadAttendanceExcel: payload => {
    const formData = new FormData();
    formData.append('employeeId', String(payload.employeeId));
    formData.append('staffName', payload.staffName || '');
    formData.append('fromDate', payload.fromDate);
    formData.append('toDate', payload.toDate);
    formData.append('file', payload.file);
    return apiPostForm('/v1/hr/attendance/upload', formData);
  },
  getDepartments: () => apiGet('/v1/admin/departments'),
  createDepartment: payload => apiPost('/v1/admin/departments', payload),
  updateDepartment: (departmentId, payload) => apiPut(`/v1/admin/departments/${departmentId}`, payload),
  deleteDepartment: departmentId => apiDelete(`/v1/admin/departments/${departmentId}`),

  getLeavePlannerCalendarCells: ({ year, month } = {}) => {
    const params = new URLSearchParams();
    if (year) {
      params.set('year', String(year));
    }
    if (month) {
      params.set('month', String(month));
    }

    const query = params.toString();
    return apiGet(`/v1/hr/leave-planner/calendar-cells${query ? `?${query}` : ''}`);
  },
  createPublicHoliday: payload => apiPost('/v1/hr/public-holidays', payload),
  updatePublicHoliday: (holidayId, payload) => apiPut(`/v1/hr/public-holidays/${holidayId}`, payload),
  deletePublicHoliday: holidayId => apiDelete(`/v1/hr/public-holidays/${holidayId}`),
  importAnnualPublicHolidays: payload => apiPost('/v1/hr/public-holidays/import-annual', payload),
  getDashboardUpcomingEvents: () => apiGet('/v1/dashboard/upcoming-events'),
  createCalendarEvent: payload => apiPost('/v1/calendar/events', payload),
  updateCalendarEvent: (eventId, payload) => apiPut(`/v1/calendar/events/${eventId}`, payload),
  deleteCalendarEvent: eventId => apiDelete(`/v1/calendar/events/${eventId}`),
  getLeavePlannerLeaves: () => apiGet('/v1/hr/leave-planner/leaves'),
  getLeaveBalance: () => apiGet('/v1/hr/leave-planner/balance'),
  createLeavePlannerLeave: payload => apiPost('/v1/hr/leave-planner/leaves', payload),
  cancelLeavePlannerLeave: leaveId => apiPost(`/v1/hr/leave-planner/leaves/${leaveId}/cancel`, {}),
  createDraftLeave: payload => apiPost('/v1/hr/leave-planner/draft', payload),
  getDraftLeaves: () => apiGet('/v1/hr/leave-planner/drafts'),
  deleteDraftLeave: leaveId => apiDelete(`/v1/hr/leave-planner/draft/${leaveId}`),
  submitLeaveApplication: (leaveId, payload) => apiPost(`/v1/hr/leave-planner/leaves/${leaveId}/submit`, payload),
  getStandInOptions: () => apiGet('/v1/hr/leave-planner/stand-in-options'),
  updatePendingLeave: (leaveId, payload) => apiPut(`/v1/hr/leave-planner/leaves/${leaveId}`, payload),
  deletePendingLeave: leaveId => apiDelete(`/v1/hr/leave-planner/leaves/${leaveId}`),
  submitLeaveHandoverReport: (leaveId, payload) => apiPost(`/v1/hr/leave-planner/leaves/${leaveId}/handover-report`, payload),

  getLeaveMarkedDates: () => apiGet('/v1/hr/leave-applications/marked-dates'),
  applyLeaveMarkedDates: markedId => apiPost(`/v1/hr/leave-applications/marked-dates/${markedId}/apply`, {}),
  getLeaveApprovals: () => apiGet('/v1/hr/leave-applications/approvals'),
  actionLeaveApproval: (approvalId, action) => apiPost(`/v1/hr/leave-applications/approvals/${approvalId}`, { action }),

  updateEmployeeSelf: payload => apiPut('/v1/hr/employees/self', payload),
  updateEmployeeByHR: (employeeId, payload) => apiPut(`/v1/hr/employees/${employeeId}`, payload),
  resetEmployeePassword: employeeId => apiPost(`/v1/hr/employees/${employeeId}/reset-password`, {}),
  submitProfileUpdateRequest: payload => apiPost('/v1/hr/profile-update-requests', payload),
  getProfileUpdateRequests: ({ status } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.set('status', String(status));
    }
    const query = params.toString();
    return apiGet(`/v1/hr/profile-update-requests${query ? `?${query}` : ''}`);
  },
  processProfileUpdateRequest: (requestId, payload) => apiPost(`/v1/hr/profile-update-requests/${requestId}/action`, payload),
  getProfileUpdateRequestEmployeeContext: requestId => apiGet(`/v1/hr/profile-update-requests/${requestId}/employee`),
  getDepartmentLeavePolicyAudit: ({ departmentId, limit } = {}) => {
    const params = new URLSearchParams();
    if (departmentId) {
      params.set('departmentId', String(departmentId));
    }
    if (limit) {
      params.set('limit', String(limit));
    }
    const query = params.toString();
    return apiGet(`/v1/admin/departments/leave-policy-audit${query ? `?${query}` : ''}`);
  },

  // Performance Review Cycles
  createReviewCycle: payload => apiPost('/v1/hr/review-cycles', payload),
  listReviewCycles: () => apiGet('/v1/hr/review-cycles'),
  getMyDepartmentCycles: () => apiGet('/v1/hr/review-cycles/my-department'),
  getReviewCycle: cycleId => apiGet(`/v1/hr/review-cycles/${cycleId}`),
  downloadReviewCycleDocument: cycleId => apiGet(`/v1/hr/review-cycles/${cycleId}/download`),
  closeReviewCycle: cycleId => apiPut(`/v1/hr/review-cycles/${cycleId}/close`, {}),
  deleteReviewCycle: cycleId => apiDelete(`/v1/hr/review-cycles/${cycleId}`),

  // Performance Review Submissions
  submitReview: (cycleId, payload) => apiPost(`/v1/hr/review-cycles/${cycleId}/submit`, payload),
  listCycleSubmissions: cycleId => apiGet(`/v1/hr/review-cycles/${cycleId}/submissions`),
  getMySubmissionForCycle: cycleId => apiGet(`/v1/hr/review-cycles/${cycleId}/submissions/my`),
  assessSubmission: (subId, payload) => apiPut(`/v1/hr/review-submissions/${subId}/assess`, payload),
  scoreSubmission: (subId, payload) => apiPut(`/v1/hr/review-submissions/${subId}/score`, payload),
  getMySubmissions: () => apiGet('/v1/hr/review-submissions/my'),
};
