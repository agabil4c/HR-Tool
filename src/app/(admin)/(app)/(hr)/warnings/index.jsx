import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';

const warnings = [{
  employee: 'Kojo Mensah',
  issuedBy: 'Lydia Brown',
  reason: 'Repeated late clock-in',
  date: '2026-03-02',
  level: 'Written'
}, {
  employee: 'David Owusu',
  issuedBy: 'Nadia Bello',
  reason: 'Missed project deadline',
  date: '2026-02-24',
  level: 'Verbal'
}];

const warningClass = {
  Written: 'bg-danger/15 text-danger',
  Verbal: 'bg-warning/15 text-warning'
};

const Index = () => {
  return <>
      <PageMeta title="Warnings" />
      <main>
        <PageBreadcrumb title="Warnings" subtitle="HR" />

        <div className="card p-5">
          <h4 className="text-lg font-semibold text-default-900 mb-4">Disciplinary Warnings</h4>
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-sm">
              <thead>
                <tr className="text-left border-b border-default-200">
                  <th className="py-2 pe-4">Employee</th>
                  <th className="py-2 pe-4">Issued By</th>
                  <th className="py-2 pe-4">Reason</th>
                  <th className="py-2 pe-4">Date</th>
                  <th className="py-2 pe-4">Level</th>
                </tr>
              </thead>
              <tbody>
                {warnings.map(warning => <tr key={`${warning.employee}-${warning.date}`} className="border-b border-default-100">
                    <td className="py-2 pe-4">{warning.employee}</td>
                    <td className="py-2 pe-4">{warning.issuedBy}</td>
                    <td className="py-2 pe-4">{warning.reason}</td>
                    <td className="py-2 pe-4">{warning.date}</td>
                    <td className="py-2 pe-4">
                      <span className={`badge ${warningClass[warning.level]}`}>
                        {warning.level}
                      </span>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>;
};

export default Index;
