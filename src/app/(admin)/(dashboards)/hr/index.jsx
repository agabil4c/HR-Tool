import { useEffect, useState } from 'react';
import avatar2 from '@/assets/images/user/avatar-2.png';
import avatar3 from '@/assets/images/user/avatar-3.png';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';
import { DashboardHero, DashboardSectionHeading } from '@/components/dashboard/DashboardChrome';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';
import { getAuthSession } from '@/utils/auth';
import { Link } from 'react-router';
import { LuArrowRight, LuBriefcaseBusiness, LuCalendarCheck2, LuClipboardCheck, LuShieldCheck, LuSparkles, LuUsers, LuUserPlus } from 'react-icons/lu';

const statCards = [];
const departments = [];
const quickActions = [];
const reviewTemplates = [];
const pendingBio = [];
const lineManagerStats = [];
const approvalQueue = [];
const rosterColumns = [];
const rosterRows = [];

const heroTints = [
  'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
  'from-sky-500/20 to-sky-500/5 border-sky-500/20',
  'from-amber-500/20 to-amber-500/5 border-amber-500/20'
];

const buildHeroCards = (cards, fallbacks) => cards.slice(0, 3).map((card, index) => ({
  label: card.title || fallbacks[index]?.label || `Metric ${index + 1}`,
  value: card.value || fallbacks[index]?.value || '--',
  detail: card.subtitle || fallbacks[index]?.detail || 'Operational indicator',
  icon: fallbacks[index]?.icon,
  tint: heroTints[index] || heroTints[0]
}));

