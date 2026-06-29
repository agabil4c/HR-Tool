import { lazy } from 'react';

// admin Ecommerce

const Cart = lazy(() => import('@/app/(admin)/(app)/(ecommerce)/cart'));
const Checkout = lazy(() => import('@/app/(admin)/(app)/(ecommerce)/checkout'));
const OrderOverview = lazy(() => import('@/app/(admin)/(app)/(ecommerce)/order-overview'));
const Orders = lazy(() => import('@/app/(admin)/(app)/(ecommerce)/orders'));
const ProductCreate = lazy(() => import('@/app/(admin)/(app)/(ecommerce)/product-create'));
const ProductGrid = lazy(() => import('@/app/(admin)/(app)/(ecommerce)/product-grid'));
const ProductList = lazy(() => import('@/app/(admin)/(app)/(ecommerce)/product-list'));
const ProductOverview = lazy(() => import('@/app/(admin)/(app)/(ecommerce)/product-overview'));
const Sellers = lazy(() => import('@/app/(admin)/(app)/(ecommerce)/sellers'));

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

// admin invoice

const InvoiceAddNew = lazy(() => import('@/app/(admin)/(app)/(invoice)/add-new'));
const InvoiceList = lazy(() => import('@/app/(admin)/(app)/(invoice)/list'));
const InvoiceOverview = lazy(() => import('@/app/(admin)/(app)/(invoice)/overview'));

// USers

const UserGrid = lazy(() => import('@/app/(admin)/(app)/(users)/users-grid'));
const UserList = lazy(() => import('@/app/(admin)/(app)/(users)/users-list'));
const Calender = lazy(() => import('@/app/(admin)/(app)/calendar'));
const Chat = lazy(() => import('@/app/(admin)/(app)/chat'));
const MailBox = lazy(() => import('@/app/(admin)/(app)/mailbox'));
const Notes = lazy(() => import('@/app/(admin)/(app)/notes'));

// dashboard
const Analytics = lazy(() => import('@/app/(admin)/(dashboards)/analytics'));
const Email = lazy(() => import('@/app/(admin)/(dashboards)/email'));
const Managers = lazy(() => import('@/app/(admin)/(dashboards)/managers'));
const Ecommerce = lazy(() => import('@/app/(admin)/(dashboards)/index'));

// layouts
const DarkMode = lazy(() => import('@/app/(admin)/(layouts)/dark-mode'));
const RTL = lazy(() => import('@/app/(admin)/(layouts)/rtl-mode'));
const SideNavCompact = lazy(() => import('@/app/(admin)/(layouts)/sidenav-compact'));
const SideNavDark = lazy(() => import('@/app/(admin)/(layouts)/sidenav-dark'));
const SideNavHidden = lazy(() => import('@/app/(admin)/(layouts)/sidenav-hidden'));
const SideNavHover = lazy(() => import('@/app/(admin)/(layouts)/sidenav-hover'));
const SideNavHoverActive = lazy(() => import('@/app/(admin)/(layouts)/sidenav-hover-active'));
const SideOffcanvas = lazy(() => import('@/app/(admin)/(layouts)/sidenav-offcanvas'));
const SideNavSmall = lazy(() => import('@/app/(admin)/(layouts)/sidenav-small'));

//Pages

const Faq = lazy(() => import('@/app/(admin)/(pages)/faqs'));
const Pricing = lazy(() => import('@/app/(admin)/(pages)/pricing'));
const Starter = lazy(() => import('@/app/(admin)/(pages)/starter'));
const Timeline = lazy(() => import('@/app/(admin)/(pages)/timeline'));

