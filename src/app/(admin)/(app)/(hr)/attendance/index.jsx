import { useEffect, useMemo, useState } from 'react';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';
import { getAuthSession } from '@/utils/auth';

const HOURS_PATTERN = /[^\d.]/g;

const parseHours = (value) => {
  const numeric = Number.parseFloat(String(value || '').replace(HOURS_PATTERN, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

const statusBadgeClassName = {
  Approved: 'bg-success/15 text-success',
  Pending: 'bg-warning/15 text-warning',
  Rejected: 'bg-danger/15 text-danger',
};

const Index = () => {
  const session = getAuthSession();
  const normalizedRole = (session?.role || '').toLowerCase();
  const isManager = session?.accessLevel === 'department-manager';
  const isHROrAdmin = ['super-admin', 'hr-manager', 'hr-officer'].includes(normalizedRole);
  const canViewAll = isHROrAdmin;
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadEmployeeId, setUploadEmployeeId] = useState('');
  const [uploadFromDate, setUploadFromDate] = useState('');
  const [uploadToDate, setUploadToDate] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let isMounted = true;

    const loadModuleData = async () => {
      try {
        const data = await hrApi.getModuleData('attendance');
        if (!isMounted) {
          return;
        }

        setEmployees(data.employees || []);
        setRecords(data.records || []);
        setCurrentEmployeeId(data.currentEmployeeId ?? null);
        setSelectedEmployeeId(data.currentEmployeeId ? String(data.currentEmployeeId) : 'all');
        if ((data.employees || []).length > 0) {
          setUploadEmployeeId(String(data.employees[0].id));
        }
      } catch (error) {
        console.error('Failed to load attendance module data', error);
      }
    };

    loadModuleData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEmployeeId, searchTerm]);

  const selectedRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return records.filter(record => {
      const matchesEmployee = selectedEmployeeId === 'all' || String(record.employeeId) === String(selectedEmployeeId);
      if (!matchesEmployee) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        record.employeeName,
        record.date,
        record.day,
        record.checkIn,
        record.checkOut,
        record.approvalStatus,
      ].join(' ').toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [records, searchTerm, selectedEmployeeId]);

  const totalPages = Math.ceil(selectedRecords.length / pageSize);

  const displayedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return selectedRecords.slice(startIndex, startIndex + pageSize);
  }, [selectedRecords, currentPage, pageSize]);

  const selectedEmployee = useMemo(() => {
    if (selectedEmployeeId === 'all') {
      return null;
    }
    return employees.find(employee => String(employee.id) === String(selectedEmployeeId)) || null;
  }, [employees, selectedEmployeeId]);

  const stats = useMemo(() => {
    const approvedRecords = selectedRecords.filter(record => record.approvalStatus === 'Approved');
    const pendingRecords = selectedRecords.filter(record => record.approvalStatus === 'Pending');
    const rejectedRecords = selectedRecords.filter(record => record.approvalStatus === 'Rejected');

    return [
      {
        label: 'Visible Records',
        value: selectedRecords.length,
        helper: selectedEmployee ? selectedEmployee.name : isManager ? 'Department scope' : canViewAll ? 'All employees' : 'My records',
      },
      {
        label: 'Approved Hours',
        value: approvedRecords.reduce((total, record) => total + parseHours(record.workHours), 0).toFixed(1),
        helper: `${approvedRecords.length} approved entr${approvedRecords.length === 1 ? 'y' : 'ies'}`,
      },
      {
        label: 'Pending / Rejected',
        value: `${pendingRecords.length} / ${rejectedRecords.length}`,
        helper: 'Need follow-up or correction',
      },
    ];
  }, [isManager, selectedEmployee, selectedRecords]);

  const handleUploadAttendance = async () => {
    setUploadMessage('');
    setUploadError('');

    if (!uploadEmployeeId || !uploadFromDate || !uploadToDate || !uploadFile) {
      setUploadError('Select staff, date range, and an Excel file before uploading.');
      return;
    }

    setUploading(true);
    try {
      const staff = employees.find(employee => String(employee.id) === String(uploadEmployeeId));
      const result = await hrApi.uploadAttendanceExcel({
        employeeId: uploadEmployeeId,
        staffName: staff?.name || '',
        fromDate: uploadFromDate,
        toDate: uploadToDate,
        file: uploadFile,
      });

      const data = await hrApi.getModuleData('attendance');
      setEmployees(data.employees || []);
      setRecords(data.records || []);
      setCurrentEmployeeId(data.currentEmployeeId ?? null);
      setUploadMessage(`Upload successful: ${result.inserted} row(s) imported, ${result.replaced} replaced.`);
      setUploadFile(null);
    } catch (error) {
      setUploadError(error?.detail || error?.message || 'Failed to upload attendance file.');
    } finally {
      setUploading(false);
    }
  };

  return <>
      <PageMeta title="Attendance" />
      <main>
        <PageBreadcrumb title="Attendance" subtitle="Menu" />
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-3">
            {stats.map(stat => <div key={stat.label} className="card">
                <div className="card-body">
                  <p className="text-sm text-default-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-default-900">{stat.value}</p>
                  <p className="mt-2 text-xs text-default-500">{stat.helper}</p>
                </div>
              </div>)}
          </div>

          <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <section className="card">
              <div className="card-body space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-default-400">Scope</p>
                  <h2 className="mt-1 text-lg font-semibold text-default-900">
                    {selectedEmployee ? selectedEmployee.name : isManager ? 'Department Attendance Records' : canViewAll ? 'All Attendance Records' : 'My Attendance Records'}
                  </h2>
                  <p className="mt-1 text-sm text-default-500">
                    {selectedEmployee
                      ? `${selectedEmployee.role || 'Employee'}${selectedEmployee.employeeCode ? ` • ${selectedEmployee.employeeCode}` : ''}`
                      : isManager
                        ? 'Review your own clock-in history or switch to any team member in your department.'
                        : canViewAll
                          ? 'View attendance records for any employee across all departments.'
                          : 'Your attendance history and clock-in records.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-default-700">Employee</label>
                  <select className="form-input" value={selectedEmployeeId} onChange={event => setSelectedEmployeeId(event.target.value)}>
                    {(isManager || canViewAll) && <option value="all">{canViewAll ? 'All employees' : 'All department members'}</option>}
                    {employees.map(employee => <option key={employee.id} value={employee.id}>
                        {employee.isCurrentUser ? `${employee.name} (You)` : employee.name}
                      </option>)}
                  </select>
                </div>

                {(isManager || canViewAll) && currentEmployeeId && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-sm btn-outline-default" onClick={() => setSelectedEmployeeId(String(currentEmployeeId))}>
                      My Records
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-default" onClick={() => setSelectedEmployeeId('all')}>
                      {isManager ? 'Team Records' : 'All Records'}
                    </button>
                  </div>
                )}

                {selectedEmployee && (
                  <div className="rounded-lg border border-default-200 bg-default-50 p-4 text-sm text-default-600">
                    <div className="flex items-center justify-between gap-3">
                      <span>Status</span>
                      <span className="font-medium text-default-900">{selectedEmployee.status || 'Active'}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span>Department</span>
                      <span className="font-medium text-default-900">{selectedEmployee.department || session?.department || 'General'}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span>Date of Joining</span>
                      <span className="font-medium text-default-900">{selectedEmployee.dateOfJoining || '—'}</span>
                    </div>
                  </div>
                )}

                {isHROrAdmin && (
                  <div className="rounded-lg border border-default-200 bg-default-50 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-default-500">Attendance Upload</p>
                    <select className="form-input" value={uploadEmployeeId} onChange={event => setUploadEmployeeId(event.target.value)}>
                      <option value="">Select staff</option>
                      {employees.map(employee => (
                        <option key={`upload-${employee.id}`} value={employee.id}>{employee.name}</option>
                      ))}
                    </select>

                    <div className="grid grid-cols-1 gap-2">
                      <input type="date" className="form-input" value={uploadFromDate} onChange={event => setUploadFromDate(event.target.value)} />
                      <input type="date" className="form-input" value={uploadToDate} onChange={event => setUploadToDate(event.target.value)} />
                    </div>

                    <input
                      type="file"
                      className="form-input"
                      accept=".xlsx,.xlsm,.xltx,.csv"
                      onChange={event => setUploadFile(event.target.files?.[0] || null)}
                    />

                    {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
                    {uploadMessage && <p className="text-xs text-success">{uploadMessage}</p>}

                    <button type="button" className="btn btn-sm bg-primary text-white w-full" disabled={uploading} onClick={handleUploadAttendance}>
                      {uploading ? 'Uploading...' : 'Upload Attendance Excel'}
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="card">
              <div className="card-header flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-default-900">Clock-In & Attendance Log</h3>
                  
                </div>
                <div className="w-full md:max-w-xs">
                  <input
                    type="search"
                    className="form-input"
                    placeholder="Search by employee, date, or status"
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-default-200">
                  <thead className="bg-default-100">
                    <tr className="text-left text-sm text-default-700">
                      {(isManager || canViewAll) && selectedEmployeeId === 'all' && <th className="px-4 py-3 font-medium">Employee</th>}
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Check In (Expected)</th>
                      <th className="px-4 py-3 font-medium">Check Out (Expected)</th>
                      <th className="px-4 py-3 font-medium">Clock In (Actual)</th>
                      <th className="px-4 py-3 font-medium">Clock Out (Actual)</th>
                      <th className="px-4 py-3 font-medium">Total Hours</th>
                      <th className="px-4 py-3 font-medium">Worked Hours</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default-200 text-sm text-default-700">
                    {selectedRecords.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-center text-default-400" colSpan={(isManager || canViewAll) && selectedEmployeeId === 'all' ? 9 : 8}>
                          No attendance records found for the selected view.
                        </td>
                      </tr>
                    ) : displayedRecords.map(record => <tr key={`${record.employeeId}-${record.date}-${record.checkIn}-${record.checkOut}`}>
                        {(isManager || canViewAll) && selectedEmployeeId === 'all' && (
                          <td className="px-4 py-3 font-medium text-default-900">
                            {record.employeeName}
                            {record.isCurrentUser && <span className="ml-2 text-xs text-primary">You</span>}
                          </td>
                        )}
                        <td className="px-4 py-3">{record.date} <span className="text-default-400">{record.day}</span></td>
                        <td className="px-4 py-3">{record.checkIn || '—'}</td>
                        <td className="px-4 py-3">{record.checkOut || '—'}</td>
                        <td className="px-4 py-3">{record.clockIn || '—'}</td>
                        <td className="px-4 py-3">{record.clockOut || '—'}</td>
                        <td className="px-4 py-3">{record.totalHours || '—'}</td>
                        <td className="px-4 py-3">{record.workHours || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${statusBadgeClassName[record.approvalStatus] || 'bg-default-100 text-default-600'}`}>
                            {record.approvalStatus || 'Unknown'}
                          </span>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              {selectedRecords.length > 0 && (
                <div className="card-footer flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-default-600">Rows per page:</label>
                    <select 
                      className="form-input w-20" 
                      value={pageSize} 
                      onChange={event => {
                        setPageSize(Number(event.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="text-sm text-default-600">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, selectedRecords.length)} of {selectedRecords.length} records
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline-default" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          type="button"
                          className={`btn btn-sm ${currentPage === pageNum ? 'bg-primary text-white' : 'btn-outline-default'}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline-default" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>;
};
export default Index;