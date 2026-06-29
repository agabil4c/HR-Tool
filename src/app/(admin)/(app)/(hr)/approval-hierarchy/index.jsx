import { useEffect, useState } from 'react';
import { Building2, RefreshCw, Trash2, UserCheck } from 'lucide-react';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';

const Index = () => {
  const [departments, setDepartments] = useState([]);
  const [staffProfiles, setStaffProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add department
  const [newDeptName, setNewDeptName] = useState('');
  const [addingDept, setAddingDept] = useState(false);
  const [addDeptError, setAddDeptError] = useState('');

  // Remove department
  const [removeDeptId, setRemoveDeptId] = useState('');
  const [removingDept, setRemovingDept] = useState(false);
  const [removeDeptError, setRemoveDeptError] = useState('');

  // Define approval chain
  const [chainDeptId, setChainDeptId] = useState('');
  const [chainLineManager, setChainLineManager] = useState('');
  const [chainDeptHead, setChainDeptHead] = useState('');
  const [chainHrManager, setChainHrManager] = useState('');
  const [chainApprovalLevel, setChainApprovalLevel] = useState('2-Step Approval');
  const [savingChain, setSavingChain] = useState(false);
  const [chainError, setChainError] = useState('');
  const [chainSuccess, setChainSuccess] = useState('');

  const [pageError, setPageError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [depts, moduleData] = await Promise.all([
        hrApi.getDepartments(),
        hrApi.getModuleData('staff-biodata'),
      ]);
      setDepartments(depts || []);
      setStaffProfiles(moduleData.staffProfiles || []);
    } catch {
      setPageError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  // Pre-fill chain form when a department is selected
  const handleChainDeptChange = (deptId) => {
    setChainDeptId(deptId);
    setChainSuccess('');
    setChainError('');
    if (!deptId) return;
    const dept = departments.find(d => String(d.id) === String(deptId));
    if (dept) {
      setChainLineManager(dept.lineManager || '');
      setChainDeptHead(dept.head || '');
      setChainHrManager(dept.hrManager || '');
      setChainApprovalLevel(dept.approvalLevel || '2-Step Approval');
    }
  };

  const handleAddDepartment = async () => {
    setAddDeptError('');
    if (!newDeptName.trim()) { setAddDeptError('Enter a department name.'); return; }
    setAddingDept(true);
    try {
      const created = await hrApi.createDepartment({ name: newDeptName.trim() });
      setDepartments(prev => [...prev, created]);
      setNewDeptName('');
      setPageSuccess(`Department "${created.name}" added.`);
    } catch (err) {
      setAddDeptError(err?.response?.data?.detail || err?.message || 'Failed to add department.');
    } finally {
      setAddingDept(false);
    }
  };

  const handleRemoveDepartment = async () => {
    setRemoveDeptError('');
    if (!removeDeptId) { setRemoveDeptError('Select a department to remove.'); return; }
    setRemovingDept(true);
    try {
      await hrApi.deleteDepartment(Number(removeDeptId));
      const removed = departments.find(d => String(d.id) === removeDeptId);
      setDepartments(prev => prev.filter(d => String(d.id) !== removeDeptId));
      setRemoveDeptId('');
      setPageSuccess(`Department "${removed?.name}" removed.`);
    } catch (err) {
      setRemoveDeptError(err?.response?.data?.detail || err?.message || 'Failed to remove department.');
    } finally {
      setRemovingDept(false);
    }
  };

  const handleSaveChain = async () => {
    setChainError('');
    setChainSuccess('');
    if (!chainDeptId) { setChainError('Select a department.'); return; }
    const dept = departments.find(d => String(d.id) === chainDeptId);
    if (!dept) return;
    setSavingChain(true);
    try {
      const updated = await hrApi.updateDepartment(Number(chainDeptId), {
        name: dept.name,
        head: chainDeptHead,
        lineManager: chainLineManager,
        hrManager: chainHrManager,
        approvalLevel: chainApprovalLevel,
        staffCount: dept.staffCount,
        status: dept.status,
        icon: dept.icon,
        iconBg: dept.iconBg,
        avatarColor: dept.avatarColor,
      });
      setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
      setChainSuccess('Approval chain saved successfully.');
    } catch (err) {
      setChainError(err?.response?.data?.detail || err?.message || 'Failed to save chain.');
    } finally {
      setSavingChain(false);
    }
  };

  return <>
    <PageMeta title="Approval Hierarchy" />
    <main>
      <PageBreadcrumb title="Approval Hierarchy" subtitle="HR" />

      {loading && <p className="text-sm text-slate-500 mb-4">Loading…</p>}
      {pageError && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{pageError}</p>}
      {pageSuccess && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{pageSuccess}</p>}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Add / Remove Department */}
        <div className="card p-5">
          <h4 className="text-lg font-semibold text-default-900 mb-4 flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            Add / Remove Department
          </h4>
          <div className="grid gap-4">
            <div className="flex gap-2">
              <input
                className="form-input flex-1"
                placeholder="New department name"
                value={newDeptName}
                onChange={e => setNewDeptName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && void handleAddDepartment()}
              />
              <button type="button" onClick={() => void handleAddDepartment()} disabled={addingDept} className="btn bg-primary text-white flex items-center gap-2 disabled:opacity-50">
                {addingDept ? <RefreshCw className="size-4 animate-spin" /> : null}
                Add
              </button>
            </div>
            {addDeptError && <p className="text-xs text-red-500">{addDeptError}</p>}

            <div className="flex gap-2">
              <select
                className="form-select flex-1"
                value={removeDeptId}
                onChange={e => { setRemoveDeptId(e.target.value); setRemoveDeptError(''); }}
              >
                <option value="">Select department to remove</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button type="button" onClick={() => void handleRemoveDepartment()} disabled={removingDept || !removeDeptId} className="btn bg-danger text-white flex items-center gap-2 disabled:opacity-50">
                {removingDept ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Remove
              </button>
            </div>
            {removeDeptError && <p className="text-xs text-red-500">{removeDeptError}</p>}
          </div>
        </div>

        {/* Define Approval Chain */}
        <div className="card p-5">
          <h4 className="text-lg font-semibold text-default-900 mb-4 flex items-center gap-2">
            <UserCheck className="size-4 text-primary" />
            Define Approval Chain
          </h4>
          <div className="grid gap-3">
            <select className="form-select" value={chainDeptId} onChange={e => handleChainDeptChange(e.target.value)}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>

            <select className="form-select" value={chainLineManager} onChange={e => setChainLineManager(e.target.value)}>
              <option value="">Line Manager (none)</option>
              {staffProfiles.map(p => <option key={p.name} value={p.name}>{p.name} — {p.role}</option>)}
            </select>

            <select className="form-select" value={chainDeptHead} onChange={e => setChainDeptHead(e.target.value)}>
              <option value="">Dept Head (none)</option>
              {staffProfiles.map(p => <option key={p.name} value={p.name}>{p.name} — {p.role}</option>)}
            </select>

            <select className="form-select" value={chainHrManager} onChange={e => setChainHrManager(e.target.value)}>
              <option value="">HR Manager (none)</option>
              {staffProfiles.map(p => <option key={p.name} value={p.name}>{p.name} — {p.role}</option>)}
            </select>

            <select className="form-select" value={chainApprovalLevel} onChange={e => setChainApprovalLevel(e.target.value)}>
              <option value="1-Step Approval">1-Step Approval (Line Manager only)</option>
              <option value="2-Step Approval">2-Step Approval (LM → Dept Head)</option>
              <option value="3-Step Approval">3-Step Approval (LM → Dept Head → HR)</option>
            </select>

            {chainError && <p className="text-xs text-red-500">{chainError}</p>}
            {chainSuccess && <p className="text-xs text-emerald-600 font-semibold">{chainSuccess}</p>}

            <button type="button" onClick={() => void handleSaveChain()} disabled={savingChain} className="btn bg-primary text-white flex items-center justify-center gap-2 disabled:opacity-50">
              {savingChain ? <RefreshCw className="size-4 animate-spin" /> : null}
              Save Hierarchy
            </button>
          </div>
        </div>
      </div>

      {/* Current Hierarchies Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-default-900">Current Hierarchies</h4>
          <button type="button" onClick={() => void loadData()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
        {departments.length === 0 && !loading && (
          <p className="text-sm text-slate-500">No departments found. Add one above.</p>
        )}
        {departments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-sm">
              <thead>
                <tr className="text-left border-b border-default-200">
                  <th className="py-2 pe-4 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>
                  <th className="py-2 pe-4 text-xs font-bold uppercase tracking-wider text-slate-500">Line Manager</th>
                  <th className="py-2 pe-4 text-xs font-bold uppercase tracking-wider text-slate-500">Dept Head</th>
                  <th className="py-2 pe-4 text-xs font-bold uppercase tracking-wider text-slate-500">HR Manager</th>
                  <th className="py-2 pe-4 text-xs font-bold uppercase tracking-wider text-slate-500">Approval Levels</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <tr
                    key={dept.id}
                    className="border-b border-default-100 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    onClick={() => handleChainDeptChange(String(dept.id))}
                  >
                    <td className="py-2.5 pe-4 font-medium">{dept.name}</td>
                    <td className="py-2.5 pe-4 text-slate-600 dark:text-slate-400">{dept.lineManager || <span className="text-slate-400 italic">—</span>}</td>
                    <td className="py-2.5 pe-4 text-slate-600 dark:text-slate-400">{dept.head || <span className="text-slate-400 italic">—</span>}</td>
                    <td className="py-2.5 pe-4 text-slate-600 dark:text-slate-400">{dept.hrManager || <span className="text-slate-400 italic">—</span>}</td>
                    <td className="py-2.5 pe-4">
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{dept.approvalLevel || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  </>;
};

export default Index;

