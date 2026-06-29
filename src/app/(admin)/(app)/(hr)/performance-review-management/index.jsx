import { useEffect, useRef, useState } from 'react';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';
import { getAuthSession } from '@/utils/auth';
import {
  LuChevronDown,
  LuChevronRight,
  LuCircleCheck,
  LuCloudUpload,
  LuDownload,
  LuFileText,
  LuLoader,
  LuPlus,
  LuStar,
  LuTrash2,
  LuX,
} from 'react-icons/lu';

const STATUS_BADGE = {
  active: 'bg-success/15 text-success',
  closed: 'bg-default-100 text-default-500',
  submitted: 'bg-primary/15 text-primary',
  assessed: 'bg-warning/15 text-warning',
  scored: 'bg-success/15 text-success',
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
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const TARGET_AUDIENCE_OPTIONS = [
  { value: 'all_staff', label: 'All Staff', description: 'All employees in the department (excluding managers)' },
  { value: 'managers', label: 'Managers Only', description: 'Department managers / heads only' },
  { value: 'hr', label: 'HR Staff', description: 'HR team only (cross-department)' },
  { value: 'all', label: 'Everyone', description: 'All staff and managers in the department' },
];

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

const INITIAL_FORM = { title: '', department: '', deadline: '', targetAudience: 'all_staff', documentFilename: '', documentData: '' };

const Index = () => {
  const session = getAuthSession();
  const isHR = ['super-admin', 'hr-manager', 'hr-officer'].includes(
    (session?.accessLevel || '').toLowerCase().trim().replace(/[\s_]+/g, '-')
  );

  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formFile, setFormFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedCycle, setExpandedCycle] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [loadingSubmissions, setLoadingSubmissions] = useState({});
  const [scoreModal, setScoreModal] = useState(null); // { subId, hrScore, hrNotes }
  const [assessModal, setAssessModal] = useState(null); // { subId, managerComment }
  const [savingScore, setSavingScore] = useState(false);
  const [savingAssess, setSavingAssess] = useState(false);
  const [departments, setDepartments] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCycles();
    hrApi.getDepartments().then(deps => setDepartments(deps || [])).catch(() => {});
  }, []);

  const loadCycles = async () => {
    try {
      setLoading(true);
      const data = await hrApi.listReviewCycles();
      setCycles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load review cycles', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async cycleId => {
    if (submissions[cycleId]) return;
    setLoadingSubmissions(prev => ({ ...prev, [cycleId]: true }));
    try {
      const data = await hrApi.listCycleSubmissions(cycleId);
      setSubmissions(prev => ({ ...prev, [cycleId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoadingSubmissions(prev => ({ ...prev, [cycleId]: false }));
    }
  };

  const toggleCycle = cycleId => {
    if (expandedCycle === cycleId) {
      setExpandedCycle(null);
    } else {
      setExpandedCycle(cycleId);
      loadSubmissions(cycleId);
    }
  };

  const handleFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormFile(file);
    const data = await fileToBase64(file);
    setForm(f => ({ ...f, documentFilename: file.name, documentData: data }));
  };

  const handleCreate = async e => {
    e.preventDefault();
    if (!form.title || !form.department || !form.deadline) return;
    try {
      setSubmitting(true);
      const cycle = await hrApi.createReviewCycle(form);
      setCycles(prev => [cycle, ...prev]);
      setShowForm(false);
      setForm(INITIAL_FORM);
      setFormFile(null);
    } catch (err) {
      console.error('Failed to create cycle', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (cycleId, e) => {
    e.stopPropagation();
    if (!confirm('Close this review cycle? Staff will no longer be able to submit.')) return;
    try {
      await hrApi.closeReviewCycle(cycleId);
      setCycles(prev => prev.map(c => c.id === cycleId ? { ...c, status: 'closed' } : c));
    } catch (err) {
      console.error('Failed to close cycle', err);
    }
  };

  const handleDelete = async (cycleId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this cycle and all its submissions? This cannot be undone.')) return;
    try {
      await hrApi.deleteReviewCycle(cycleId);
      setCycles(prev => prev.filter(c => c.id !== cycleId));
      setSubmissions(prev => { const next = { ...prev }; delete next[cycleId]; return next; });
      if (expandedCycle === cycleId) setExpandedCycle(null);
    } catch (err) {
      console.error('Failed to delete cycle', err);
    }
  };

  const handleDownloadCycleDoc = async (cycleId, e) => {
    e.stopPropagation();
    try {
      const result = await hrApi.downloadReviewCycleDocument(cycleId);
      if (result?.documentData) downloadBase64(result.documentData, result.documentFilename);
    } catch (err) {
      console.error('Failed to download document', err);
    }
  };

  const handleDownloadSubmission = sub => {
    if (sub.documentData) downloadBase64(sub.documentData, sub.documentFilename);
  };

  const openAssessModal = sub => {
    setAssessModal({ subId: sub.id, managerComment: sub.managerComment || '' });
  };

  const handleAssess = async () => {
    if (!assessModal?.managerComment?.trim()) return;
    setSavingAssess(true);
    try {
      const updated = await hrApi.assessSubmission(assessModal.subId, { managerComment: assessModal.managerComment });
      setSubmissions(prev => {
        const next = { ...prev };
        for (const cycleId of Object.keys(next)) {
          next[cycleId] = next[cycleId].map(s => s.id === updated.id ? updated : s);
        }
        return next;
      });
      setAssessModal(null);
    } catch (err) {
      console.error('Failed to assess', err);
    } finally {
      setSavingAssess(false);
    }
  };

  const openScoreModal = sub => {
    setScoreModal({ subId: sub.id, hrScore: sub.hrScore ?? '', hrNotes: sub.hrNotes || '' });
  };

  const handleScore = async () => {
    const score = parseFloat(scoreModal?.hrScore);
    if (!scoreModal || isNaN(score) || score < 0 || score > 5) return;
    setSavingScore(true);
    try {
      const updated = await hrApi.scoreSubmission(scoreModal.subId, { hrScore: score, hrNotes: scoreModal.hrNotes });
      setSubmissions(prev => {
        const next = { ...prev };
        for (const cycleId of Object.keys(next)) {
          next[cycleId] = next[cycleId].map(s => s.id === updated.id ? updated : s);
        }
        return next;
      });
      setScoreModal(null);
    } catch (err) {
      console.error('Failed to score', err);
    } finally {
      setSavingScore(false);
    }
  };

  return <>
    <PageMeta title="Performance Review Management" />
    <main>
      <div className="flex items-center justify-between mb-1">
        <PageBreadcrumb title="Performance Review Management" subtitle="HR" />
        {isHR && (
          <button
            type="button"
            className="btn bg-primary text-white"
            onClick={() => setShowForm(v => !v)}
          >
            <LuPlus className="size-4" />
            New Review Cycle
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-5 mb-6">
          <h3 className="text-base font-semibold text-default-900 mb-4">Create Review Cycle</h3>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-default-700 mb-1">Cycle Title</label>
              <input
                className="form-input"
                placeholder="e.g. Annual Review 2025"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-default-700 mb-1">Target Department</label>
              <select
                className="form-input"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                required
              >
                <option value="">Select department…</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-default-700 mb-1">Submission Deadline</label>
              <input
                type="date"
                className="form-input"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-default-700 mb-1">Target Audience</label>
              <select
                className="form-input"
                value={form.targetAudience}
                onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
              >
                {TARGET_AUDIENCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-default-700 mb-1">Review Form Document</label>
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-default-300 rounded-lg px-4 py-3 hover:border-primary/40 transition">
                <LuCloudUpload className="size-5 text-default-400 shrink-0" />
                <span className="text-sm text-default-600 truncate">
                  {formFile ? formFile.name : 'Upload PDF / DOCX (optional)'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" className="btn btn-outline-default" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn bg-primary text-white disabled:opacity-60">
                {submitting ? 'Creating…' : 'Create Cycle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cycles list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-16 text-default-400">
            <LuLoader className="size-6 animate-spin" />
          </div>
        ) : cycles.length === 0 ? (
          <div className="card p-10 text-center text-default-500">
            <LuFileText className="size-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No review cycles yet.{isHR ? ' Create one to get started.' : ''}</p>
          </div>
        ) : cycles.map(cycle => (
          <article key={cycle.id} className="card overflow-hidden">
            {/* Cycle header */}
            <button
              type="button"
              className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-4"
              onClick={() => toggleCycle(cycle.id)}
            >
              <span className={`badge shrink-0 ${STATUS_BADGE[cycle.status] || 'bg-default-100 text-default-500'}`}>
                {cycle.status}
              </span>
              <span className={`badge shrink-0 ${TARGET_BADGE[cycle.targetAudience] || 'bg-default-100 text-default-500'}`}>
                {TARGET_LABEL[cycle.targetAudience] || cycle.targetAudience}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-default-900 truncate">{cycle.title}</p>
                <p className="text-xs text-default-500 mt-0.5">
                  {cycle.department} &bull; Deadline: {formatDate(cycle.deadline)} &bull; {cycle.submissionCount} submission{cycle.submissionCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {cycle.documentFilename && (
                  <button
                    type="button"
                    title="Download form"
                    className="btn btn-sm btn-outline-default icon-btn"
                    onClick={e => handleDownloadCycleDoc(cycle.id, e)}
                  >
                    <LuDownload className="size-4" />
                  </button>
                )}
                {isHR && cycle.status === 'active' && (
                  <button
                    type="button"
                    title="Close cycle"
                    className="btn btn-sm btn-outline-default icon-btn"
                    onClick={e => handleClose(cycle.id, e)}
                  >
                    <LuCircleCheck className="size-4" />
                  </button>
                )}
                {isHR && (
                  <button
                    type="button"
                    title="Delete cycle"
                    className="btn btn-sm btn-outline-danger icon-btn"
                    onClick={e => handleDelete(cycle.id, e)}
                  >
                    <LuTrash2 className="size-4" />
                  </button>
                )}
                {expandedCycle === cycle.id
                  ? <LuChevronDown className="size-4 text-default-400" />
                  : <LuChevronRight className="size-4 text-default-400" />}
              </div>
            </button>

            {/* Submissions */}
            {expandedCycle === cycle.id && (
              <div className="border-t border-default-200 px-5 py-4">
                {loadingSubmissions[cycle.id] ? (
                  <div className="flex justify-center py-6 text-default-400">
                    <LuLoader className="size-5 animate-spin" />
                  </div>
                ) : !submissions[cycle.id]?.length ? (
                  <p className="text-sm text-default-400 text-center py-4">No submissions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {submissions[cycle.id].map(sub => (
                      <div key={sub.id} className="rounded-lg border border-default-200 bg-default-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-default-900">{sub.employeeName}</p>
                            <p className="text-xs text-default-500 mt-0.5">
                              {sub.department} &bull; Submitted {formatDate(sub.submittedAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`badge ${STATUS_BADGE[sub.status] || 'bg-default-100 text-default-500'}`}>
                              {sub.status}
                            </span>
                            {sub.hrScore != null && (
                              <span className="badge bg-primary/10 text-primary font-bold">
                                Score: {sub.hrScore.toFixed(1)} / 5.0
                              </span>
                            )}
                            {sub.documentFilename && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-default"
                                onClick={() => handleDownloadSubmission(sub)}
                              >
                                <LuDownload className="size-3.5" />
                                Download
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm bg-warning/10 text-warning hover:bg-warning/20"
                              onClick={() => openAssessModal(sub)}
                            >
                              Assess
                            </button>
                            {isHR && (
                              <button
                                type="button"
                                className="btn btn-sm bg-primary/10 text-primary hover:bg-primary/20"
                                onClick={() => openScoreModal(sub)}
                              >
                                <LuStar className="size-3.5" />
                                Score
                              </button>
                            )}
                          </div>
                        </div>
                        {sub.managerComment && (
                          <div className="mt-3 rounded border border-default-200 bg-white p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-default-400">Manager Comment</p>
                            <p className="text-sm text-default-700 mt-1 italic">"{sub.managerComment}"</p>
                            <p className="text-xs text-default-400 mt-1">— {sub.managerAssessedBy}, {formatDate(sub.managerAssessedAt)}</p>
                          </div>
                        )}
                        {sub.hrNotes && (
                          <div className="mt-2 rounded border border-primary/20 bg-primary/5 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/60">HR Notes</p>
                            <p className="text-sm text-default-700 mt-1 italic">"{sub.hrNotes}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </main>

    {/* Assess modal */}
    {assessModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-default-900">Manager Assessment</h3>
            <button type="button" className="text-default-400 hover:text-default-700" onClick={() => setAssessModal(null)}>
              <LuX className="size-5" />
            </button>
          </div>
          <label className="block text-sm font-medium text-default-700 mb-1">Comment</label>
          <textarea
            className="form-input min-h-[100px]"
            placeholder="Add your assessment comment…"
            value={assessModal.managerComment}
            onChange={e => setAssessModal(m => ({ ...m, managerComment: e.target.value }))}
          />
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-outline-default" onClick={() => setAssessModal(null)}>Cancel</button>
            <button
              type="button"
              disabled={savingAssess || !assessModal.managerComment?.trim()}
              className="btn bg-warning text-white disabled:opacity-60"
              onClick={handleAssess}
            >
              {savingAssess ? 'Saving…' : 'Submit Assessment'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Score modal */}
    {scoreModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-default-900">Set Performance Score</h3>
            <button type="button" className="text-default-400 hover:text-default-700" onClick={() => setScoreModal(null)}>
              <LuX className="size-5" />
            </button>
          </div>
          <label className="block text-sm font-medium text-default-700 mb-1">Score (0.0 – 5.0)</label>
          <input
            type="number"
            className="form-input"
            min="0"
            max="5"
            step="0.1"
            placeholder="e.g. 4.2"
            value={scoreModal.hrScore}
            onChange={e => setScoreModal(m => ({ ...m, hrScore: e.target.value }))}
          />
          <label className="block text-sm font-medium text-default-700 mb-1 mt-3">HR Notes (optional)</label>
          <textarea
            className="form-input min-h-[80px]"
            placeholder="Any notes or feedback…"
            value={scoreModal.hrNotes}
            onChange={e => setScoreModal(m => ({ ...m, hrNotes: e.target.value }))}
          />
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-outline-default" onClick={() => setScoreModal(null)}>Cancel</button>
            <button
              type="button"
              disabled={savingScore || scoreModal.hrScore === ''}
              className="btn bg-primary text-white disabled:opacity-60"
              onClick={handleScore}
            >
              {savingScore ? 'Saving…' : 'Save Score'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>;
};

export default Index;
