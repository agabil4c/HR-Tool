import { createContext, use, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

const UserRoleContext = createContext(undefined);

export const ACCESS_LEVELS = {
  EMPLOYEE: 'employee',
  SUPER_ADMIN: 'super-admin',
  HR_MANAGER: 'hr-manager',
  HR_OFFICER: 'hr-officer',
  DEPARTMENT_MANAGER: 'department-manager'
};

export const ACCESS_LEVEL_OPTIONS = [{
  value: ACCESS_LEVELS.EMPLOYEE,
  label: 'Employee'
}, {
  value: ACCESS_LEVELS.SUPER_ADMIN,
  label: 'Super Admin'
}, {
  value: ACCESS_LEVELS.HR_MANAGER,
  label: 'HR Manager'
}, {
  value: ACCESS_LEVELS.HR_OFFICER,
  label: 'HR Officer'
}, {
  value: ACCESS_LEVELS.DEPARTMENT_MANAGER,
  label: 'Department Manager'
}];

export const useUserRoleContext = () => {
  const context = use(UserRoleContext);

  if (!context) {
    throw new Error('useUserRoleContext can only be used within UserRoleProvider');
  }

  return context;
};

const UserRoleProvider = ({
  children
}) => {
  const [accessLevel, setAccessLevel] = useLocalStorage('__HR_TOOL_ACCESS_LEVEL__', ACCESS_LEVELS.EMPLOYEE, {
    serializer: (value) => value,
    deserializer: (value) => value || ACCESS_LEVELS.EMPLOYEE,
  });

  return <UserRoleContext value={useMemo(() => ({
    accessLevel,
    setAccessLevel,
    accessLevels: ACCESS_LEVEL_OPTIONS
  }), [accessLevel, setAccessLevel])}>
      {children}
    </UserRoleContext>;
};

export default UserRoleProvider;
