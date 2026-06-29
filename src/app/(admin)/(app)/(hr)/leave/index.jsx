import { useEffect, useState } from 'react';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';
import { getAuthSession } from '@/utils/auth';
import LeaveCard from './components/LeaveCard';
import LeaveTabel from './components/LeaveTabel';

const APPROVAL_ACCESS_LEVELS = ['super-admin', 'hr-manager', 'hr-officer', 'department-manager'];

const Index = () => {
  const session = getAuthSession();
  const canApprove = APPROVAL_ACCESS_LEVELS.includes(session?.accessLevel || 'employee');
  const [summaryRows, setSummaryRows] = useState([]);
  const [leaveRows, setLeaveRows] = useState([]);
  const [actionRowId, setActionRowId] = useState(null);

  const loadModuleData = async () => {
    try {
      const data = await hrApi.getModuleData('leave-requests');
      setSummaryRows(data.summary || []);
      setLeaveRows((data.rows || []).map(row => ({
        ...row,
        status: row.status === 'Declined' ? 'Rejected' : row.status,
      })));
    } catch (error) {
      console.error('Failed to load leave requests module data', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await hrApi.getModuleData('leave-requests');
        if (!isMounted) {
          return;
        }

        setSummaryRows(data.summary || []);
        setLeaveRows((data.rows || []).map(row => ({
          ...row,
          status: row.status === 'Declined' ? 'Rejected' : row.status,
        })));
      } catch (error) {
        console.error('Failed to load leave requests module data', error);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleApprovalAction = async (row, action) => {
    try {
      setActionRowId(row.id);
      await hrApi.actionLeaveApproval(row.id, action);
      await loadModuleData();
    } catch (error) {
      console.error('Failed to update leave request action', error);
    } finally {
      setActionRowId(null);
    }
  };

  return <>
      <PageMeta title="Leave Manage (HR)" />
      <main>
        <PageBreadcrumb title="Leave Manage (HR)" subtitle="Menu" />
        <LeaveCard leaveData={summaryRows} />
        <LeaveTabel leaveData={leaveRows} canApprove={canApprove} onApprovalAction={handleApprovalAction} actionRowId={actionRowId} />
      </main>
    </>;
};
export default Index;