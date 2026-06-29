import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Building2, CircleAlert, ClipboardCopy, Download, Eye, EyeOff, FolderOpen, Key, Lock, Network, RefreshCw, Search, ShieldCheck, Star, UserCheck, UserMinus, UserPlus, Users } from 'lucide-react';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';

const SIDEBAR_ICON_MAP = {
  'solar:users-group-rounded-outline': Users,
  'solar:sitemap-outline': Network,
  'solar:file-text-outline': FolderOpen,
  'solar:graph-up-outline': CircleAlert,
  'solar:shield-check-outline': ShieldCheck,
  'solar:user-check-outline': UserCheck,
};
const SidebarIcon = ({ icon, className }) => {
  const Comp = SIDEBAR_ICON_MAP[icon];
  return Comp ? <Comp className={className ?? 'size-4'} /> : null;
};

const sidebarItems = [];
const hierarchyItems = [];
const staffProfiles = [];
const approvalCards = [];
const HIDDEN_MAIN_MENU_ITEMS = new Set(['org chart', 'onboarding', 'performance']);

const splitBankDetails = (rawValue = '') => {
  const raw = (rawValue || '').trim();
  if (!raw) {
    return { bankAccount: '', accountNames: '', bankName: '' };
  }

  const parts = raw.split('|').map(part => part.trim());
  const readPart = (prefix) => {
    const item = parts.find(part => part.toLowerCase().startsWith(prefix));
    return item ? item.slice(prefix.length).trim() : '';
  };

  const bankAccount = readPart('account:');
  const accountNames = readPart('names:');
  const bankName = readPart('bank:');

  if (bankAccount || accountNames || bankName) {
    return { bankAccount, accountNames, bankName };
  }

  return { bankAccount: '', accountNames: '', bankName: raw };
};

const composeBankDetails = ({ bankAccount = '', accountNames = '', bankName = '' } = {}) => {
  const fields = [
    bankAccount && `Account: ${bankAccount}`,
    accountNames && `Names: ${accountNames}`,
    bankName && `Bank: ${bankName}`,
  ].filter(Boolean);

  return fields.join(' | ');
};

const buildEmptyForm = (departments = [], roleProfileOptions = []) => ({
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  nationality: '',
  maritalStatus: '',
  profilePhoto: '',
  nationalId: '',
  personalEmail: '',
  workEmail: '',
  phone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  addressCity: '',
  addressDistrict: '',
  addressCountry: '',
  addressLine1: '',
  employeeId: '',
  department: departments[0]?.name || '',
  jobTitle: '',
  roleProfileName: roleProfileOptions[0]?.name || '',
  reportingManager: '',
  lineManager: '',
  departmentHead: '',
  employmentType: '',
  dateOfJoining: '',
  workLocation: '',
  status: 'Active',
  salary: '',
  payGrade: '',
  salaryBenefits: '',
  bankAccount: '',
  accountNames: '',
  bankName: '',
  bankDetails: '',
  taxId: '',
  nssfNumber: '',
  cvDocument: '',
  contractDocument: '',
  idCopyDocument: '',
  certificatesDocument: '',
  otherDocuments: '',
});

