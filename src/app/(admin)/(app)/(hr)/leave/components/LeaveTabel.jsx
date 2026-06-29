import { LuCheck, LuChevronLeft, LuChevronRight, LuDownload, LuSearch, LuX } from 'react-icons/lu';
const statusClasses = {
  Approved: 'bg-success/15 text-success',
  Pending: 'bg-warning/15 text-warning',
  Declined: 'bg-danger/10 text-danger',
  Rejected: 'bg-danger/10 text-danger',
  New: 'bg-secondary/10 text-secondary'
};
const LeaveTabel = ({ leaveData = [], canApprove = false, onApprovalAction, actionRowId = null }) => {
  const normalizedRows = leaveData.map(row => ({
    ...row,
    status: row.status === 'Declined' ? 'Rejected' : row.status,
  }));

  const hasAction = typeof onApprovalAction === 'function';

  return <div className="grid grid-cols-1 gap-5 mb-5">
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <div className="relative">
            <input
              type="text"
              className="form-input form-input-sm ps-9"
              placeholder="Search for..."
              onChange={event => {
                const value = event.target.value.toLowerCase();
                const tableRows = document.querySelectorAll('[data-leave-row]');
                tableRows.forEach((tr) => {
                  const rowText = (tr.getAttribute('data-row-text') || '').toLowerCase();
                  tr.classList.toggle('hidden', value && !rowText.includes(value));
                });
              }}
            />
            <div className="absolute inset-y-0 start-0 flex items-center ps-3">
              <LuSearch className="size-4 text-default-500" />
            </div>
          </div>

          <button className="btn btn-sm bg-primary text-white flex items-center">
            <LuDownload className="size-4 me-1" /> Export
          </button>
        </div>
        <div className="flex flex-col">
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-default-200">
                  <thead className="bg-default-150">
                    <tr className="text-sm font-normal text-default-500 whitespace-nowrap">
                      <th className="px-3.5 py-3 text-start">#</th>
                      <th className="px-3.5 py-3 text-start">Employee Name</th>
                      <th className="px-3.5 py-3 text-start">Leave Type</th>
                      <th className="px-3.5 py-3 text-start">Reason</th>
                      <th className="px-3.5 py-3 text-start">No Of Days</th>
                      <th className="px-3.5 py-3 text-start">From</th>
                      <th className="px-3.5 py-3 text-start">To</th>
                      <th className="px-3.5 py-3 text-start">Status</th>
                      <th className="px-3.5 py-3 text-start">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-default-200">
                    {normalizedRows.map(leave => <tr key={leave.id} className="text-default-800 font-normal" data-leave-row data-row-text={`${leave.employeeName || ''} ${leave.leaveType || ''} ${leave.reason || ''} ${leave.status || ''}`}>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-sm">
                          {leave.id.toString().padStart(2, '0')}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-sm">
                          {leave.employeeName}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-sm">
                          {leave.leaveType}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-sm">{leave.reason}</td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-sm">
                          {leave.noOfDays}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-sm">{leave.from}</td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-sm">{leave.to}</td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-x-1.5 py-0.5 px-2.5 rounded text-xs font-medium ${statusClasses[leave.status]}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {canApprove && leave.status === 'Pending' && hasAction ? <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={actionRowId === leave.id}
                                onClick={() => onApprovalAction(leave, 'Approved')}
                                className="btn size-8 bg-success/15 hover:bg-success hover:text-white text-success disabled:opacity-60"
                                title="Approve"
                              >
                                <LuCheck className="size-4" />
                              </button>

                              <button
                                type="button"
                                disabled={actionRowId === leave.id}
                                onClick={() => onApprovalAction(leave, 'Rejected')}
                                className="btn size-8 bg-danger/10 hover:bg-danger hover:text-white text-danger disabled:opacity-60"
                                title="Decline"
                              >
                                <LuX className="size-4" />
                              </button>
                            </div> : <span className="text-xs text-default-500">No action</span>}
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card-footer flex justify-between items-center">
            <p className="text-default-500 text-sm">
              Showing <b>{leaveData.length}</b> of <b>{leaveData.length}</b> Results
            </p>
            <nav className="flex items-center gap-2" aria-label="Pagination">
              <button className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary">
                <LuChevronLeft className="size-4 me-1" /> Prev
              </button>
              <button className="btn size-7.5 bg-primary text-white">1</button>
              <button className="btn size-7.5 bg-transparent border border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary">
                2
              </button>
              <button className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary">
                Next <LuChevronRight className="size-4 ms-1" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>;
};
export default LeaveTabel;