//auth
const BasicCreatePassword = lazy(() => import('@/app/(auth)/basic-create-password'));
const BasicLogin = lazy(() => import('@/app/(auth)/basic-login'));
const BasicRegister = lazy(() => import('@/app/(auth)/basic-register'));
const BasicResetPassword = lazy(() => import('@/app/(auth)/basic-reset-password'));
const BasicVerifyEmail = lazy(() => import('@/app/(auth)/basic-verify-email'));
const BasicLogout = lazy(() => import('@/app/(auth)/basic-logout'));
const BasicTwoStep = lazy(() => import('@/app/(auth)/basic-two-steps'));
const BoxedCreatePassword = lazy(() => import('@/app/(auth)/boxed-create-password'));
const BoxedLogin = lazy(() => import('@/app/(auth)/boxed-login'));
const BoxedRegister = lazy(() => import('@/app/(auth)/boxed-register'));
const BoxedResetPassword = lazy(() => import('@/app/(auth)/boxed-reset-password'));
const BoxedLogout = lazy(() => import('@/app/(auth)/boxed-logout'));
const BoxedTwoStep = lazy(() => import('@/app/(auth)/boxed-two-steps'));
const CoverCreatePassword = lazy(() => import('@/app/(auth)/cover-create-password'));
const CoverLogin = lazy(() => import('@/app/(auth)/cover-login'));
const CoverRegister = lazy(() => import('@/app/(auth)/cover-register'));
const CoverResetPassword = lazy(() => import('@/app/(auth)/cover-reset-password'));
const CoverLogout = lazy(() => import('@/app/(auth)/cover-logout'));
const CoverTwoStep = lazy(() => import('@/app/(auth)/cover-two-steps'));
const CoverVerifyEmail = lazy(() => import('@/app/(auth)/cover-verify-email'));
const ModernCreatePassword = lazy(() => import('@/app/(auth)/modern-create-password'));
const ModernLogin = lazy(() => import('@/app/(auth)/modern-login'));
const ModernRegister = lazy(() => import('@/app/(auth)/modern-register'));
const ModernResetPassword = lazy(() => import('@/app/(auth)/modern-reset-password'));
const ModernLogout = lazy(() => import('@/app/(auth)/modern-logout'));
const ModernTwoStep = lazy(() => import('@/app/(auth)/modern-two-steps'));
const ModernVerifyEmail = lazy(() => import('@/app/(auth)/modern-verify-email'));

//  landing

const OnePageLanding = lazy(() => import('@/app/(landing)/onepage-landing'));
const ProductLanding = lazy(() => import('@/app/(landing)/product-landing'));

//Other

