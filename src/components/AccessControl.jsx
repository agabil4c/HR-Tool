import { Link } from 'react-router-dom';
import { getAuthSession, hasSectionAccess } from '@/utils/auth';

const DISABLED_CLASSES = 'pointer-events-none cursor-not-allowed opacity-50 saturate-0';

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

export const useSectionAccess = (permissionKey) => {
  const session = getAuthSession();
  return hasSectionAccess(session, permissionKey);
};

export const PermissionLink = ({
  permissionKey,
  hideWhenNoAccess = false,
  className,
  disabledClassName,
  children,
  ...props
}) => {
  const hasAccess = useSectionAccess(permissionKey);

  if (!hasAccess && hideWhenNoAccess) {
    return null;
  }

  if (!hasAccess) {
    return (
      <span
        aria-disabled="true"
        title="You do not have permission to access this section"
        className={joinClasses(className, DISABLED_CLASSES, disabledClassName)}
      >
        {children}
      </span>
    );
  }

  return (
    <Link className={className} {...props}>
      {children}
    </Link>
  );
};

export const PermissionButton = ({
  permissionKey,
  hideWhenNoAccess = false,
  className,
  disabledClassName,
  children,
  disabled,
  ...props
}) => {
  const hasAccess = useSectionAccess(permissionKey);

  if (!hasAccess && hideWhenNoAccess) {
    return null;
  }

  const isDisabled = Boolean(disabled || !hasAccess);

  return (
    <button
      {...props}
      disabled={isDisabled}
      title={!hasAccess ? 'You do not have permission to perform this action' : props.title}
      className={joinClasses(className, !hasAccess ? DISABLED_CLASSES : '', !hasAccess ? disabledClassName : '')}
    >
      {children}
    </button>
  );
};
