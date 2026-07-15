import { LuCalendar1, LuCalendarClock, LuCalendarDays, LuCircuitBoard, LuClipboardList, LuClock, LuFileText, LuListChecks, LuMonitorDot, LuSettings2, LuSquareUserRound, LuUserCog } from 'react-icons/lu';

const ALL_ACCESS_LEVELS = ['employee', 'super-admin', 'hr-manager', 'hr-officer', 'department-manager'];
const MANAGERIAL_ACCESS_LEVELS = ['super-admin', 'hr-manager', 'hr-officer', 'department-manager'];
const HR_AND_DEPARTMENT_ACCESS_LEVELS = ['super-admin', 'hr-manager', 'hr-officer', 'department-manager'];
const HR_ONLY_ACCESS_LEVELS = ['super-admin', 'hr-manager', 'hr-officer'];
const DEPARTMENT_MANAGER_ACCESS_LEVELS = ['super-admin', 'hr-manager', 'hr-officer', 'department-manager'];
const EMPLOYEE_AND_MANAGER_ACCESS_LEVELS = ['employee', 'super-admin', 'hr-manager', 'hr-officer', 'department-manager'];

export const menuItemsData = [{
  key: 'Main',
  label: 'Main',
  isTitle: true
}, {
  key: 'Dashboard',
  label: 'Dashboard',
  icon: LuMonitorDot,
  href: '/dashboard',
  permissionKey: 'dashboard',
  accessLevels: ALL_ACCESS_LEVELS
}, {
  key: 'HR Management',
  label: 'HR Management',
  isTitle: true
}, {
  key: 'Staff Directory',
  label: 'Staff Bio Data',
  icon: LuCircuitBoard,
  href: '/staff-biodata',
  permissionKey: 'staff',
  accessLevels: HR_ONLY_ACCESS_LEVELS // Shifted to managerial to protect privacy
}, {
  key: 'Departments',
  label: 'Departments',
  icon: LuFileText, // Changed icon for variety
  href: '/department',
  permissionKey: 'departments',
  accessLevels: HR_ONLY_ACCESS_LEVELS
}, {
  key: 'Leave Requests',
  label: 'Leave Requests',
  icon: LuCalendarClock,
  href: '/leave',
  permissionKey: 'leave',
  accessLevels: MANAGERIAL_ACCESS_LEVELS
}, {
  key: 'Attendance Records',
  label: 'Attendance Records',
  icon: LuClock,
  href: '/attendance',
  permissionKey: 'attendance',
  accessLevels: MANAGERIAL_ACCESS_LEVELS
}, {
  key: 'Holidays',
  label: 'Public Holidays',
  icon: LuCalendarDays,
  href: '/holidays',
  permissionKey: 'leave',
  accessLevels: HR_ONLY_ACCESS_LEVELS
}, {
  key: 'Profile Update Requests',
  label: 'Profile Update Requests',
  icon: LuUserCog,
  href: '/profile-update-requests',
  permissionKey: 'staff',
  accessLevels: HR_ONLY_ACCESS_LEVELS
}, {
  key: 'Performance Overview',
  label: 'My Review Forms',
  icon: LuClipboardList,
  href: '/performance-reviews',
  permissionKey: 'reports',
  accessLevels: EMPLOYEE_AND_MANAGER_ACCESS_LEVELS
}, {
  key: 'Review Management',
  label: 'Department Review Queue',
  icon: LuListChecks,
  href: '/performance-review-management',
  permissionKey: 'reports',
  accessLevels: HR_AND_DEPARTMENT_ACCESS_LEVELS
}, {
  key: 'Self Service',
  label: 'Self Service',
  isTitle: true
}, {
  key: 'My Profile',
  label: 'My Profile',
  icon: LuSquareUserRound,
  href: '/my-profile',
  permissionKey: 'profile',
  accessLevels: ALL_ACCESS_LEVELS
}, {
  key: 'My Leave',
  label: 'Request Leave',
  icon: LuCalendar1,
  href: '/leave-planner',
  permissionKey: 'leave',
  accessLevels: ALL_ACCESS_LEVELS
}, {
  key: 'Admin Settings',
  label: 'Admin Settings',
  isTitle: true
}, {
  key: 'Users List',
  label: 'User Management',
  icon: LuFileText,
  href: '/users-list',
  permissionKey: 'user-admin',
  accessLevels: HR_ONLY_ACCESS_LEVELS
}, {
  key: 'Role Access',
  label: 'Roles & Permissions',
  icon: LuSettings2,
  href: '/role-access',
  permissionKey: 'role-access',
  accessLevels: HR_ONLY_ACCESS_LEVELS
}];
