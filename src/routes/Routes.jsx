import { lazy } from 'react';

// admin Hr
const Attendances = lazy(() => import('@/app/(admin)/(app)/(hr)/attendance'));
const AttemdanceMain = lazy(() => import('@/app/(admin)/(app)/(hr)/attendance-main'));
const CreateLeave = lazy(() => import('@/app/(admin)/(app)/(hr)/create-leave'));
const CreateLeaveEmployee = lazy(() => import('@/app/(admin)/(app)/(hr)/create-leave-employee'));
const CreatePayslip = lazy(() => import('@/app/(admin)/(app)/(hr)/create-payslip'));
const CreateDepartment = lazy(() => import('@/app/(admin)/(app)/(hr)/create-department'));
const Department = lazy(() => import('@/app/(admin)/(app)/(hr)/department'));
const Employee = lazy(() => import('@/app/(admin)/(app)/(hr)/employee'));
const RoleAccess = lazy(() => import('@/app/(admin)/(app)/(hr)/role-access'));
const StaffBioData = lazy(() => import('@/app/(admin)/(app)/(hr)/staff-biodata'));
const Dashboard = lazy(() => import('@/app/(admin)/(app)/(hr)/dashboard'));
const MyProfile = lazy(() => import('@/app/(admin)/(app)/(hr)/my-profile'));
const ProfileUpdateRequests = lazy(() => import('@/app/(admin)/(app)/(hr)/profile-update-requests'));
const Holidays = lazy(() => import('@/app/(admin)/(app)/(hr)/holidays'));
const Leave = lazy(() => import('@/app/(admin)/(app)/(hr)/leave'));
const LeaveEmployee = lazy(() => import('@/app/(admin)/(app)/(hr)/leave-employee'));
const LeavePlanner = lazy(() => import('@/app/(admin)/(app)/(hr)/leave-planner'));
const LeaveApplications = lazy(() => import('@/app/(admin)/(app)/(hr)/leave-applications'));
const PendingDays = lazy(() => import('@/app/(admin)/(app)/(hr)/pending-days'));
const PerformanceReviews = lazy(() => import('@/app/(admin)/(app)/(hr)/performance-reviews'));
const PerformanceReviewManagement = lazy(() => import('@/app/(admin)/(app)/(hr)/performance-review-management'));
const Warnings = lazy(() => import('@/app/(admin)/(app)/(hr)/warnings'));
const ApprovalHierarchy = lazy(() => import('@/app/(admin)/(app)/(hr)/approval-hierarchy'));
const PayrollEmplyoeeSalary = lazy(() => import('@/app/(admin)/(app)/(hr)/payroll-employee-salary'));
const PayRollSlip = lazy(() => import('@/app/(admin)/(app)/(hr)/payroll-payslip'));
const SalesEstimate = lazy(() => import('@/app/(admin)/(app)/(hr)/sales-estimates'));
const SalesExpense = lazy(() => import('@/app/(admin)/(app)/(hr)/sales-expenses'));
const SalePayment = lazy(() => import('@/app/(admin)/(app)/(hr)/sales-payments'));

// Users
const UserList = lazy(() => import('@/app/(admin)/(app)/(users)/users-list'));

// Dashboard
const Managers = lazy(() => import('@/app/(admin)/(dashboards)/managers'));

// Auth
const BoxedLogin = lazy(() => import('@/app/(auth)/boxed-login'));
const BasicLogout = lazy(() => import('@/app/(auth)/basic-logout'));

// Other
const Error404 = lazy(() => import('@/app/(others)/404'));

export const layoutsRoutes = [
  {
    path: '/attendance',
    name: 'Attendances',
    component: Attendances
  },
  {
    path: '/attendance-main',
    name: 'AttemdanceMain',
    component: AttemdanceMain
  },
  {
    path: '/create-leave',
    name: 'CreateLeave',
    component: CreateLeave
  },
  {
    path: '/create-leave-employee',
    name: 'CreateLeaveEmployee',
    component: CreateLeaveEmployee
  },
  {
    path: '/create-payslip',
    name: 'CreatePayslip',
    component: CreatePayslip
  },
  {
    path: '/create-department',
    name: 'CreateDepartment',
    component: CreateDepartment
  },
  {
    path: '/department',
    name: 'Department',
    component: Department
  },
  {
    path: '/employee',
    name: 'Employee',
    component: Employee
  },
  {
    path: '/role-access',
    name: 'RoleAccess',
    component: RoleAccess
  },
  {
    path: '/staff-biodata',
    name: 'StaffBioData',
    component: StaffBioData
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/my-profile',
    name: 'MyProfile',
    component: MyProfile
  },
  {
    path: '/profile-update-requests',
    name: 'ProfileUpdateRequests',
    component: ProfileUpdateRequests
  },
  {
    path: '/approval-hierarchy',
    name: 'ApprovalHierarchy',
    component: ApprovalHierarchy
  },
  {
    path: '/holidays',
    name: 'Holidays',
    component: Holidays
  },
  {
    path: '/leave',
    name: 'Leave',
    component: Leave
  },
  {
    path: '/leave-planner',
    name: 'LeavePlanner',
    component: LeavePlanner
  },
  {
    path: '/leave-applications',
    name: 'LeaveApplications',
    component: LeaveApplications
  },
  {
    path: '/pending-days',
    name: 'PendingDays',
    component: PendingDays
  },
  {
    path: '/leave-employee',
    name: 'LeaveEmployee',
    component: LeaveEmployee
  },
  {
    path: '/daily-attendance',
    name: 'DailyAttendance',
    component: AttemdanceMain
  },
  {
    path: '/performance-reviews',
    name: 'PerformanceReviews',
    component: PerformanceReviews
  },
  {
    path: '/performance-review-management',
    name: 'PerformanceReviewManagement',
    component: PerformanceReviewManagement
  },
  {
    path: '/warnings',
    name: 'Warnings',
    component: Warnings
  },
  {
    path: '/payroll-employee-salary',
    name: 'PayrollEmplyoeeSalary',
    component: PayrollEmplyoeeSalary
  },
  {
    path: '/payroll-payslip',
    name: 'PayRollSlip',
    component: PayRollSlip
  },
  {
    path: '/sales-estimates',
    name: 'SalesEstimate',
    component: SalesEstimate
  },
  {
    path: '/sales-expenses',
    name: 'SalesExpense',
    component: SalesExpense
  },
  {
    path: '/sales-payments',
    name: 'SalePayment',
    component: SalePayment
  },
  {
    path: '/users-list',
    name: 'UserList',
    component: UserList
  },
  {
    path: '/dashboard/managers/index',
    name: 'ManagersDashboardIndex',
    component: Managers
  }
];

export const singlePageRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: BoxedLogin
  },
  {
    path: '/basic-logout',
    name: 'BasicLogout',
    component: BasicLogout
  },
  {
    path: '/404',
    name: '404',
    component: Error404
  }
];