const Error404 = lazy(() => import('@/app/(others)/404'));
const CommingSoon = lazy(() => import('@/app/(others)/coming-soon'));
const Maintenance = lazy(() => import('@/app/(others)/maintenance'));
const Offline = lazy(() => import('@/app/(others)/offline'));
export const layoutsRoutes = [{
  path: '/cart',
  name: 'Cart',
  component: Cart
}, {
  path: '/checkout',
  name: 'Checkout',
  component: Checkout
}, {
  path: '/order-overview',
  name: 'OrderOverview',
  component: OrderOverview
}, {
  path: '/orders',
  name: 'Orders',
  component: Orders
}, {
  path: '/product-create',
  name: 'ProductCreate',
  component: ProductCreate
}, {
  path: '/product-grid',
  name: 'ProductGrid',
  component: ProductGrid
}, {
  path: '/product-list',
  name: 'ProductList',
  component: ProductList
}, {
  path: '/product-overview',
  name: 'ProductOverview',
  component: ProductOverview
}, {
  path: '/sellers',
  name: 'Sellers',
  component: Sellers
}, {
  path: '/attendance',
  name: 'Attendances',
  component: Attendances
}, {
  path: '/attendance-main',
  name: 'AttemdanceMain',
  component: AttemdanceMain
}, {
  path: '/create-leave',
  name: 'CreateLeave',
  component: CreateLeave
}, {
  path: '/create-leave-employee',
  name: 'CreateLeaveEmployee',
  component: CreateLeaveEmployee
}, {
  path: '/create-payslip',
  name: 'CreatePayslip',
  component: CreatePayslip
}, {
  path: '/create-department',
  name: 'CreateDepartment',
  component: CreateDepartment
}, {
  path: '/department',
  name: 'Department',
  component: Department
}, {
  path: '/employee',
  name: 'Employee',
  component: Employee
}, {
  path: '/role-access',
  name: 'RoleAccess',
  component: RoleAccess
}, {
  path: '/staff-biodata',
  name: 'StaffBioData',
  component: StaffBioData
}, {
  path: '/dashboard',
  name: 'Dashboard',
  component: Dashboard
}, {
  path: '/my-profile',
  name: 'MyProfile',
  component: MyProfile
}, {
  path: '/profile-update-requests',
  name: 'ProfileUpdateRequests',
  component: ProfileUpdateRequests
}, {
  path: '/approval-hierarchy',
  name: 'ApprovalHierarchy',
  component: ApprovalHierarchy
}, {
  path: '/holidays',
  name: 'Holidays',
  component: Holidays
}, {
  path: '/leave',
  name: 'Leave',
  component: Leave
}, {
  path: '/leave-planner',
  name: 'LeavePlanner',
  component: LeavePlanner
}, {
  path: '/leave-applications',
  name: 'LeaveApplications',
  component: LeaveApplications
}, {
  path: '/pending-days',
  name: 'PendingDays',
  component: PendingDays
}, {
  path: '/leave-employee',
  name: 'LeaveEmployee',
  component: LeaveEmployee
}, {
  path: '/daily-attendance',
  name: 'DailyAttendance',
  component: AttemdanceMain
}, {
  path: '/performance-reviews',
  name: 'PerformanceReviews',
  component: PerformanceReviews
}, {
  path: '/performance-review-management',
  name: 'PerformanceReviewManagement',
  component: PerformanceReviewManagement
}, {
  path: '/warnings',
  name: 'Warnings',
  component: Warnings
}, {
  path: '/payroll-employee-salary',
  name: 'PayrollEmplyoeeSalary',
  component: PayrollEmplyoeeSalary
}, {
  path: '/payroll-payslip',
  name: 'PayRollSlip',
  component: PayRollSlip
}, {
  path: '/sales-estimates',
  name: 'SalesEstimate',
  component: SalesEstimate
}, {
  path: '/sales-expenses',
  name: 'SalesExpense',
  component: SalesExpense
}, {
  path: '/sales-payments',
  name: 'SalePayment',
  component: SalePayment
}, {
  path: '/add-new',
  name: 'InvoiceAddNew',
  component: InvoiceAddNew
}, {
  path: '/list',
  name: 'InvoiceList',
  component: InvoiceList
}, {
  path: '/overview',
  name: 'InvoiceOverview',
  component: InvoiceOverview
}, {
  path: '/users-grid',
  name: 'UserGrid',
  component: UserGrid
}, {
  path: '/users-list',
  name: 'UserList',
  component: UserList
}, {
  path: '/calendar',
  name: 'Calender',
  component: Calender
}, {
  path: '/chat',
  name: 'Chat',
  component: Chat
}, {
  path: '/mailbox',
  name: 'MailBox',
  component: MailBox
}, {
  path: '/notes',
  name: 'Notes',
  component: Notes
}, {
  path: '/analytics',
  name: 'Analytics',
  component: Analytics
}, {
  path: '/email',
  name: 'Email',
  component: Email
}, {
  path: '/managers',
  name: 'Managers',
  component: Managers
}, {
  path: '/dashboard/managers/index',
  name: 'ManagersDashboardIndex',
  component: Managers
}, {
  path: '/dark-mode',
  name: 'DarkMode',
  component: DarkMode
}, {
  path: '/rtl-mode',
  name: 'RtlMode',
  component: RTL
}, {
  path: '/sidenav-compact',
  name: 'SideNavCompact',
  component: SideNavCompact
}, {
  path: '/sidenav-dark',
  name: 'SideNavDark',
  component: SideNavDark
}, {
  path: '/sidenav-hidden',
  name: 'SideNavHidden',
  component: SideNavHidden
}, {
  path: '/sidenav-hover',
  name: 'SideNavHover',
  component: SideNavHover
}, {
  path: '/sidenav-offcanvas',
  name: 'SideNavOffcanvas',
  component: SideOffcanvas
}, {
  path: '/sidenav-small',
  name: 'SideNavSmall',
  component: SideNavSmall
}, {
  path: '/sidenav-hover-active',
  name: 'SideNavHoverActive',
  component: SideNavHoverActive
}, {
  path: '/faqs',
  name: 'Faqs',
  component: Faq
}, {
  path: '/pricing',
  name: 'Pricing',
  component: Pricing
}, {
  path: '/starter',
  name: 'Starter',
  component: Starter
}, {
  path: '/timeline',
  name: 'Timeline',
  component: Timeline
}];
export const singlePageRoutes = [{
  path: '/login',
  name: 'Login',
  component: BoxedLogin
}, {
  path: '/basic-login',
  name: 'BasicLogin',
  component: BasicLogin
}, {
  path: '/basic-register',
  name: 'BasicRegister',
  component: BasicRegister
}, {
  path: '/basic-create-password',
  name: 'BasicCreatePassword',
  component: BasicCreatePassword
}, {
  path: '/basic-reset-password',
  name: 'BasicResetPassword',
  component: BasicResetPassword
}, {
  path: '/basic-verify-email',
  name: 'BasicVerifyEmail',
  component: BasicVerifyEmail
}, {
  path: '/basic-logout',
  name: 'BasicLogout',
  component: BasicLogout
}, {
  path: '/basic-two-steps',
  name: 'BasicTwoStep',
  component: BasicTwoStep
}, {
  path: '/boxed-login',
  name: 'BoxedLogin',
  component: BoxedLogin
}, {
  path: '/boxed-register',
  name: 'BoxedRegister',
  component: BoxedRegister
}, {
  path: '/boxed-create-password',
  name: 'BoxedCreatePassword',
  component: BoxedCreatePassword
}, {
  path: '/boxed-reset-password',
  name: 'BoxedResetPassword',
  component: BoxedResetPassword
}, {
  path: '/boxed-logout',
  name: 'BoxedLogout',
  component: BoxedLogout
}, {
  path: '/boxed-two-steps',
  name: 'BoxedTwoStep',
  component: BoxedTwoStep
}, {
  path: '/cover-login',
  name: 'CoverLogin',
  component: CoverLogin
}, {
  path: '/cover-register',
  name: 'CoverRegister',
  component: CoverRegister
}, {
  path: '/cover-create-password',
  name: 'CoverCreatePassword',
  component: CoverCreatePassword
}, {
  path: '/cover-reset-password',
  name: 'CoverResetPassword',
  component: CoverResetPassword
}, {
  path: '/cover-logout',
  name: 'CoverLogout',
  component: CoverLogout
}, {
  path: '/cover-two-steps',
  name: 'CoverTwoStep',
  component: CoverTwoStep
}, {
  path: '/cover-verify-email',
  name: 'CoverVerifyEmail',
  component: CoverVerifyEmail
}, {
  path: '/modern-create-password',
  name: 'ModernCreatePassword',
  component: ModernCreatePassword
}, {
  path: '/modern-login',
  name: 'ModernLogin',
  component: ModernLogin
}, {
  path: '/modern-register',
  name: 'ModernRegister',
  component: ModernRegister
}, {
  path: '/modern-reset-password',
  name: 'ModernResetPassword',
  component: ModernResetPassword
}, {
  path: '/modern-logout',
  name: 'ModernLogout',
  component: ModernLogout
}, {
  path: '/modern-verify-email',
  name: 'ModernVerifyEmail',
  component: ModernVerifyEmail
}, {
  path: '/modern-two-steps',
  name: 'ModernTwoStep',
  component: ModernTwoStep
}, {
  path: '/onepage-landing',
  name: 'OnePageLanding',
  component: OnePageLanding
}, {
  path: '/product-landing',
  name: 'ProductLanding',
  component: ProductLanding
}, {
  path: '/404',
  name: '404',
  component: Error404
}, {
  path: '/coming-soon',
  name: 'ComingSoon',
  component: CommingSoon
}, {
  path: '/maintenance',
  name: 'Maintenance',
  component: Maintenance
}, {
  path: '/offline',
  name: 'Offline',
  component: Offline
}];
