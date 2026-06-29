import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { useEffect, useState } from 'react';
import { hrApi } from '@/services/hrApi';

const Index = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadBalances = async () => {
      try {
        const data = await hrApi.getModuleData('staff-biodata');
        if (isMounted && data && data.staffProfiles) {
          setBalances(data.staffProfiles);
        }
      } catch (error) {
        console.error('Failed to load leave balances:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadBalances();
    return () => {
      isMounted = false;
    };
  }, []);

  return <>
      <PageMeta title="Pending Leave Days" />
      <main>
        <PageBreadcrumb title="Pending Leave Days" subtitle="HR" />

        <div className="card p-5">
          <h4 className="text-lg font-semibold text-default-900 mb-4">Outstanding Leave Balances</h4>
          {loading ? (
            <p className="text-sm text-default-500">Loading balances...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-default-200">
                    <th className="py-2 pe-4">Employee</th>
                    <th className="py-2 pe-4">Annual Days Left</th>
                    <th className="py-2 pe-4">Sick Days Left</th>
                    <th className="py-2 pe-4">Unpaid Leave Days</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map(balance => <tr key={balance.dbId || balance.name} className="border-b border-default-100">
                      <td className="py-2 pe-4">{balance.name}</td>
                      <td className="py-2 pe-4">
                        {balance.leaveBalance?.annual?.remainingDays ?? balance.leaveBalance?.remainingDays ?? 0}
                      </td>
                      <td className="py-2 pe-4">
                        {balance.leaveBalance?.sick?.remainingDays ?? 0}
                      </td>
                      <td className="py-2 pe-4">
                        {balance.leaveBalance?.unpaid?.usedDays ?? 0}
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>;
};

export default Index;

