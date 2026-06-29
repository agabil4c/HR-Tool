import { useEffect, useState } from 'react';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';
import EmployeeReport from './components/EmployeeReport';
import EmployeeReportTabel from './components/EmployeeReportTabel';
const Index = () => {
  const [reports, setReports] = useState([]);
  const [tableRows, setTableRows] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadModuleData = async () => {
      try {
        const data = await hrApi.getModuleData('attendance-main');
        if (!isMounted) {
          return;
        }

        setReports(data.reports || []);
        setTableRows(data.tableRows || []);
      } catch (error) {
        console.error('Failed to load attendance main module data', error);
      }
    };

    loadModuleData();

    return () => {
      isMounted = false;
    };
  }, []);

  return <>
      <PageMeta title="Main Attendance" />
      <main>
        <PageBreadcrumb title="Main Attendance" subtitle="Menu" />
        <EmployeeReport reports={reports} />
        <EmployeeReportTabel tableRows={tableRows} />
      </main>
    </>;
};
export default Index;