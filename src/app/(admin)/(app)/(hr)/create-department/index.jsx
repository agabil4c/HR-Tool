import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';
import { PermissionButton, PermissionLink } from '@/components/AccessControl';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';

const CreateDepartment = () => {
  const navigate = useNavigate();
  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentHead, setDepartmentHead] = useState('');
  const [description, setDescription] = useState('');
  const [initialLeaveDays, setInitialLeaveDays] = useState('21');
  const [approvalLevel, setApprovalLevel] = useState('1-level');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedStaff, setSelectedStaff] = useState([]);

  const removeStaff = (id) => {
    setSelectedStaff(selectedStaff.filter(staff => staff.id !== id));
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const getApprovalLabel = () => {
    if (approvalLevel === '2-level') {
      return '2-Step Approval';
    }
    return '1-Step Approval';
  };

  const handleCreateDepartment = async () => {
    if (!departmentName.trim()) {
      setErrorMessage('Department name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await hrApi.createDepartment({
        name: departmentName.trim(),
        head: departmentHead || 'Unassigned',
        staffCount: selectedStaff.length,
        initialLeaveDays: Number.isNaN(Number.parseInt(initialLeaveDays, 10)) ? undefined : Math.max(Number.parseInt(initialLeaveDays, 10), 1),
        approvalLevel: getApprovalLabel(),
        status: 'Active',
        icon: 'solar:buildings-3-bold-duotone',
        iconBg: 'bg-primary/10 text-primary',
        avatarColor: 'bg-slate-200 dark:bg-slate-700'
      });

      navigate('/department');
    } catch (error) {
      console.error('Failed to create department', error);
      if (error?.status === 403) {
        setErrorMessage('You do not have permission to create departments.');
      } else if (error?.status === 409) {
        setErrorMessage('Unable to create department. The name already exists.');
      } else {
        setErrorMessage(error?.detail || 'Unable to create department right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return <>
      <PageMeta title="Create Department" />
      <main className="font-display flex-1 flex flex-col items-center px-4 py-8 md:px-20 lg:px-40">
        <div className="w-full max-w-[960px]">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm">
            <Link to="/index" className="text-slate-500 hover:text-primary font-medium">Dashboard</Link>
            <IconifyIcon icon="solar:alt-arrow-right-outline" className="text-xs text-slate-400" />
            <Link to="/department" className="text-slate-500 hover:text-primary font-medium">Departments</Link>
            <IconifyIcon icon="solar:alt-arrow-right-outline" className="text-xs text-slate-400" />
            <span className="text-slate-900 dark:text-white font-bold">Add New Department</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-slate-900 dark:text-white text-4xl font-black tracking-tight mb-2">Create Department</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">Define your organization's structure, assign leadership, and configure custom approval workflows.</p>
          </div>

          {/* Form Container */}
          <form className="space-y-8">
            {errorMessage && (
              <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-start gap-2" role="alert">
                <IconifyIcon icon="solar:info-circle-bold-duotone" className="size-5 shrink-0 mt-0.5 animate-bounce" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}
            {/* General Information */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold flex items-center gap-2">
                  <IconifyIcon icon="solar:info-circle-bold" className="text-primary" />
                  General Information
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Department Name <span className="text-red-500">*</span>
                  </span>
                  <input 
                    type="text" 
                    placeholder="e.g. Product Engineering" 
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="form-input rounded-lg border-slate-300 dark:border-slate-700 bg-transparent focus:border-primary focus:ring-primary h-12"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Department Code / ID <span className="text-red-500">*</span>
                  </span>
                  <input 
                    type="text" 
                    placeholder="e.g. DEPT-ENG-01" 
                    value={departmentCode}
                    onChange={(e) => setDepartmentCode(e.target.value)}
                    className="form-input rounded-lg border-slate-300 dark:border-slate-700 bg-transparent focus:border-primary focus:ring-primary h-12"
                  />
                </label>
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Assign Department Head</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <IconifyIcon icon="solar:user-id-outline" />
                    </div>
                    <select 
                      value={departmentHead}
                      onChange={(e) => setDepartmentHead(e.target.value)}
                      className="form-select w-full rounded-lg border-slate-300 dark:border-slate-700 bg-transparent pl-10 focus:border-primary focus:ring-primary h-12 appearance-none"
                    >
                      <option value="">Select a manager...</option>
                      <option>Sarah Jenkins (Senior Director)</option>
                      <option>Michael Chen (VP Engineering)</option>
                      <option>Amara Okafor (Head of Operations)</option>
                    </select>
                  </div>
                </label>
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Department Description</span>
                  <textarea 
                    rows="3" 
                    placeholder="Briefly describe the purpose and scope of this department..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea rounded-lg border-slate-300 dark:border-slate-700 bg-transparent focus:border-primary focus:ring-primary"
                  />
                </label>
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Initial Leave Days Per Staff</span>
                  <input type="number" min="1" value={initialLeaveDays} onChange={e => setInitialLeaveDays(e.target.value)} className="form-input rounded-lg border-slate-300 dark:border-slate-700 bg-transparent focus:border-primary focus:ring-primary h-12" />
                </label>
              </div>
            </section>

            {/* Define Approval Hierarchy */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold flex items-center gap-2">
                  <IconifyIcon icon="solar:chart-2-outline" className="text-primary" />
                  Define Approval Hierarchy
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Set the default approval chain for leave requests, performance reviews, and expense reports within this department.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1-Level Approval */}
                  <div 
                    onClick={() => setApprovalLevel('1-level')}
                    className={`relative flex items-start p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      approvalLevel === '1-level' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center h-5">
                      <input 
                        type="radio" 
                        name="approval_level" 
                        checked={approvalLevel === '1-level'}
                        onChange={() => setApprovalLevel('1-level')}
                        className="h-4 w-4 text-primary border-slate-300 focus:ring-primary"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-bold text-slate-900 dark:text-white">1-Level Approval</label>
                      <p className="text-slate-500">Only the Line Manager's approval is required.</p>
                    </div>
                    <div className="absolute top-4 right-4 text-primary">
                      <IconifyIcon icon="solar:user-outline" />
                    </div>
                  </div>

                  {/* 2-Level Approval */}
                  <div 
                    onClick={() => setApprovalLevel('2-level')}
                    className={`relative flex items-start p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      approvalLevel === '2-level' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center h-5">
                      <input 
                        type="radio" 
                        name="approval_level" 
                        checked={approvalLevel === '2-level'}
                        onChange={() => setApprovalLevel('2-level')}
                        className="h-4 w-4 text-primary border-slate-300 focus:ring-primary"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-bold text-slate-900 dark:text-white">2-Level Approval</label>
                      <p className="text-slate-500">Line Manager + Department Head approval.</p>
                    </div>
                    <div className={`absolute top-4 right-4 ${approvalLevel === '2-level' ? 'text-primary' : 'text-slate-400'}`}>
                      <IconifyIcon icon="solar:users-group-rounded-outline" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Add Staff */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold flex items-center gap-2">
                  <IconifyIcon icon="solar:users-group-rounded-bold" className="text-primary" />
                  Add Staff
                </h3>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                  {selectedStaff.length} Staff Selected
                </span>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="Search and select employees to migrate..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input w-full rounded-lg border-slate-300 dark:border-slate-700 bg-transparent pl-10 h-10 text-sm"
                    />
                    <IconifyIcon icon="solar:magnifer-outline" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                  </div>
                  <button 
                    type="button"
                    className="px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                  >
                    Add Selected
                  </button>
                </div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedStaff.map(staff => (
                    <div key={staff.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                          {getInitials(staff.name)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{staff.name}</p>
                          <p className="text-xs text-slate-500">{staff.role} • ID: {staff.id}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeStaff(staff.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <IconifyIcon icon="solar:close-circle-outline" className="text-lg" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pb-12 pt-4">
            <PermissionLink
              permissionKey="departments"
              to="/department"
              className="px-6 py-3 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              Cancel
            </PermissionLink>
            <PermissionButton
              permissionKey="departments"
              type="button"
              onClick={() => void handleCreateDepartment()}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-lg text-white bg-primary font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <IconifyIcon icon="solar:check-circle-outline" className="text-xl" />
              {isSubmitting ? 'Creating...' : 'Create Department'}
            </PermissionButton>
          </div>
          </form>
        </div>
      </main>
    </>;
};

export default CreateDepartment;