import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';
import { PermissionButton, PermissionLink } from '@/components/AccessControl';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';
import { getAuthSession } from '@/utils/auth';

const APPROVAL_RULES_STORAGE_KEY = '__HR_TOOL_APPROVAL_RULES__';

const Index = () => {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalDepth, setApprovalDepth] = useState('2');
  const [autoEscalationEnabled, setAutoEscalationEnabled] = useState(true);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [rulesMessage, setRulesMessage] = useState('');
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [calendarCells, setCalendarCells] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');
  const [policyAuditRows, setPolicyAuditRows] = useState([]);
  const [policyAuditError, setPolicyAuditError] = useState('');
  const session = getAuthSession();
  const normalizedRole = String(session?.role || '').toLowerCase();
  const canSetInitialLeaveDays = normalizedRole === 'super-admin' || normalizedRole === 'hr-manager';

  const APPROVAL_LABEL_BY_DEPTH = {
    '1': '1-Step Approval',
    '2': '2-Step Approval',
    '3': '3-Step Approval'
  };

  const loadDepartments = async () => {
    try {
      const data = await hrApi.getDepartments();
      setRows(data || []);
    } catch (error) {
      console.error('Failed to load departments', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartmentCalendar = async (targetDate = calendarDate) => {
    try {
      setCalendarLoading(true);
      setCalendarError('');
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const data = await hrApi.getLeavePlannerCalendarCells({ year, month });
      setCalendarCells(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load department leave calendar', error);
      setCalendarError('Unable to load department leave calendar right now.');
      setCalendarCells([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  const loadPolicyAudit = async () => {
    try {
      setPolicyAuditError('');
      const data = await hrApi.getDepartmentLeavePolicyAudit({ limit: 100 });
      setPolicyAuditRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load leave policy audit history', error);
      setPolicyAuditRows([]);
      setPolicyAuditError('Unable to load leave-policy audit history.');
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(APPROVAL_RULES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.depth && ['1', '2', '3'].includes(parsed.depth)) {
          setApprovalDepth(parsed.depth);
        }
        if (typeof parsed?.autoEscalationEnabled === 'boolean') {
          setAutoEscalationEnabled(parsed.autoEscalationEnabled);
        }
      }
    } catch {
      // Ignore malformed local storage values and continue with defaults.
    }

    let isMounted = true;

    const loadModuleData = async () => {
      try {
        const data = await hrApi.getDepartments();
        if (!isMounted) {
          return;
        }

        setRows(data || []);
        await loadDepartmentCalendar();
        await loadPolicyAudit();
      } catch (error) {
        console.error('Failed to load departments', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadModuleData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void loadDepartmentCalendar(calendarDate);
  }, [calendarDate]);

  useEffect(() => {
    try {
      localStorage.setItem(APPROVAL_RULES_STORAGE_KEY, JSON.stringify({
        depth: approvalDepth,
        autoEscalationEnabled
      }));
    } catch {
      // Ignore storage failures (private mode / restricted browsers).
    }
  }, [approvalDepth, autoEscalationEnabled]);

  const handleDeleteDepartment = async (departmentId) => {
    if (!window.confirm('Delete this department?')) {
      return;
    }

    try {
      await hrApi.deleteDepartment(departmentId);
      await loadDepartments();
    } catch (error) {
      console.error('Failed to delete department', error);
    }
  };

  const handleEditDepartment = async (row) => {
    const nextName = window.prompt('Department name', row.name);
    if (nextName === null || !nextName.trim()) {
      return;
    }

    const nextHead = window.prompt('Department head', row.head || '') ?? row.head;
    const nextStaff = window.prompt('Staff count', String(row.staffCount ?? 0));
    let nextInitialLeaveDays = null;
    if (canSetInitialLeaveDays) {
      nextInitialLeaveDays = window.prompt('Initial leave days per staff in this department', String(row.initialLeaveDays ?? 21));
    }
    const parsedStaff = Number.parseInt(nextStaff || '0', 10);
    const parsedInitialLeaveDays = Number.parseInt(nextInitialLeaveDays || String(row.initialLeaveDays ?? 21), 10);

    const payload = {
      name: nextName.trim(),
      head: nextHead || '',
      staffCount: Number.isNaN(parsedStaff) ? 0 : Math.max(parsedStaff, 0),
      approvalLevel: row.approvalLevel || '1-Step Approval',
      status: row.status || 'Active',
      icon: row.icon,
      iconBg: row.iconBg,
      avatarColor: row.avatarColor
    };

    if (canSetInitialLeaveDays) {
      payload.initialLeaveDays = Number.isNaN(parsedInitialLeaveDays) ? row.initialLeaveDays ?? 21 : Math.max(parsedInitialLeaveDays, 1);
    }

    try {
      await hrApi.updateDepartment(row.id, payload);
      await loadDepartments();
      await loadDepartmentCalendar(calendarDate);
      await loadPolicyAudit();
    } catch (error) {
      console.error('Failed to update department', error);
    }
  };

  const buildWorkflowSteps = () => {
    const steps = [
      {
        label: 'Employee',
        icon: 'solar:user-circle-outline',
        highlighted: false
      },
      {
        label: 'Line Manager',
        icon: 'solar:users-group-rounded-outline',
        highlighted: approvalDepth === '1'
      }
    ];

    if (approvalDepth === '2' || approvalDepth === '3') {
      steps.push({
        label: 'Department Head',
        icon: 'solar:shield-check-outline',
        highlighted: approvalDepth === '2'
      });
    }

    if (approvalDepth === '3') {
      steps.push({
        label: 'HR Approval',
        icon: 'solar:verified-check-outline',
        highlighted: true
      });
    }

    return steps;
  };

  const handleSaveGlobalRules = async () => {
    if (!rows.length) {
      setRulesMessage('No departments found to apply approval rules.');
      return;
    }

    try {
      setIsSavingRules(true);
      setRulesMessage('');
      const approvalLevelLabel = APPROVAL_LABEL_BY_DEPTH[approvalDepth] || '2-Step Approval';

      await Promise.all(rows.map((row) => {
        const payload = {
          name: row.name,
          head: row.head || '',
          staffCount: typeof row.staffCount === 'number' ? row.staffCount : 0,
          approvalLevel: approvalLevelLabel,
          status: row.status || 'Active',
          icon: row.icon,
          iconBg: row.iconBg,
          avatarColor: row.avatarColor
        };
        if (canSetInitialLeaveDays) {
          payload.initialLeaveDays = row.initialLeaveDays ?? 21;
        }
        return hrApi.updateDepartment(row.id, payload);
      }));

      await loadDepartments();
      setRulesMessage(`Saved global rules: ${approvalLevelLabel}${autoEscalationEnabled ? ' with auto-escalation' : ''}.`);
      await loadPolicyAudit();
    } catch (error) {
      console.error('Failed to save global rules', error);
      setRulesMessage('Failed to save global rules. Please try again.');
    } finally {
      setIsSavingRules(false);
    }
  };

  return <>
      <PageMeta title="Departments" />
      <main className="font-display">
        <div className="w-full p-8 flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Department &amp; Hierarchy Management</h1>
              <p className="text-slate-500 dark:text-slate-400">Design organization structure and approval workflows.</p>
            </div>
            <PermissionLink permissionKey="departments" to="/create-department" className="flex h-12 items-center gap-2 rounded-lg bg-primary px-6 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
              <IconifyIcon icon="solar:add-circle-outline" className="text-base" />
              Add New Department
            </PermissionLink>
          </div>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-6 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Departments</h2>
              <div className="flex gap-2">
                <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <IconifyIcon icon="solar:filter-outline" className="text-xl" />
                </button>
                <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <IconifyIcon icon="solar:download-outline" className="text-xl" />
                </button>
              </div>
            </div>

            <div className="@container overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Department Name</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Head of Department</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Total Staff</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Initial Leave Days</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Approval Level</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading && <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">Loading departments...</td>
                    </tr>}
                  {rows.map(row => <tr key={row.name} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded flex items-center justify-center ${row.iconBg}`}>
                            <IconifyIcon icon={row.icon} className="text-sm" />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`size-6 rounded-full ${row.avatarColor}`} />
                          <span className="text-sm font-medium">{row.head}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{typeof row.staffCount === 'number' ? `${row.staffCount} Employees` : row.staff || '0 Employees'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{row.initialLeaveDays ?? 21} days</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                          <IconifyIcon icon="solar:double-alt-arrow-right-outline" className="text-sm" />
                          <span>{row.approvalLevel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">{row.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <PermissionButton permissionKey="departments" type="button" onClick={() => void handleEditDepartment(row)} className="text-sm font-bold text-primary hover:text-primary/80">Edit</PermissionButton>
                          <PermissionButton permissionKey="departments" type="button" onClick={() => void handleDeleteDepartment(row.id)} className="text-sm font-bold text-danger hover:text-danger/80">Delete</PermissionButton>
                        </div>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
            {!canSetInitialLeaveDays && <div className="border-t border-slate-200 px-6 py-3 text-xs text-slate-500 dark:border-slate-800">
                Only Super Admin and HR Manager can update initial leave days.
              </div>}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Leave-Day Policy Audit History</h2>
                <p className="text-xs text-slate-500">Tracks who changed department initial leave-day settings and when.</p>
              </div>
              <button type="button" onClick={() => void loadPolicyAudit()} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Refresh
              </button>
            </div>

            {policyAuditError && <p className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{policyAuditError}</p>}

            <div className="overflow-x-auto p-6">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800">
                    <th className="py-3 pe-4">Timestamp</th>
                    <th className="py-3 pe-4">Department</th>
                    <th className="py-3 pe-4">Change</th>
                    <th className="py-3 pe-4">Changed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {policyAuditRows.length === 0 && <tr>
                      <td colSpan={4} className="py-6 text-center text-sm text-slate-500">No policy changes recorded yet.</td>
                    </tr>}
                  {policyAuditRows.map(row => <tr key={row.id}>
                      <td className="py-3 pe-4 text-xs text-slate-500">{row.createdAt || '-'}</td>
                      <td className="py-3 pe-4 text-sm font-medium text-slate-800 dark:text-slate-200">{row.departmentName || '-'}</td>
                      <td className="py-3 pe-4 text-sm text-slate-700 dark:text-slate-300">
                        {row.previousDays === null || row.previousDays === undefined ? `Set to ${row.newDays} days` : `${row.previousDays} -> ${row.newDays} days`}
                      </td>
                      <td className="py-3 pe-4 text-sm text-slate-700 dark:text-slate-300">{row.changedByName || 'System'}</td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Department Leave Calendar</h2>
                <p className="text-xs text-slate-500">Shows approved leave days for department members and public holidays.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => {
                const next = new Date(calendarDate);
                next.setMonth(next.getMonth() - 1);
                setCalendarDate(next);
              }}>
                  <IconifyIcon icon="solar:alt-arrow-left-outline" className="text-sm" />
                </button>
                <span className="min-w-[140px] text-center text-sm font-semibold text-slate-700 dark:text-slate-200">{calendarDate.toLocaleString('en-US', {
                month: 'long',
                year: 'numeric'
              })}</span>
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => {
                const next = new Date(calendarDate);
                next.setMonth(next.getMonth() + 1);
                setCalendarDate(next);
              }}>
                  <IconifyIcon icon="solar:alt-arrow-right-outline" className="text-sm" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-red-100" />
                  <span>Public Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-amber-100" />
                  <span>Department Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-blue-100" />
                  <span>Other Event</span>
                </div>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => <div key={day}>{day}</div>)}
              </div>

              {calendarLoading && <p className="py-6 text-center text-sm text-slate-500">Loading calendar...</p>}
              {!calendarLoading && calendarError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{calendarError}</p>}
              {!calendarLoading && !calendarError && <div className="grid grid-cols-7 gap-2">
                  {calendarCells.map((cell, index) => {
                const tooltipParts = [];
                if (Array.isArray(cell.holidayNames) && cell.holidayNames.length) {
                  tooltipParts.push(`Holiday: ${cell.holidayNames.join(', ')}`);
                }
                if (Array.isArray(cell.events) && cell.events.length) {
                  tooltipParts.push(`Leave/Event: ${cell.events.join(', ')}`);
                }
                const title = tooltipParts.join(' | ');

                return <div key={`${cell.day}-${index}`} title={title} className={`flex h-10 items-center justify-center rounded-lg border text-sm font-semibold ${cell.outside ? 'border-transparent text-slate-300' : cell.holidayNames?.length ? 'border-red-200 bg-red-100 text-red-700' : cell.teamAway ? 'border-amber-200 bg-amber-100 text-amber-700' : cell.events?.length ? 'border-blue-200 bg-blue-100 text-blue-700' : cell.weekend ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}>
                        {cell.day}
                      </div>;
              })}
                </div>}
            </div>
          </section>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <IconifyIcon icon="solar:sitemap-outline" className="text-2xl text-primary" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Define Approval Hierarchy</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <h3 className="mb-1 font-bold text-slate-900 dark:text-slate-100">Global Workflow Rules</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Set the default approval chain for leave and expense requests.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Approval Level Depth</label>
                    <select value={approvalDepth} onChange={(event) => setApprovalDepth(event.target.value)} className="form-select rounded-lg border-slate-200 bg-slate-50 text-slate-900 focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      <option value="1">1 Level (Manager Only)</option>
                      <option value="2">2 Levels (Manager -&gt; Dept Head)</option>
                      <option value="3">3 Levels (Manager -&gt; Dept Head -&gt; HR)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Auto-Escalation</label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={autoEscalationEnabled} onChange={(event) => setAutoEscalationEnabled(event.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Escalate to next level after 48 hours of inactivity</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button type="button" disabled={isSavingRules} onClick={() => void handleSaveGlobalRules()} className="h-10 w-full rounded-lg bg-slate-100 font-bold text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                    {isSavingRules ? 'Saving Rules...' : 'Save Global Rules'}
                  </button>
                  {rulesMessage && <p className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-400">{rulesMessage}</p>}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-primary/20 bg-primary/5 p-6 dark:bg-primary/10">
                <h3 className="mb-6 font-bold text-primary">Workflow Preview</h3>

                <div className="w-full max-w-xs space-y-4">
                  {buildWorkflowSteps().map((step, index, collection) => <div key={step.label} className={`flex items-center justify-between rounded-lg border bg-white p-3 dark:bg-slate-800 ${step.highlighted ? 'border-primary shadow-md' : 'border-primary/30'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-full flex items-center justify-center ${step.highlighted ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                          <IconifyIcon icon={step.icon} className={`text-sm ${step.highlighted ? 'text-primary' : 'text-slate-500'}`} />
                        </div>
                        <span className={`text-sm font-bold ${step.highlighted ? 'text-primary' : ''}`}>{step.label}</span>
                      </div>
                      {index < collection.length - 1 ? <IconifyIcon icon="solar:arrow-down-outline" className="text-primary" /> : <IconifyIcon icon="solar:verified-check-outline" className="text-emerald-500" />}
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>;
};

export default Index;
