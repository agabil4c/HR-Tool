import Flatpickr from 'react-flatpickr';
import { LuCalendar, LuCheck, LuSearch, LuX } from 'react-icons/lu';
const dayColumns = Array.from({ length: 30 }, (_, idx) => String(idx + 1).padStart(2, '0'));

const renderCell = value => {
  if (value === 'P') {
    return <LuCheck className="size-4 text-success" />;
  }
  if (value === 'A') {
    return <LuX className="size-4 text-danger" />;
  }
  return '-';
};

const EmployeeReportTabel = ({ tableRows = [] }) => {
  return <div className="card">
      <div className="card-header">
        <div className="relative">
          <input type="email" className="ps-11 form-input form-input-sm" placeholder="Search for...." />
          <div className="absolute inset-y-0 start-0 flex items-center ps-3">
            <LuSearch className="size-3.5 flex items-center text-default-500" />
          </div>
        </div>

        <div className="relative">
          <Flatpickr options={{
          mode: 'range',
          dateFormat: 'd M, Y'
        }} className="form-input form-input-sm ps-10" placeholder="Select Date" />
          <LuCalendar className="absolute top-1.5 start-3 size-4 flex items-center text-default-500" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-default-200">
                <thead className="bg-default-100 font-normal whitespace-nowrap">
                  <tr className="text-sm  text-default-800">
                    <th scope="col" className="px-3.5 py-3 font-medium">
                      Employee Name
                    </th>
                    {dayColumns.map(col => <th key={col} scope="col" className="px-3.5 py-3 font-medium">
                        {col}
                      </th>)}
                  </tr>
                </thead>

                <tbody className="divide-y divide-default-200">
                  {tableRows.map(row => <tr key={row.employeeName} className="text-default-800 font-normal whitespace-nowrap">
                      <td className="px-3.5 py-3 text-sm">{row.employeeName}</td>
                      {dayColumns.map((_, idx) => <td key={`${row.employeeName}-${idx}`} className="px-3.5 py-3 text-sm">
                          {renderCell(row.days[idx] || '-')}
                        </td>)}
                    </tr>)}

                  <tr className="text-default-800 font-normal whitespace-nowrap">
                    <td className="px-3.5 py-3 text-sm">Jose White</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                  </tr>

                  <tr className="text-default-800 font-normal whitespace-nowrap">
                    <td className="px-3.5 py-3 text-sm">Jose White</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                  </tr>

                  <tr className="text-default-800 font-normal whitespace-nowrap">
                    <td className="px-3.5 py-3 text-sm">Jonas Frederiksen</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                  </tr>

                  <tr className="text-default-800 font-normal whitespace-nowrap">
                    <td className="px-3.5 py-3 text-sm">Kim Broberg</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>

                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                  </tr>

                  <tr className="text-default-800 font-normal whitespace-nowrap">
                    <td className="px-3.5 py-3 text-sm">Nancy Reynolds</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>

                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                  </tr>

                  <tr className="text-default-800 font-normal whitespace-nowrap">
                    <td className="px-3.5 py-3 text-sm">Thomas Hatfield</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>

                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>

                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>

                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                  </tr>

                  <tr className="text-default-800 font-normal whitespace-nowrap">
                    <td className="px-3.5 py-3 text-sm">Holly Kavanaugh</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>

                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>

                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>

                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>

                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>

                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">-</td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuX className="size-4 text-danger" />
                    </td>
                    <td className="px-3.5 py-3 text-sm">
                      <LuCheck className="size-4 text-success" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default EmployeeReportTabel;