const LineManagerDashboard = ({ lineManagerStatsData, approvalQueueData, rosterColumnsData, rosterRowsData }) => {
  const dashboardStats = lineManagerStatsData.length > 0 ? lineManagerStatsData : [{
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

  const queueItems = approvalQueueData.length > 0 ? approvalQueueData : [{
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

  const rosterColumns = rosterColumnsData;
  const rosterRows = rosterRowsData;
  const hasCurrentWeekRoster = rosterColumns.length > 0 && rosterRows.length > 0;

  return <>
      <PageMeta title="Line Manager Dashboard" />
      <main className="font-display">
        <div className="space-y-7">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {dashboardStats.map(card => <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
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

            {hasCurrentWeekRoster && <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Attendance Roster &amp; Leave Calendar</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="w-56 border-b border-slate-100 p-4 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800">Employee</th>
                      {rosterColumns.map(col => <th key={col} className="border-b border-slate-100 p-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800">{col}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rosterRows.map(row => <tr key={row.name}>
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
            </div>}
          </div>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Performance Review Hub</h2>
                <p className="text-sm text-slate-500">Q3 Review Cycle: Engineering Dept</p>
              </div>
              <button type="button" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90">
                <IconifyIcon icon="solar:download-outline" className="text-sm" />
                Export Report
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={avatar3} alt="Alex Thompson" className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Alex Thompson</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Senior Developer</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold text-yellow-700">Pending Hub Review</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Self Assessment:</span><span className="font-bold text-slate-700 dark:text-slate-300">Submitted</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Peer Feedback (3):</span><span className="font-bold text-slate-700 dark:text-slate-300">Complete</span></div>
                  <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Final Hub Score</label>
                    <div className="flex gap-2">
                      <select className="h-8 flex-1 rounded border-none bg-slate-50 py-0 text-sm focus:ring-primary dark:bg-slate-800">
                        <option>Set Score...</option>
                        <option>1 - Needs Improvement</option>
                        <option>2 - Developing</option>
                        <option>3 - Fully Meets</option>
                        <option>4 - Exceeds</option>
                        <option>5 - Exceptional</option>
                      </select>
                      <button type="button" className="rounded bg-slate-100 p-1.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        <IconifyIcon icon="solar:eye-outline" className="text-base" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">LM</div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Lisa Miller</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Project Lead</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">Completed</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Self Assessment:</span><span className="font-bold text-slate-700 dark:text-slate-300">Submitted</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Final Hub Score:</span><span className="font-bold text-primary">4 - Exceeds Expectations</span></div>
                  <div className="flex gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                    <button type="button" className="flex-1 rounded-lg border border-slate-200 py-2 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:text-slate-400">View Form</button>
                    <button type="button" className="flex-1 rounded-lg border border-slate-200 py-2 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:text-slate-400">Update</button>
                  </div>
                </div>
              </div>

              <div className="flex min-h-60 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-900/50">
                <IconifyIcon icon="solar:user-plus-outline" className="text-4xl text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-medium text-slate-400">Invite additional reviewers or external contributors</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>;
};

const Index = () => {
  const session = getAuthSession();
  const accessLevel = session?.accessLevel || 'employee';
  const [moduleData, setModuleData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadModuleData = async () => {
      try {
        const data = await hrApi.getModuleData('hr-dashboard');
        if (!isMounted) {
          return;
        }

        const avatarMap = { avatar2, avatar3 };
        const mappedPendingBio = (data.pendingBio || []).map(item => ({
          ...item,
          avatar: avatarMap[item.avatar] || avatar2
        }));

        const mappedApprovalQueue = (data.approvalQueue || []).map(item => ({
          ...item,
          avatar: item.name === 'Sarah Jenkins' ? avatar3 : avatar2
        }));

        setModuleData({
          ...data,
          pendingBio: mappedPendingBio,
          approvalQueue: mappedApprovalQueue
        });
      } catch (error) {
        console.error('Failed to load HR dashboard module data', error);
      }
    };

    loadModuleData();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCardsData = moduleData?.statCards || statCards;
  const departmentsData = moduleData?.departments || departments;
  const quickActionsData = moduleData?.quickActions || quickActions;
  const reviewTemplatesData = moduleData?.reviewTemplates || reviewTemplates;
  const pendingBioData = moduleData?.pendingBio || pendingBio;
  const lineManagerStatsData = moduleData?.lineManagerStats || lineManagerStats;
  const approvalQueueData = moduleData?.approvalQueue || approvalQueue;
  const rosterColumnsData = moduleData?.rosterColumns || rosterColumns;
  const rosterRowsData = moduleData?.rosterRows || rosterRows;

  if (accessLevel === 'department-manager') {
    return <LineManagerDashboard lineManagerStatsData={lineManagerStatsData} approvalQueueData={approvalQueueData} rosterColumnsData={rosterColumnsData} rosterRowsData={rosterRowsData} />;
  }

  const adminHeroCards = buildHeroCards(statCardsData, [{
    label: 'Workforce total',
    value: '248',
    detail: 'Active staff tracked across departments.',
    icon: LuUsers
  }, {
    label: 'Department load',
    value: '12 teams',
    detail: 'Organization structure and ownership health.',
    icon: LuBriefcaseBusiness
  }, {
    label: 'Onboarding queue',
    value: '9 pending',
    detail: 'Bio data and access setup waiting to clear.',
    icon: LuShieldCheck
  }]);

  return <>
      <PageMeta title="HR Admin Management" />
      <main className="font-display">
        <DashboardHero primaryAction={<button type="button" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-sky-950 transition hover:bg-sky-50">
              <LuUserPlus className="size-4" />
              Bio Data Entry
            </button>} secondaryAction={<Link to="#" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15">
              Open department view
              <LuArrowRight className="size-4" />
            </Link>} highlights={adminHeroCards} summaryTitle="Workforce calendar focus" />

        <DashboardSectionHeading />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div className="overflow-hidden rounded-xl border border-default-200 bg-card">
              <div className="flex items-center justify-between border-b border-default-200 p-6">
                <h2 className="text-lg font-bold text-default-900">Department Management</h2>
                <button type="button" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  <IconifyIcon icon="solar:add-circle-linear" className="text-sm" />
                  Add New
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {departmentsData.map(department => <div key={department.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-default-100">
                          <IconifyIcon icon={department.icon} className={`text-xl ${department.tone.split(' ')[0]}`} />
                        </div>
                        <div>
                          <p className="font-bold text-default-900">{department.name}</p>
                          <p className="text-xs text-default-500">{department.members}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="me-4 text-right">
                          <p className="text-xs font-semibold uppercase tracking-wider text-default-400">HOD</p>
                          <p className="text-sm font-medium text-default-700">{department.head}</p>
                        </div>
                        <button type="button" className="rounded-lg p-2 text-default-400 hover:bg-default-100">
                          <IconifyIcon icon="solar:pen-2-outline" className="text-lg" />
                        </button>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-default-200 bg-card">
              <div className="flex items-center justify-between border-b border-default-200 p-6">
                <h2 className="text-lg font-bold text-default-900">Performance Review Builder</h2>
                <Link to="/performance-review-management" className="btn rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                  <IconifyIcon icon="solar:upload-bold-duotone" className="me-2 text-sm" />
                  Upload / Manage
                </Link>
              </div>
              <div className="p-6">
                {reviewTemplatesData.length === 0 ? (
                  <div className="text-center py-8 text-default-400">
                    <IconifyIcon icon="solar:document-text-bold-duotone" className="text-4xl mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No review cycles yet.</p>
                    <Link to="/performance-review-management" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                      Create a review cycle →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {reviewTemplatesData.map(template => <div key={template.name} className="cursor-pointer rounded-xl border border-default-100 p-4 transition-all hover:border-primary/30">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${template.tone}`}>
                          <IconifyIcon icon={template.icon} className="text-lg" />
                        </div>
                        <span className="rounded bg-default-100 px-2 py-0.5 text-[10px] font-bold uppercase">{template.tag}</span>
                      </div>
                      <h4 className="text-sm font-bold text-default-900">{template.name}</h4>
                      <p className="mt-1 text-xs text-default-500">{template.audience}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[10px] italic text-default-400">{template.age}</span>
                        <Link to="/performance-review-management" className="text-xs font-bold text-primary">Manage →</Link>
                      </div>
                    </div>)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-default-200 bg-card p-6">
              <h2 className="mb-4 text-lg font-bold text-default-900">User Creation & Actions</h2>
              <div className="space-y-3">
                {quickActionsData.map(action => <button key={action.title} type="button" className="group flex w-full items-center gap-3 rounded-xl border border-default-100 p-3 transition-all hover:border-primary/20 hover:bg-primary/5">
                    <IconifyIcon icon={action.icon} className="text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-default-900">{action.title}</p>
                      <p className="text-[10px] text-default-500">{action.subtitle}</p>
                    </div>
                  </button>)}
              </div>
            </div>

            <div className="rounded-xl border border-default-200 bg-card p-6">
              <h2 className="mb-4 text-lg font-bold text-default-900">Pending Bio Data</h2>
              <div className="space-y-4">
                {pendingBioData.map(person => <div key={person.name} className="flex items-center gap-3">
                    <img src={person.avatar} alt={person.name} className="h-10 w-10 shrink-0 rounded-full bg-default-200 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-default-900">{person.name}</p>
                      <p className={`truncate text-[10px] uppercase font-bold tracking-tight ${person.cta === 'Verify' ? 'text-success' : 'text-warning'}`}>{person.status}</p>
                    </div>
                    {person.cta === 'Verify' ? <button type="button" className="rounded bg-primary px-2 py-1 text-[10px] font-bold text-white">
                        Verify
                      </button> : <button type="button" className="rounded-lg p-1.5 text-primary hover:bg-primary/10">
                        <IconifyIcon icon="solar:letter-linear" className="text-sm" />
                      </button>}
                  </div>)}
              </div>
            </div>

            
          </div>
        </div>
      </main>
    </>;
};

export default Index;