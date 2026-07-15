import { useEffect, useState } from 'react';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';
import PageMeta from '@/components/PageMeta';
import UpcomingEventsSummary from '@/components/UpcomingEventsSummary';
import avatar2 from '@/assets/images/user/avatar-2.png';
import { hrApi } from '@/services/hrApi';
import { getAuthSession } from '@/utils/auth';

const emptyLeaveBalance = { initialDays: 0, usedDays: 0, remainingDays: 0 };
const emptyMonthlyAttendance = { percentage: null, presentDays: 0, trackedDays: 0, monthYear: '' };
const emptyPerformanceSummary = { averageScore: null, reviewCount: 0, scoredCount: 0, latestScore: null, latestTitle: '' };

const formatReviewDate = value => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatReviewStatus = status => {
  const value = (status || 'submitted').replace(/_/g, ' ');
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const MyProfile = () => {
  const session = getAuthSession();
  const [currentMonth, setCurrentMonth] = useState('');
  const [displayMonth, setDisplayMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());
  const [leaveBalance, setLeaveBalance] = useState(emptyLeaveBalance);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestFields, setRequestFields] = useState([]);
  const [requestNote, setRequestNote] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [monthlyAttendance, setMonthlyAttendance] = useState(emptyMonthlyAttendance);
  const [performanceSummary, setPerformanceSummary] = useState(emptyPerformanceSummary);
  const [reviewScores, setReviewScores] = useState([]);

  const [documents, setDocuments] = useState([]);

  const [calendarDays, setCalendarDays] = useState([]);

  const [employeeId, setEmployeeId] = useState('-');
  const [reportingManager, setReportingManager] = useState('-');
  const [dateOfJoining, setDateOfJoining] = useState('-');
  const [email, setEmail] = useState('-');

  const loadData = async (month = displayMonth, year = displayYear) => {
    try {
      const params = {};
      if (month !== null) params.month = month;
      if (year !== null) params.year = year;
      const data = await hrApi.getModuleData('dashboard', params);

      setCurrentMonth(data.currentMonth || '');
      setAttendanceRecords(data.attendanceRecords || []);
      setMonthlyAttendance(data.monthlyAttendance || emptyMonthlyAttendance);
      setPerformanceSummary(data.performanceSummary || emptyPerformanceSummary);
      setReviewScores(data.reviewScores || []);
      setDocuments(data.documents || []);
      setCalendarDays(data.calendarDays || []);
      setLeaveBalance(data.leaveBalance || emptyLeaveBalance);
      setEmployeeId(data.employeeId || '-');
      setReportingManager(data.reportingManager || '-');
      setDateOfJoining(data.dateOfJoining || '-');
      setEmail(data.email || '-');
    } catch (error) {
      console.error('Failed to load profile module data', error);
    }
  };

  useEffect(() => {
    void loadData(displayMonth, displayYear);
  }, []);

  const handlePreviousMonth = () => {
    let newMonth = displayMonth - 1;
    let newYear = displayYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setDisplayMonth(newMonth);
    setDisplayYear(newYear);
    void loadData(newMonth, newYear);
  };

  const handleNextMonth = () => {
    let newMonth = displayMonth + 1;
    let newYear = displayYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setDisplayMonth(newMonth);
    setDisplayYear(newYear);
    void loadData(newMonth, newYear);
  };

  const attendancePercentage = monthlyAttendance.percentage;
  const attendanceProgressWidth = attendancePercentage == null ? 0 : Math.min(Math.max(attendancePercentage, 0), 100);
  const averageScore = performanceSummary.averageScore;
  const latestScore = performanceSummary.latestScore;

  const profileFieldOptions = [
    'First Name',
    'Last Name',
    'Gender',
    'Date of Birth',
    'Nationality',
    'Marital Status',
    'National ID',
    'Profile Photo',
    'Personal Email',
    'Phone Number',
    'Emergency Contact Name',
    'Emergency Contact Phone',
    'Emergency Contact Relationship',
    'Address Line 1',
    'Address City',
    'Address District',
    'Address Country',
    'Work Location',
    'Bank Account',
    'Account Names',
    'Bank Name',
    'Bank Details',
    'Tax ID',
    'NSSF Number',
    'Other'
  ];

  const toggleRequestField = (fieldLabel) => {
    setRequestError('');
    setRequestSuccess('');
    setRequestFields((current) => current.includes(fieldLabel) ? current.filter((value) => value !== fieldLabel) : [...current, fieldLabel]);
  };

  const handleSubmitProfileUpdateRequest = async () => {
    if (!requestFields.length) {
      setRequestError('Select at least one field to update.');
      return;
    }

    try {
      setIsSubmittingRequest(true);
      setRequestError('');
      setRequestSuccess('');
      await hrApi.submitProfileUpdateRequest({
        requestedFields: requestFields,
        note: requestNote.trim()
      });
      setRequestSuccess('Request sent to HR successfully.');
      setRequestFields([]);
      setRequestNote('');
      setIsRequestModalOpen(false);
    } catch (error) {
      setRequestError(error?.detail || error?.message || 'Failed to submit request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return <>
    <PageMeta title="Dashboard" />
    <main className="font-display p-6">

      {/* Profile Header Card */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <img src={avatar2} alt={session.fullName || 'User'} className="h-24 w-24 rounded-xl object-cover" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{session.fullName || 'User'}</h1>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">ACTIVE</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">{session.accessLevel || 'employee'} • {session.department || 'General'} Department</p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Employee ID</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{employeeId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reporting Manager</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{reportingManager}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date of Joining</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {dateOfJoining && dateOfJoining !== '-' ? new Date(dateOfJoining).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{email}</p>
                </div>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90" onClick={() => {
            setRequestError('');
            setRequestSuccess('');
            setIsRequestModalOpen(true);
          }}>
            <IconifyIcon icon="solar:pen-bold" className="text-base" />
            Request Profile Update
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Attendance */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Monthly Attendance</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <IconifyIcon icon="solar:calendar-mark-bold-duotone" className="text-lg text-primary" />
            </div>
          </div>
          <h3 className="mb-3 text-3xl font-bold text-slate-900 dark:text-white">
            {attendancePercentage == null ? '--' : `${attendancePercentage}%`}
          </h3>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full bg-primary" style={{ width: `${attendanceProgressWidth}%` }} />
          </div>
          <p className="text-xs text-slate-500">
            {monthlyAttendance.trackedDays
              ? `${monthlyAttendance.presentDays} present day(s) across ${monthlyAttendance.trackedDays} tracked workday(s)`
              : `No attendance data recorded for ${currentMonth || 'this month'}`}
          </p>
        </div>

        {/* Annual Leave Balance */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Annual Leave Balance</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
              <IconifyIcon icon="solar:calendar-bold-duotone" className="text-lg text-orange-500" />
            </div>
          </div>
          <h3 className="mb-3 text-3xl font-bold text-slate-900 dark:text-white">{leaveBalance.remainingDays} Days</h3>
          <p className="text-xs text-slate-500">{leaveBalance.usedDays} day(s) requested from {leaveBalance.initialDays}</p>
        </div>

        {/* Sick Leave Balance */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sick Leave Balance</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <IconifyIcon icon="solar:health-bold-duotone" className="text-lg text-red-500" />
            </div>
          </div>
          <h3 className="mb-3 text-3xl font-bold text-slate-900 dark:text-white">
            {leaveBalance.sick ? `${leaveBalance.sick.remainingDays} Days` : '10 Days'}
          </h3>
          <p className="text-xs text-slate-500">
            {leaveBalance.sick
              ? `${leaveBalance.sick.usedDays} day(s) requested from ${leaveBalance.sick.initialDays}`
              : '0 day(s) requested from 10'}
          </p>
        </div>

        {/* Performance Score */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Performance Score</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
              <IconifyIcon icon="solar:star-bold-duotone" className="text-lg text-yellow-500" />
            </div>
          </div>
          <h3 className="mb-3 text-3xl font-bold text-slate-900 dark:text-white">
            {averageScore == null ? '--' : averageScore}
            <span className="text-lg text-slate-400">/5.0</span>
          </h3>
          <p className="text-xs text-slate-500">
            {performanceSummary.scoredCount
              ? `Average across ${performanceSummary.scoredCount} scored review${performanceSummary.scoredCount === 1 ? '' : 's'}${latestScore != null && performanceSummary.latestTitle ? ` • latest ${latestScore}/5 in ${performanceSummary.latestTitle}` : ''}`
              : performanceSummary.reviewCount
                ? `${performanceSummary.reviewCount} submitted review${performanceSummary.reviewCount === 1 ? '' : 's'} awaiting HR score`
                : 'No scored reviews yet'}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* Event Calendar */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Event Calendar</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-red-100 dark:bg-red-900/20" />
                  <span className="text-xs text-slate-500">Holidays</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-primary/10" />
                  <span className="text-xs text-slate-500">Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-yellow-100 dark:bg-yellow-900/20" />
                  <span className="text-xs text-slate-500">Leave Days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-primary" />
                  <span className="text-xs text-slate-500">Your Selection</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{currentMonth}</h3>
                <div className="flex gap-2">
                  <button onClick={handlePreviousMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                    <IconifyIcon icon="solar:alt-arrow-left-outline" className="text-sm" />
                  </button>
                  <button onClick={handleNextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                    <IconifyIcon icon="solar:alt-arrow-right-outline" className="text-sm" />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-2 grid grid-cols-7 gap-2 text-center">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                    <div key={day} className="text-xs font-semibold text-slate-500">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, idx) => {
                    const isPrevOrNextMonth = day.month === 'prev' || day.month === 'next';
                    return (
                      <div
                        key={idx}
                        title={[...(day.holidayNames || []), ...(day.events || [])].join(' | ')}
                        className={`flex min-h-[3.5rem] flex-col justify-between rounded-lg p-1.5 border border-slate-100 dark:border-slate-800 transition-colors ${isPrevOrNextMonth
                            ? 'bg-slate-50/50 dark:bg-slate-900/30 text-slate-300 dark:text-slate-700'
                            : day.bgColor
                              ? `${day.bgColor}`
                              : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800'
                          }`}
                      >
                        <span className={`text-xs font-bold ${isPrevOrNextMonth
                            ? 'text-slate-300 dark:text-slate-700'
                            : 'text-slate-900 dark:text-white'
                          }`}>
                          {day.date}
                        </span>

                        <div className="mt-1.5 flex flex-col gap-1 w-full overflow-hidden">
                          {day.holidayNames?.map((name, i) => (
                            <div
                              key={`h-${i}`}
                              className="text-[10px] leading-tight font-semibold text-red-600 bg-white/75 dark:bg-slate-950/75 px-1 py-0.5 rounded truncate w-full border border-red-200/50"
                              title={name}
                            >
                              {name}
                            </div>
                          ))}
                          {day.events?.map((name, i) => {
                            const isLeave = name.toLowerCase().includes("on leave");
                            return (
                              <div
                                key={`e-${i}`}
                                className={`text-[10px] leading-tight font-semibold px-1 py-0.5 rounded truncate w-full border ${isLeave
                                    ? 'text-yellow-600 bg-white/75 dark:bg-slate-950/75 border-yellow-200/50'
                                    : 'text-primary bg-white/75 dark:bg-slate-950/75 border-primary/20'
                                  }`}
                                title={name}
                              >
                                {name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Performance Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Performance Breakdown</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review-by-review scores and feedback from submitted performance cycles.
                </p>
              </div>
              <div className="rounded-lg bg-slate-100 px-3 py-2 text-right dark:bg-slate-800">
                <p className="text-xs uppercase tracking-wide text-slate-500">Reviewed Cycles</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{performanceSummary.reviewCount}</p>
              </div>
            </div>

            {reviewScores.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
                No review submissions found yet. Submitted review cycles and their HR scores will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {reviewScores.map(review => (
                  <div key={review.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{review.title}</h3>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {formatReviewStatus(review.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {review.department || session.department || 'General'} Department
                          {review.deadline ? ` • Due ${formatReviewDate(review.deadline)}` : ''}
                          {review.submittedAt ? ` • Submitted ${formatReviewDate(review.submittedAt)}` : ''}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs uppercase tracking-wide text-slate-500">HR Score</p>
                        <p className="text-2xl font-bold text-primary">
                          {review.score == null ? '--' : review.score}
                          <span className="text-sm text-slate-400">/5</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full bg-primary" style={{ width: `${review.scorePercentage || 0}%` }} />
                    </div>

                    {(review.managerComment || review.hrNotes) && (
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Manager Feedback</p>
                          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                            {review.managerComment || 'No manager feedback recorded yet.'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">HR Notes</p>
                          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                            {review.hrNotes || 'No HR notes recorded yet.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <UpcomingEventsSummary />
          {/* Review Documents */}
          {/* <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 p-6 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review Documents</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.name} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <IconifyIcon icon={doc.icon} className="text-lg text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{doc.name}</p>
                          {doc.size && <p className="text-xs text-slate-500">{doc.size}</p>}
                        </div>
                      </div>
                      <button className="text-primary hover:text-primary/80">
                        <IconifyIcon icon="solar:download-bold" className="text-xl" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div> */}

          {/* Attendance Record */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-6 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attendance Record</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {attendanceRecords.slice(0, 5).map((record, idx) => (
                  <div key={idx} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{record.date}</p>
                      {record.day && <p className="text-xs text-slate-500">{record.day}</p>}
                    </div>
                    <div className="text-right">
                      {record.time && <p className="text-sm font-bold text-slate-900 dark:text-white">{record.time}</p>}
                      <p className={`text-xs font-semibold ${record.statusColor}`}>{record.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full text-center text-sm font-bold text-primary hover:underline">
                View Full Log
              </button>
            </div>
          </div>

          {/* Submit Review */}
          {/* <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 p-6 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Submit Review</h2>
              </div>
              <div className="p-6">
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <IconifyIcon icon="solar:cloud-upload-bold-duotone" className="text-3xl text-primary" />
                  </div>
                  <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Click to upload completed form</p>
                  <p className="text-xs text-slate-500">Supported file types: DOC, PDF (Max 10 MB)</p>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary/5 p-3">
                  <IconifyIcon icon="solar:info-circle-bold" className="mt-0.5 text-sm text-primary" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Deadline for Q3 submissions: <span className="font-bold">Dec 15th, 2024</span>
                  </p>
                </div>
              </div>
            </div> */}


        </div>
      </div>
    </main>
    {isRequestModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Request Profile Update</h3>
            <p className="mt-1 text-sm text-slate-500">Select what HR should update in your profile.</p>
          </div>
          <button type="button" className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsRequestModalOpen(false)}>
            <IconifyIcon icon="solar:close-circle-outline" className="text-xl" />
          </button>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Fields to update</p>
          <div className="max-h-60 overflow-y-auto pr-1 rounded-lg border border-slate-100 p-2 dark:border-slate-800">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {profileFieldOptions.map(fieldLabel => <label key={fieldLabel} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                <input type="checkbox" checked={requestFields.includes(fieldLabel)} onChange={() => toggleRequestField(fieldLabel)} className="rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-slate-700 dark:text-slate-300">{fieldLabel}</span>
              </label>)}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Extra details (optional)</label>
          <textarea rows={4} value={requestNote} onChange={event => setRequestNote(event.target.value)} placeholder="Add context, new values, or clarifications for HR." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900" />
        </div>

        {requestError && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{requestError}</p>}
        {requestSuccess && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{requestSuccess}</p>}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setIsRequestModalOpen(false)}>Cancel</button>
          <button type="button" disabled={isSubmittingRequest} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60" onClick={() => void handleSubmitProfileUpdateRequest()}>
            {isSubmittingRequest ? 'Submitting...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>}
  </>;
};

export default MyProfile;