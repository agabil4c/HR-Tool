import { useEffect, useMemo, useState } from 'react';
import avatar2 from '@/assets/images/user/avatar-2.png';
import avatar3 from '@/assets/images/user/avatar-3.png';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';
import PageMeta from '@/components/PageMeta';
import UpcomingEventsSummary from '@/components/UpcomingEventsSummary';
import { hrApi } from '@/services/hrApi';
import { Link } from 'react-router-dom';

const lineManagerStats = [];
const approvalQueue = [];
const rosterColumns = [];
const rosterRows = [];

const ManagersDashboard = () => {
  const [moduleData, setModuleData] = useState(null);
  const [myReviewCycles, setMyReviewCycles] = useState([]);
  const [departmentReviewCycles, setDepartmentReviewCycles] = useState([]);
  const [myReviewSubmissions, setMyReviewSubmissions] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadModuleData = async () => {
      try {
        const [data, ownCycles, departmentCycles, ownSubmissions] = await Promise.all([
          hrApi.getModuleData('hr-dashboard'),
          hrApi.getMyDepartmentCycles().catch(() => []),
          hrApi.listReviewCycles().catch(() => []),
          hrApi.getMySubmissions().catch(() => []),
        ]);
        if (!isMounted) {
          return;
        }

        const mappedApprovalQueue = (data.approvalQueue || []).map(item => ({
          ...item,
          avatar: item.name === 'Sarah Jenkins' ? avatar3 : avatar2
        }));

        setModuleData({
          ...data,
          approvalQueue: mappedApprovalQueue
        });
        setMyReviewCycles(Array.isArray(ownCycles) ? ownCycles : []);
        setDepartmentReviewCycles(Array.isArray(departmentCycles) ? departmentCycles : []);
        setMyReviewSubmissions(Array.isArray(ownSubmissions) ? ownSubmissions : []);
      } catch (error) {
        console.error('Failed to load managers dashboard module data', error);
      }
    };

    loadModuleData();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = (moduleData?.lineManagerStats || lineManagerStats).length > 0 ? moduleData.lineManagerStats : [{
    title: 'Pending Approvals',
    value: '12',
    subtitle: '4 new since yesterday',
    subtitleTone: 'text-emerald-600',
    icon: 'solar:clipboard-check-outline',
    accent: 'text-primary text-lg'
  }, {
    title: 'Team Attendance',
    value: '94%',
    subtitle: '3 members on leave today',
    subtitleTone: 'text-slate-500',
    icon: 'solar:users-group-rounded-outline',
    accent: 'text-orange-500 text-lg'
  }, {
    title: 'Performance Reviews',
    value: '8 Due',
    subtitle: 'Q3 cycle closing in 5 days',
    subtitleTone: 'text-slate-500',
    icon: 'solar:star-outline',
    accent: 'text-violet-500 text-lg'
  }];

  const queueItems = (moduleData?.approvalQueue || approvalQueue).length > 0 ? moduleData.approvalQueue : [{
    name: 'Sarah Jenkins',
    when: '2h ago',
    note: 'Annual Leave • 3 days',
    avatar: avatar3
  }, {
    name: 'Mike Ross',
    when: 'Yesterday',
    note: 'Sick Leave • 1 day',
    avatar: avatar2
  }];

  const columns = moduleData?.rosterColumns || rosterColumns;
  const rows = moduleData?.rosterRows || rosterRows;
  const hasCurrentWeekRoster = columns.length > 0 && rows.length > 0;

  const reviewStats = useMemo(() => {
    const activeOwnCycles = myReviewCycles.filter(cycle => cycle.status === 'active');
    const outstandingOwnCycles = activeOwnCycles.filter(cycle => !myReviewSubmissions.some(submission => submission.cycleId === cycle.id));
    const departmentSubmissionCount = departmentReviewCycles.reduce((total, cycle) => total + (cycle.submissionCount || 0), 0);
    const assessableCount = myReviewSubmissions.filter(submission => submission.status === 'submitted').length;

    return {
      activeOwnCycles,
      outstandingOwnCycles,
      departmentSubmissionCount,
      assessableCount,
    };
  }, [departmentReviewCycles, myReviewCycles, myReviewSubmissions]);

  return <>
      <PageMeta title="Manager Dashboard" />
      <main className="font-display">
        <div className="space-y-7">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {stats.map(card => <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-2 flex items-start justify-between">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                  <IconifyIcon icon={card.icon} className={card.accent} />
                </div>
                <p className="text-4xl font-bold leading-none tracking-tight text-slate-900 dark:text-slate-100">{card.value}</p>
                <p className={`mt-2 text-[11px] font-medium uppercase tracking-wide ${card.subtitleTone}`}>
                  {card.title === 'Pending Approvals' && <IconifyIcon icon="solar:arrow-up-outline" className="me-1 inline-block" />}
                  {card.subtitle}
                </p>
              </div>)}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-3">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Approval Queue</h3>
                <button type="button" className="text-xs font-bold text-primary hover:underline">View All</button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {queueItems.map(item => <div key={item.name} className="p-4">
                    <div className="flex gap-3">
                      <img src={item.avatar} alt={item.name} className="h-10 w-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                          <span className="text-[10px] text-slate-400">{item.when}</span>
                        </div>
                        <p className="text-xs text-slate-500">{item.note}</p>
                        <div className="mt-3 flex gap-2">
                          <button type="button" className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-bold text-white hover:bg-primary/90">Approve</button>
                          <button type="button" className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">Reject</button>
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>

            <div className="space-y-6 xl:col-span-2">
              <UpcomingEventsSummary />

              {hasCurrentWeekRoster && <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">Attendance Roster &amp; Leave Calendar</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="w-56 border-b border-slate-100 p-4 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800">Employee</th>
                        {columns.map(col => <th key={col} className="border-b border-slate-100 p-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800">{col}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rows.map(row => <tr key={row.name}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${row.initials === 'SJ' ? 'bg-primary/10 text-primary' : row.initials === 'MR' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                                {row.initials}
                              </div>
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{row.name}</span>
                            </div>
                          </td>
                          {row.statuses.map((status, idx) => <td key={`${row.name}-${idx}`} className="p-4 text-center">
                              {status === 'present' && <div className="mx-auto h-2.5 w-2.5 rounded-full bg-emerald-500" title="Present" />}
                              {status === 'al' && <div className="mx-auto flex h-6 w-10 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">AL</div>}
                              {status === 'sl' && <div className="mx-auto flex h-6 w-10 items-center justify-center rounded bg-orange-100 text-[10px] font-bold text-orange-600">SL</div>}
                              {status === 'wfh' && <div className="mx-auto flex h-6 w-10 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-600">WFH</div>}
                            </td>)}
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
              }
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Performance Review Hub</h2>
                <p className="text-sm text-slate-500">Track your own review cycles and assess department submissions before they move to HR.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/performance-reviews" className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200">
                  <IconifyIcon icon="solar:user-id-outline" className="text-sm" />
                  My Reviews
                </Link>
                <Link to="/performance-review-management" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90">
                  <IconifyIcon icon="solar:clipboard-check-outline" className="text-sm" />
                  Assess Team Reviews
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">My Performance Reviews</p>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Submit and track your own cycles</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                    {reviewStats.activeOwnCycles.length} active
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Outstanding submissions</span><span className="font-bold text-slate-700 dark:text-slate-300">{reviewStats.outstandingOwnCycles.length}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Completed submissions</span><span className="font-bold text-slate-700 dark:text-slate-300">{myReviewSubmissions.length}</span></div>
                  <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                    {reviewStats.activeOwnCycles.length === 0 ? <p className="text-sm text-slate-500">No active manager review cycles right now.</p> : reviewStats.activeOwnCycles.slice(0, 3).map(cycle => <div key={cycle.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                          <span className="font-medium text-slate-800 dark:text-slate-100">{cycle.title}</span>
                          <span className="text-xs text-slate-500">{cycle.deadline || 'No deadline'}</span>
                        </div>)}
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Department Review Queue</p>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Assess department submissions before HR scoring</p>
                  </div>
                  <span className="rounded-full bg-warning/15 px-2 py-1 text-[10px] font-bold text-warning">{reviewStats.departmentSubmissionCount} submissions</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Cycles in department</span><span className="font-bold text-slate-700 dark:text-slate-300">{departmentReviewCycles.length}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Submitted and awaiting assessment</span><span className="font-bold text-slate-700 dark:text-slate-300">{reviewStats.assessableCount}</span></div>
                  <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                    {departmentReviewCycles.length === 0 ? <p className="text-sm text-slate-500">No review cycles for your department yet.</p> : departmentReviewCycles.slice(0, 3).map(cycle => <div key={cycle.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                          <span className="font-medium text-slate-800 dark:text-slate-100">{cycle.title}</span>
                          <span className="text-xs text-slate-500">{cycle.submissionCount || 0} submissions</span>
                        </div>)}
                  </div>
                </div>
              </div>

              <div className="flex min-h-60 flex-col justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-left dark:border-slate-700 dark:bg-slate-900/50">
                <div>
                  <IconifyIcon icon="solar:shield-check-outline" className="text-4xl text-slate-300 dark:text-slate-700" />
                  <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Forward Ready</h3>
                  <p className="mt-2 text-sm text-slate-500">Use the management queue to add your manager assessment. HR only sees the final scoring step after your department review is complete.</p>
                </div>
                <Link to="/performance-review-management" className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
                  Open Review Queue
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>;
};

export default ManagersDashboard;
