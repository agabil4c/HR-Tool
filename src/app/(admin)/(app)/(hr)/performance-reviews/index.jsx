import { useEffect, useMemo, useRef, useState } from 'react';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';
import { getAuthSession } from '@/utils/auth';
import {
  LuCalendarClock,
  LuCircleCheck,
  LuCloudUpload,
  LuDownload,
  LuEye,
  LuFileText,
  LuInfo,
  LuLoader,
  LuStar,
  LuX,
} from 'react-icons/lu';

const STATUS_BADGE = {
  submitted: 'bg-primary/15 text-primary',
  assessed: 'bg-warning/15 text-warning',
  scored: 'bg-success/15 text-success',
};

const TARGET_BADGE = {
  all_staff: 'bg-blue-100 text-blue-700',
  managers: 'bg-purple-100 text-purple-700',
  hr: 'bg-teal-100 text-teal-700',
  all: 'bg-default-100 text-default-600',
};

const TARGET_LABEL = {
  all_staff: 'All Staff',
  managers: 'Managers',
  hr: 'HR Staff',
  all: 'Everyone',
};

const fileToBase64 = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const downloadBase64 = (data, filename) => {
  const link = document.createElement('a');
  link.href = data;
  link.download = filename || 'document';
  link.click();
};

const formatDate = iso => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const daysUntil = iso => {
  if (!iso) return null;
  try {
    return Math.ceil((new Date(iso) - new Date()) / 86400000);
  } catch {
    return null;
  }
};

const statusLabel = status => {
  if (status === 'scored') return 'Scored';
  if (status === 'assessed') return 'Manager Assessed';
  return 'Submitted';
};

const formatScore = value => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric.toFixed(1);
};

