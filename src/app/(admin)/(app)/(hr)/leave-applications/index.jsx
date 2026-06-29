import { useEffect, useState } from 'react';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';
import { getAuthSession } from '@/utils/auth';

const statusClass = {
  Approved: 'bg-success/15 text-success',
  Pending: 'bg-warning/15 text-warning',
  Rejected: 'bg-danger/15 text-danger',
  Available: 'bg-info/15 text-info',
  Applied: 'bg-default/15 text-default-600'
};

const APPROVAL_ACCESS_LEVELS = ['super-admin', 'hr-manager', 'hr-officer', 'department-manager'];

const Index = () => {
  const session = getAuthSession();
  const accessLevel = session?.accessLevel || 'employee';
  const canApprove = APPROVAL_ACCESS_LEVELS.includes(accessLevel);
  const [markedDatesTable, setMarkedDatesTable] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [selectedMarkedDates, setSelectedMarkedDates] = useState(null);
  const [leaveType, setLeaveType] = useState('Annual');
  const [leaveReason, setLeaveReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const markedDatesPromise = hrApi.getLeaveMarkedDates();
        const approvalsPromise = canApprove ? hrApi.getLeaveApprovals() : Promise.resolve([]);
        const [markedDates, approvalsQueue] = await Promise.all([markedDatesPromise, approvalsPromise]);

        if (!isMounted) {
          return;
        }

        setMarkedDatesTable(markedDates);
        setApprovals(approvalsQueue);
      } catch (error) {
        console.error('Failed to load leave applications data', error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [canApprove]);


  const handleApplyFromMarked = async (markedSet) => {
    try {
      await hrApi.applyLeaveMarkedDates(markedSet.id);
      const updatedMarkedDates = await hrApi.getLeaveMarkedDates();
      setMarkedDatesTable(updatedMarkedDates);
    } catch (error) {
      console.error('Failed to apply marked date set', error);
    }

    setSelectedMarkedDates(markedSet);
  };

  const handleSubmitFromMarked = async () => {
    if (!selectedMarkedDates) {
      return;
    }

    try {
      await hrApi.createLeavePlannerLeave({
        leaveType: `${leaveType} Leave`,
        reason: leaveReason || 'Submitted from marked dates',
        from: `${selectedMarkedDates.dates[0]} Mar, 2026`,
        to: `${selectedMarkedDates.dates[selectedMarkedDates.dates.length - 1]} Mar, 2026`,
        reviewer: 'Line Manager'
      });

      setSelectedMarkedDates(null);
      setLeaveReason('');
    } catch (error) {
      console.error('Failed to submit leave from marked dates', error);
    }
  };

  const handleQuickSubmit = async () => {
    if (!startDate || !endDate) {
      return;
    }

    try {
      await hrApi.createLeavePlannerLeave({
        leaveType: `${leaveType} Leave`,
        reason: leaveReason || 'Submitted from quick application form',
        from: startDate,
        to: endDate,
        reviewer: 'Line Manager'
      });

      setStartDate('');
      setEndDate('');
      setLeaveReason('');
    } catch (error) {
      console.error('Failed to submit quick leave application', error);
    }
  };

  const handleApprovalAction = async (approval, action) => {
    try {
      await hrApi.actionLeaveApproval(approval.id, action);
      const approvalsQueue = await hrApi.getLeaveApprovals();
      setApprovals(approvalsQueue);
    } catch (error) {
      console.error('Failed to update approval action', error);
    }
  };

  return <>
      <PageMeta title="Leave Applications" />
      <main>
        <PageBreadcrumb title="Leave Applications & Approval" subtitle="HR" />

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Apply from Marked Dates */}
          <div className="card p-5">
            <h4 className="text-lg font-semibold text-default-900 mb-4">My Marked Leave Dates</h4>
            <p className="text-sm text-default-500 mb-4">Select dates you marked on the calendar to apply for leave</p>
            <div className="space-y-3">
              {markedDatesTable.map(marked => (
                <div key={marked.id} className="border border-default-200 rounded p-3 hover:bg-default-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium">Dates: {marked.dates.join(', ')} March</p>
                      <p className="text-xs text-default-500">Marked on: {marked.markedOn}</p>
                    </div>
                    <span className={`badge text-xs ${statusClass[marked.status]}`}>
                      {marked.status}
                    </span>
                  </div>
                  {marked.status === 'Available' && (
                    <button 
                      type="button" 
                      onClick={() => void handleApplyFromMarked(marked)}
                      className="btn btn-sm bg-primary text-white w-full">
                      Apply for These Dates
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Direct Application Form */}
          <div className="card p-5">
            <h4 className="text-lg font-semibold text-default-900 mb-4">Quick Leave Application</h4>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-default-700 mb-2">Leave Type</label>
                <select className="form-input" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                  <option>Annual</option>
                  <option>Sick</option>
                  <option>Unpaid</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-default-700 mb-2">Start Date</label>
                  <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-default-700 mb-2">End Date</label>
                  <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-default-700 mb-2">Reason</label>
                <textarea className="form-input" rows={4} value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Reason for leave"></textarea>
              </div>
              <button type="button" onClick={() => void handleQuickSubmit()} className="btn bg-primary text-white">Submit Application</button>
            </div>
          </div>
        </div>

        {/* Approval Queue - visible to managers */}
        {canApprove && (
          <div className="card p-5">
            <h4 className="text-lg font-semibold text-default-900 mb-4">Approval Queue</h4>
            {approvals.length === 0 ? (
              <p className="text-sm text-default-500">No pending leave applications.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-auto w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-default-200">
                      <th className="py-2 pe-4">Employee</th>
                      <th className="py-2 pe-4">Department</th>
                      <th className="py-2 pe-4">Type</th>
                      <th className="py-2 pe-4">Period</th>
                      <th className="py-2 pe-4">Stand-in</th>
                      <th className="py-2 pe-4">Hand-over Report</th>
                      <th className="py-2 pe-4">Days</th>
                      <th className="py-2 pe-4">Submitted</th>
                      <th className="py-2 pe-4">Status</th>
                      <th className="py-2 pe-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.map(request => (
                      <tr key={request.id} className="border-b border-default-100">
                        <td className="py-2 pe-4 font-medium">{request.employee}</td>
                        <td className="py-2 pe-4 text-default-500">{request.department}</td>
                        <td className="py-2 pe-4">{request.leaveType}</td>
                        <td className="py-2 pe-4 whitespace-nowrap">{request.period}</td>
                        <td className="py-2 pe-4 text-default-600">{request.standIn || '—'}</td>
                        <td className="py-2 pe-4 max-w-xs">
                          {request.handoverReport ? (
                            <div>
                              <p className="line-clamp-2 text-default-700">{request.handoverReport}</p>
                              {request.handoverSubmittedOn && <p className="text-[11px] text-default-400 mt-1">Submitted: {request.handoverSubmittedOn}</p>}
                            </div>
                          ) : (
                            <span className="text-default-400">Not submitted</span>
                          )}
                        </td>
                        <td className="py-2 pe-4">{request.days}</td>
                        <td className="py-2 pe-4 text-default-500">{request.submittedOn}</td>
                        <td className="py-2 pe-4">
                          <span className={`badge ${statusClass[request.status]}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="py-2 pe-4">
                          {request.status === 'Pending' && canApprove && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => void handleApprovalAction(request, 'Approved')}
                                className="btn btn-sm bg-success/20 text-success hover:bg-success/30">
                                Approve
                              </button>
                              <button
                                onClick={() => void handleApprovalAction(request, 'Rejected')}
                                className="btn btn-sm bg-danger/20 text-danger hover:bg-danger/30">
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal for applying from marked dates */}
        {selectedMarkedDates && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedMarkedDates(null)}>
            <div className="card p-6 max-w-lg w-full m-4" onClick={e => e.stopPropagation()}>
              <h4 className="text-lg font-semibold text-default-900 mb-4">Apply for Leave</h4>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-default-700 mb-2">Selected Dates</label>
                  <div className="text-sm text-default-600 bg-default-100 p-3 rounded">
                    {selectedMarkedDates.dates.join(', ')} March 2026
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-default-700 mb-2">Leave Type</label>
                  <select 
                    className="form-input w-full" 
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}>
                    <option>Annual</option>
                    <option>Sick</option>
                    <option>Unpaid</option>
                    <option>Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-default-700 mb-2">Reason for Leave</label>
                  <textarea 
                    className="form-input w-full" 
                    rows={4} 
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Explain your reason for leave..."></textarea>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={handleSubmitFromMarked}
                    className="btn bg-primary text-white flex-1">
                    Submit Application
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSelectedMarkedDates(null)}
                    className="btn bg-default-200 text-default-700">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>;
};

export default Index;
