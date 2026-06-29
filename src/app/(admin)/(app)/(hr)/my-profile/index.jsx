import { useEffect, useState } from 'react';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';
import PageMeta from '@/components/PageMeta';
import { hrApi } from '@/services/hrApi';

const buildEmptyForm = () => ({
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
  department: '',
  jobTitle: '',
  employmentType: '',
  dateOfJoining: '',
  workLocation: '',
  status: 'Active',
  salary: '',
  payGrade: '',
  bankDetails: '',
  taxId: '',
  nssfNumber: '',
  cvDocument: '',
  contractDocument: '',
  idCopyDocument: '',
  certificatesDocument: '',
  otherDocuments: '',
});

const ReadField = ({ label, value, type = 'text' }) => (
  <div>
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</label>
    <p className="h-11 w-full flex items-center rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-200 select-all">
      {(type === 'date' && value) ? new Date(value).toLocaleDateString() : (value || <span className="text-slate-300 dark:text-slate-600 italic">—</span>)}
    </p>
  </div>
);

const MyProfile = () => {
  const [form, setForm] = useState(buildEmptyForm());
  const [activeSection, setActiveSection] = useState('personal-details');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await hrApi.getModuleData('my-bio');
        setForm({ ...buildEmptyForm(), ...data });
      } catch (error) {
        console.error('Failed to load profile data', error);
      }
    };
    loadData();
  }, []);

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      await hrApi.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password');
    }
  };

  const handleRequestUpdate = async () => {
    if (!requestMessage.trim()) {
      setRequestError('Please describe the changes you need.');
      return;
    }
    setRequestSubmitting(true);
    setRequestError('');
    setRequestSuccess('');
    try {
      await hrApi.submitProfileUpdateRequest({ message: requestMessage.trim() });
      setRequestSuccess('Your request has been submitted. HR will review and update your profile.');
      setRequestMessage('');
    } catch (err) {
      setRequestError(err?.response?.data?.detail || err?.message || 'Failed to submit request.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const sections = [
    { id: 'personal-details', label: 'Personal Details', icon: 'solar:user-bold' },
    { id: 'contact-info', label: 'Contact Information', icon: 'solar:phone-bold' },
    { id: 'employment-info', label: 'Employment Information', icon: 'solar:briefcase-bold' },
    { id: 'compensation', label: 'Compensation & Benefits', icon: 'solar:money-bold' },
    { id: 'documents', label: 'Documents', icon: 'solar:document-bold' },
    { id: 'request-update', label: 'Request Profile Update', icon: 'solar:pen-bold' },
    { id: 'change-password', label: 'Change Password', icon: 'solar:lock-bold' },
  ];

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <PageMeta title="My Profile" />
      <main className="font-display p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-slate-600 dark:text-slate-400">View your personal and employment information</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Side Menu */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Sections</h2>
              <div className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className={`w-full rounded-lg p-3 text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary text-white'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconifyIcon icon={section.icon} className="text-lg" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Personal Details — read-only */}
            <div id="personal-details" className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Personal Details</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <ReadField label="First Name" value={form.firstName} />
                <ReadField label="Last Name" value={form.lastName} />
                <ReadField label="Gender" value={form.gender} />
                <ReadField label="Date of Birth" value={form.dateOfBirth} type="date" />
                <ReadField label="Nationality" value={form.nationality} />
                <ReadField label="Marital Status" value={form.maritalStatus} />
                <ReadField label="National ID" value={form.nationalId} />
              </div>
            </div>

            {/* Contact Information — read-only */}
            <div id="contact-info" className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Contact Information</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <ReadField label="Personal Email" value={form.personalEmail} />
                <ReadField label="Phone" value={form.phone} />
              </div>
              <h3 className="mt-6 mb-4 text-base font-semibold text-slate-800 dark:text-slate-200">Emergency Contact</h3>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <ReadField label="Name" value={form.emergencyContactName} />
                <ReadField label="Phone" value={form.emergencyContactPhone} />
                <ReadField label="Relationship" value={form.emergencyContactRelationship} />
              </div>
              <h3 className="mt-6 mb-4 text-base font-semibold text-slate-800 dark:text-slate-200">Address</h3>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <ReadField label="City" value={form.addressCity} />
                <ReadField label="District" value={form.addressDistrict} />
                <ReadField label="Country" value={form.addressCountry} />
                <ReadField label="Address Line 1" value={form.addressLine1} />
              </div>
            </div>

            {/* Employment Information — read-only */}
            <div id="employment-info" className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Employment Information</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <ReadField label="Employee ID" value={form.employeeId} />
                <ReadField label="Department" value={form.department} />
                <ReadField label="Job Title" value={form.jobTitle} />
                <ReadField label="Employment Type" value={form.employmentType} />
                <ReadField label="Date of Joining" value={form.dateOfJoining} type="date" />
                <ReadField label="Work Location" value={form.workLocation} />
              </div>
            </div>

            {/* Compensation — read-only */}
            <div id="compensation" className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Compensation & Benefits</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <ReadField label="Salary" value={form.salary} />
                <ReadField label="Pay Grade" value={form.payGrade} />
              </div>
            </div>

            {/* Documents */}
            <div id="documents" className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Documents</h2>
              <p className="text-slate-500 dark:text-slate-400">Document management will be available soon.</p>
            </div>

            {/* Request Profile Update */}
            <div id="request-update" className="rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-900/10 p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                  <IconifyIcon icon="solar:pen-bold" className="text-xl text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request Profile Update</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    To change your profile information, submit a request and HR will update it for you.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Describe the changes you need <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={requestMessage}
                    onChange={e => { setRequestMessage(e.target.value); setRequestError(''); }}
                    placeholder="E.g. Please update my phone number to +256 7XX XXX XXX and my emergency contact name to John Doe."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:border-primary focus:ring-primary resize-none"
                  />
                </div>
                {requestError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{requestError}</p>}
                {requestSuccess && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{requestSuccess}</p>}
                <button
                  type="button"
                  onClick={handleRequestUpdate}
                  disabled={requestSubmitting}
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {requestSubmitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div id="change-password" className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Change Password</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 focus:border-primary focus:ring-primary dark:border-slate-800 dark:bg-slate-800/50"
                  />
                </div>
                {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                {passwordSuccess && <p className="text-sm text-emerald-600">{passwordSuccess}</p>}
                <button
                  type="button"
                  onClick={() => void handleChangePassword()}
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default MyProfile;