const Index = () => {
  const session = getAuthSession();

  const [cycles, setCycles] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [submitModal, setSubmitModal] = useState(null);
  const [submitFile, setSubmitFile] = useState(null);
  const [submitData, setSubmitData] = useState('');
  const [submitFilename, setSubmitFilename] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [previewModal, setPreviewModal] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [cyclesData, subsData] = await Promise.all([
        hrApi.getMyDepartmentCycles().catch(err => { throw err; }),
        hrApi.getMySubmissions().catch(() => []),
      ]);
      setCycles(Array.isArray(cyclesData) ? cyclesData : []);
      setMySubmissions(Array.isArray(subsData) ? subsData : []);
    } catch (err) {
      console.error('Failed to load review data', err);
      setLoadError(err?.message || 'Could not load your review cycles. Please check your access permissions or try again.');
    } finally {
      setLoading(false);
    }
  };

  const submissionForCycle = cycleId => mySubmissions.find(s => s.cycleId === cycleId) || null;

  const pendingCycles = useMemo(
    () => cycles.filter(cycle => !submissionForCycle(cycle.id)),
    [cycles, mySubmissions]
  );

  const submittedCycles = useMemo(
    () => cycles.filter(cycle => submissionForCycle(cycle.id)),
    [cycles, mySubmissions]
  );

  const archivedSubmissions = useMemo(
    () => mySubmissions.filter(sub => !cycles.find(cycle => cycle.id === sub.cycleId)),
    [mySubmissions, cycles]
  );

  const openSubmitModal = cycle => {
    setSubmitModal(cycle);
    setSubmitFile(null);
    setSubmitData('');
    setSubmitFilename('');
  };

  const handleFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitFile(file);
    setSubmitFilename(file.name);
    const data = await fileToBase64(file);
    setSubmitData(data);
  };

  const handleSubmit = async () => {
    if (!submitModal) return;

    setSubmitting(true);
    try {
      const sub = await hrApi.submitReview(submitModal.id, {
        documentFilename: submitFilename,
        documentData: submitData,
      });

      setMySubmissions(prev => [sub, ...prev.filter(item => item.cycleId !== submitModal.id)]);
      setSubmitModal(null);
    } catch (err) {
      console.error('Failed to submit review', err);
      alert(err?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadForm = async cycle => {
    try {
      const result = await hrApi.downloadReviewCycleDocument(cycle.id);
      if (result?.documentData) {
        downloadBase64(result.documentData, result.documentFilename);
      }
    } catch (err) {
      console.error('Failed to download form', err);
    }
  };

  const handleDownloadSubmission = sub => {
    if (!sub?.documentData) {
      alert('Your submission file is not available for download yet.');
      return;
    }
    downloadBase64(sub.documentData, sub.documentFilename);
  };

  return (
    <>
      <PageMeta title="Performance Reviews" />
      <main>
        <PageBreadcrumb title="Performance Reviews" subtitle="HR" />

        {loading ? (
          <div className="flex justify-center py-20 text-default-400">
            <LuLoader className="size-6 animate-spin" />
          </div>
        ) : loadError ? (
          <div className="card p-10 text-center">
            <LuInfo className="mx-auto mb-3 size-10 text-warning/60" />
            <p className="font-semibold text-default-800">Could not load review cycles</p>
            <p className="mt-1 text-sm text-default-500">{loadError}</p>
            <button type="button" className="btn btn-sm btn-outline-default mt-4" onClick={loadData}>Retry</button>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <LuInfo className="mt-0.5 size-5 shrink-0 text-blue-600" />
                <div className="text-sm text-blue-900">
                  <p className="mb-1 font-semibold">How to Complete Your Review</p>
                  <ol className="ml-1 list-inside list-decimal space-y-1 text-xs">
                    <li>
                      <strong>Download</strong> the review form assigned to your department.
                    </li>
                    <li>
                      <strong>Complete</strong> the document with your responses.
                    </li>
                    <li>
                      <strong>Submit</strong> your completed review document before the deadline.
                    </li>
                    <li>
                      <strong>Track</strong> manager feedback and HR performance score here.
                    </li>
                  </ol>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <LuInfo className="size-5 text-warning" />
                <h2 className="text-lg font-semibold text-default-900">Action Needed</h2>
              </div>

              {pendingCycles.length === 0 ? (
                <div className="card p-8 text-center">
                  <LuCircleCheck className="mx-auto mb-3 size-10 text-success/60" />
                  <p className="text-sm text-default-500">No pending reviews. You have submitted all active cycles.</p>
                </div>
              ) : (
                pendingCycles.map(cycle => {
                  const days = daysUntil(cycle.deadline);
                  return (
                    <article key={cycle.id} className="card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge bg-orange-100 text-orange-700">Pending</span>
                            {cycle.targetAudience && (
                              <span className={`badge ${TARGET_BADGE[cycle.targetAudience] || 'bg-default-100 text-default-500'}`}>
                                {TARGET_LABEL[cycle.targetAudience] || cycle.targetAudience}
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-semibold text-default-900">{cycle.title}</h3>

                          <p className="flex items-center gap-1.5 text-xs text-default-600">
                            <LuCalendarClock className="size-3.5" />
                            Deadline: {formatDate(cycle.deadline)}
                            {days != null && (
                              <span
                                className={`ml-1 font-semibold ${days <= 3 ? 'text-danger' : days <= 7 ? 'text-warning' : 'text-default-600'}`}
                              >
                                ({days > 0 ? `${days} day${days !== 1 ? 's' : ''} remaining` : days === 0 ? 'Due today' : 'Overdue'})
                              </span>
                            )}
                          </p>

                          <p className="mt-2 text-xs text-default-500">
                            {cycle.documentFilename || 'Review form available'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {cycle.documentFilename && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-default"
                              onClick={() => setPreviewModal(cycle)}
                            >
                              <LuEye className="size-4" />
                              View Form
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-default"
                            onClick={() => handleDownloadForm(cycle)}
                          >
                            <LuDownload className="size-4" />
                            Download Form
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm bg-primary text-white"
                            onClick={() => openSubmitModal(cycle)}
                          >
                            <LuCloudUpload className="size-4" />
                            Submit Review
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </section>

            {submittedCycles.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <LuCircleCheck className="size-5 text-primary" />
                  <h2 className="text-lg font-semibold text-default-900">Submitted for Review</h2>
                </div>

                {submittedCycles.map(cycle => {
                  const sub = submissionForCycle(cycle.id);
                  if (!sub) return null;

                  return (
                    <article key={cycle.id} className="card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className={`badge ${STATUS_BADGE[sub.status] || 'bg-default-100 text-default-500'}`}>
                            {statusLabel(sub.status)}
                          </span>
                          <h3 className="text-lg font-semibold text-default-900">{cycle.title}</h3>
                          <p className="text-xs text-default-500">Submitted {formatDate(sub.submittedAt)}</p>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-default"
                          onClick={() => handleDownloadSubmission(sub)}
                          disabled={!sub.documentData}
                        >
                          <LuDownload className="size-4" />
                          My Submission
                        </button>
                      </div>

                      <div className="mt-4 h-1.5 rounded-full bg-default-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            sub.status === 'scored'
                              ? 'w-full bg-success'
                              : sub.status === 'assessed'
                                ? 'w-2/3 bg-warning'
                                : 'w-1/3 bg-primary'
                          }`}
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-3 text-center text-xs">
                        <div className="font-semibold text-primary">
                          <LuCircleCheck className="mr-1 inline size-3.5" />
                          Self Submission
                        </div>
                        <div
                          className={
                            sub.status === 'assessed' || sub.status === 'scored'
                              ? 'font-semibold text-warning'
                              : 'text-default-400'
                          }
                        >
                          {(sub.status === 'assessed' || sub.status === 'scored') && (
                            <LuCircleCheck className="mr-1 inline size-3.5" />
                          )}
                          Manager Review
                        </div>
                        <div className={sub.status === 'scored' ? 'font-semibold text-success' : 'text-default-400'}>
                          {sub.status === 'scored' && <LuCircleCheck className="mr-1 inline size-3.5" />}
                          HR Scoring
                        </div>
                      </div>

                      {sub.managerComment && (
                        <div className="mt-4 rounded-lg border border-default-200 bg-default-50 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-default-400">
                            Manager Feedback
                          </p>
                          <p className="mt-1 text-sm italic text-default-700">"{sub.managerComment}"</p>
                          <p className="mt-1 text-xs text-default-400">- {sub.managerAssessedBy}</p>
                        </div>
                      )}

                      {sub.status === 'scored' && formatScore(sub.hrScore) != null && (
                        <div className="mt-3 flex items-center gap-4 rounded-lg border border-success/20 bg-success/5 p-4">
                          <div className="text-center">
                            <p className="text-3xl font-bold leading-none text-success">{formatScore(sub.hrScore)}</p>
                            <p className="mt-1 text-xs text-default-400">/ 5.0 Score</p>
                          </div>
                          <div>
                            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-default-500">
                              <LuStar className="size-3.5 text-success" />
                              Performance Score
                            </p>
                            {sub.hrNotes && <p className="mt-1 text-sm italic text-default-700">"{sub.hrNotes}"</p>}
                            <p className="mt-1 text-xs text-default-400">Scored by {sub.hrScoredBy}</p>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </section>
            )}

            {archivedSubmissions.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-default-900">Archived Submissions</h2>
                {archivedSubmissions.map(sub => (
                  <article key={sub.id} className="card flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="flex gap-3">
                      <span className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-default-100 text-default-500">
                        <LuFileText className="size-4" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-default-900">{sub.cycleTitle}</h4>
                          <span className={`badge ${STATUS_BADGE[sub.status] || 'bg-default-100 text-default-500'}`}>
                            {statusLabel(sub.status)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-default-500">
                          {sub.cycleDepartment} • Submitted {formatDate(sub.submittedAt)}
                        </p>
                        {sub.managerComment && (
                          <p className="mt-2 text-sm italic text-default-600">"{sub.managerComment}"</p>
                        )}
                      </div>
                    </div>
                    {formatScore(sub.hrScore) != null && (
                      <div className="text-right">
                        <p className="text-2xl font-bold leading-none text-primary">{formatScore(sub.hrScore)}</p>
                        <p className="text-[10px] uppercase tracking-wide text-default-400">Rating</p>
                      </div>
                    )}
                  </article>
                ))}
              </section>
            )}
          </div>
        )}
      </main>

      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-default-900">Submit Your Review</h3>
                <p className="mt-0.5 text-xs text-default-500">{submitModal.title}</p>
              </div>
              <button
                type="button"
                className="text-default-400 hover:text-default-700"
                onClick={() => setSubmitModal(null)}
              >
                <LuX className="size-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-default-600">
              Download the review form, fill it out, then upload and submit it here before {formatDate(submitModal.deadline)}.
            </p>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-default-300 bg-default-50 px-4 py-8 text-center transition hover:border-primary/40 hover:bg-primary/5">
              <LuCloudUpload className="mb-2 size-10 text-default-400" />
              <span className="text-sm font-medium text-default-700">
                {submitFile ? submitFile.name : 'Click to upload completed form'}
              </span>
              <span className="mt-1 text-xs text-default-400">PDF or DOCX</span>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn btn-outline-default" onClick={() => setSubmitModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !submitFile}
                className="btn bg-primary text-white disabled:opacity-60"
                onClick={handleSubmit}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-default-900">Review Form Details</h3>
              <button
                type="button"
                className="text-default-400 hover:text-default-700"
                onClick={() => setPreviewModal(null)}
              >
                <LuX className="size-5" />
              </button>
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-default-500">Cycle Title</p>
                <p className="mt-1 text-sm text-default-900">{previewModal.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-default-500">Department</p>
                <p className="mt-1 text-sm text-default-900">{previewModal.department}</p>
              </div>
              {previewModal.documentFilename && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-default-500">Form File</p>
                  <p className="mt-1 break-all text-sm text-default-900">{previewModal.documentFilename}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-default-500">Deadline</p>
                <p className="mt-1 text-sm text-default-900">{formatDate(previewModal.deadline)}</p>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs text-blue-900">
                <strong>Next Step:</strong> Download the form, complete it, then return to submit your final document.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" className="btn btn-outline-default" onClick={() => setPreviewModal(null)}>
                Close
              </button>
              <button
                type="button"
                className="btn bg-primary text-white"
                onClick={() => {
                  handleDownloadForm(previewModal);
                  setPreviewModal(null);
                }}
              >
                <LuDownload className="size-4" />
                Download Form
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Index;
