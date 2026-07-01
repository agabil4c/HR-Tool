import { getPermissionsForAccessLevel, loadRoles } from '@/services/roleService';

export const AUTH_STORAGE_KEYS = {
  token: 'auth_token',
  role: '__HR_TOOL_ROLE__',
  fullName: '__HR_TOOL_FULL_NAME__',
  department: '__HR_TOOL_DEPARTMENT__',
  accessLevel: '__HR_TOOL_ACCESS_LEVEL__',
  dashboardRoute: '__HR_TOOL_DASHBOARD_ROUTE__',
  allowedSections: '__HR_TOOL_ALLOWED_SECTIONS__'
};

const ROUTE_SECTION_MAP = {
  '/managers': 'dashboard',
  '/analytics': 'dashboard',
  '/email': 'dashboard',
  '/dashboard': 'profile',
  '/staff-biodata': 'staff',
  '/department': 'departments',
  '/create-department': 'departments',
  '/leave': 'leave',
  '/leave-planner': 'leave',
  '/leave-applications': 'leave',
  '/holidays': 'leave',
  '/profile-update-requests': 'staff',
  '/attendance': 'attendance',
  '/attendance-main': 'attendance',
  '/performance-reviews': 'reports',
  '/performance-review-management': 'reports',
  '/calendar': 'calendar',
  '/users-list': 'user-admin',
  '/users-grid': 'user-admin',
  '/role-access': 'role-access'
};

const DEFAULT_ALLOWED_BY_ACCESS_LEVEL_FALLBACK = {
  'super-admin': ['*'],
  'hr-manager': ['dashboard', 'profile', 'staff', 'departments', 'leave', 'attendance', 'reports', 'calendar', 'user-admin'],
  'hr-officer': ['dashboard', 'profile', 'staff', 'departments', 'leave', 'attendance', 'reports', 'calendar'],
  'department-manager': ['dashboard', 'profile', 'staff', 'departments', 'leave', 'attendance', 'reports', 'calendar'],
  'employee': ['dashboard', 'profile', 'leave', 'attendance', 'reports', 'calendar']
};

const ACCESS_LEVEL_ALIASES = {
  staff: 'employee',
  'self-service': 'employee',
  'self service': 'employee',
  'full-access': 'super-admin',
  'super admin': 'super-admin',
  'hr manager': 'hr-manager',
  'hr officer': 'hr-officer',
  'general-manager': 'department-manager',
  'general manager': 'department-manager',
  'department manager': 'department-manager',
  'line-manager': 'department-manager',
  'line manager': 'department-manager',
  'dept-head': 'department-manager',
  'department-head': 'department-manager',
  'department head': 'department-manager'
};

const PERMISSION_ALIASES = {
  reports: ['performance'],
  performance: ['reports']
};

const parseAllowedSections = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeAccessLevel = (accessLevel) => {
  const normalized = (accessLevel || '').toLowerCase().trim().replace(/[_\s]+/g, '-');
  return ACCESS_LEVEL_ALIASES[normalized] || normalized;
};

const resolveSessionAccessLevel = (accessLevel, role) => {
  const normalizedAccessLevel = normalizeAccessLevel(accessLevel);
  const normalizedRole = normalizeAccessLevel(role);

  if (!normalizedAccessLevel || normalizedAccessLevel === 'employee') {
    if (normalizedRole && normalizedRole !== 'employee') {
      return normalizedRole;
    }
  }

  return normalizedAccessLevel || normalizedRole || 'employee';
};

const getDefaultAllowedSections = ({ accessLevel, permissions } = {}) => {
  if (permissions && Array.isArray(permissions) && permissions.length > 0) {
    return permissions;
  }

  const normalizedAccessLevel = normalizeAccessLevel(accessLevel);

  if (normalizedAccessLevel) {
    const rolePermissions = getPermissionsForAccessLevel(normalizedAccessLevel);
    if (rolePermissions && Array.isArray(rolePermissions) && rolePermissions.length > 0) {
      return rolePermissions;
    }
  }

  const byAccessLevel = DEFAULT_ALLOWED_BY_ACCESS_LEVEL_FALLBACK[normalizedAccessLevel];
  if (byAccessLevel && byAccessLevel.length) {
    return [...byAccessLevel];
  }

  return ['profile'];
};

