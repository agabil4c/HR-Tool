import { LuChevronLeft, LuChevronRight, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
const HoliyDays = ({ holidayRows = [], onOpenAddModal, onEditRecord, onDeleteRecord, onSyncAnnual, isSyncingAnnual = false, syncMessage = '' }) => {

  return <div className="card">
      <div className="card-header flex justify-between items-center">
        <h6 className="text-default-800 text-base font-semibold">Holidays & Annual Calendar</h6>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onSyncAnnual} disabled={isSyncingAnnual} className="btn btn-sm border border-default-200 text-default-700 hover:bg-default-100 disabled:opacity-60">
            {isSyncingAnnual ? 'Syncing...' : 'Sync Annual Calendar'}
          </button>
          <button type="button" onClick={onOpenAddModal} className="btn btn-sm bg-primary text-white flex items-center gap-1">
            <LuPlus size={16} /> Add Holiday
          </button>
        </div>
      </div>

      {syncMessage && <div className="px-4 pt-3 text-xs text-default-600">{syncMessage}</div>}

      <div className="flex flex-col">
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-default-200">
                <thead className="font-normal whitespace-nowrap">
                  <tr className="text-sm text-default-800 divide-x divide-default-200">
                    <th className="px-3.5 py-3 font-medium text-start">#</th>
                    <th className="px-3.5 py-3 font-medium text-start">Kind</th>
                    <th className="px-3.5 py-3 font-medium text-start">Day</th>
                    <th className="px-3.5 py-3 font-medium text-start">Date</th>
                    <th className="px-3.5 py-3 font-medium text-start">Name</th>
                    <th className="px-3.5 py-3 font-medium text-start">Type</th>
                    <th className="px-3.5 py-3 font-medium text-start">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-default-200">
                  {holidayRows.map((holiday, index) => <tr key={holiday.recordKey || holiday.id} className="text-default-800 font-normal whitespace-nowrap divide-x divide-default-200">
                      <td className="px-3.5 py-3 text-sm">{index + 1}</td>
                      <td className="px-3.5 py-3 text-sm">{holiday.kind}</td>
                      <td className="px-3.5 py-3 text-sm">{holiday.day}</td>
                      <td className="px-3.5 py-3 text-sm">{holiday.date}</td>
                      <td className="px-3.5 py-3 text-sm">{holiday.name}</td>
                      <td className="px-3.5 py-3 text-sm">{holiday.type}</td>
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => onEditRecord?.(holiday)} className="flex size-8 bg-default-200 rounded-md items-center justify-center hover:bg-primary/10 hover:text-primary transition-all text-default-600">
                            <LuPencil className="size-4" />
                          </button>

                          <button type="button" onClick={() => onDeleteRecord?.(holiday)} className="flex size-8 bg-default-200 rounded-md items-center justify-center hover:bg-primary/10 hover:text-primary transition-all text-default-600">
                            <LuTrash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card-footer flex justify-between items-center mt-4">
          <p className="text-default-500 text-sm">
            Showing <b>{holidayRows.length > 0 ? 1 : 0}</b> of <b>{holidayRows.length}</b> Results
          </p>
          <nav className="flex items-center gap-2" aria-label="Pagination">
            <button className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10 flex items-center gap-1" type="button">
              <LuChevronLeft size={16} /> Prev
            </button>
            <button className="btn size-7.5 bg-primary text-white">1</button>
            <button className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10 flex items-center gap-1" type="button">
              Next <LuChevronRight size={16} />
            </button>
          </nav>
        </div>
      </div>
    </div>;
};
export default HoliyDays;