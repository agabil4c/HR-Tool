import { useEffect, useMemo, useState } from 'react';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';
import { getAuthSession } from '@/utils/auth';
import { LuChevronLeft, LuChevronRight, LuDownload, LuInfo, LuPencil, LuSearch, LuX, LuCalendarDays } from 'react-icons/lu';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const leaveTypeStyle = {
  'Medical Leave':  { color: 'bg-rose-100 text-rose-600',    icon: 'solar:health-bold-duotone' },
  'Casual Leave':   { color: 'bg-amber-100 text-amber-600',  icon: 'solar:sun-bold-duotone' },
  'Sick Leave':     { color: 'bg-blue-100 text-blue-600',    icon: 'solar:bedside-table-bold-duotone' },
  'Annual Leave':   { color: 'bg-violet-100 text-violet-600', icon: 'solar:calendar-bold-duotone' },
  'Study Leave':    { color: 'bg-teal-100 text-teal-600',    icon: 'solar:book-bold-duotone' },
};

const statusClass = {
  Approved: 'inline-flex items-center gap-x-1.5 py-0.5 px-2.5 rounded text-xs font-medium bg-success/15 text-success',
  Pending: 'inline-flex items-center gap-x-1.5 py-0.5 px-2.5 rounded text-xs font-medium bg-warning/15 text-warning',
  Declined: 'inline-flex items-center gap-x-1.5 py-0.5 px-2.5 rounded text-xs font-medium bg-danger/10 text-danger'
};

const parseIsoDate = isoStr => {
  if (!isoStr) return null;
  const [year, month, day] = isoStr.split('-').map(Number);
  return { year, month, day };
};

const draftToRow = draft => {
  const from = parseIsoDate(draft.fromDate);
  const to = parseIsoDate(draft.toDate);
  return {
    id: draft.id,
    fromDate: draft.fromDate,
    toDate: draft.toDate,
    startDay: from?.day ?? 1,
    endDay: to?.day ?? 1,
    month: from?.month ?? 1,
    year: from?.year ?? new Date().getFullYear(),
    daysCount: draft.days,
    type: draft.leaveType || 'Annual Leave',
  };
};

const formatDisplayDate = (day, month, year) => {
  const monthLabel = monthLabels[month - 1] || '';
  return `${monthLabel.slice(0, 3)} ${String(day).padStart(2, '0')}, ${year}`;
};

const toIsoDate = (day, month, year) => {
  const monthPart = String(month).padStart(2, '0');
  const dayPart = String(day).padStart(2, '0');
  return `${year}-${monthPart}-${dayPart}`;
};