const normalizeAllowedSections = ({ accessLevel, allowedSections, permissions } = {}) => {
  const normalizedAccessLevel = normalizeAccessLevel(accessLevel);
  const baselineSections = getDefaultAllowedSections({ accessLevel: normalizedAccessLevel, permissions });

  if (normalizedAccessLevel === 'super-admin') {
    return ['*'];
  }

  if (Array.isArray(allowedSections) && allowedSections.length) {
    return [...new Set([...allowedSections, ...baselineSections])];
  }

  return baselineSections;
};

export const getDefaultDashboardRoute = ({ accessLevel, dashboardRoute } = {}) => {
  return '/dashboard';
};

export const getAuthSession = () => {
  if (typeof window === 'undefined') {
    return {
      token: null,
      role: null,
      fullName: null,
      department: null,
      accessLevel: null,
      dashboardRoute: '/login',
      allowedSections: []
    };
  }

  loadRoles().catch(err => console.error('Failed to load roles during getAuthSession', err));

  const token = localStorage.getItem(AUTH_STORAGE_KEYS.token);
  const role = localStorage.getItem(AUTH_STORAGE_KEYS.role);
  const department = localStorage.getItem(AUTH_STORAGE_KEYS.department);
  const accessLevel = resolveSessionAccessLevel(localStorage.getItem(AUTH_STORAGE_KEYS.accessLevel), role);
  const dashboardRoute = localStorage.getItem(AUTH_STORAGE_KEYS.dashboardRoute);
  const parsedAllowedSections = parseAllowedSections(localStorage.getItem(AUTH_STORAGE_KEYS.allowedSections));

  const permissions = getPermissionsForAccessLevel(accessLevel);
  const allowedSections = normalizeAllowedSections({
    accessLevel,
    allowedSections: parsedAllowedSections,
    permissions
  });

  return {
    token,
    role,
    fullName: localStorage.getItem(AUTH_STORAGE_KEYS.fullName),
    department,
    accessLevel,
    dashboardRoute: getDefaultDashboardRoute({
      accessLevel,
      dashboardRoute
    }),
    allowedSections
  };
};

export const saveAuthSession = (session) => {
  if (typeof window === 'undefined') {
    return;
  }

  // Save the token first, so loadRoles can see it if it needs to fetch
  localStorage.setItem(AUTH_STORAGE_KEYS.token, session.token || '');

  loadRoles().catch(err => console.error('Failed to load roles during saveAuthSession', err));

  const resolvedAccessLevel = resolveSessionAccessLevel(session.accessLevel, session.role);
  const dashboardRoute = getDefaultDashboardRoute({
    accessLevel: resolvedAccessLevel,
    dashboardRoute: session.dashboardRoute
  });
  const allowedSections = normalizeAllowedSections({
    accessLevel: resolvedAccessLevel,
    allowedSections: session.allowedSections,
    permissions: session.permissions
  });

  localStorage.setItem(AUTH_STORAGE_KEYS.role, normalizeAccessLevel(session.role || resolvedAccessLevel));
  localStorage.setItem(AUTH_STORAGE_KEYS.fullName, session.fullName || '');
  localStorage.setItem(AUTH_STORAGE_KEYS.department, session.department || 'General');
  localStorage.setItem(AUTH_STORAGE_KEYS.accessLevel, resolvedAccessLevel);
  localStorage.setItem(AUTH_STORAGE_KEYS.dashboardRoute, dashboardRoute);
  localStorage.setItem(AUTH_STORAGE_KEYS.allowedSections, JSON.stringify(allowedSections));
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  Object.values(AUTH_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
};

export const hasSectionAccess = (session, sectionKey) => {
  if (!sectionKey) {
    return true;
  }

  const allowedSections = session?.allowedSections || [];
  const aliases = PERMISSION_ALIASES[sectionKey] || [];
  return allowedSections.includes('*') || allowedSections.includes(sectionKey) || aliases.some(alias => allowedSections.includes(alias));
};

export const hasRouteAccess = (session, routePath) => {
  const permissionKey = ROUTE_SECTION_MAP[routePath];
  if (!permissionKey) {
    return true;
  }

  return hasSectionAccess(session, permissionKey);
};