const Index = () => {
  const navigate = useNavigate();
  const [isAddEmployeeView, setIsAddEmployeeView] = useState(false);
  const [sidebarMenuData, setSidebarMenuData] = useState(sidebarItems);
  const [hierarchyMenuData, setHierarchyMenuData] = useState(hierarchyItems);
  const [staffProfilesData, setStaffProfilesData] = useState(staffProfiles);
  const [approvalCardsData, setApprovalCardsData] = useState(approvalCards);
  const [departments, setDepartments] = useState([]);
  const [roleProfileOptions, setRoleProfileOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [directorySuccess, setDirectorySuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [focusMissingManagers, setFocusMissingManagers] = useState(false);
  const [selectedHierarchyDept, setSelectedHierarchyDept] = useState('');
  const [isBulkPlannerOpen, setIsBulkPlannerOpen] = useState(false);
  const [bulkLineManager, setBulkLineManager] = useState('');
  const [bulkDepartmentHead, setBulkDepartmentHead] = useState('');
  const [form, setForm] = useState(buildEmptyForm());
  const [formErrors, setFormErrors] = useState({});
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  // ── HR edit employee modal ──────────────────────────────────────────────
  const [editEmployee, setEditEmployee] = useState(null); // person object from staffProfilesData
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [regenPassword, setRegenPassword] = useState('');
  const [regenVisible, setRegenVisible] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  // ── Remove employee modal ───────────────────────────────────────────────
  const [removeEmployee, setRemoveEmployee] = useState(null);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [removeError, setRemoveError] = useState('');
  // ── Edit hierarchy modal ────────────────────────────────────────────────
  const [hierarchyEmployee, setHierarchyEmployee] = useState(null);
  const [hierarchyForm, setHierarchyForm] = useState({ lineManager: '', departmentHead: '' });
  const [hierarchySubmitting, setHierarchySubmitting] = useState(false);
  const [hierarchyError, setHierarchyError] = useState('');
  const [hierarchySuccess, setHierarchySuccess] = useState('');

  const TOP_LEVEL_KEYWORDS = ['general manager', 'ceo', 'chief', 'director', 'president', 'super admin', 'hr manager', 'department manager', 'dept manager', 'department head', 'dept head', 'managing director', 'md'];

  const hasAssignedLineManager = (person) => {
    const reporting = person?.reporting || [];
    // Intentionally top-level if title matches a senior role
    const title = (person?.role || '').toLowerCase();
    if (TOP_LEVEL_KEYWORDS.some(kw => title.includes(kw))) {
      return true;
    }
    if (!Array.isArray(reporting) || reporting.length === 0) {
      return false;
    }
    if (reporting.some(line => (line || '').toLowerCase().includes('assign manager'))) {
      return false;
    }
    // Any non-empty reporting entry counts as having a manager assigned
    return reporting.some(line => !!(line || '').trim());
  };

  const normalizeDepartmentLabel = (value) => {
    return (value || '').replace(/\s+Dept$/i, '').trim().toLowerCase();
  };

  const employeesMissingManager = useMemo(() => {
    return staffProfilesData.filter(person => !hasAssignedLineManager(person));
  }, [staffProfilesData]);

  const managerCandidates = useMemo(() => {
    return staffProfilesData.filter(person => hasAssignedLineManager(person));
  }, [staffProfilesData]);

  const filteredStaffProfiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return staffProfilesData.filter((person) => {
      const personDeptNormalized = normalizeDepartmentLabel(person.dept);
      const departmentMatch = departmentFilter === 'all' || personDeptNormalized === normalizeDepartmentLabel(departmentFilter);
      const hierarchyMatch = !selectedHierarchyDept || personDeptNormalized === normalizeDepartmentLabel(selectedHierarchyDept);
      const statusMatch = statusFilter === 'all' || (person.status || '').toLowerCase() === statusFilter.toLowerCase();
      const missingManagerMatch = !focusMissingManagers || !hasAssignedLineManager(person);
      const searchMatch = !q || [person.name, person.role, person.dept, person.contact].some(value => (value || '').toLowerCase().includes(q));

      return departmentMatch && hierarchyMatch && statusMatch && missingManagerMatch && searchMatch;
    });
  }, [staffProfilesData, searchQuery, departmentFilter, statusFilter, focusMissingManagers, selectedHierarchyDept]);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFormErrors(prev => (prev[key] ? { ...prev, [key]: false } : prev));
  };

  const fieldInputClass = (key, extra = '') =>
    `h-11 w-full rounded-lg ${formErrors[key] ? 'border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-900/10' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'} focus:border-primary focus:ring-primary ${extra}`.trim();

  const openEditEmployee = (person) => {
    const bankParts = splitBankDetails(person.bankDetails || '');
    setEditEmployee(person);
    setEditForm({
      firstName: person.firstName || '',
      lastName: person.lastName || '',
      gender: person.gender || '',
      dateOfBirth: person.dateOfBirth || '',
      nationality: person.nationality || '',
      maritalStatus: person.maritalStatus || '',
      nationalId: person.nationalId || '',
      personalEmail: person.personalEmail || '',
      workEmail: person.workEmail || '',
      phone: person.phone || '',
      emergencyContactName: person.emergencyContact?.name || '',
      emergencyContactPhone: person.emergencyContact?.phone || '',
      emergencyContactRelationship: person.emergencyContact?.relationship || '',
      addressCity: person.address?.city || '',
      addressDistrict: person.address?.district || '',
      addressCountry: person.address?.country || '',
      addressLine1: person.address?.line1 || '',
      employeeId: person.employeeId || '',
      jobTitle: person.role || '',
      employmentType: person.employmentType || '',
      dateOfJoining: person.dateOfJoining || '',
      workLocation: person.workLocation || '',
      status: person.status || 'Active',
      salary: person.salary || '',
      payGrade: person.payGrade || '',
      salaryBenefits: person.salaryBenefits || '',
      bankAccount: bankParts.bankAccount,
      accountNames: bankParts.accountNames,
      bankName: bankParts.bankName,
      bankDetails: person.bankDetails || '',
      taxId: person.taxId || '',
      nssfNumber: person.nssfNumber || '',
    });
    setEditError('');
    setEditSuccess('');
    setRegenPassword('');
    setRegenVisible(false);
  };

  const handleEditSave = async () => {
    if (!editEmployee) return;
    setEditSubmitting(true);
    setEditError('');
    setEditSuccess('');
    try {
      const payload = {
        ...editForm,
        bankDetails: composeBankDetails(editForm),
      };
      await hrApi.updateEmployeeByHR(editEmployee.dbId, payload);
      setEditSuccess('Profile updated successfully.');
      const data = await hrApi.getModuleData('staff-biodata');
      setStaffProfilesData(data.staffProfiles || []);
    } catch (err) {
      setEditError(err?.response?.data?.detail || err?.message || 'Failed to update employee.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleRegenPassword = async () => {
    if (!editEmployee) return;
    setRegenLoading(true);
    setEditError('');
    try {
      const res = await hrApi.resetEmployeePassword(editEmployee.dbId);
      setRegenPassword(res.temporaryPassword || '');
      setRegenVisible(false);
    } catch (err) {
      setEditError(err?.response?.data?.detail || err?.message || 'Failed to reset password.');
    } finally {
      setRegenLoading(false);
    }
  };

  const handleRemoveEmployee = async () => {
    if (!removeEmployee) return;
    setRemoveSubmitting(true);
    setRemoveError('');
    try {
      await hrApi.deleteEmployee(removeEmployee.dbId);
      const data = await hrApi.getModuleData('staff-biodata');
      setStaffProfilesData(data.staffProfiles || []);
      setRemoveEmployee(null);
      setDirectorySuccess(`${removeEmployee.name} has been removed from the directory.`);
    } catch (err) {
      setRemoveError(err?.response?.data?.detail || err?.message || 'Failed to remove employee.');
    } finally {
      setRemoveSubmitting(false);
    }
  };

  const openHierarchyEdit = (person) => {
    setHierarchyEmployee(person);
    const existing = person.reporting || [];
    setHierarchyForm({
      lineManager: existing[0] || '',
      departmentHead: existing[1] || '',
    });
    setHierarchyError('');
    setHierarchySuccess('');
  };

  const handleHierarchySave = async () => {
    if (!hierarchyEmployee) return;
    setHierarchySubmitting(true);
    setHierarchyError('');
    setHierarchySuccess('');
    try {
      await hrApi.updateEmployeeByHR(hierarchyEmployee.dbId, {
        lineManager: hierarchyForm.lineManager || null,
        departmentHead: hierarchyForm.departmentHead || null,
      });
      setHierarchySuccess('Reporting hierarchy updated.');
      const data = await hrApi.getModuleData('staff-biodata');
      setStaffProfilesData(data.staffProfiles || []);
    } catch (err) {
      setHierarchyError(err?.response?.data?.detail || err?.message || 'Failed to update hierarchy.');
    } finally {
      setHierarchySubmitting(false);
    }
  };

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#!$';
    const arr = new Uint8Array(12);
    crypto.getRandomValues(arr);
    const pwd = Array.from(arr, b => chars[b % chars.length]).join('');
    setGeneratedPassword(pwd);
    setPasswordVisible(false);
  };

  const handleManageAllFlows = () => {
    navigate('/approval-hierarchy');
  };

  useEffect(() => {
    let isMounted = true;

    const loadModuleData = async () => {
      try {
        const [data, departmentRows, roleProfiles] = await Promise.all([
          hrApi.getModuleData('staff-biodata'),
          hrApi.getDepartments(),
          hrApi.getRoleAccessProfileOptions()
        ]);
        if (!isMounted) {
          return;
        }

        setSidebarMenuData((data.sidebarItems || []).filter(item => !HIDDEN_MAIN_MENU_ITEMS.has((item?.label || '').trim().toLowerCase())));
        setHierarchyMenuData(data.hierarchyItems || []);
        setStaffProfilesData(data.staffProfiles || []);
        setApprovalCardsData(data.approvalCards || []);
        setDepartments(departmentRows || []);
        setRoleProfileOptions(roleProfiles || []);

        setForm(buildEmptyForm(departmentRows || [], roleProfiles || []));
      } catch (error) {
        console.error('Failed to load staff biodata module data', error);
      }
    };

    loadModuleData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateStaffAccount = async () => {
    setSubmitError('');
    setDirectorySuccess('');

    const errors = {
      firstName: !form.firstName.trim(),
      lastName: !form.lastName.trim(),
      personalEmail: !form.personalEmail.trim(),
      jobTitle: !form.jobTitle.trim(),
      roleProfileName: !form.roleProfileName.trim(),
    };
    setFormErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      setSubmitError('Please complete all required fields (highlighted below) before creating the staff account.');
      return;
    }

    try {
      setIsSubmitting(true);
      const bankDetails = composeBankDetails(form);
      const created = await hrApi.createEmployeeWithUser({
        firstName: form.firstName,
        lastName: form.lastName,
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        nationality: form.nationality,
        maritalStatus: form.maritalStatus,
        profilePhoto: form.profilePhoto,
        nationalId: form.nationalId,
        personalEmail: form.personalEmail,
        workEmail: form.workEmail,
        phone: form.phone,
        emergencyContactName: form.emergencyContactName,
        emergencyContactPhone: form.emergencyContactPhone,
        emergencyContactRelationship: form.emergencyContactRelationship,
        addressCity: form.addressCity,
        addressDistrict: form.addressDistrict,
        addressCountry: form.addressCountry,
        addressLine1: form.addressLine1,
        employeeId: form.employeeId,
        department: form.department,
        jobTitle: form.jobTitle,
        roleProfileName: form.roleProfileName,
        temporaryPassword: generatedPassword || undefined,
        reportingManager: form.reportingManager,
        lineManager: form.lineManager === '__none__' ? '' : (form.lineManager || form.reportingManager),
        departmentHead: form.departmentHead === '__self__' ? `${form.firstName} ${form.lastName}`.trim() : form.departmentHead,
        employmentType: form.employmentType,
        dateOfJoining: form.dateOfJoining,
        workLocation: form.workLocation,
        status: form.status,
        salary: form.salary,
        payGrade: form.payGrade,
        salaryBenefits: form.salaryBenefits,
        bankAccount: form.bankAccount,
        accountNames: form.accountNames,
        bankName: form.bankName,
        bankDetails,
        taxId: form.taxId,
        nssfNumber: form.nssfNumber,
        cvDocument: form.cvDocument,
        contractDocument: form.contractDocument,
        idCopyDocument: form.idCopyDocument,
        certificatesDocument: form.certificatesDocument,
        otherDocuments: form.otherDocuments,
      });

      setForm(buildEmptyForm(departments, roleProfileOptions));
      setFormErrors({});
      setGeneratedPassword('');
      setPasswordVisible(false);

      const data = await hrApi.getModuleData('staff-biodata');
      setStaffProfilesData(data.staffProfiles || []);
      setApprovalCardsData(data.approvalCards || []);

      setIsAddEmployeeView(false);
      setSubmitError('');
      setDirectorySuccess(`Created employee + user account for ${created.employeeName}. Temporary password: ${created.temporaryPassword}`);
    } catch (error) {
      setSubmitError(error?.detail || error?.message || 'Failed to create staff account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSectionClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleViewHierarchyDept = (deptLabel) => {
    const normalized = deptLabel.replace(/\s+Dept$/i, '').trim();
    setSelectedHierarchyDept(normalized);
    setDepartmentFilter(normalized);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setStatusFilter('all');
    setFocusMissingManagers(false);
    setSelectedHierarchyDept('');
  };

  const handleBulkAssignManagers = async () => {
    if (employeesMissingManager.length === 0) {
      setDirectorySuccess('All employees already have a line manager assigned.');
      return;
    }

    if (!bulkLineManager || !bulkDepartmentHead) {
      setSubmitError('Select both a Line Manager and Department Head to apply the bulk assignment.');
      return;
    }

    setSubmitError('');
    try {
      await Promise.all(
        employeesMissingManager
          .filter(person => person.dbId)
          .map(person =>
            hrApi.updateEmployeeByHR(person.dbId, {
              lineManager: bulkLineManager,
              departmentHead: bulkDepartmentHead,
            })
          )
      );
      const data = await hrApi.getModuleData('staff-biodata');
      setStaffProfilesData(data.staffProfiles || []);
      setDirectorySuccess(`Assigned manager to ${employeesMissingManager.length} employee(s).`);
      setIsBulkPlannerOpen(false);
      setBulkLineManager('');
      setBulkDepartmentHead('');
    } catch (err) {
      setSubmitError(err?.response?.data?.detail || err?.message || 'Bulk assignment failed.');
    }
  };

  if (isAddEmployeeView) {
    return <>
        <PageMeta title="Add New Staff" />
        <main className="flex-1 px-6 py-10 font-display">
          <div className="mx-auto w-full max-w-4xl">
            <nav className="mb-6 flex text-sm font-medium text-slate-500">
              <button type="button" onClick={() => setIsAddEmployeeView(false)} className="hover:text-primary">Employee Directory</button>
              <span className="mx-2">/</span>
              <span className="text-slate-900 dark:text-slate-100">Add New Staff</span>
            </nav>

            <div className="mb-10">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Staff Bio Data &amp; Access Setup</h1>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Initialize a new employee record and configure system permissions.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              <aside className="lg:col-span-1">
                <div className="sticky top-24 flex flex-col gap-6">
                  <a href="#personal-details" onClick={() => handleSectionClick('personal-details')} className="flex items-center gap-3 border-l-2 border-primary pl-4 text-primary">
                    <span className="text-sm font-bold">01</span>
                    <span className="text-sm font-bold">Personal Details</span>
                  </a>
                  <a href="#job-hierarchy" onClick={() => handleSectionClick('job-hierarchy')} className="flex items-center gap-3 border-l-2 border-transparent pl-4 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
                    <span className="text-sm font-bold">02</span>
                    <span className="text-sm font-bold">Job &amp; Hierarchy</span>
                  </a>
                  <a href="#compensation" onClick={() => handleSectionClick('compensation')} className="flex items-center gap-3 border-l-2 border-transparent pl-4 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
                    <span className="text-sm font-bold">03</span>
                    <span className="text-sm font-bold">Compensation</span>
                  </a>
                  <a href="#documents" onClick={() => handleSectionClick('documents')} className="flex items-center gap-3 border-l-2 border-transparent pl-4 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
                    <span className="text-sm font-bold">04</span>
                    <span className="text-sm font-bold">Documents</span>
                  </a>
                  <a href="#system-credentials" onClick={() => handleSectionClick('system-credentials')} className="flex items-center gap-3 border-l-2 border-transparent pl-4 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
                    <span className="text-sm font-bold">05</span>
                    <span className="text-sm font-bold">System Credentials</span>
                  </a>

                  <div className="mt-8 rounded-xl bg-slate-100 p-4 dark:bg-slate-800/50">
                    <p className="text-xs leading-relaxed text-slate-500">Ensure all fields marked with <span className="text-red-500">*</span> are completed before proceeding to the next section.</p>
                  </div>
                </div>
              </aside>

              <section className="space-y-8 lg:col-span-3">
                <div id="personal-details" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 p-6 dark:border-slate-800">
                    <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                      <UserCheck className="size-4 text-primary" />
                      Personal Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">First Name <span className="text-red-500">*</span></label>
                      <input type="text" value={form.firstName} onChange={e => updateForm('firstName', e.target.value)} className={fieldInputClass('firstName')} placeholder="Enter first name" />
                      {formErrors.firstName && <p className="text-xs text-red-500">First name is required</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Last Name <span className="text-red-500">*</span></label>
                      <input type="text" value={form.lastName} onChange={e => updateForm('lastName', e.target.value)} className={fieldInputClass('lastName')} placeholder="Enter last name" />
                      {formErrors.lastName && <p className="text-xs text-red-500">Last name is required</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Gender</label>
                      <select value={form.gender} onChange={e => updateForm('gender', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50">
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date of Birth</label>
                      <input type="date" value={form.dateOfBirth} onChange={e => updateForm('dateOfBirth', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nationality</label>
                      <input type="text" value={form.nationality} onChange={e => updateForm('nationality', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="Enter nationality" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Marital Status</label>
                      <select value={form.maritalStatus} onChange={e => updateForm('maritalStatus', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50">
                        <option value="">Select status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Profile Photo</label>
                      <input type="file" accept="image/*" onChange={e => updateForm('profilePhoto', e.target.files?.[0]?.name || '')} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">National ID / Passport Number</label>
                      <input type="text" value={form.nationalId} onChange={e => updateForm('nationalId', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="Enter ID or passport" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Work Email</label>
                      <input type="email" value={form.workEmail} onChange={e => updateForm('workEmail', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="Enter work email" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Personal Email <span className="text-red-500">*</span></label>
                      <input type="email" value={form.personalEmail} onChange={e => updateForm('personalEmail', e.target.value)} className={fieldInputClass('personalEmail')} placeholder="Enter personal email" />
                      {formErrors.personalEmail && <p className="text-xs text-red-500">Personal email is required</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                      <input type="tel" value={form.phone} onChange={e => updateForm('phone', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Next of Kin</label>
                      <input type="text" value={form.emergencyContactName} onChange={e => updateForm('emergencyContactName', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Next of Kin Contact</label>
                      <input type="tel" value={form.emergencyContactPhone} onChange={e => updateForm('emergencyContactPhone', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Relationship</label>
                      <input type="text" value={form.emergencyContactRelationship} onChange={e => updateForm('emergencyContactRelationship', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">City</label>
                      <input type="text" value={form.addressCity} onChange={e => updateForm('addressCity', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">District</label>
                      <input type="text" value={form.addressDistrict} onChange={e => updateForm('addressDistrict', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Country</label>
                      <input type="text" value={form.addressCountry} onChange={e => updateForm('addressCountry', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Physical Address</label>
                      <textarea value={form.addressLine1} onChange={e => updateForm('addressLine1', e.target.value)} className="h-28 w-full rounded-lg border-slate-200 bg-slate-50 p-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="House number, street, zone" />
                    </div>
                  </div>
                </div>

                <div id="job-hierarchy" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 p-6 dark:border-slate-800">
                    <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                      <UserCheck className="size-4 text-primary" />
                      Job &amp; Hierarchy
                    </h3>
                  </div>
                  <div className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Employee ID</label>
                        <input type="text" value={form.employeeId} onChange={e => updateForm('employeeId', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="Enter employee ID" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Department</label>
                        <select value={form.department} onChange={e => updateForm('department', e.target.value)} className={fieldInputClass('department')}>
                          <option value="">N/A (Cross-functional / No dept)</option>
                          {departments.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Job Title / Position <span className="text-red-500">*</span></label>
                        <input type="text" value={form.jobTitle} onChange={e => updateForm('jobTitle', e.target.value)} className={fieldInputClass('jobTitle')} placeholder="Enter job title" />
                        {formErrors.jobTitle && <p className="text-xs text-red-500">Job title is required</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Role (System Role) <span className="text-red-500">*</span></label>
                        <select value={form.roleProfileName} onChange={e => updateForm('roleProfileName', e.target.value)} className={fieldInputClass('roleProfileName')}>
                          <option value="">Select role profile</option>
                          {roleProfileOptions.map(option => <option key={option.name} value={option.name}>{option.name}</option>)}
                        </select>
                        {formErrors.roleProfileName && <p className="text-xs text-red-500">Role is required</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reporting Manager</label>
                        <select value={form.reportingManager} onChange={e => updateForm('reportingManager', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50">
                          <option value="">Select manager</option>
                          {staffProfilesData.map(person => <option key={person.name} value={person.name}>{person.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Employment Type</label>
                        <select value={form.employmentType} onChange={e => updateForm('employmentType', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50">
                          <option value="">Select type</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Intern">Intern</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date of Joining</label>
                        <input type="date" value={form.dateOfJoining} onChange={e => updateForm('dateOfJoining', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Work Location</label>
                        <input type="text" value={form.workLocation} onChange={e => updateForm('workLocation', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="Office / Branch" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                      <select value={form.status} onChange={e => updateForm('status', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50">
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </div>

                    <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Approval Hierarchy</p>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <UserCheck className="size-4" />
                            Line Manager
                          </label>
                          <select value={form.lineManager} onChange={e => updateForm('lineManager', e.target.value)} className={fieldInputClass('lineManager')}>
                            <option value="">Select Manager</option>
                            <option value="__none__">None (Top-level / Reports to Board)</option>
                            {staffProfilesData.map(person => <option key={person.name} value={person.name}>{person.name}</option>)}
                          </select>
                          {formErrors.lineManager && <p className="text-xs text-red-500">Line manager is required</p>}
                          <p className="text-[10px] italic text-slate-500">Direct supervisor for daily tasks and leave approvals.</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Building2 className="size-4" />
                            Department Head
                          </label>
                          <select value={form.departmentHead} onChange={e => updateForm('departmentHead', e.target.value)} className={fieldInputClass('departmentHead')}>
                            <option value="">Select Dept Head</option>
                            <option value="__self__">Self (This person IS the dept head)</option>
                            {staffProfilesData.map(person => <option key={person.name} value={person.name}>{person.name}</option>)}
                          </select>
                          {formErrors.departmentHead && <p className="text-xs text-red-500">Department head is required</p>}
                          <p className="text-[10px] italic text-slate-500">Final approver for departmental budget or promotions.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="compensation" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 p-6 dark:border-slate-800">
                    <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                      <CircleAlert className="size-4 text-primary" />
                      Compensation
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Salary</label>
                      <input type="text" value={form.salary} onChange={e => updateForm('salary', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="Amount" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pay Grade / Level</label>
                      <input type="text" value={form.payGrade} onChange={e => updateForm('payGrade', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="e.g. P3" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Salary Benefits</label>
                      <input type="text" value={form.salaryBenefits} onChange={e => updateForm('salaryBenefits', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="Medical cover, housing, transport, etc." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bank Account</label>
                      <input type="text" value={form.bankAccount} onChange={e => updateForm('bankAccount', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="Account number" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Account Names</label>
                      <input type="text" value={form.accountNames} onChange={e => updateForm('accountNames', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="Account holder names" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bank Name</label>
                      <input type="text" value={form.bankName} onChange={e => updateForm('bankName', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="Bank name" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tax ID (TIN/NSSF)</label>
                      <input type="text" value={form.taxId} onChange={e => updateForm('taxId', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="Tax identification number" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">NSSF Number</label>
                      <input type="text" value={form.nssfNumber} onChange={e => updateForm('nssfNumber', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" placeholder="Optional" />
                    </div>
                  </div>
                </div>

                <div id="documents" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 p-6 dark:border-slate-800">
                    <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                      <FolderOpen className="size-4 text-primary" />
                      Documents
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">CV / Resume</label>
                      <input type="file" onChange={e => updateForm('cvDocument', e.target.files?.[0]?.name || '')} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contract</label>
                      <input type="file" onChange={e => updateForm('contractDocument', e.target.files?.[0]?.name || '')} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">ID Copy</label>
                      <input type="file" onChange={e => updateForm('idCopyDocument', e.target.files?.[0]?.name || '')} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Certificates</label>
                      <input type="file" onChange={e => updateForm('certificatesDocument', e.target.files?.[0]?.name || '')} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Other HR Documents</label>
                      <input type="file" onChange={e => updateForm('otherDocuments', e.target.files?.[0]?.name || '')} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50" />
                    </div>
                  </div>
                </div>

                <div id="system-credentials" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
                    <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                      <Key className="size-4 text-primary" />
                      Credentials &amp; Access
                    </h3>
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">SECURITY SENSITIVE</span>
                  </div>

                  <div className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">System Username</label>
                        <div className="relative">
                          <input type="text" value={form.workEmail || form.personalEmail || ''} readOnly placeholder="Auto-generated from email" className="h-11 w-full cursor-not-allowed rounded-lg border-slate-200 bg-slate-100 pl-4 text-slate-500 dark:border-slate-800 dark:bg-slate-800" />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Access Role</label>
                        <select value={form.roleProfileName} onChange={e => updateForm('roleProfileName', e.target.value)} className="h-11 w-full rounded-lg border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50">
                          <option value="">Select Access Role</option>
                          {roleProfileOptions.map(option => <option key={option.name} value={option.name}>{option.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {submitError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{submitError}</p>}
                    <div className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-primary/20 dark:bg-primary/10">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-sm font-bold text-primary">Generate Temporary Password</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {generatedPassword
                              ? 'Password ready — will be set when the account is created.'
                              : "Generate a secure temporary password for this employee's first login."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={generateTempPassword}
                          className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-all hover:bg-primary/90"
                        >
                          {generatedPassword ? <RefreshCw className="size-4" /> : <Key className="size-4" />}
                          {generatedPassword ? 'Regenerate' : 'Generate Password'}
                        </button>
                      </div>
                      {generatedPassword && (
                        <div className="flex items-center gap-2 rounded-md bg-white/70 border border-blue-200 px-3 py-2 dark:bg-slate-900/40 dark:border-primary/30">
                          <Key className="size-4 text-primary shrink-0" />
                          <code className="flex-1 text-sm font-mono text-slate-800 dark:text-slate-200 tracking-wider select-all">
                            {passwordVisible ? generatedPassword : '•'.repeat(generatedPassword.length)}
                          </code>
                          <button
                            type="button"
                            onClick={() => setPasswordVisible(v => !v)}
                            className="text-slate-400 hover:text-primary transition-colors"
                            title={passwordVisible ? 'Hide password' : 'Reveal password'}
                          >
                            {passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(generatedPassword)}
                            className="text-slate-400 hover:text-primary transition-colors"
                            title="Copy to clipboard"
                          >
                            <ClipboardCopy className="size-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                      Force password change on first login
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-12 pt-4">
                  <button type="button" onClick={() => {
                    setIsAddEmployeeView(false);
                    setFormErrors({});
                    setGeneratedPassword('');
                    setPasswordVisible(false);
                  }} className="rounded-lg border border-slate-300 px-6 py-3 font-bold text-slate-600 transition-all hover:bg-white dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                    Cancel
                  </button>
                  <div className="flex gap-4">
                    <button type="button" className="rounded-lg border border-slate-300 px-6 py-3 font-bold text-slate-700 transition-all hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                      Save as Draft
                    </button>
                    <button type="button" onClick={() => void handleCreateStaffAccount()} disabled={isSubmitting} className="rounded-lg bg-primary px-8 py-3 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60">
                      {isSubmitting ? 'Creating...' : 'Create Staff Account'}
                    </button>
                  </div>
                </div>
              </section>
            </div>

            
          </div>
        </main>
      </>;
  }

  return <>
      <PageMeta title="Staff Bio Data" />
      <main className="font-display">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="xl:col-span-3 2xl:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <button type="button" onClick={() => {
              setSubmitError('');
              setDirectorySuccess('');
              setForm(buildEmptyForm(departments, roleProfileOptions));
              setFormErrors({});
              setGeneratedPassword('');
              setPasswordVisible(false);
              setIsAddEmployeeView(true);
            }} className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90">
                <UserPlus className="size-5" />
                Add Employee
              </button>

              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Main Menu</p>
              <div className="space-y-1.5">
                {sidebarMenuData.map(item => <button key={item.label} type="button" className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${item.active ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                    <SidebarIcon icon={item.icon} className="size-4" />
                    {item.label}
                  </button>)}
              </div>

              <p className="mb-2 mt-7 text-xs font-bold uppercase tracking-wider text-slate-400">Hierarchy Setup</p>
              <div className="space-y-1.5">
                {hierarchyMenuData.map(item => <button key={item.label} type="button" onClick={() => {
                if ((item.label || '').toLowerCase().includes('approval')) {
                  handleManageAllFlows();
                  return;
                }
                if ((item.label || '').toLowerCase().includes('assign')) {
                  setIsBulkPlannerOpen(true);
                }
              }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                    <SidebarIcon icon={item.icon} className="size-4" />
                    {item.label}
                  </button>)}
              </div>
            </div>
          </aside>

          <section className="xl:col-span-9 2xl:col-span-10">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Employee Directory</h1>
                <p className="text-base text-slate-500 dark:text-slate-400">Manage staff bio data, departments, and reporting lines.</p>
                {directorySuccess && <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">{directorySuccess}</p>}
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    <Download className="size-5" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-primary/50 dark:border-slate-800 dark:bg-slate-900" placeholder="Search by name, role, or department..." />
              </div>
              <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="form-select h-12 rounded-lg border border-slate-200 bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary/50 dark:border-slate-800 dark:bg-slate-900">
                <option value="all">All Departments</option>
                {departments.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select h-12 rounded-lg border border-slate-200 bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary/50 dark:border-slate-800 dark:bg-slate-900">
                <option value="all">Any Status</option>
                <option value="active">Active</option>
                <option value="probation">Probation</option>
                <option value="on leave">On Leave</option>
              </select>
              <button type="button" onClick={handleResetFilters} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Clear Filters
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Name &amp; Bio</th>
                      <th className="hidden px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 md:table-cell">Role &amp; Dept</th>
                      <th className="hidden px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 md:table-cell">Leave Balance</th>
                      <th className="hidden px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 lg:table-cell">Contact</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Reporting Hierarchy</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStaffProfiles.map(person => <tr key={person.name} className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{person.initials}</span>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{person.name}</p>
                              <p className="text-xs text-slate-500">{person.startedAt}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-6 py-4 md:table-cell">
                          <div className="flex flex-col">
                            <p className="text-sm text-slate-700 dark:text-slate-300">{person.role}</p>
                            <span className="mt-1 inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">{person.dept}</span>
                          </div>
                        </td>
                        <td className="hidden px-6 py-4 md:table-cell">
                          <div className="flex flex-col">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {person.leaveBalance?.remainingDays ?? 0} / {person.leaveBalance?.initialDays ?? 0} days
                            </p>
                            <p className="text-xs text-slate-500">Used: {person.leaveBalance?.usedDays ?? 0}</p>
                          </div>
                        </td>
                        <td className="hidden px-6 py-4 lg:table-cell">
                          <p className="text-sm text-slate-600 dark:text-slate-400">{person.contact}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {person.reporting.map(line => <div key={line} className={`flex items-center gap-1.5 text-xs ${line === 'Assign Manager' ? 'text-amber-600' : line === 'Direct Report (CEO)' ? 'font-bold text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                {line === 'Assign Manager' ? <AlertTriangle className="size-3.5" /> : line === 'Direct Report (CEO)' ? <Star className="size-3.5" /> : <span className="size-3.5">{line.includes('(LM)') ? <Users className="size-3.5 text-slate-400" /> : <Building2 className="size-3.5 text-slate-400" />}</span>}
                                {line}
                              </div>)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${person.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${person.status === 'Active' ? 'bg-emerald-500' : 'bg-primary'}`} />
                            {person.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => openHierarchyEdit(person)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-500" title="Edit Reporting Hierarchy">
                              <Network className="size-5" />
                            </button>
                            <button type="button" onClick={() => openEditEmployee(person)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary" title="Edit Profile">
                              <UserCheck className="size-5" />
                            </button>
                            <button type="button" onClick={() => { setRemoveEmployee(person); setRemoveError(''); }} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500" title="Remove">
                              <UserMinus className="size-5" />
                            </button>
                          </div>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
                <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredStaffProfiles.length === 0 ? 0 : 1}</span> to <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredStaffProfiles.length}</span> of <span className="font-semibold text-slate-900 dark:text-slate-100">{staffProfilesData.length}</span> staff</p>
                <div className="flex items-center gap-2">
                  <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-white disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800" disabled>
                    Previous
                  </button>
                  <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Approval Hierarchies</h3>
                  <button type="button" onClick={handleManageAllFlows} className="text-sm font-bold text-primary hover:underline">Manage All Flows</button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {approvalCardsData.map(card => <div key={card.dept} className={`flex flex-col gap-2 rounded-lg border p-4 dark:bg-slate-800/50 ${normalizeDepartmentLabel(selectedHierarchyDept) === normalizeDepartmentLabel(card.dept) ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 dark:border-slate-800'}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{card.dept}</p>
                        <span className="text-[10px] font-bold uppercase text-slate-400">{card.levels}</span>
                      </div>
                      <div className="flex -space-x-2 overflow-hidden py-1">
                        <div className="inline-block h-6 w-6 rounded-full bg-slate-300 ring-2 ring-white dark:ring-slate-900" />
                        <div className="inline-block h-6 w-6 rounded-full bg-slate-400 ring-2 ring-white dark:ring-slate-900" />
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[8px] font-bold text-primary ring-2 ring-white dark:ring-slate-900">{card.count}</div>
                      </div>
                      <p className="text-xs text-slate-500">{card.head}</p>
                      <button type="button" onClick={() => handleViewHierarchyDept(card.dept)} className="mt-1 w-fit rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        View Staff
                      </button>
                    </div>)}
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm dark:bg-primary/10">
                <h4 className="flex items-center gap-3 text-lg font-bold text-primary">
                  <CircleAlert className="size-5" />
                  Quick Insight
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">There are <span className="font-bold text-slate-900 dark:text-slate-100">{employeesMissingManager.length} employees</span> without an assigned Line Manager. This can block leave approvals and review workflows.</p>
                {employeesMissingManager.length > 0 && <ul className="max-h-24 space-y-1 overflow-auto rounded-lg bg-white/60 p-2 text-xs text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                    {employeesMissingManager.slice(0, 5).map(person => <li key={`missing-${person.name}`}>{person.name} ({person.dept})</li>)}
                    {employeesMissingManager.length > 5 && <li className="font-semibold text-primary">+{employeesMissingManager.length - 5} more</li>}
                  </ul>}
                <button type="button" onClick={() => setFocusMissingManagers(prev => !prev)} className="w-full rounded-lg border border-primary bg-white py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary/5 dark:bg-slate-900">
                  {focusMissingManagers ? 'Show All Staff' : 'Show Affected Staff'}
                </button>
                <button type="button" onClick={() => setIsBulkPlannerOpen(prev => !prev)} className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {isBulkPlannerOpen ? 'Hide Bulk Planner' : 'Bulk Assign Managers'}
                </button>
                {isBulkPlannerOpen && <div className="space-y-3 rounded-lg border border-primary/20 bg-white/70 p-3 dark:bg-slate-900/50">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prepare a bulk assignment brief for employees missing a line manager.</p>
                    <select value={bulkLineManager} onChange={e => setBulkLineManager(e.target.value)} className="form-select h-10 w-full rounded-lg border border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-900">
                      <option value="">Select Line Manager</option>
                      {managerCandidates.map(person => <option key={`manager-${person.name}`} value={person.name}>{person.name}</option>)}
                    </select>
                    <select value={bulkDepartmentHead} onChange={e => setBulkDepartmentHead(e.target.value)} className="form-select h-10 w-full rounded-lg border border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-900">
                      <option value="">Select Department Head</option>
                      {managerCandidates.map(person => <option key={`dept-head-${person.name}`} value={person.name}>{person.name}</option>)}
                    </select>
                    <button type="button" onClick={() => void handleBulkAssignManagers()} className="w-full rounded-lg bg-primary py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90">
                      Prepare & Copy Assignment Brief
                    </button>
                  </div>}
              </div>
            </div>
      </main>

      {/* Edit Reporting Hierarchy Modal */}
      {hierarchyEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setHierarchyEmployee(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Edit Reporting Hierarchy</h2>
                <p className="text-xs text-slate-500 mt-0.5">{hierarchyEmployee.name} &middot; {hierarchyEmployee.dept}</p>
              </div>
              <button type="button" onClick={() => setHierarchyEmployee(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <UserMinus className="size-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Line Manager</label>
                <select value={hierarchyForm.lineManager} onChange={e => setHierarchyForm(p => ({ ...p, lineManager: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm focus:border-primary focus:ring-primary">
                  <option value="">None (Top-level / No line manager)</option>
                  {staffProfilesData.filter(p => p.name !== hierarchyEmployee.name).map(p => (
                    <option key={p.name} value={p.name}>{p.name} — {p.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Department Head</label>
                <select value={hierarchyForm.departmentHead} onChange={e => setHierarchyForm(p => ({ ...p, departmentHead: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm focus:border-primary focus:ring-primary">
                  <option value="">None</option>
                  <option value={hierarchyEmployee.name}>Self (this person IS the dept head)</option>
                  {staffProfilesData.filter(p => p.name !== hierarchyEmployee.name).map(p => (
                    <option key={p.name} value={p.name}>{p.name} — {p.role}</option>
                  ))}
                </select>
              </div>
              {hierarchyError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{hierarchyError}</p>}
              {hierarchySuccess && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{hierarchySuccess}</p>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button type="button" onClick={() => setHierarchyEmployee(null)} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">Close</button>
              <button type="button" onClick={handleHierarchySave} disabled={hierarchySubmitting} className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
                {hierarchySubmitting ? <><RefreshCw className="size-4 animate-spin" /> Saving…</> : 'Save Hierarchy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Employee Confirmation Modal */}
      {removeEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setRemoveEmployee(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Remove Employee</h2>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Are you sure you want to permanently remove <span className="font-bold">{removeEmployee.name}</span>? Their employee record and linked user account will be deleted.
              </p>
              {removeError && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{removeError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button type="button" onClick={() => setRemoveEmployee(null)} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">Cancel</button>
              <button type="button" onClick={() => void handleRemoveEmployee()} disabled={removeSubmitting} className="px-6 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-2">
                {removeSubmitting ? <><RefreshCw className="size-4 animate-spin" /> Removing…</> : 'Remove Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HR Edit Employee Modal */}
      {editEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditEmployee(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Edit Employee Profile</h2>
                <p className="text-xs text-slate-500 mt-0.5">{editEmployee.name} &middot; {editEmployee.dept}</p>
              </div>
              <button type="button" onClick={() => setEditEmployee(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <UserMinus className="size-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1">

              {/* Personal */}
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Personal Details</legend>
                <div className="grid grid-cols-2 gap-4">
                  {[['First Name','firstName','text'],['Last Name','lastName','text'],['Personal Email','personalEmail','email'],['Work Email','workEmail','email'],['Phone','phone','tel'],['National ID','nationalId','text'],['Date of Birth','dateOfBirth','date'],['Nationality','nationality','text']].map(([label, key, type]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
                      <input type={type} value={editForm[key] || ''} onChange={e => setEditForm(p => ({...p, [key]: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm focus:border-primary focus:ring-primary" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Gender</label>
                    <select value={editForm.gender || ''} onChange={e => setEditForm(p => ({...p, gender: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm focus:border-primary focus:ring-primary">
                      <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Marital Status</label>
                    <select value={editForm.maritalStatus || ''} onChange={e => setEditForm(p => ({...p, maritalStatus: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm focus:border-primary focus:ring-primary">
                      <option value="">Select</option><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Emergency + Address */}
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Emergency Contact &amp; Address</legend>
                <div className="grid grid-cols-2 gap-4">
                  {[['Next of Kin','emergencyContactName'],['Next of Kin Contact','emergencyContactPhone'],['Relationship','emergencyContactRelationship'],['City','addressCity'],['District','addressDistrict'],['Country','addressCountry'],['Address Line','addressLine1']].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
                      <input type="text" value={editForm[key] || ''} onChange={e => setEditForm(p => ({...p, [key]: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm focus:border-primary focus:ring-primary" />
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Employment */}
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Employment</legend>
                <div className="grid grid-cols-2 gap-4">
                  {[['Employee ID','employeeId','text'],['Job Title','jobTitle','text'],['Work Location','workLocation','text'],['Date of Joining','dateOfJoining','date'],['Salary','salary','text'],['Pay Grade','payGrade','text'],['Salary Benefits','salaryBenefits','text'],['Bank Account','bankAccount','text'],['Account Names','accountNames','text'],['Bank Name','bankName','text'],['Tax ID','taxId','text'],['NSSF Number','nssfNumber','text']].map(([label, key, type]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
                      <input type={type || 'text'} value={editForm[key] || ''} onChange={e => setEditForm(p => ({...p, [key]: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm focus:border-primary focus:ring-primary" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Employment Type</label>
                    <select value={editForm.employmentType || ''} onChange={e => setEditForm(p => ({...p, employmentType: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm focus:border-primary focus:ring-primary">
                      <option value="">Select</option><option>Full-time</option><option>Contract</option><option>Intern</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label>
                    <select value={editForm.status || 'Active'} onChange={e => setEditForm(p => ({...p, status: e.target.value}))} className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm focus:border-primary focus:ring-primary">
                      <option>Active</option><option>On Leave</option><option>Terminated</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Regenerate password */}
              <fieldset className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10 p-4">
                <legend className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">Reset Temporary Password</legend>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Generate a new temporary password for this employee if they lost access.</p>
                {regenPassword ? (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-white dark:bg-slate-900 px-3 py-2 mb-3">
                    <Key className="size-4 text-amber-500 shrink-0" />
                    <code className="flex-1 font-mono text-sm select-all">{regenVisible ? regenPassword : '•'.repeat(regenPassword.length)}</code>
                    <button type="button" onClick={() => setRegenVisible(v => !v)} className="text-slate-400 hover:text-primary transition-colors">{regenVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                    <button type="button" onClick={() => navigator.clipboard.writeText(regenPassword)} title="Copy" className="text-slate-400 hover:text-primary transition-colors"><ClipboardCopy className="size-4" /></button>
                  </div>
                ) : null}
                <button type="button" onClick={handleRegenPassword} disabled={regenLoading} className="flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-bold disabled:opacity-50 transition-colors">
                  {regenLoading ? <RefreshCw className="size-4 animate-spin" /> : <Key className="size-4" />}
                  {regenPassword ? 'Regenerate Password' : 'Generate Temporary Password'}
                </button>
              </fieldset>

              {editError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{editError}</p>}
              {editSuccess && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{editSuccess}</p>}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setEditEmployee(null)} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">Close</button>
              <button type="button" onClick={handleEditSave} disabled={editSubmitting} className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
                {editSubmitting ? <><RefreshCw className="size-4 animate-spin" /> Saving…</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>;
};

export default Index;