const isHandoverPromptDue = leave => {
  if (!leave || leave.status !== 'Approved' || leave.handoverReport) {
    return false;
  }

  if (!leave.fromDate) {
    return false;
  }

  const start = new Date(`${leave.fromDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    return false;
  }

  const due = new Date(start);
  due.setDate(due.getDate() - 1);

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return todayMidnight >= due;
};

const Index = () => {
  const session = getAuthSession();
  const currentUserName = (session?.fullName || '').trim().toLowerCase();
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth() + 1);
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [calendarCells, setCalendarCells] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [selectedDays, setSelectedDays] = useState(new Set());
  const [draftRows, setDraftRows] = useState([]);
  const [standInOptions, setStandInOptions] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({ initialDays: 0, usedDays: 0, remainingDays: 0 });
  // per-row submit modal
  const [submitModal, setSubmitModal] = useState(null); // { row, leaveType, standIn, reason, submitting }
  // edit modal state for pending leaves
  const [editLeave, setEditLeave] = useState(null); // { id, leaveType, reason, standIn }
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [draftError, setDraftError] = useState(null);
  const [handoverModal, setHandoverModal] = useState(null); // { leaveId, fromDate, toDate, standIn, report, submitting, error }

  const reloadBalance = async () => {
    try {
      const balance = await hrApi.getLeaveBalance();
      setLeaveBalance(balance);
    } catch (error) {
      console.error('Failed to load leave balance', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadLeaves = async () => {
      try {
        const [leaves, drafts, standIns, balance] = await Promise.all([
          hrApi.getLeavePlannerLeaves(),
          hrApi.getDraftLeaves(),
          hrApi.getStandInOptions(),
          hrApi.getLeaveBalance(),
        ]);

        if (!isMounted) {
          return;
        }

        setLeavesData(leaves);
        setDraftRows(drafts.map(draftToRow));
        setStandInOptions(standIns);
        setLeaveBalance(balance);
      } catch (error) {
        console.error('Failed to load leave planner data', error);
      }
    };

    loadLeaves();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCalendarCells = async () => {
      try {
        const cells = await hrApi.getLeavePlannerCalendarCells({
          year: visibleYear,
          month: visibleMonth
        });

        if (!isMounted) {
          return;
        }

        setCalendarCells(cells);
        setSelectedDays(new Set());
      } catch (error) {
        console.error('Failed to load leave planner calendar cells', error);
      }
    };

    loadCalendarCells();

    return () => {
      isMounted = false;
    };
  }, [visibleMonth, visibleYear]);

  useEffect(() => {
    if (!currentUserName || handoverModal) {
      return;
    }

    const dueLeave = leavesData.find(leave => {
      const owner = (leave.employeeName || '').trim().toLowerCase();
      return owner === currentUserName && isHandoverPromptDue(leave);
    });

    if (dueLeave) {
      setHandoverModal({
        leaveId: dueLeave.id,
        fromDate: dueLeave.fromDate || dueLeave.from,
        toDate: dueLeave.toDate || dueLeave.to,
        standIn: dueLeave.standIn || '',
        report: '',
        submitting: false,
        error: '',
      });
    }
  }, [leavesData, currentUserName, handoverModal]);

  const unavailableDays = useMemo(() => new Set(calendarCells.filter(cell => cell.unavailable).map(cell => cell.day)), [calendarCells]);

  const sortedSelectedDays = useMemo(() => Array.from(selectedDays).sort((a, b) => a - b), [selectedDays]);

  const selectedWorkingDays = sortedSelectedDays.length;
  const selectedRangeLabel = sortedSelectedDays.length > 0 ? `${formatDisplayDate(sortedSelectedDays[0], visibleMonth, visibleYear)} - ${formatDisplayDate(sortedSelectedDays[sortedSelectedDays.length - 1], visibleMonth, visibleYear)}` : 'None';

  const toggleDay = day => {
    if (unavailableDays.has(day)) {
      return;
    }

    setSelectedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const reloadCalendar = async () => {
    try {
      const cells = await hrApi.getLeavePlannerCalendarCells({ year: visibleYear, month: visibleMonth });
      setCalendarCells(cells);
    } catch (error) {
      console.error('Failed to reload calendar cells', error);
    }
  };

  const addSelectionToDraft = async () => {
    if (sortedSelectedDays.length === 0) {
      return;
    }

    const fromDate = toIsoDate(sortedSelectedDays[0], visibleMonth, visibleYear);
    const toDate = toIsoDate(sortedSelectedDays[sortedSelectedDays.length - 1], visibleMonth, visibleYear);

    setDraftError(null);
    try {
      const draft = await hrApi.createDraftLeave({ fromDate, toDate, leaveType: 'Annual Leave' });
      setDraftRows(prev => [...prev, draftToRow(draft)]);
      setSelectedDays(new Set());
      await reloadCalendar();
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.message || 'Failed to save draft';
      setDraftError(msg);
    }
  };

  const openSubmitModal = row => {
    setSubmitModal({ row, leaveType: row.type || 'Annual Leave', standIn: '', reason: '', submitting: false });
  };

  const handleModalSubmit = async () => {
    if (!submitModal) return;
    setSubmitModal(prev => ({ ...prev, submitting: true }));
    try {
      await hrApi.submitLeaveApplication(submitModal.row.id, {
        leaveType: submitModal.leaveType,
        standIn: submitModal.standIn,
        reason: submitModal.reason,
      });
      const [leaves, cells] = await Promise.all([
        hrApi.getLeavePlannerLeaves(),
        hrApi.getLeavePlannerCalendarCells({ year: visibleYear, month: visibleMonth }),
      ]);
      setLeavesData(leaves);
      setCalendarCells(cells);
      setDraftRows(prev => prev.filter(r => r.id !== submitModal.row.id));
      setSubmitModal(null);
      void reloadBalance();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to submit';
      setSubmitModal(prev => ({ ...prev, submitting: false, error: msg }));
    }
  };

  const removeDraftRow = async id => {
    try {
      await hrApi.deleteDraftLeave(id);
    } catch (error) {
      console.error('Failed to delete draft', error);
    }
    setDraftRows(prev => prev.filter(row => row.id !== id));
    await reloadCalendar();
  };

  const cancelLeave = async leaveId => {
    try {
      await hrApi.cancelLeavePlannerLeave(leaveId);
      const leaves = await hrApi.getLeavePlannerLeaves();
      setLeavesData(leaves);
      void reloadBalance();
    } catch (error) {
      console.error('Failed to cancel leave application', error);
    }
  };

  const openEditLeave = leave => {
    setEditLeave({ id: leave.id, leaveType: leave.leaveType, reason: leave.reason, standIn: leave.standIn || '', error: null });
  };

  const handleEditSave = async () => {
    if (!editLeave) return;
    setEditSubmitting(true);
    try {
      await hrApi.updatePendingLeave(editLeave.id, {
        leaveType: editLeave.leaveType,
        reason: editLeave.reason,
        standIn: editLeave.standIn,
      });
      const leaves = await hrApi.getLeavePlannerLeaves();
      setLeavesData(leaves);
      setEditLeave(null);
      void reloadBalance();
    } catch (error) {
      console.error('Failed to update leave application', error);
      const msg = error?.response?.data?.detail || error?.message || 'Failed to update leave application';
      setEditLeave(prev => ({ ...prev, error: msg }));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeletePending = async leaveId => {
    try {
      await hrApi.deletePendingLeave(leaveId);
      const leaves = await hrApi.getLeavePlannerLeaves();
      setLeavesData(leaves);
      const cells = await hrApi.getLeavePlannerCalendarCells({ year: visibleYear, month: visibleMonth });
      setCalendarCells(cells);
      void reloadBalance();
    } catch (error) {
      console.error('Failed to delete leave application', error);
    }
  };

  const openHandoverModal = leave => {
    setHandoverModal({
      leaveId: leave.id,
      fromDate: leave.fromDate || leave.from,
      toDate: leave.toDate || leave.to,
      standIn: leave.standIn || '',
      report: leave.handoverReport || '',
      submitting: false,
      error: '',
    });
  };

  const handleHandoverSubmit = async () => {
    if (!handoverModal || !handoverModal.report.trim()) {
      setHandoverModal(prev => prev ? { ...prev, error: 'Please enter your hand-over report before submitting.' } : prev);
      return;
    }

    setHandoverModal(prev => ({ ...prev, submitting: true, error: '' }));
    try {
      const updated = await hrApi.submitLeaveHandoverReport(handoverModal.leaveId, {
        report: handoverModal.report.trim(),
      });
      setLeavesData(prev => prev.map(row => row.id === updated.id ? { ...row, ...updated } : row));
      setHandoverModal(null);
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.message || 'Failed to submit hand-over report';
      setHandoverModal(prev => ({ ...prev, submitting: false, error: msg }));
    }
  };

  const totalDraftDays = useMemo(() => draftRows.reduce((sum, row) => sum + (row.daysCount || (row.endDay - row.startDay + 1)), 0), [draftRows]);

  return <>
      <PageMeta title="Leave Calendar" />
      <main className="font-display">
        {/* Breadcrumbs */}
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-default-500">
          <span className="hover:text-primary cursor-pointer">Home</span>
          <IconifyIcon icon="solar:alt-arrow-right-outline" className="text-xs" />
          <span className="text-default-900">Leave Management</span>
        </div>

        {/* Header */}
        <div className="mt-4 mb-8 flex flex-wrap justify-between items-end gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-default-900">Leave Calendar</h1>
            <p className="text-lg text-default-600">Click and drag to select dates. Greyed dates indicate team unavailability.</p>
          </div>
          <button type="button" className="flex items-center justify-center h-11 px-6 rounded-lg bg-primary text-white text-sm font-bold tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <IconifyIcon icon="solar:document-text-outline" className="me-2" />
            View Policy
          </button>
        </div>

        {/* Balance Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="bg-card flex flex-col gap-2 rounded-xl p-6 border border-default-200 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-default-500 text-sm font-semibold uppercase tracking-wider">Total Entitlement</p>
              <IconifyIcon icon="solar:box-minimalistic-outline" className="text-primary/40" />
            </div>
            <p className="text-default-900 text-3xl font-bold">{leaveBalance?.initialDays ?? 0} Days</p>
            <p className="text-default-400 text-sm">Annual quota for {new Date().getFullYear()}</p>
          </div>

          <div className="bg-card flex flex-col gap-2 rounded-xl p-6 border border-default-200 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-default-500 text-sm font-semibold uppercase tracking-wider">Leave Taken</p>
              <IconifyIcon icon="solar:check-circle-bold" className="text-success/40" />
            </div>
            <p className="text-default-900 text-3xl font-bold">{leaveBalance?.usedDays ?? 0} Days</p>
            <p className="text-success text-sm font-medium flex items-center gap-1">
              <IconifyIcon icon="solar:arrow-up-outline" className="text-xs" /> Approved &amp; Processed
            </p>
          </div>

          <div className="bg-card flex flex-col gap-2 rounded-xl p-6 border border-primary/30 ring-2 ring-primary/5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-primary text-sm font-semibold uppercase tracking-wider">Pending Balance</p>
              <IconifyIcon icon="solar:clipboard-check-outline" className="text-primary" />
            </div>
            <p className="text-default-900 text-3xl font-bold">{leaveBalance?.remainingDays ?? 0} Days</p>
            <p className="text-default-500 text-sm">Excluding {totalDraftDays} days in draft</p>
          </div>
        </div>

        {/* Quick Guide Banner */}
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-4 bg-primary/5 border border-primary/10 rounded-xl px-5 py-4">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconifyIcon icon="solar:cursor-bold-duotone" className="text-primary text-[20px]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-default-900 mb-0.5">Select a Date Range</p>
              <p className="text-xs text-default-500">Click individual days on the calendar to select them, then hit <strong>Apply Selection</strong> to add to your draft.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-primary/5 border border-primary/10 rounded-xl px-5 py-4">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconifyIcon icon="solar:users-group-rounded-bold-duotone" className="text-primary text-[20px]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-default-900 mb-0.5">Team Availability</p>
              <p className="text-xs text-default-500">Days marked amber are your saved drafts. Days in rose indicate a team member is already on leave — same-department clashes are blocked at submission.</p>
            </div>
          </div>
        </div>

        {/* Main Content Area: Calendar & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 mb-5 gap-8 items-start">
          {/* Calendar Section */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-default-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-default-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-default-900">{monthLabels[visibleMonth - 1]} {visibleYear}</h3>
                <div className="flex gap-1">
                  <button type="button" onClick={() => {
                  if (visibleMonth === 1) {
                    setVisibleMonth(12);
                    setVisibleYear(year => year - 1);
                  } else {
                    setVisibleMonth(month => month - 1);
                  }
                }} className="p-1 hover:bg-default-100 rounded transition-colors">
                    <IconifyIcon icon="solar:alt-arrow-left-outline" />
                  </button>
                  <button type="button" onClick={() => {
                  if (visibleMonth === 12) {
                    setVisibleMonth(1);
                    setVisibleYear(year => year + 1);
                  } else {
                    setVisibleMonth(month => month + 1);
                  }
                }} className="p-1 hover:bg-default-100 rounded transition-colors">
                    <IconifyIcon icon="solar:alt-arrow-right-outline" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-300"></span>
                  <span className="text-default-600">Your Draft</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-warning/60"></span>
                  <span className="text-default-600">Pending</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-300"></span>
                  <span className="text-default-600">Team Away</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  <span className="text-default-600">Selected</span>
                </div>
              </div>
            </div>

            {/* Interactive Calendar Grid */}
            <div className="p-4">
              <div className="grid grid-cols-7 text-center mb-2">
                {weekDays.map((day, idx) => <div key={day} className={`py-2 text-xs font-bold uppercase ${idx >= 5 ? 'text-primary/60' : 'text-default-400'}`}>
                    {day}
                  </div>)}
              </div>
              <div className="grid grid-cols-7 gap-2z bg-default-100 border border-default-100 rounded-lg overflow-hidden">
                {calendarCells.map((cell, index) => {
                const isSelected = selectedDays.has(cell.day) && !cell.outside;
                const isUnavailable = cell.unavailable;
                const isWeekend = cell.weekend;
                const hasEvents = Array.isArray(cell.events) && cell.events.length > 0;
                const canSelect = !cell.outside && !isUnavailable && !isWeekend;
                let cellClass = 'bg-card h-8 p-1.5 group relative';
                if (cell.outside) {
                  cellClass += ' text-default-400';
                } else if (isWeekend) {
                  cellClass += ' bg-default-50 text-default-400';
                } else if (cell.draftBlock) {
                  cellClass += ' bg-amber-50';
                } else if (cell.pendingBlock) {
                  cellClass += ' bg-orange-50';
                } else if (cell.teamAway) {
                  cellClass += ' bg-rose-50';
                } else if (isUnavailable) {
                  cellClass += ' bg-default-100';
                } else if (isSelected) {
                  cellClass += ' cursor-pointer bg-primary/10';
                } else {
                  cellClass += ' cursor-pointer hover:bg-default-50';
                }
                return <div key={`${cell.day}-${index}`} onClick={() => canSelect && toggleDay(cell.day)} className={cellClass} title={[...(cell.holidayNames || []), ...(cell.events || [])].join(' | ')}>
                    {isSelected && !cell.outside && <div className="absolute inset-0 bg-primary/20 border-y border-primary/40" style={{
                    borderLeftWidth: index % 7 === 0 || !selectedDays.has(calendarCells[index - 1]?.day) ? '1px' : '0',
                    borderRightWidth: index % 7 === 6 || !selectedDays.has(calendarCells[index + 1]?.day) ? '1px' : '0'
                  }}></div>}
                    <span className={`relative z-10 ${isSelected ? 'text-primary font-bold' : cell.draftBlock ? 'text-amber-600 font-semibold' : cell.pendingBlock ? 'text-orange-600 font-semibold' : cell.teamAway ? 'text-rose-500' : cell.outside || isWeekend || isUnavailable ? 'text-default-400' : 'text-default-900'}`}>
                      {cell.day}
                    </span>
                    {hasEvents && !cell.outside && <span className="absolute bottom-1 right-1 inline-flex h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true"></span>}
                    {cell.draftBlock && !cell.outside && <span className="absolute bottom-1 left-1 inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true"></span>}
                    {cell.pendingBlock && !cell.outside && <span className="absolute bottom-1 left-1 inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" aria-hidden="true"></span>}
                    {cell.badge && <div className="absolute inset-0 bg-default-900/5 flex items-center justify-center">
                        <span className="text-[10px] bg-white px-1 rounded shadow-sm text-default-600 font-bold z-10">
                          {cell.badge}
                        </span>
                      </div>}
                  </div>;
              })}
              </div>
            </div>

            <div className="p-6 bg-default-50 flex items-center justify-between border-t border-default-200">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <IconifyIcon icon="solar:info-circle-bold" className="text-primary" />
                  <span className="text-sm text-default-600">
                    Selected: <strong>{selectedRangeLabel}</strong> ({selectedWorkingDays} Working Days)
                  </span>
                </div>
                {draftError && (
                  <p className="text-xs text-danger flex items-center gap-1">
                    <IconifyIcon icon="solar:danger-triangle-bold" className="text-sm" />
                    {draftError}
                  </p>
                )}
              </div>
              <button type="button" onClick={addSelectionToDraft} disabled={selectedWorkingDays === 0} className="bg-primary text-white px-8 py-2.5 rounded-lg font-bold text-sm shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100">
                <IconifyIcon icon="solar:add-circle-outline" className="text-[20px]" />
                Apply Selection
              </button>
            </div>
          </div>

          {/* Side Application Drafts */}
          <div className="flex flex-col gap-6">
            <div className="bg-card rounded-xl border border-default-200 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-5 border-b border-default-200 flex items-center justify-between">
                <h3 className="font-bold text-default-900">Draft Leave Table</h3>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">{draftRows.length} Item{draftRows.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-default-50 text-default-500 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="px-5 py-3">Date Range</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default-100">
                    {draftRows.length > 0 ? draftRows.map(row => (
                      <tr
                        key={row.id}
                        className="group hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => openSubmitModal(row)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-default-900 group-hover:text-primary transition-colors">
                              {formatDisplayDate(row.startDay, row.month, row.year)}
                              {row.startDay !== row.endDay || row.month !== row.month ? ` – ${formatDisplayDate(row.endDay, row.month, row.year)}` : ''}
                            </span>
                            <span className="text-xs text-default-400">{row.daysCount || (row.endDay - row.startDay + 1)} working day{(row.daysCount || (row.endDay - row.startDay + 1)) !== 1 ? 's' : ''} · click to submit</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              title="Submit this leave"
                              onClick={() => openSubmitModal(row)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
                            >
                              <IconifyIcon icon="solar:check-circle-outline" className="text-base" />
                              Submit
                            </button>
                            <button
                              type="button"
                              title="Remove draft"
                              onClick={() => removeDraftRow(row.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-danger/10 text-default-400 hover:text-danger transition-colors"
                            >
                              <IconifyIcon icon="solar:trash-bin-trash-outline" className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="2" className="px-5 py-12 text-center text-default-400">
                          <IconifyIcon icon="solar:calendar-search-outline" className="text-4xl mb-2 opacity-20" />
                          <p className="text-xs">
                            Select dates on the calendar<br />to add to draft
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-5 bg-default-50 border-t border-default-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-default-500">Total draft days</span>
                  <span className="font-bold text-default-900">{totalDraftDays} Day{totalDraftDays !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-[10px] text-default-400 mt-2 text-center">Click a date range above to select the leave type, stand-in, and submit for manager approval.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Leave Applications Table */}
        <div className="bg-card rounded-xl border border-default-200 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-5 border-b border-default-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-default-900">Leave Applications</h3>
              <p className="text-xs text-default-500 mt-0.5">All leave requests submitted for manager approval</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input type="text" className="ps-9 pe-4 py-2 text-sm rounded-lg border border-default-200 bg-default-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 w-52 placeholder:text-default-400" placeholder="Search applications..." />
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-default-400" />
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
                <LuDownload className="size-4" /> Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-default-50 border-b border-default-200 text-[11px] font-bold uppercase tracking-wider text-default-400">
                  <th className="px-6 py-3.5 text-start">Application</th>
                  <th className="px-6 py-3.5 text-start">Date Range</th>
                  <th className="px-6 py-3.5 text-start">Duration</th>
                  <th className="px-6 py-3.5 text-start">Submitted To</th>
                  <th className="px-6 py-3.5 text-start">Submitted On</th>
                  <th className="px-6 py-3.5 text-start">Hand-over Report</th>
                  <th className="px-6 py-3.5 text-start">Status</th>
                  <th className="px-6 py-3.5 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-100">
                {leavesData.map(leave => {
                  const typeStyle = leaveTypeStyle[leave.leaveType] ?? { color: 'bg-default-100 text-default-600', icon: 'solar:calendar-bold-duotone' };
                  return (
                    <tr key={leave.id} className="hover:bg-default-50/60 transition-colors group">
                      {/* Application */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${typeStyle.color.replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                            <IconifyIcon icon={typeStyle.icon} className="text-[18px]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-default-900 whitespace-nowrap">{leave.leaveType}</p>
                            <p className="text-xs text-default-400 mt-0.5">{leave.reason}</p>
                          </div>
                        </div>
                      </td>
                      {/* Date Range */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-default-700 whitespace-nowrap">
                          <LuCalendarDays className="size-3.5 text-default-400 shrink-0" />
                          <span>{leave.from}</span>
                          {leave.from !== leave.to && <><span className="text-default-300">→</span><span>{leave.to}</span></>}
                        </div>
                      </td>
                      {/* Duration */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-default-100 text-default-700 text-xs font-semibold">
                          {leave.days} {leave.days === 1 ? 'Day' : 'Days'}
                        </span>
                      </td>
                      {/* Submitted To */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {leave.reviewer.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm text-default-700 whitespace-nowrap">{leave.reviewer}</span>
                        </div>
                      </td>
                      {/* Submitted On */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-default-500 whitespace-nowrap">{leave.submittedOn}</span>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        {leave.handoverReport ? (
                          <div>
                            <p className="text-sm text-default-700 line-clamp-2">{leave.handoverReport}</p>
                            {leave.handoverSubmittedOn && <p className="text-xs text-default-400 mt-0.5">Submitted: {leave.handoverSubmittedOn}</p>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-default-400">Not submitted</span>
                            {((leave.employeeName || '').trim().toLowerCase() === currentUserName) && isHandoverPromptDue(leave) && (
                              <button
                                type="button"
                                onClick={() => openHandoverModal(leave)}
                                className="text-xs font-semibold px-2 py-1 rounded bg-warning/20 text-warning hover:bg-warning/30 transition-colors"
                              >
                                Submit now
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={statusClass[leave.status]}>{leave.status}</span>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {leave.status === 'Pending' && (
                            <button type="button" title="Edit" onClick={() => openEditLeave(leave)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-default-100 hover:bg-default-200 text-default-500 hover:text-default-700 transition-colors">
                              <LuPencil className="size-3.5" />
                            </button>
                          )}
                          {leave.status === 'Pending' && (
                            <button type="button" title="Delete" onClick={() => handleDeletePending(leave.id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-danger/10 hover:bg-danger/20 text-danger transition-colors">
                              <LuX className="size-3.5" />
                            </button>
                          )}
                          {(leave.status === 'Approved' && (leave.employeeName || '').trim().toLowerCase() === currentUserName) && (
                            <button type="button" title="Submit hand-over report" onClick={() => openHandoverModal(leave)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-warning/10 hover:bg-warning/20 text-warning transition-colors">
                              <IconifyIcon icon="solar:notes-outline" className="text-base" />
                            </button>
                          )}
                          <button type="button" title="View Details" className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                            <LuInfo className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-default-200 bg-default-50 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-default-500">
              Showing <span className="font-semibold text-default-700">{leavesData.length}</span> of <span className="font-semibold text-default-700">17</span> applications
            </p>
            <nav className="flex items-center gap-1.5">
              <button type="button" className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors">
                <LuChevronLeft className="size-4" /> Prev
              </button>
              {[1, 2, 3].map(p => (
                <button key={p} type="button" className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${
                  p === 2 ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'border border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/20'
                }`}>{p}</button>
              ))}
              <button type="button" className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors">
                Next <LuChevronRight className="size-4" />
              </button>
            </nav>
          </div>
        </div>
      </main>

      {/* Submit Draft Modal */}
      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !submitModal.submitting && setSubmitModal(null)}>
          <div className="bg-white dark:bg-default-100 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-default-900">Submit Leave Application</h3>
                <p className="text-xs text-default-500 mt-0.5">
                  {formatDisplayDate(submitModal.row.startDay, submitModal.row.month, submitModal.row.year)}
                  {' – '}
                  {formatDisplayDate(submitModal.row.endDay, submitModal.row.month, submitModal.row.year)}
                  {' · '}
                  <strong>{submitModal.row.daysCount || (submitModal.row.endDay - submitModal.row.startDay + 1)} day{(submitModal.row.daysCount || (submitModal.row.endDay - submitModal.row.startDay + 1)) !== 1 ? 's' : ''}</strong>
                </p>
              </div>
              <button type="button" onClick={() => setSubmitModal(null)} disabled={submitModal.submitting} className="text-default-400 hover:text-default-600 transition-colors">
                <LuX className="size-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Leave Type */}
              <div>
                <label className="block text-xs font-semibold text-default-500 uppercase tracking-wider mb-1.5">Leave Type</label>
                <select
                  value={submitModal.leaveType}
                  onChange={e => setSubmitModal(prev => ({ ...prev, leaveType: e.target.value }))}
                  className="w-full border border-default-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Medical Leave</option>
                  <option>Study Leave</option>
                  <option>Casual Leave</option>
                </select>
              </div>

              {/* Stand-in */}
              {standInOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-default-500 uppercase tracking-wider mb-1.5">
                    Stand-in Colleague <span className="text-default-400 normal-case font-normal">(recommended)</span>
                  </label>
                  <select
                    value={submitModal.standIn}
                    onChange={e => setSubmitModal(prev => ({ ...prev, standIn: e.target.value }))}
                    className="w-full border border-default-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— No stand-in —</option>
                    {standInOptions.map(opt => (
                      <option key={opt.id} value={opt.fullName}>{opt.fullName} · {opt.role}{opt.department ? ` (${opt.department})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-default-500 uppercase tracking-wider mb-1.5">Reason <span className="text-default-400 normal-case font-normal">(optional)</span></label>
                <textarea
                  rows={3}
                  value={submitModal.reason}
                  onChange={e => setSubmitModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full border border-default-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Brief reason for your leave…"
                />
              </div>

              {/* Error */}
              {submitModal.error && (
                <p className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">{submitModal.error}</p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleModalSubmit}
                disabled={submitModal.submitting}
                className="flex-1 bg-primary text-white py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {submitModal.submitting ? (
                  <><IconifyIcon icon="solar:refresh-circle-outline" className="animate-spin text-base" /> Submitting…</>
                ) : (
                  <><IconifyIcon icon="solar:check-circle-bold" className="text-base" /> Submit for Approval</>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSubmitModal(null)}
                disabled={submitModal.submitting}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-default-100 hover:bg-default-200 text-default-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pending Leave Modal */}
      {editLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditLeave(null)}>
          <div className="bg-white dark:bg-default-100 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-default-900 mb-5">Edit Leave Application</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-default-500 uppercase tracking-wider mb-1.5">Leave Type</label>
                <select
                  value={editLeave.leaveType}
                  onChange={e => setEditLeave(prev => ({ ...prev, leaveType: e.target.value }))}
                  className="w-full border border-default-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Study Leave</option>
                  <option>Medical Leave</option>
                  <option>Casual Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-default-500 uppercase tracking-wider mb-1.5">Reason</label>
                <textarea
                  rows={3}
                  value={editLeave.reason}
                  onChange={e => setEditLeave(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full border border-default-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Reason for leave..."
                />
              </div>
              {standInOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-default-500 uppercase tracking-wider mb-1.5">Stand-in Colleague</label>
                  <select
                    value={editLeave.standIn}
                    onChange={e => setEditLeave(prev => ({ ...prev, standIn: e.target.value }))}
                    className="w-full border border-default-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— None —</option>
                    {standInOptions.map(opt => (
                      <option key={opt.id} value={opt.fullName}>{opt.fullName} ({opt.role})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {editLeave.error && (
              <p className="mt-4 text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">{editLeave.error}</p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleEditSave}
                disabled={editSubmitting}
                className="flex-1 bg-primary text-white py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {editSubmitting ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditLeave(null)}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-default-100 hover:bg-default-200 text-default-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hand-over Report Modal */}
      {handoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !handoverModal.submitting && setHandoverModal(null)}>
          <div className="bg-white dark:bg-default-100 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-default-900">Hand-over Report</h3>
                <p className="text-xs text-default-500 mt-0.5">
                  Leave period: <strong>{handoverModal.fromDate}</strong> to <strong>{handoverModal.toDate}</strong>
                </p>
              </div>
              <button type="button" onClick={() => setHandoverModal(null)} disabled={handoverModal.submitting} className="text-default-400 hover:text-default-600 transition-colors">
                <LuX className="size-5" />
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-default-700">
              Please submit this report at least one day before your approved leave starts.
              {handoverModal.standIn && <span> It will be shared with <strong>{handoverModal.standIn}</strong>.</span>}
            </div>

            <label className="block text-xs font-semibold text-default-500 uppercase tracking-wider mb-1.5">Report Details</label>
            <textarea
              rows={8}
              value={handoverModal.report}
              onChange={e => setHandoverModal(prev => ({ ...prev, report: e.target.value, error: '' }))}
              className="w-full border border-default-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              placeholder="List outstanding tasks, active hand-offs, key contacts, pending approvals, and any urgent follow-up items."
            />

            {handoverModal.error && <p className="mt-3 text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">{handoverModal.error}</p>}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleHandoverSubmit}
                disabled={handoverModal.submitting}
                className="flex-1 bg-primary text-white py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {handoverModal.submitting ? 'Submitting…' : 'Submit Hand-over Report'}
              </button>
              <button
                type="button"
                onClick={() => setHandoverModal(null)}
                disabled={handoverModal.submitting}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-default-100 hover:bg-default-200 text-default-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>;
};

export default Index;
